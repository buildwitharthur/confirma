# Contas, configurações e chaves

As rotas deste módulo são do painel. Exigem sessão e conta ativa, salvo saída e exclusão da conta. A identidade da conta vem da sessão.

### GET /panel/account

**O que faz:** consulta dados e configuração da conta.

**Autenticação:** sessão.

**Entrada:** sem parâmetros.

**Passo a passo:**
1. Leia a conta da sessão.
2. Retorne nome, fuso, janela de envio, antecedência configurada e data da última alteração.

**Resposta:** `200` com `{"id":"<UUID>","name":"Clínica Exemplo","timezone":"America/Sao_Paulo","send_window_start":"08:00","send_window_end":"20:00","first_send_lead_minutes":1440,"updated_at":"2026-10-19T12:00:00Z"}`.

**Erros:** `401 unauthorized`, `403 forbidden`.

### PATCH /panel/account

**O que faz:** atualiza nome e configuração temporal.

**Autenticação:** sessão.

**Entrada:** `{"name":"Clínica Exemplo","timezone":"America/Sao_Paulo","first_send_lead_minutes":1440,"send_window_start":"08:00","send_window_end":"20:00"}`.

**Passo a passo:**
1. Exija sessão e conta ativa.
2. Valide nome não vazio e fuso IANA reconhecido.
3. Exija antecedência maior que o corte de resposta.
4. Exija janela não vazia.
5. Salve a configuração.
6. Aplique mudanças temporais somente a novos agendamentos.

**Resposta:** `200` com a configuração atualizada.

**Erros:** `401 unauthorized`, `403 forbidden`, `422 validation_error`.

### GET /panel/account/template

**O que faz:** consulta o template de confirmação vigente.

**Autenticação:** sessão.

**Entrada:** sem parâmetros.

**Passo a passo:**
1. Leia o template da conta da sessão.
2. Se a conta nunca salvou um template, retorne o texto padrão com `is_default: true` e `updated_at: null`.

**Resposta:** `200` com `{"body":"Olá, {{nome}}! Seu agendamento está marcado para {{data}} às {{hora}}.","is_default":true,"updated_at":null}`.

**Erros:** `401 unauthorized`, `403 forbidden`.

### PUT /panel/account/template

**O que faz:** salva o template de confirmação.

**Autenticação:** sessão.

**Entrada:** `{"body":"Olá {{nome}}, confirme seu horário de {{data}} às {{hora}} com {{profissional}}."}`.

**Passo a passo:**
1. Exija conta ativa.
2. Exija texto não vazio.
3. Aceite somente `{{nome}}`, `{{profissional}}`, `{{data}}` e `{{hora}}`.
4. Se houver erro, preserve o template atual.
5. Salve o novo texto.
6. Não retome agendamentos que já falharam.

**Resposta:** `200` com `{"body":"Olá {{nome}}, confirme seu horário de {{data}} às {{hora}} com {{profissional}}.","updated_at":"2026-10-19T12:00:00Z"}`.

**Erros:** `401 unauthorized`, `403 forbidden`, `422 validation_error`.

### GET /panel/account/api-keys

**O que faz:** lista chaves de integração da conta.

**Autenticação:** sessão.

**Entrada:** sem parâmetros.

**Passo a passo:**
1. Liste chaves da conta da sessão.
2. Exiba prefixo e datas.
3. Nunca recupere ou exponha o segredo completo.

**Resposta:** `200` com `{"items":[{"id":"<UUID>","prefix":"cf_live_abc","created_at":"2026-10-19T12:00:00Z","revoked_at":null}]}`.

**Erros:** `401 unauthorized`, `403 forbidden`.

### POST /panel/account/api-keys

**O que faz:** cria chave de integração.

**Autenticação:** sessão.

**Entrada:** sem corpo.

**Passo a passo:**
1. Exija conta ativa.
2. Gere a chave e guarde somente seu hash.
3. Retorne o segredo completo uma única vez.

**Resposta:** `201` com `{"id":"<UUID>","prefix":"cf_live_abc","secret":"<segredo exibido uma vez>","created_at":"2026-10-19T12:00:00Z"}`.

**Erros:** `401 unauthorized`, `403 forbidden`.

### DELETE /panel/account/api-keys/{key_id}

**O que faz:** revoga uma chave da conta.

**Autenticação:** sessão.

**Entrada:** `key_id` no caminho; sem corpo.

**Passo a passo:**
1. Exija conta ativa e registro externo confirmado.
2. Confirme a revogação no registro externo antes de alterar a chave.
3. Se a confirmação falhar, mantenha a chave ativa.
4. Revogue a chave da conta da sessão.
5. Repetição não reativa nem duplica o efeito.

**Resposta:** `204`, sem corpo.

**Erros:** `401 unauthorized`, `403 forbidden`, `404 not_found`, `503 service_unavailable`.

### GET /panel/account/usage

**O que faz:** consulta o uso do mês corrente e a distribuição dos agendamentos reais por estado.

**Autenticação:** sessão.

**Entrada:** sem parâmetros.

**Passo a passo:**
1. Determine o mês corrente no fuso da conta.
2. Retorne a contagem de agendamentos aceitos de `MonthlyUsage` e o limite mensal.
3. Conte por estado os agendamentos com `test: false` e consulta no mês, ainda consultáveis.
4. Não conte simulações nem repetições idempotentes no uso.

**Resposta:** `200` com `{"period_start":"2026-10-01","timezone":"America/Sao_Paulo","accepted_appointments":312,"limit":1000,"appointments_by_status":{"scheduled":40,"sent":12,"confirmed":210,"canceled":20,"no_response":18,"failed":12}}`.

**Erros:** `401 unauthorized`, `403 forbidden`.

### DELETE /panel/account

**O que faz:** solicita encerramento e remoção definitiva da conta.

**Autenticação:** sessão do usuário responsável, reautenticada por `POST /auth/reauthenticate` nos últimos 5 minutos.

**Entrada:** nome digitado: `{"account_name":"Clínica Exemplo"}`.

**Passo a passo:**
1. Exija reautenticação válida da sessão; sem ela, retorne `403 reauthentication_required`.
2. Compare o nome após normalização Unicode e remoção de espaços externos.
3. Confirme a operação no registro externo antes de alterar a conta.
4. Se a confirmação falhar, não mude o estado.
5. Marque a conta como `deleting` e interrompa novos trabalhos.
6. Aguarde chamadas externas já iniciadas.
7. Remova dados, vínculos e o usuário. JWTs já emitidos deixam de autenticar porque o usuário não existe mais.
8. Mantenha apenas registro mínimo por 12 meses e tente notificar a conclusão.

**Resposta:** `202` com `{"status":"deleting"}`. A remoção é assíncrona e irreversível.

**Erros:** `401 unauthorized`, `403 forbidden` ou `reauthentication_required`, `422 validation_error`, `503 service_unavailable`.
