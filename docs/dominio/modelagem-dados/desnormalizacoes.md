# Desnormalizações deliberadas

O modelo transacional permanece em terceira forma normal. As colunas abaixo são projeções ou cópias controladas criadas para atender filas, consultas frequentes, entrega externa ou recuperação. Nenhuma delas pode evoluir sem uma fonte canônica e um mecanismo de conferência.

## Estado atual do agendamento

**Colunas:** `appointments.current_status`, `failure_reason`, `canceled_by`, `delivery_uncertain`, `current_event_sequence` e horários de próxima ação.

**Fonte canônica:** sequência de `appointment_events` e resultados das mensagens associadas.

**Motivo:** selecionar trabalho de fila, consultar o detalhe e filtrar estados sem reconstruir todo o histórico a cada operação.

**Consistência:** inserir o evento e atualizar a projeção na mesma transação, bloqueando a linha do agendamento. O novo número deve ser exatamente o anterior mais um. Uma rotina de auditoria recompõe a projeção pelo último evento e alerta divergências. A rotina só corrige a projeção; nunca altera o histórico.

## Estado e próxima tentativa de mensagens

**Colunas:** `outbound_messages.current_status`, `next_attempt_at`, `accepted_at`, `delivery_uncertain` e `attempt_count`.

**Fonte canônica:** linhas de `message_attempts` e o resultado operacional do provedor.

**Motivo:** reivindicar mensagens prontas na fila e interromper rapidamente retentativas sem agregar tentativas em cada busca.

**Consistência:** criar a tentativa e atualizar a mensagem na mesma transação. A fila usa bloqueio com salto de linhas já reivindicadas. `attempt_count` corresponde ao maior `attempt_no`; `accepted_at` só é preenchido para aceite ou aceite incerto. Uma rotina compara as projeções com a última tentativa.

## Estado e próxima tentativa de webhook

**Colunas:** `webhook_events.delivery_status`, `next_attempt_at`, `automatic_attempt_count`, `delivered_at` e `manual_delivery_in_progress`.

**Fonte canônica:** `webhook_attempts`.

**Motivo:** buscar eventos prontos, exibir o botão de reenvio e garantir uma entrega por evento de cada vez sem agregar o histórico.

**Consistência:** tentativa e projeção mudam na mesma transação. Uma restrição parcial permite no máximo uma tentativa em andamento por evento. O botão usa atualização condicional de `manual_delivery_in_progress`; falha manual o libera sem reiniciar o ciclo automático.

## Sequência corrente do agendamento

**Coluna:** `appointments.current_event_sequence`.

**Fonte canônica:** maior `appointment_events.sequence_no` do agendamento.

**Motivo:** alocar a próxima sequência de forma concorrente e montar eventos de webhook sem varrer o histórico.

**Consistência:** a aplicação bloqueia o agendamento, incrementa a coluna e insere o evento com o novo valor na mesma transação. `UNIQUE (account_id, appointment_id, sequence_no)` impede duplicação.

## Corpo imutável do webhook

**Coluna:** `webhook_events.payload`.

**Fonte canônica:** evento em `appointment_events` e dados do agendamento no instante do fato; `appointment_events.reason` origina `failure_reason`.

**Motivo:** reentregas precisam preservar integralmente o corpo, inclusive motivo, origem de cancelamento, teste, sequência, ocorrência e metadados.

**Consistência:** criar evento canônico e payload na mesma transação. O payload é somente de inserção; a única remoção permitida é sua destruição autorizada na anonimização. Reentregas enviam o payload gravado, sem consultar o agendamento atual para reconstruí-lo. URL, segredos e timestamp da assinatura são capturados a cada tentativa. `anonymized_at` preenchido exige `payload` nulo e impede reenvio.

## Identificadores do provedor

**Colunas:** `outbound_messages.provider_message_id` e `inbound_messages.quoted_provider_message_id`.

**Fonte canônica:** resposta e evento recebidos da Evolution API.

**Motivo:** associar uma resposta citada ao envio original sem depender de consulta externa. O identificador também ajuda a eliminar eventos repetidos do provedor.

**Consistência:** gravar o identificador apenas a partir do payload autenticado do provedor. A unicidade por conta, conexão e identificador impede associar o mesmo envio a duas mensagens. Após anonimização, esses identificadores são apagados com o conteúdo operacional.

## Corpo composto e conexão aceita da mensagem

**Colunas:** `outbound_messages.body` e `connection_id`; `message_attempts.connection_id`.

**Fonte canônica:** template e dados no momento da composição; conexão vigente no início de cada tentativa e resultado aceito ou incerto.

**Motivo:** a mensagem lógica preserva o texto, mas uma tentativa ainda não aceita segue a conexão vigente.

**Consistência:** compor uma vez; `outbound_messages.connection_id` permanece nulo até `accepted` ou `uncertain`. Cada tentativa registra sua própria conexão antes da chamada. Aceite ou incerteza fixa a conexão da tentativa na mensagem e impede qualquer reenvio. A troca marca a anterior `replacing`, impede chamadas novas e aguarda as iniciadas; a credencial de envio é apagada quando nenhuma resta. Falha conclusiva permite retentativa na conexão nova. Corpo e contato são apagados na anonimização; `appointment_id` permanece até expurgo.

## URL e versões de segredo usadas na tentativa de webhook

**Colunas:** `webhook_attempts.endpoint_url` e relações em `webhook_attempt_signatures`.

