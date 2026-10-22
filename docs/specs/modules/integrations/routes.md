# Integrações

Exigem sessão, conta ativa e aceite dos termos vigentes. Segredos e credenciais nunca aparecem em consultas.

### GET /panel/integrations/whatsapp

**O que faz:** consulta a conexão WhatsApp atual.

**Autenticação:** sessão.

**Entrada:** sem parâmetros.

**Passo a passo:**
1. Leia a conexão da conta da sessão.
2. Retorne identificador, telefone, estados de conexão, versão lida no último teste e data da última verificação, sem credenciais.
3. Se houver conexão em substituição, retorne seu identificador.

**Resposta:** `200` com `{"instance_identifier":"agenda-clinica","sender_phone":"+5511999999999","status":"active","connection_status":"connected","provider_version":"2.3.7","last_checked_at":"2026-10-19T12:00:00Z","replacing_instance_identifier":null}`.

**Erros:** `401 unauthorized`, `403 forbidden`, `404 not_found`.

### PUT /panel/integrations/whatsapp

**O que faz:** testa e salva uma conexão WhatsApp.

**Autenticação:** sessão.

**Entrada:** `{"instance_identifier":"agenda-clinica","sender_phone":"+5511999999999","send_credentials":"...","receive_secret":"..."}`.

**Passo a passo:**
1. Exija conta ativa e aceite dos termos.
2. Teste a conexão e consulte a versão com timeout de 10 segundos.
3. Se o teste falhar, preserve toda a configuração anterior.
4. Salve a nova conexão com a versão lida e o instante do teste, sem retornar credenciais.
5. Na troca, impeça chamadas novas pela conexão antiga.
6. Aguarde chamadas já iniciadas e apague credenciais antigas quando terminarem.
7. Mantenha respostas da conexão substituída para mensagens já enviadas até o início da consulta.
8. Use a conexão atual para retentativas conclusivas.

**Resposta:** `200` com dados públicos da conexão e `connection_status`. Versão diferente de 2.3.7 pode ser salva se funcionar, com aviso de que não está homologada.

**Erros:** `401 unauthorized`, `403 forbidden`, `422 validation_error`, `502 service_unavailable` para falhas do adaptador (`network_error`, `authentication_failed`, `instance_not_found`, `instance_not_connected`).

### GET /panel/integrations/webhook

**O que faz:** consulta o destino de webhook configurado.

**Autenticação:** sessão.

**Entrada:** sem parâmetros.

**Passo a passo:**
1. Leia o destino da conta da sessão.
2. Retorne URL sanitizada e datas, nunca o valor do segredo.
3. Retorne a vigência do segredo atual e do anterior em rotação, ou `null` se ainda não houver segredo.
4. Retorne o resumo do último evento `webhook.test`, ou `null`.

**Resposta:** `200` com `{"url":"https://cliente.example/webhooks/confirma","created_at":"2026-10-19T12:00:00Z","updated_at":"2026-10-19T12:00:00Z","secret":{"valid_from":"2026-10-19T12:00:00Z","previous_valid_until":null},"last_test":{"event_id":"<UUID>","delivery_status":"delivered","occurred_at":"2026-10-19T12:10:00Z"}}`.

**Erros:** `401 unauthorized`, `403 forbidden`, `404 not_found`.

### PUT /panel/integrations/webhook

**O que faz:** cadastra ou atualiza o destino de eventos.

**Autenticação:** sessão.

**Entrada:** `{"url":"https://cliente.example/webhooks/confirma"}`.

**Passo a passo:**
1. Exija conta ativa e aceite dos termos.
2. Exija URL HTTPS sem credenciais embutidas.
3. Rejeite endereços locais ou privados e resolução proibida.
4. Rejeite redirecionamento para destino proibido.
5. Salve URL sanitizada.
6. Revalide o destino a cada entrega.

**Resposta:** `200` com `{"url":"https://cliente.example/webhooks/confirma","updated_at":"2026-10-19T12:00:00Z"}`.

**Erros:** `401 unauthorized`, `403 forbidden`, `422 validation_error`.

### POST /panel/integrations/webhook/secret

**O que faz:** cria o primeiro segredo de assinatura.

**Autenticação:** sessão.

**Entrada:** sem corpo.

**Passo a passo:**
1. Exija endpoint configurado, conta ativa e aceite dos termos.
2. Recuse se já houver segredo; a troca usa a rotação.
3. Gere o segredo e guarde-o protegido.
4. Exiba o valor completo somente nesta resposta.
5. Garanta que chamadas concorrentes criem um único segredo.

**Resposta:** `201` com `{"secret":"<segredo exibido uma vez>","valid_from":"2026-10-19T12:00:00Z"}`.

**Erros:** `401 unauthorized`, `403 forbidden`, `404 not_found`, `409 conflict`.

