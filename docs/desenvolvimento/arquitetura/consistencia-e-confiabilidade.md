# Consistência e confiabilidade

## Transações, concorrência e publicação

O banco é a fonte de verdade operacional; `appointment_events` é a fonte canônica da evolução, e `appointments.current_status` é sua projeção transacional. Bloqueio da linha e unicidade de `(account_id, appointment_id, sequence_no)` protegem a sequência. O evento notificável nasce na mesma transação em `webhook_events`. `monthly_usage` é reservado junto da criação, e a unicidade de `(account_id, external_id)` impede duplicação concorrente. A conta é obrigatória nas consultas, referências e envelopes; a identidade do usuário ou chave é resolvida no servidor.

A intenção de trabalho fica persistida com a alteração local, em `durable_commands`, com identidade idempotente, referências internas, estado, responsável, versão, validade da reserva, tentativas e próxima execução. Um publicador envia referências à fila, e a reconciliação republica os comandos não concluídos. Não há necessidade de transação distribuída entre banco, fila e integrações. O agendador e a rotina de reconciliação leem horários, tentativas não finalizadas, mensagens não processadas e operações pendentes; não dependem de conteúdo pessoal copiado para jobs. Os jobs carregam referências internas e o contexto mínimo de execução. O comando de e-mail de conclusão conserva excepcionalmente o destinatário cifrado, sem publicá-lo na fila; esse valor é apagado no aceite ou quarta falha.

| Falha | Recuperação e limite |
| --- | --- |
| Fila perde publicações ou reinicia | Reconstituir o trabalho a partir de horários e pendências duráveis. Revalidar também trabalhos antigos que continuarem na fila. Uma publicação perdida após commit não desfaz o aceite da API nem autoriza ignorar janela e corte. |
| Worker cai antes de confirmar a transação | Reexecução encontra o estado anterior; a transação incompleta não produz mudança parcial. |
| Worker cai depois do commit, antes de confirmar o job | A nova entrega encontra estado, evento ou tentativa já persistidos e não repete o efeito lógico. |
| Worker cai durante uma chamada de WhatsApp | Tentativa persistida sem resultado conclusivo é reconciliada como `uncertain` quando não há prova de que o pedido não foi enviado; a mesma mensagem não é repetida. No primeiro envio, registrar `send_uncertain` sem sobrescrever cancelamento ou exclusão concorrente. |
| Worker cai durante entrega de webhook | Após o limite da chamada, registrar a tentativa como falha e permitir nova entrega elegível do mesmo evento. Pode haver duplicata no receptor. |
| Webhook do cliente fica fora do ar | Persistir falha e próxima tentativa segundo a política de webhook. Ao esgotar, manter `delivery_failed`, notificar por e-mail e permitir tentativa manual isolada. O estado do agendamento não muda. |
| Registro externo não confirma a escrita inicial | Exclusão, desbloqueio, revogação, cancelamento pela origem e exclusão de conta não alteram o banco; operações interativas retornam 503 `recovery_log_unavailable`. Retenção fica pendente. |
| Registro externo indisponível ao receber PARAR | Bloquear no banco imediatamente, persistir a necessidade de cópia, repetir a escrita externa e alertar após 15 minutos. Isso não garante reaplicação de uma cópia externa que nunca chegou a ser confirmada. |
| Registro externo indisponível durante restauração | Manter o serviço fechado e os envios suspensos; não é possível provar a reaplicação sem acesso às entradas e ao relatório. |

A reserva de uma tentativa é curta e transacional; a chamada externa tem prazo finito. A recuperação de reservas abandonadas não pode liberar outra execução enquanto a anterior ainda puder iniciar um efeito. Cada comando tem responsável, versão crescente e reserva de 60 segundos. Antes da chamada, atualização condicional valida posse, versão e validade, marca a tentativa iniciada e exige timeout cabendo na validade restante. Timeouts iniciais: 15 segundos para envio ao provedor e 10 segundos para teste de conexão e webhook. Expiração com chamada iniciada e resultado ausente é desconhecimento, tratado pela fronteira. A conexão admite um envio por vez e intervalo mínimo de 3 segundos.

Webhooks usam corpo lógico imutável, destino e segredos vigentes capturados na tentativa, assinatura com o tempo da tentativa e evidência em `webhook_attempt_signatures`. `failure_reason` integra `webhook_events.payload` a partir de `appointment_events.reason`, na mesma transação; somente a anonimização pode destruir o payload. A validação do destino ocorre na configuração e em cada tentativa, incluindo resolução e redirecionamentos. Logs e métricas usam IDs internos, `request_id` e códigos sanitizados, sem mensagens, metadados pessoais ou segredos.

## Registro externo e entradas órfãs

A entrada inicial `pending` é síncrona e fica fora da saída durável. Toda gravação posterior à alteração local passa por `recovery_outbox`, com apenas `contact_block_copy` e `completion_mark`. A operação é única por conta, tipo e alvo HMAC enquanto houver `pending`, permitindo reaproveitar pedido repetido.

Se a transação local falhar com o processo vivo, tentar `abandoned` uma vez, sem repetição imediata. A reconciliação examina `pending` com mais de 15 minutos: efeito local existente gera conclusão pela saída; efeito ausente gera `abandoned`. Na restauração, restritivas ainda `pending` são reaplicadas, `abandoned` não são, e desbloqueios `pending` são descartados. O relatório lista restritivas aplicadas que estavam pendentes havia menos de 15 minutos; aplicar uma órfã não reconciliada é risco residual aceito.

## Recuperação e observabilidade

Backups diários com retenção de 30 dias sustentam o RPO de 24 horas e o RTO de 4 horas; a restauração deve ser ensaiada antes do lançamento. A disponibilidade-alvo é 99% ao mês, medida pela aceitação de agendamentos. São metas operacionais, não garantias de entrega das dependências externas.

API e worker emitem latência, atraso do primeiro envio, idade do trabalho pendente, progresso de jobs e resultados de tentativas. A operação verifica p95 da API abaixo de um segundo e 95% dos primeiros envios em até cinco minutos do horário programado. A verificação de fila sem consumo e job parado precisa executar fora do consumidor observado para produzir o alerta por e-mail mesmo quando ele parar. Alertas iniciais: comando vencido há mais de 5 minutos sem reserva; reserva expirada há mais de 2 minutos sem retomada; 3 eventos de webhook esgotados na mesma conta em 1 hora; 5 falhas consecutivas `provider_disconnected` na mesma conexão.
