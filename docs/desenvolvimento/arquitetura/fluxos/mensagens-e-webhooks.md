# Fluxo de mensagens e webhooks

## Resposta do contato e webhook de resultado

```mermaid
sequenceDiagram
    participant P as Provedor de WhatsApp
    participant A as API HTTP
    participant B as Banco de dados relacional
    participant Q as Fila e agendador de jobs
    participant W as Worker
    participant C as Sistema do cliente
    P->>A: InboundTextReceived autenticado
    A->>B: Inserir inbound_messages com unicidade do evento
    B-->>A: Recebimento persistido ou duplicata identificada
    A-->>P: Confirmar recebimento persistido
    A->>Q: Publicar inbound_message.process persistido
    Q->>W: Trabalho de processamento
    W->>B: Serializar por conta e contato, recarregar candidatos
    W->>B: Transação: evento, appointments, webhook_events.payload e comandos
    W->>Q: message.attempt_due para response_ack, webhook.attempt_due
    Q->>W: webhook.attempt_due
    W->>B: Reservar webhook_attempts, capturar destino e versões dos segredos
    W->>C: POST assinado com corpo do evento
    C-->>W: 2xx dentro do timeout
    W->>B: Finalizar tentativa e marcar delivered
```

O diagrama mostra a deduplicação na entrada e a separação entre mudança de resultado e entrega do webhook correspondente.

A serialização usa `received_at` e UUID interno como desempate. Atualizar `appointments`, inserir `appointment_events` e criar `webhook_events` é uma só transação. O evento de saída é `appointment.confirmed` ou `appointment.canceled`; sua sequência vem do histórico do agendamento e não precisa ser contígua entre webhooks. Respostas sem mudança não criam outro evento. A mensagem `response_ack` é um trabalho independente e sua falha não desfaz o resultado.

## PARAR

```mermaid
sequenceDiagram
    participant P as Provedor de WhatsApp
    participant A as API HTTP
    participant B as Banco de dados relacional
    participant W as Worker
    participant R as Registro externo de recuperação
    participant Q as Fila e agendador de jobs
    P->>A: PARAR autenticado
    A->>B: Persistir inbound_messages e serializar o contato
    A->>B: Transação: contact_blocks, blocked, sequência e recovery_outbox
    A->>B: Persistir failed e webhook_events dos agendamentos afetados
    A-->>P: Recebimento processado
    W->>B: Ler bloqueio e pendência de cópia externa
    W->>R: Gravar contact_block idempotente e concluir registro
    alt Escrita externa sem confirmação
        W->>Q: Repetir gravação externa duravelmente
        Note over W,R: Bloqueio permanece, alerta após 15 minutos
    end
    W->>Q: message.attempt_due para stop_ack e webhook.attempt_due
```

O diagrama mostra que o bloqueio local não espera pelo registro externo e que sua cópia é retomável sem permitir novos envios indevidos.

O tratamento de `PARAR` compartilha a serialização por conta e `phone_hmac` das outras mensagens e aplica o bloqueio sem depender da disponibilidade da fila. O bloqueio e os efeitos nos agendamentos são coordenados com as reservas de tentativa no banco. `stop_ack` é a exceção explícita ao bloqueio de mensagens; possui identidade própria e não é recriado para a repetição do comando. A cópia pendente reside em `recovery_outbox`, escrita atomicamente com o bloqueio. A recuperação cria `contact_blocks` só com conta e HMAC se não houver contato; criação e recebimento consultam essa chave e vinculam o contato quando o telefone reaparecer.

## Falha de envio com retentativa

```mermaid
sequenceDiagram
    participant Q as Fila e agendador de jobs
    participant W as Worker
    participant B as Banco de dados relacional
    participant P as Provedor de WhatsApp
    Q->>W: message.attempt_due
    W->>B: Revalidar e reservar attempt_no exclusivo
    W->>P: SendTextCommand da mesma outbound_messages
    alt Falha conclusiva elegível
        P-->>W: TechnicalFailure
        W->>B: Finalizar message_attempts e persistir next_attempt_at
        W->>Q: message.attempt_due no horário persistido
        Q->>W: Próxima tentativa disponível
        W->>B: Revalidar antes de reservar outra tentativa
    else Aceite incerto
        P-->>W: Uncertain
        W->>B: uncertain, primeiro envio registra send_uncertain e sent
    else Falha final no primeiro envio
        P-->>W: InvalidNumber ou falha conclusiva sem nova tentativa
        W->>B: failed em appointment_events e appointments, webhook_events
        W->>Q: webhook.attempt_due
    end
```

O diagrama mostra que uma nova tentativa depende de falha conclusiva, estado persistido e nova verificação, enquanto a incerteza encerra as tentativas daquela mensagem.

O worker calcula o intervalo da política de mensagens a partir do término da falha anterior e aplica os horários congelados do agendamento. A fila não usa uma política genérica que possa repetir a chamada ignorando `message_attempts`. Falha de lembrete produz `reminder_failed`; mensagens de resposta mantêm seu resultado técnico nas tentativas. Nenhuma delas converte por si só o agendamento em `failed`. Antes de aceite ou incerteza, `outbound_messages.connection_id` é nulo e cada `message_attempts.connection_id` registra a conexão vigente usada. A troca marca a antiga `replacing`, impede chamadas novas e aguarda as iniciadas. A credencial de envio é apagada quando nenhuma chamada resta. Aceite anterior fixa a mensagem na conexão antiga; falha permite tentativa na nova.
