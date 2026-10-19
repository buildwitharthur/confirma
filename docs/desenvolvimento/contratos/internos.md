# Contratos internos

## Entrada, persistência e execução

API HTTP, painel e worker compartilham operações transacionais. Toda alteração de negócio grava os comandos correspondentes em `durable_commands` na mesma transação. O publicador entrega referências à fila, e a reconciliação republica comandos não concluídos. A fila não guarda dados pessoais nem a única cópia do trabalho.

`WorkItem` contém `work_id`, `kind`, `account_id`, `aggregate_id`, `available_at`, `created_at` e referências internas em `payload`. `work_id` identifica a publicação; a identidade do comando e sua `idempotency_key` protegem o efeito lógico. O consumidor recarrega dados e elegibilidade no banco.

## Catálogo de trabalho

| `kind` | Agregado e efeito |
| --- | --- |
| `appointment.first_send_due` | Agendamento; verifica política congelada e cria solicitação. |
| `appointment.reminder_due` | Agendamento; cria, adia ou descarta lembrete. |
| `appointment.response_cutoff_due` | Agendamento; registra `no_response` se elegível. |
| `message.attempt_due` | Mensagem; tenta envio na conexão vigente. |
| `webhook.attempt_due` | Evento; entrega payload persistido. |
| `inbound_message.process` | Mensagem recebida; processa na ordem de chegada. |
| `appointment.test_confirmation_due` | Agendamento de teste; simula confirmação. |
| `notification.send_due` | Aviso; envia e-mail e registra evidência. Exige `account_id`. |
| `notification.send_unscoped` | Aviso sem conta (convite e aviso de pedido de acesso); `account_id` nulo; mesma política de tentativas; idempotência pelo identificador da notificação. |
| `privacy.erasure_complete` | Agendamento ou conta; conclui exclusão idempotente. |
| `privacy.appointment_erasure_due` | Agendamento; inicia remoção por retenção. |
| `privacy.connection_secret_erasure_due` | Conexão; desativa e remove segredo de recebimento e número no prazo. |
| `privacy.webhook_secret_erasure_due` | Segredo; destrói valor ao fim da rotação. |

## Agendamento e evento

Uma transação bloqueia o agendamento, verifica aplicabilidade, incrementa `current_event_sequence`, insere `appointment_events`, atualiza `appointments` e, quando notificável, insere `webhook_events.payload` e comando de entrega. O payload inclui o motivo canônico, origem do cancelamento, teste, sequência, ocorrência e metadados. É somente de inserção, com exceção da destruição por anonimização; nunca é reconstruído na reentrega.

## Reserva e chamada externa

Cada comando recebe responsável, versão crescente e reserva de 60 segundos. Antes de chamar uma dependência, uma atualização condicional valida responsável, versão, validade e elegibilidade e marca a tentativa iniciada. Se falhar, nenhuma chamada começa. Esse ponto sem volta usa timeout que cabe no restante da reserva: 15 segundos para envio ao provedor, 10 segundos para teste de conexão e 10 segundos para webhook. Uma execução antiga não pode iniciar chamada após perder a reserva.

Índices únicos parciais limitam a uma tentativa em andamento por mensagem ou evento. A conexão também tem um envio por vez e intervalo mínimo de 3 segundos. Se a reserva expirar com tentativa iniciada e resultado ausente, mensagem é `uncertain` e não se repete; webhook registra falha e permite nova entrega elegível. A finalização revalida cancelamento, bloqueio e exclusão para não sobrescrever efeitos posteriores.

## Tentativa de mensagem e substituição

Sob bloqueio da mensagem, alocar `attempt_no = attempt_count + 1` e gravar `message_attempts.connection_id` com a conexão vigente. `outbound_messages.connection_id` permanece nulo até `accepted` ou `uncertain`, quando recebe a conexão daquela tentativa. A mesma mensagem aceita ou incerta nunca é reenviada. Falhas conclusivas elegíveis têm até quatro tentativas com esperas de 30 segundos, 2 minutos e 10 minutos; mensagens programadas revalidam janela e corte.

Substituir a conexão marca a anterior `replacing`, impede novas chamadas nela e ativa a nova atomicamente. Chamadas anteriores terminam no timeout; a credencial antiga é apagada quando não resta nenhuma. Aceite de chamada anterior fixa a mensagem na conexão antiga; falha permite próxima tentativa na nova. O número e segredo de recebimento antigos permanecem até a última consulta vinculada, quando a conexão vira `inactive` e ambos são apagados.

