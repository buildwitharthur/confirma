# Jobs e filas

## Fonte durável e publicação

Toda alteração de negócio grava seu trabalho em `durable_commands` na mesma transação. Um publicador entrega à fila referências ao comando; a reconciliação republica comandos não concluídos. A fila acelera a execução e não é a fonte de verdade. Mensagens da fila não carregam dados pessoais nem segredos. O consumidor recarrega o comando, a conta e a elegibilidade no banco.

## Catálogo de comandos

| `kind` | Papel | Referência e efeito |
| --- | --- | --- |
| `message.attempt_due` | Enviar mensagem | `outbound_messages`; reserva uma tentativa na conexão vigente. |
| `webhook.attempt_due` | Entregar webhook | `webhook_events`; entrega o `payload` persistido. |
| `inbound_message.process` | Processar mensagem recebida | `inbound_messages`; serializa por conta e `phone_hmac`. |
| `appointment.test_confirmation_due` | Simular confirmação de teste | `appointments`; confirma a simulação sem WhatsApp. |
| `notification.send_due` | Enviar aviso | Referência ao fato notificável; exige `account_id`; grava evidência em `notifications`. |
| `notification.send_unscoped` | Enviar aviso sem conta | Convite e aviso de pedido de acesso; `account_id` obrigatoriamente nulo, regra do próprio comando; mesma política de tentativas e mesma evidência em `notifications`; a chave de idempotência é o identificador da notificação. |
| `privacy.erasure_complete` | Concluir exclusão | Conta ou agendamento em exclusão; aguarda chamadas iniciadas e remove os dados. |

Os comandos temporais também são persistidos em `durable_commands`: `appointment.first_send_due`, `appointment.reminder_due`, `appointment.response_cutoff_due`, `privacy.appointment_erasure_due`, `privacy.connection_secret_erasure_due` e `privacy.webhook_secret_erasure_due`. Eles criam o trabalho seguinte ou aplicam a transição elegível na mesma transação. A rotina de reconciliação de `recovery_outbox` é independente do transporte pela fila e repete cópias e marcações externas não confirmadas.

## Reserva e início de tentativa

Cada comando tem responsável, `lease_version` crescente e `lease_expires_at`, com reserva de 60 segundos. Antes de uma chamada externa, uma atualização condicional atômica confere responsável, versão, validade, elegibilidade e ausência de tentativa concorrente, e persiste o início. Se falhar, não há chamada. Esse é o ponto sem volta; o consumidor deve iniciar a chamada nesse limite, com timeout cabendo na validade restante da reserva. Uma execução antiga não pode iniciar chamada com reserva vencida ou substituída.

Há no máximo uma tentativa em andamento por mensagem ou evento e um envio por conexão. Envios na mesma conexão respeitam intervalo mínimo de 3 segundos. O timeout é de 15 segundos para mensagem ao provedor, 10 segundos para teste de conexão e 10 segundos para webhook. São valores iniciais calibráveis na homologação.

Ao expirar a reserva com tentativa iniciada e sem resultado, o resultado é desconhecido: mensagem fica `uncertain`, sem repetição; webhook registra falha e permite nova entrega elegível. Sem tentativa iniciada, a reconciliação pode reservar novamente. Queda antes da confirmação do job não reaplica transição já persistida.

## Retentativas

| Trabalho | Política |
| --- | --- |
| Mensagem com falha conclusiva elegível | Até 4 tentativas: inicial e novas após 30 segundos, 2 minutos e 10 minutos. |
| Webhook automático | Até 6 tentativas: inicial e novas após 30 segundos, 2 minutos, 10 minutos, 1 hora e 6 horas. |
| Webhook manual | Uma tentativa isolada, sem reiniciar ciclo automático. |
| E-mail transacional | Até 4 tentativas: inicial e novas após 1 minuto, 10 minutos e 1 hora. |
| `recovery_outbox` | Repetir a cada 1 minuto até confirmação durável; alerta `operational_alert` após 15 minutos sem confirmação. Valores recalibrados no piloto. |

Os intervalos começam na falha anterior. A política de negócio prevalece sobre a reentrega da fila. Aceite incerto de mensagem não é uma falha recuperável.

## Exclusão e avisos

`privacy.erasure_complete` é idempotente e retomável. O pedido mantém a conta em `deleting` ou o agendamento com `deletion_requested_at`; nenhuma tentativa nova começa. Se o processo cair, a reconciliação retoma após expirar a reserva. A exclusão conclui quando não houver chamada anterior em andamento e os dados pessoais tiverem sido removidos.

Na transação que marca a conta como `deleting`, `notification.send_due` para conclusão recebe `recipient_ciphertext`. Esse comando aguarda a exclusão terminar. Depois de removido `account_users.email`, essa é a única cópia operacional do destinatário; não é publicada na fila. O valor é apagado no aceite pelo serviço de e-mail ou na última tentativa falha. Neste último caso, `accounts.deletion_email_status` fica `not_sent`. `notifications` conserva somente evidência sem endereço por 12 meses.

## Alertas e manutenção

| Condição | Disparo inicial |
| --- | --- |
| Fila sem consumo | Comando vencido há mais de 5 minutos sem reserva. |
| Job parado | Reserva expirada há mais de 2 minutos sem retomada. |
| Falhas seguidas de webhook | 3 eventos com entregas esgotadas na mesma conta em 1 hora. |
| Falhas seguidas de envio | 5 falhas consecutivas `provider_disconnected` na mesma conexão. |
| Registro externo indisponível | 15 minutos: alerta ao operador. |
| Retenção atrasada | 24 horas com registros vencidos: escalonamento urgente; 72 horas: incidente registrado para a documentação de privacidade do operador. |

O supervisor não depende do consumidor observado. A retenção mantém relatório diário sem dados pessoais em `retention_reports` e registra lotes em `retention_erasure_batches`; ao restabelecer o registro externo, processa do vencimento mais antigo ao mais novo. Dados vencidos ficam indisponíveis para consulta e reenvio, sem declarar remoção ainda não realizada.

## Entradas externas sem efeito local

A entrada inicial `pending` é síncrona, fora de `recovery_outbox`. Toda gravação posterior à alteração local passa pela saída durável, limitada aos tipos `contact_block_copy` e `completion_mark`. O identificador pendente é único por conta, tipo de operação e alvo HMAC; repetição reaproveita a entrada enquanto pendente.

Falha da transação local com processo vivo tenta marcar `abandoned` uma única vez, sem repetição imediata. Após queda, a reconciliação examina `pending` com mais de 15 minutos: se o efeito local existe, grava conclusão pela saída; se não existe, marca `abandoned`. Essas marcações de abandono anteriores a efeito local não criam um terceiro tipo de saída.

Na restauração, entradas restritivas ainda `pending` são reaplicadas, `abandoned` são ignoradas e desbloqueios `pending` descartados. Risco residual aceito: uma órfã não reconciliada pode ser aplicada mesmo sem transação local concluída. O relatório lista entradas restritivas aplicadas que estavam `pending` havia menos de 15 minutos.

## Origem de e-mail

O comando `notification.send_due` usa o domínio remetente `mail.useconfirma.com.br`; SPF, DKIM e DMARC precisam estar configurados. O domínio não define uma caixa postal nem escolhe o serviço de e-mail.