**Fonte canônica:** endpoint e segredos vigentes no início da tentativa.

**Motivo:** comprovar para onde uma tentativa específica foi enviada e quais versões de segredo produziram seus cabeçalhos, mesmo que a conta seja reconfigurada depois.

**Consistência:** capturar URL, tempo e IDs dos segredos na mesma transação que inicia a tentativa. O envio usa somente esses valores capturados. Nunca copiar o segredo aberto. A URL é removida na anonimização; os IDs das versões podem permanecer no histórico sanitizado.

## Estado atual do bloqueio por telefone

**Tabela:** `contact_blocks`, chave `(account_id, phone_hmac)`; `contact_id` opcional.

**Fonte canônica:** `contact_privacy_events` para efeitos efetivados e operações sequenciadas no registro externo para restauração.

**Consistência:** atribuir `current_sequence` sob bloqueio da chave do telefone. PARAR grava efeito e `recovery_outbox` juntos. Desbloqueio em confirmação mantém o bloqueio até `completed` externo; só então insere `unblocked`, se nenhuma sequência maior o cancelou. Restauração ordena `phone_sequence`, descarta desbloqueios pendentes e mantém o maior efeito aplicável. Pode criar bloqueio só com HMAC; o contato é vinculado em `contact_blocks` quando o telefone reaparece, sem alterar o evento imutável.

A chave HMAC fica fora dos dois armazenamentos e não é rotacionada no MVP; troca por vazamento exige migrar todos os HMACs.

## Contador mensal de uso

**Coluna:** `monthly_usage.accepted_appointments`.

**Fonte canônica:** criações aceitas e elegíveis no mês calendário da conta.

**Motivo:** aplicar a cota na criação sem contar toda a tabela de agendamentos. A contagem precisa sobreviver à anonimização, que remove `external_id`, e não pode diminuir por exclusão.

**Consistência:** reservar a unidade e criar o agendamento na mesma transação. A chave `(account_id, period_start)` serializa a atualização. Simulações, repetições idempotentes e erros de validação não incrementam. Uma marca `appointments.counted_in_quota` registra se a criação contribuiu para auditoria; o total mensal continua preservado mesmo após anonimização.

`monthly_usage.timezone_snapshot` copia o fuso vigente quando o primeiro agendamento é aceito no período. Cada agendamento contribui uma única vez para o mês determinado no instante de seu aceite. Uma mudança posterior de fuso não move contagens entre períodos; aceita-se o deslocamento de algumas horas na fronteira do mês.

## Configuração corrente da conta

**Colunas em `accounts`:** fuso, antecedência, janela de envio e limites do piloto. **Snapshots em `appointments`:** fuso, janela, antecedência, atraso do lembrete e corte.

**Fonte canônica:** a própria configuração vigente da conta; não há histórico funcional exigido para esses valores no MVP.

**Motivo:** os valores vigentes são parâmetros escalares de uma relação um para um e são lidos em toda criação. As cópias no agendamento congelam a política aplicável ao compromisso, permitindo que alterações da conta afetem somente criações futuras e que o painel continue exibindo o fuso original.

**Consistência:** validar a configuração numa única operação. Cada agendamento copia fuso, antecedência, janela, atraso do lembrete e corte vigentes no aceite e usa esses valores até terminar. Alterações da conta só afetam novos agendamentos; não existe recálculo. Para mudar o planejamento de um compromisso, o integrador cancela e cria outro.

`whatsapp_connections.is_current` também projeta qual versão da conexão é vigente. Um índice único parcial garante uma só linha atual por conta. A troca marca a anterior e ativa a nova na mesma transação; cada tentativa em andamento preserva a conexão capturada, e somente aceite ou incerteza fixa a conexão na mensagem.

## Registro externo de recuperação

**Tabela lógica:** `recovery_ledger`, independente do banco restaurado.

**Consistência:** operações protegidas exigem `pending` externo confirmado antes da alteração local. A alteração local grava `recovery_outbox` para marcar `completed`. Falha nessa marcação não desfaz efeitos restritivos nem impede resposta de sucesso; a reconciliação repete até confirmar e alerta após 15 minutos. PARAR grava primeiro bloqueio e saída durável na mesma transação. Desbloqueio permanece em confirmação, com resposta 202, até confirmação externa e efetivação local por sequência.

Toda operação de telefone leva `phone_hmac` e `phone_sequence`. Na restauração, restritivas pendentes são reaplicadas; desbloqueios pendentes são descartados. A maior sequência aplicável determina o efeito. Entradas externas podem estar `pending`, `completed` ou `abandoned`. A reconciliação de pendências com mais de 15 minutos procura efeito local: conclui pela saída durável quando ele existe, ou abandona quando ausente. Na restauração, `abandoned` não se aplica e restritivas pendentes com menos de 15 minutos são destacadas no relatório. Relatórios externos comprovam reaplicação sem dados pessoais.

## Comandos e notificações

`durable_commands` armazena intenção na transação de negócio; a fila contém somente referências. Reserva versionada de 60 segundos e atualização condicional antes da chamada protegem a execução. Publicação e reconciliação não reconstroem trabalho de memória.

`recipient_ciphertext` no comando do aviso de conclusão é a única cópia operacional do destinatário depois da exclusão de `account_users`. É apagado no aceite ou última falha; `notifications` conserva somente evidência sem endereço por 12 meses.

