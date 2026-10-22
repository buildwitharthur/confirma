# Contatos

As rotas são do painel autenticado.

### POST /panel/contacts/lookup

**O que faz:** consulta o estado de bloqueio de um telefone na conta.

**Autenticação:** sessão.

**Entrada:** `{"phone":"+5511999999999"}`. O telefone vai no corpo para não aparecer em URLs e logs de acesso.

**Passo a passo:**
1. Exija conta ativa e aceite dos termos vigentes.
2. Valide o telefone em E.164.
3. Localize o bloqueio pelo HMAC do telefone na conta da sessão.
4. Não crie contato, bloqueio nem evento.
5. Retorne o estado, o último `PARAR`, o pedido de desbloqueio pendente e o último desbloqueio efetivado.

**Resposta:** `200` com `{"phone":"+5511999999999","status":"blocked","blocked_at":"2026-10-09T18:22:00Z","pending_unblock":null,"last_unblock":null}`. `status`: `not_blocked`, `blocked` ou `pending_unblock`. `pending_unblock` e `last_unblock` usam `{"consent_method":"form","consent_at":"2026-10-16T09:00:00Z","recorded_at":"2026-10-16T09:05:00Z","recorded_by_email":"responsavel@example.com"}`.

**Erros:** `401 unauthorized`, `403 forbidden`, `422 validation_error`.

### POST /panel/contacts/unblocks

**O que faz:** registra consentimento para solicitar desbloqueio.

**Autenticação:** sessão.

**Entrada:** `{"phone":"+5511999999999","consent_method":"in_person","consent_at":"2026-10-19T12:00:00Z"}`.

**Passo a passo:**
1. Exija conta ativa e aceite dos termos vigentes.
2. Valide o telefone, método e instante do consentimento.
3. Recuse data futura ou anterior ao último `PARAR`.
4. Confirme a entrada no registro externo antes de criar o pedido local.
5. Mantenha o telefone bloqueado enquanto o pedido aguarda confirmação externa.
6. Se chegar outro `PARAR`, invalide o pedido pendente.
7. Quando confirmado, libere mensagens. Não reative agendamentos que já falharam.

**Resposta:** `202` com `{"status":"pending_confirmation"}`.

**Erros:** `401 unauthorized`, `403 forbidden`, `404 contact_not_blocked`, `422 validation_error`, `503 service_unavailable`.

## Processos internos

- `PARAR` bloqueia o telefone na conta imediatamente, mesmo sem agendamento. Salve evidência e sequência duráveis. Repetir `PARAR` não envia outra confirmação.
- Cancele mensagens pendentes. Agendamentos em `scheduled`, `sent` ou `no_response` passam a `failed` com `contact_opted_out`, cada um com evento e webhook. Preserve `confirmed` e `canceled`. Novos agendamentos são aceitos em falha por bloqueio.
- Confirme o bloqueio por mensagem imediata, mesmo fora da janela. Retente falhas conclusivas até três vezes, após 30 segundos, 2 minutos e 10 minutos. Não repita resultado incerto.
- A remoção por retenção ou pedido de privacidade preserva bloqueios e consentimentos enquanto a conta existir.