## Tentativa de webhook

Reservar exclusivamente o evento, alocar `attempt_no`, capturar URL, timestamp e IDs de segredos vigentes e persistir a tentativa antes de enviar `webhook_events.payload`. Registrar assinaturas em `webhook_attempt_signatures`. Automáticas têm `automatic_no` de 1 a 6; manual é isolada, sem `automatic_no`, e exige `delivery_failed`. Não permitir segundo envio concorrente. Falha de entrega nunca altera resultado do agendamento.

## Mensagem recebida e privacidade

Persistir `inbound_messages` com unicidade por conta, conexão e evento do provedor antes de confirmar recebimento. Serializar processamento por conta e `phone_hmac` na ordem de `received_at`, com UUID interno como desempate. Calcular HMAC do telefone e consultar `contact_blocks`, mesmo sem contato vinculado. Vincular contato que reapareceu somente na projeção, sem alterar histórico imutável.

PARAR grava bloqueio, sequência por telefone, `contact_privacy_events` e `recovery_outbox` na mesma transação; não espera disponibilidade externa. A saída durável copia `contact_block` até confirmar. Nova operação PARAR durante desbloqueio em confirmação ganha sequência maior e cancela o desbloqueio. A repetição mantém uma confirmação por bloqueio e não cria mensagens duplicadas.

## Registro externo e desbloqueio

Exclusão de dados, revogação de chave, cancelamento pela origem e exclusão de conta exigem entrada `pending` externa confirmada antes do efeito local. Sem essa confirmação, retornar 503 `recovery_log_unavailable` sem alteração local. A transação local grava `recovery_outbox` do tipo `completion_mark`. Se marcar `completed` falhar, o efeito restritivo permanece e a operação responde sucesso conforme sua semântica; repetir em segundo plano com alerta após 15 minutos. Não confundir confirmação de registro com conclusão de uma exclusão ainda em andamento.

Desbloqueio valida consentimento e cria `pending` externo. A alteração local registra pedido em confirmação, sequência e saída durável, mantendo o bloqueio efetivo; responde 202. Depois de `completed` externo confirmado, verifica a sequência, insere `unblocked` e libera o bloqueio. Se houver PARAR de sequência maior, não libera. Não existe evento de desbloqueio efetivo antes dessa etapa.

`recovery_outbox` usa identidade idempotente por operação e tipo, estado, contador e próxima tentativa. Suas linhas são gravadas na transação local; as entradas externas iniciais que são pré-condição da transação são gravadas e confirmadas antes dela. Na restauração, ordenar ações por conta, HMAC e sequência; restritivas pendentes valem, desbloqueios pendentes não valem. Criar bloqueio só com HMAC quando o contato não existir. A chave não gira no MVP e fica fora dos dois armazenamentos.

## Exclusão e retenção

O pedido grava `deletion_requested_at` ou `accounts.lifecycle_status = deleting`, impede novas tentativas e cria `privacy.erasure_complete`. Sem chamada em andamento, a remoção de agendamento pode terminar com 204; caso contrário retorna 202. O finalizador conclui após terminar a chamada; se cair, a reconciliação retoma ao expirar a reserva. A conclusão exige ausência de chamadas anteriores em andamento e remoção dos dados, não apenas expiração do job.

Anonimização de mensagens apaga conteúdo e `contact_id`, preenche `anonymized_at` e mantém `appointment_id` e dados mínimos até expurgo em 12 meses. `contact_privacy_events.source_message_id` é informativo, sem FK, e o evento conserva data, tipo, canal e conexão; o painel indica mensagem expurgada sem alterar o evento. Contato com bloqueio ou consentimento mantém telefone, sem nome, enquanto a conta existir. `webhook_events.payload` é apagado e o evento deixa de ser reenviável.

Retenção exige registro externo confirmado. Sem ele, marcar vencimento, impedir consulta e reenvio e registrar falha operacional, sem declarar exclusão ou estender prazo. Alertar após 15 minutos de indisponibilidade; 24 horas com vencidos geram urgência e 72 horas geram incidente para documentação de privacidade. Relatório diário sem dados pessoais contém quantidade e vencimento mais antigo; cada lote registra sua conclusão real. Retomar em ordem do vencimento mais antigo.

