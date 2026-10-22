# Checklist de desenvolvimento da API

Todas as caixas começam desmarcadas. Marque uma rota somente quando houver evidência de que ela foi implementada.

## Auth

- [ ] POST /auth/login
- [ ] POST /auth/logout
- [ ] POST /auth/password/forgot
- [ ] POST /auth/password/reset
- [ ] POST /auth/reauthenticate

Detalhes: [Auth](modules/auth/routes.md).

## Invites

- [ ] GET /auth/invitations/inspect
- [ ] POST /auth/invitations/accept

Detalhes: [Convites](modules/invites/routes.md).

## Accounts

- [ ] GET /panel/account
- [ ] PATCH /panel/account
- [ ] DELETE /panel/account
- [ ] POST /panel/account/terms-acceptance
- [ ] GET /panel/account/usage
- [ ] GET /panel/account/template
- [ ] PUT /panel/account/template
- [ ] GET /panel/account/api-keys
- [ ] POST /panel/account/api-keys
- [ ] DELETE /panel/account/api-keys/{key_id}

Detalhes: [Contas](modules/accounts/routes.md).

## Appointments

- [ ] POST /appointments
- [ ] GET /appointments/{external_id}
- [ ] POST /appointments/{external_id}/cancel
- [ ] DELETE /appointments/{external_id}
- [ ] GET /panel/appointments
- [ ] GET /panel/appointments/{external_id}
- [ ] DELETE /panel/appointments/{external_id}

Detalhes: [Agendamentos](modules/appointments/routes.md).

## Contacts

- [ ] POST /panel/contacts/lookup
- [ ] POST /panel/contacts/unblocks

Detalhes: [Contatos](modules/contacts/routes.md).

## Integrations

- [ ] GET /panel/integrations/whatsapp
- [ ] PUT /panel/integrations/whatsapp
- [ ] GET /panel/integrations/webhook
- [ ] PUT /panel/integrations/webhook
- [ ] POST /panel/integrations/webhook/secret
- [ ] POST /panel/integrations/webhook/secret/rotate
- [ ] POST /panel/integrations/webhook/test
- [ ] GET /panel/integrations/webhook/events
- [ ] GET /panel/integrations/webhook/events/{event_id}
- [ ] POST /panel/integrations/webhook/events/{event_id}/redeliver

Detalhes: [Integrações](modules/integrations/routes.md).

## Access

- [ ] POST /site/access-requests

Detalhes: [Acesso](modules/access/routes.md).

## Webhooks recebidos

- [ ] POST /inbound/{opaque_id} — método e formato pendentes da homologação da Evolution API.

Detalhes: [Webhooks](modules/webhooks/routes.md).

## Limites e formatos

Datas usam RFC 3339 e instantes gerados pelo Confirma usam UTC. Corpos JSON usam UTF-8 e `snake_case`. A conta vem da sessão ou da chave, nunca do corpo. Requisições rejeitam propriedades desconhecidas. A API `/v1` usa `Authorization: Bearer <api_key>`, aceita corpo bruto de até 64 KiB e limita cada chave a 60 requisições por minuto. A cota mensal é de 1.000 agendamentos aceitos por conta.

O painel usa um JWT de sessão em cookie `HttpOnly`, `Secure`, `SameSite=Lax`, sem atributo `Domain`. CORS autenticado permite somente `https://app.useconfirma.com.br`. Comandos autenticados validam `Origin` e exigem cabeçalho personalizado ou token anti-CSRF. A chave de API não autentica rotas do painel.

## Erros

Toda resposta de erro usa somente `code` e `message`:

```json
{
  "code": "validation_error",
  "message": "Um ou mais campos são inválidos."
}
```

Use códigos HTTP conhecidos: `bad_request`, `unauthorized`, `forbidden`, `not_found`, `conflict`, `validation_error`, `too_many_requests`, `internal_error` e `service_unavailable`. Mantenha código específico de negócio somente quando o cliente precisar agir de forma diferente, como `invitation_invalid` ou `idempotency_conflict`. Não inclua identificadores de log no corpo HTTP.

## Situação dos contratos

Os contratos dos módulos são a referência para implementar o MVP. A única exceção é `POST /inbound/{opaque_id}`: o caminho está definido, mas método, formato do corpo e transporte da credencial dependem da homologação da Evolution API. Até lá, mantenha esse formato isolado no adaptador do provedor.

O webhook enviado ao integrador é uma chamada de saída; seu contrato está em [Webhooks](modules/webhooks/routes.md#webhook-enviado-ao-integrador).