### POST /panel/integrations/webhook/secret/rotate

**O que faz:** troca o segredo de assinatura.

**Autenticação:** sessão.

**Entrada:** sem corpo.

**Passo a passo:**
1. Exija endpoint e segredo configurados, conta ativa e aceite dos termos.
2. Recuse com `409 conflict` enquanto o segredo anterior de uma rotação ainda estiver no período de 24 horas; nunca mantenha mais de um segredo anterior ativo.
3. Gere segredo novo.
4. Exiba o valor completo somente nesta resposta.
5. Por 24 horas, assine com o segredo novo e o anterior.
6. Depois do prazo, destrua o valor anterior.

**Resposta:** `200` com `{"secret":"<segredo exibido uma vez>","previous_valid_until":"2026-10-20T12:00:00Z"}`.

**Erros:** `401 unauthorized`, `403 forbidden`, `404 not_found`, `409 conflict`.
### POST /panel/integrations/webhook/test

**O que faz:** cria evento isolado para testar entrega e assinatura.

**Autenticação:** sessão.

**Entrada:** sem corpo.

**Passo a passo:**
1. Exija endpoint e segredo configurados.
2. Crie evento `webhook.test` com `test: true`.
3. Enfileire a entrega.
4. Não trate o aceite do comando como prova de entrega.

**Resposta:** `202` com `{"event_id":"<UUID>","status":"pending"}`.

**Erros:** `401 unauthorized`, `403 forbidden`, `409 conflict`.

### GET /panel/integrations/webhook/events

**O que faz:** lista eventos de webhook da conta, como os que esgotaram as tentativas.

**Autenticação:** sessão.

**Entrada:** query opcional: `delivery_status` (`pending`, `delivering`, `delivered`, `delivery_failed` ou `suppressed`), `page` (a partir de 1) e `page_size` (1–50, padrão 20). Rejeite parâmetros desconhecidos.

**Passo a passo:**
1. Filtre somente eventos consultáveis da conta da sessão.
2. Ordene do mais recente para o mais antigo.
3. Não retorne corpo, assinatura nem segredo.

**Resposta:** `200` com `{"items":[{"event_id":"<UUID>","type":"appointment.failed","appointment_external_id":"agenda-8475","sequence":2,"occurred_at":"2026-10-19T12:00:00Z","test":false,"delivery_status":"delivery_failed"}],"page":1,"page_size":20,"total":1}`. `appointment_external_id` é `null` para `webhook.test`.

**Erros:** `401 unauthorized`, `403 forbidden`, `422 validation_error`.

### GET /panel/integrations/webhook/events/{event_id}

**O que faz:** consulta um evento de webhook e suas tentativas, inclusive o resultado de um teste.

**Autenticação:** sessão.

**Entrada:** `event_id` no caminho.

**Passo a passo:**
1. Localize evento consultável da conta da sessão.
2. Retorne estado de entrega e tentativas em ordem.
3. Não retorne corpo, assinatura nem segredo.

**Resposta:** `200` com os campos da listagem e `attempts` (lista com `number`, `kind` (`automatic` ou `manual`), `attempted_at`, `outcome` (`success`, `http_error`, `timeout` ou `network_error`) e `http_status`).

**Erros:** `401 unauthorized`, `403 forbidden`, `404 not_found`.

### POST /panel/integrations/webhook/events/{event_id}/redeliver

**O que faz:** solicita uma tentativa manual para evento esgotado.

**Autenticação:** sessão.

**Entrada:** `event_id` no caminho; sem corpo.

**Passo a passo:**
1. Localize evento consultável da conta.
2. Exija estado `delivery_failed` e nenhuma entrega em andamento.
3. Reserve uma única tentativa para evitar duplicidade concorrente.
4. Use evento original e configurações vigentes.
5. Se falhar, mantenha a ação disponível sem novo ciclo automático nem e-mail.

**Resposta:** `202` com `{"event_id":"<UUID>","status":"delivering"}`.

**Erros:** `401 unauthorized`, `403 forbidden`, `404 not_found`, `409 conflict`.

## Processos internos

- A entrega usa `POST` HTTPS, timeout de 10 segundos e qualquer 2xx conta como sucesso. Assine `timestamp + "." + corpo bruto` com HMAC-SHA256. Na rotação, envie assinaturas atual e anterior.
- Faça uma tentativa inicial e até cinco novas após 30 segundos, 2 minutos, 10 minutos, 1 hora e 6 horas. Preserve ID, corpo, sequência e ocorrência; renove timestamp e assinatura por tentativa.
- Entregas podem repetir e chegar fora de ordem. O receptor deduplica por ID e usa sequência do agendamento. Ao esgotar tentativas, marque falha e avise o responsável por e-mail. A entrega não muda o resultado do agendamento.
