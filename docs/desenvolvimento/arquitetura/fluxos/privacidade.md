# Fluxo de privacidade

## Desbloqueio

```mermaid
sequenceDiagram
    participant P as Painel web
    participant A as API HTTP
    participant R as Registro externo de recuperação
    participant B as Banco de dados relacional
    P->>A: UnblockContact com sessão e consentimento
    A->>B: Validar conta, contato e consentimento
    A->>R: contact_unblock com operation_key e pending
    alt Gravação durável não confirmada
        A-->>P: recovery_log_unavailable, sem alteração local
    else Gravação durável confirmada
        A->>B: Gravar pedido em confirmação, sequência e recovery_outbox
        A-->>P: 202 pending_confirmation, bloqueio continua
        A->>R: Executar conclusão pela saída durável
        R-->>A: Conclusão confirmada
        A->>B: Se sequência ainda vigente: inserir unblocked e liberar contact_blocks
    end
```

O diagrama mostra o desbloqueio em confirmação e sua efetivação após confirmação externa, sem liberar o bloqueio durante a espera.

O desbloqueio não muda `appointments` em `failed`. A reconciliação repete `completion_mark` até confirmar e só então efetiva o desbloqueio. PARAR de sequência maior cancela o pedido em confirmação. Operações restritivas, por sua vez, preservam o efeito local e respondem sucesso mesmo se `completed` falhar; a marcação é repetida e gera alerta após 15 minutos.

## Exclusão antecipada

```mermaid
sequenceDiagram
    participant C as Sistema do cliente ou painel web
    participant A as API HTTP
    participant R as Registro externo de recuperação
    participant B as Banco de dados relacional
    participant W as Worker
    C->>A: Excluir dados por external_id
    A->>B: Autorizar e localizar na conta
    A->>R: data_erasure pending, aguardar confirmação durável
    A->>B: deletion_requested_at, impedir reservas e encerrar pendências
    alt Nenhuma chamada externa em andamento
        A->>B: Anonimizar, personal_data_erased com deletion_request
        A->>B: Gravar completion_mark em recovery_outbox
        A-->>C: 204
    else Chamada externa já iniciada
        A-->>C: 202, external_call_may_complete
        W->>B: privacy.erasure_complete: finalizar e anonimizar sem chamada em andamento
        W->>B: personal_data_erased com deletion_request, webhook suppressed
        W->>R: completion_mark pela recovery_outbox
    end
```

O diagrama mostra a barreira contra novas tentativas e a conclusão da exclusão quando uma chamada anterior ainda está em andamento.

Registro ausente ou já excluído retorna 204 sem criar trabalho de remoção. O evento `personal_data_erased` é auditoria interna, não um webhook; não existe estado público de exclusão. A reserva da chamada e `deletion_requested_at` usam a mesma coordenação transacional, evitando que uma leitura anterior autorize envio depois da barreira. Uma chamada que já cruzou essa fronteira pode terminar. A anonimização preenche `anonymized_at`, remove conteúdo e `contact_id` das mensagens e mantém `appointment_id` até o expurgo. `source_message_id` no evento de privacidade é informativo e não impede expurgo. Se o finalizador cair, o comando de exclusão é retomado após a reserva de 60 segundos expirar.

## Exclusão por retenção

```mermaid
sequenceDiagram
    participant Q as Fila e agendador de jobs
    participant W as Worker
    participant B as Banco de dados relacional
    participant R as Registro externo de recuperação
    Q->>W: privacy.appointment_erasure_due
    W->>B: Recarregar personal_data_delete_at e elegibilidade
    W->>R: data_erasure pending, aguardar confirmação durável
    alt Registro externo indisponível
        W->>Q: Manter trabalho pendente para nova execução
    else Registro externo confirmado
        W->>B: Impedir novas tentativas e encerrar entregas
        W->>B: Finalizar chamadas anteriores até seus timeouts
        W->>B: Anonimizar, personal_data_erased com retention, suppressed
        W->>R: completed
    end
```

O diagrama mostra a mesma barreira de exclusão acionada pelo prazo persistido, com dependência explícita da confirmação do registro externo.

O processamento também seleciona prazos de mensagens sem agendamento, segredos, conexões e auditoria. Mantém bloqueios e consentimentos independentes do agendamento e preserva o consumo em `monthly_usage`. O expurgo dos backups é uma tarefa operacional separada. A indisponibilidade do registro externo pode atrasar a remoção física; o prazo vencido impede consulta e reenvio, sem declarar remoção nem estender a retenção. Após 15 minutos de indisponibilidade há alerta; após 24 horas com vencidos, urgência; após 72 horas, incidente para documentação de privacidade. `retention_reports` registra diariamente quantidade e vencimento mais antigo sem dados pessoais, e `retention_erasure_batches` registra datas reais dos lotes, processados do mais antigo ao mais novo.
