# Agendamentos

As rotas `/v1` usam `Authorization: Bearer <api_key>`. Chave válida de conta que não está ativa recebe `403 account_inactive` em todas elas. O corpo máximo é 64 KiB; o limite é 60 requisições por minuto por chave. Erros usam `{"code":"...","message":"..."}`.

### POST /appointments

**O que faz:** cria ou recupera um agendamento de forma idempotente.

**Autenticação:** chave de API.

**Entrada:**

```json
{"external_id":"agenda-8472","contact":{"name":"Maria da Silva","social_name":"Maria","phone":"+5511999999999"},"scheduled_at":"2026-10-20T14:00:00-03:00","professional_or_service":"Dra. Ana","metadata":{"unit":"centro"},"test":false}
```

Obrigatórios: `external_id` (1–191 caracteres), `contact.name` (1–160), `contact.phone` em E.164 e `scheduled_at` futuro com fuso explícito. Opcionais: `social_name` (1–160), `professional_or_service` (até 240), `metadata` (objeto até 50 propriedades e 16 KiB) e `test` (padrão `false`). Rejeite propriedades desconhecidas. Não coloque dados sensíveis em `metadata`.

**Passo a passo:**
1. Valide todos os campos antes de produzir efeitos.
2. Exija conta ativa e webhook cadastrado. Para criação real, exija conexão WhatsApp testada.
3. Procure `external_id` dentro da conta. Se o conteúdo normalizado for igual, devolva o existente sem nova cota ou envio. Se for diferente, retorne conflito.
4. Garanta que chamadas concorrentes não criem duplicatas.
5. Para criação real, verifique bloqueio, antecedência mínima de duas horas e janela. Se mais de uma condição falhar, escolha o primeiro motivo nesta ordem: bloqueio, prazo, janela. Aceite o registro como `failed`.
6. Planeje o primeiro envio conforme a antecedência e a janela local da conta. A janela padrão é 08:00 inclusiva a 20:00 exclusiva e a antecedência padrão é 24 horas.
7. Copie as regras temporais atuais para o agendamento.
8. Para `test: true`, valide os dados e exija webhook, mas não exija provedor, não aplique bloqueio, antecedência ou janela, não envie WhatsApp e não consuma cota. Simule confirmação e webhook de teste.
9. Conte até 1.000 agendamentos aceitos por mês; simulações e repetições idempotentes não contam. Avise em 80% e 100%.

**Resposta:** `201` para criação e `200` para repetição idempotente. Exemplo: `{"id":"<UUID>","external_id":"agenda-8472","status":"scheduled","failure_reason":null,"canceled_by":null,"scheduled_at":"2026-10-20T17:00:00Z","timezone":"America/Sao_Paulo","test":false,"delivery_uncertain":false,"created_at":"2026-10-19T12:00:00Z","updated_at":"2026-10-19T12:00:00Z"}`.

**Erros:** `401 unauthorized`, `403 account_inactive`, `409 idempotency_conflict` ou `account_not_configured`, `413 bad_request`, `422 validation_error`, `429 too_many_requests` (inclui `Retry-After`) ou `quota_exceeded`, `503 service_unavailable`.

### GET /appointments/{external_id}

**O que faz:** consulta estado, eventos e entrega de webhook de um agendamento.

**Autenticação:** chave de API.

**Entrada:** `external_id` no caminho, de 1 a 191 caracteres.

**Passo a passo:**
1. Procure o registro somente na conta da chave.
2. Não exponha registro inexistente, anonimizado, excluído ou fora do prazo consultável.
3. Retorne os campos do agendamento, eventos em ordem e resumo da entrega.
4. Não retorne segredos nem payload bruto.

**Resposta:** `200` com os campos do agendamento e `events` (lista com `id`, `sequence`, `type`, `resulting_status`, `reason`, `actor`, `occurred_at`) e `webhook_delivery` (`status`, `event_id`, `automatic_attempts`, `last_attempt_at`).

**Erros:** `401 unauthorized`, `403 account_inactive`, `404 appointment_not_found`, `429 too_many_requests`.

### POST /appointments/{external_id}/cancel

**O que faz:** cancela definitivamente o acompanhamento pela origem.

**Autenticação:** chave de API.

**Entrada:** `external_id` no caminho; sem corpo.

**Passo a passo:**
1. Localize o agendamento na conta da chave.
2. Recuse se a consulta já começou.
3. Registre o cancelamento de forma durável e interrompa trabalhos ainda não iniciados.
4. Não tente recolher mensagem já aceita pelo provedor.
5. Registre e ignore respostas posteriores.
6. Se o contato já havia cancelado, torne o cancelamento definitivo e gere novo evento.
7. Repetição do mesmo cancelamento não cria evento adicional.

**Resposta:** `200` com o recurso `Appointment`; `status` é `canceled` e `canceled_by` é `system`.

**Erros:** `401 unauthorized`, `403 account_inactive`, `404 appointment_not_found`, `409 appointment_started`, `429 too_many_requests`, `503 service_unavailable`.

### DELETE /appointments/{external_id}

**O que faz:** solicita exclusão antecipada dos dados pessoais do agendamento.

**Autenticação:** chave de API.

**Entrada:** `external_id` no caminho; sem corpo.