## E-mail e recuperação

E-mails têm até quatro tentativas: inicial e novas após 1 minuto, 10 minutos e 1 hora. Na transação de exclusão da conta, copiar destinatário cifrado para o comando de conclusão. Depois da remoção do vínculo, só esse comando guarda o endereço; apagá-lo no aceite ou última falha. Esgotamento anota `accounts.deletion_email_status = not_sent`. `notifications` guarda tipo, conta, instante, resultado e ID do serviço, sem endereço, por 12 meses.

Identidades e sessões são restauradas com o mesmo banco; invalidar todas as sessões antes de reabrir. Reaplicar ações protegidas, registrar relatórios e reconciliar prazos com envios suspensos. O aviso de recuperação deve ser aceito pelo serviço de e-mail ou esgotar quatro tentativas por destinatário. Persistindo indisponibilidade, o operador pode decidir reabrir com alerta. Se o operador reabrir o serviço com alerta, começa um único ciclo de continuação: 1 tentativa a cada 24 horas, até 7 tentativas, numeradas de 5 a 11 na mesma sequência do aviso. A identidade é a do próprio aviso de recuperação, sem aviso novo, e a chave de idempotência de cada tentativa é o identificador do aviso mais o número da tentativa. O ciclo termina na primeira entrega confirmada ou quando o operador encerrar a indisponibilidade. Esgotadas as 7 tentativas sem entrega, o aviso fica abandonado e gera um `operational_alert`. Não reabrir com ação de recuperação aplicável sem sucesso.

## Superfícies e isolamento

Na origem da API, `/v1` aceita somente chave de API, nunca cookie; `/panel` aceita somente sessão, nunca chave; `/auth` atende autenticação; `/inbound` exige segredo por conexão; `/site` recebe pedidos de acesso e aceita só a origem `https://useconfirma.com.br`. Cada superfície tem limite próprio, e o excesso responde 429: `/panel`, 120 por minuto por sessão; `/auth`, 10 por minuto por endereço de origem, além do bloqueio por e-mail; `/inbound`, 300 por minuto por conexão de WhatsApp; `/site`, 5 pedidos por hora por endereço de origem. Os valores são recalibrados no piloto. A conta vem da chave ou sessão e do vínculo, nunca de uma escolha arbitrária na entrada. Repositórios e comandos usam `account_id` e referências compostas. Logs usam somente IDs, `request_id` e códigos sanitizados.

## Entradas externas sem efeito local

A entrada inicial `pending` é síncrona, fora de `recovery_outbox`. Toda gravação posterior à alteração local passa pela saída durável, limitada aos tipos `contact_block_copy` e `completion_mark`. O identificador pendente é único por conta, tipo de operação e alvo HMAC; repetição reaproveita a entrada enquanto pendente.

Falha da transação local com processo vivo tenta marcar `abandoned` uma única vez, sem repetição imediata. Após queda, a reconciliação examina `pending` com mais de 15 minutos: se o efeito local existe, grava conclusão pela saída; se não existe, marca `abandoned`. Essas marcações de abandono anteriores a efeito local não criam um terceiro tipo de saída.

Na restauração, entradas restritivas ainda `pending` são reaplicadas, `abandoned` são ignoradas e desbloqueios `pending` descartados. Risco residual aceito: uma órfã não reconciliada pode ser aplicada mesmo sem transação local concluída. O relatório lista entradas restritivas aplicadas que estavam `pending` havia menos de 15 minutos.

## Origens de implantação

O painel está em `https://app.useconfirma.com.br` e usa `https://api.useconfirma.com.br/panel` e `https://api.useconfirma.com.br/auth`. O cookie de sessão é restrito ao host `api.useconfirma.com.br`, sem atributo `Domain`, com `HttpOnly`, `Secure` e `SameSite=Lax`. CORS com credenciais permite somente a origem exata `https://app.useconfirma.com.br`, sem curingas. Comandos do painel verificam `Origin` e exigem cabeçalho personalizado ou token anti-CSRF. `/v1` nunca autentica por cookie; `/panel` nunca autentica por chave de API.

Webhooks de entrada e recebimento do provedor usam `https://api.useconfirma.com.br/inbound/<identificador-opaco>`. Avisos transacionais são enviados por `mail.useconfirma.com.br`, com SPF, DKIM e DMARC configurados.