**Passo a passo:**
1. Confirme a operação no registro externo antes de alterar os dados.
2. Se a confirmação falhar, não altere os dados.
3. Impeça novas chamadas externas, encerre trabalhos pendentes e remova dados pessoais e conteúdo associado.
4. Preserve bloqueio e evidência de consentimento do telefone.
5. Não crie estado público de exclusão nem webhook.
6. Se uma chamada externa já começou, aguarde a reserva de até 60 segundos e retome a exclusão.
7. Permita reutilizar o identificador após a exclusão.

**Resposta:** `204` quando concluída ou sem dado correspondente. `202` quando uma chamada iniciada ainda pode terminar, com `{"status":"pending","external_call_may_complete":true}`. A resposta não revela se o registro existia.

**Erros:** `401 unauthorized`, `403 account_inactive`, `429 too_many_requests`, `503 service_unavailable`.

## Rotas do painel

Exigem sessão e conta ativa. A conta vem da sessão. Registros anonimizados, excluídos ou fora do prazo consultável não aparecem.

### GET /panel/appointments

**O que faz:** lista agendamentos da conta para acompanhamento.

**Autenticação:** sessão.

**Entrada:** query opcional: `q` (trecho de `external_id`, até 191 caracteres), `status` (`AppointmentStatus`), `webhook_status` (`pending`, `delivering`, `delivered`, `delivery_failed`, `suppressed` ou `none`), `test` (`true` ou `false`), `sort` (`scheduled_at_desc`, padrão, ou `updated_at_desc`), `page` (a partir de 1) e `page_size` (1–50, padrão 10). Rejeite parâmetros desconhecidos.

**Passo a passo:**
1. Filtre somente agendamentos da conta da sessão.
2. Use como `webhook_status` o estado de entrega do evento mais recente do agendamento; `none` indica que ainda não há evento.
3. Retorne dados mínimos do contato, sem telefone completo.

**Resposta:** `200` com `{"items":[{"external_id":"agenda-8472","status":"confirmed","failure_reason":null,"canceled_by":null,"scheduled_at":"2026-10-20T17:00:00Z","timezone":"America/Sao_Paulo","test":false,"delivery_uncertain":false,"contact":{"name":"Maria da Silva","phone_last4":"9999"},"webhook_delivery":{"status":"delivered","automatic_attempts":1},"updated_at":"2026-10-19T12:00:00Z"}],"page":1,"page_size":10,"total":1}`.

**Erros:** `401 unauthorized`, `403 forbidden`, `422 validation_error`.

### GET /panel/appointments/{external_id}

**O que faz:** consulta o detalhe, o histórico e as entregas de webhook de um agendamento.

**Autenticação:** sessão.

**Entrada:** `external_id` no caminho, de 1 a 191 caracteres.

**Passo a passo:**
1. Procure o registro somente na conta da sessão.
2. Retorne os campos do agendamento, `professional_or_service`, contato com nome, nome social e últimos quatro dígitos do telefone.
3. Retorne `events` em ordem de sequência.
4. Retorne `webhook_events`, cada um com tentativas automáticas e manuais.
5. Não retorne `metadata`, segredos, conteúdo de mensagens nem payload bruto.

**Resposta:** `200` com os campos do agendamento, `created_at`, `updated_at`, `contact` (`name`, `social_name`, `phone_last4`), `professional_or_service`, `events` (mesmo formato de `GET /appointments/{external_id}`) e `webhook_events` (lista com `event_id`, `type`, `sequence`, `occurred_at`, `test`, `delivery_status` e `attempts`, cada tentativa com `number`, `kind` (`automatic` ou `manual`), `attempted_at`, `outcome` (`success`, `http_error`, `timeout` ou `network_error`) e `http_status`).

**Erros:** `401 unauthorized`, `403 forbidden`, `404 appointment_not_found`.

### DELETE /panel/appointments/{external_id}

**O que faz:** solicita pelo painel a exclusão antecipada dos dados pessoais do agendamento.

**Autenticação:** sessão.

**Entrada:** `external_id` no caminho; sem corpo.

**Passo a passo:**
1. Execute a mesma operação de `DELETE /appointments/{external_id}`, na conta da sessão.
2. Registre o usuário do painel como responsável na auditoria mínima.

**Resposta:** igual a `DELETE /appointments/{external_id}`: `204` ou `202` com `{"status":"pending","external_call_may_complete":true}`. A resposta não revela se o registro existia.

**Erros:** `401 unauthorized`, `403 forbidden`, `503 service_unavailable`.

## Processos internos

- O primeiro envio usa o template da conta. `{{nome}}` prefere nome social; dados opcionais ausentes viram texto vazio. Acrescente instrução fixa para responder `1` ou `2`. Template inválido causa falha final `invalid_message`; corrigir o template não retoma o agendamento.
- Reserve cada tentativa antes da chamada. Use uma tentativa inicial e até três retentativas após 30 segundos, 2 minutos e 10 minutos. Cada chamada tem timeout de 15 segundos e há intervalo mínimo de três segundos por conexão. Número inválido não é repetido. Resultado incerto não é repetido e leva a `sent` com `delivery_uncertain`.
- Desconexão sem tentativa causa `provider_disconnected`; esgotamento causa `attempts_exhausted`. Aceite ou incerteza agenda lembrete quatro horas após o primeiro aceite.
- Lembrete usa texto fixo. Respeita janela e corte de duas horas; pode ser adiado à próxima abertura. Falha e incerteza não mudam o estado nem geram webhook. Após troca, usa a conexão atual.
- No corte de duas horas, marque `no_response` somente se ainda elegível. Resposta tardia pode alterar esse estado até o início da consulta.
- `test` simula confirmação e webhook sem enviar mensagem.
