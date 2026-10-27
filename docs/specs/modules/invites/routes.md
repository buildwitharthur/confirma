# Convites

O convite dura sete dias e só pode ser consumido uma vez. Convites de acesso ao piloto são emitidos pelo módulo de convites a partir do pedido público abaixo. O pedido e os dados adicionais do formulário não são persistidos; a API armazena somente o convite e o hash do token.

### POST /site/access-requests

**O que faz:** valida o formulário público e, quando elegível, cria e envia automaticamente um convite para o e-mail informado. Não há triagem manual. A conta só é criada quando a pessoa aceita o convite.

**Autenticação:** pública.

**Entrada:** exatamente os campos abaixo; `intended_use` pode ser omitido.

```json
{"name":"Marina Costa","email":"marina@example.com","company_or_project":"Clínica Exemplo","whatsapp_provider":"evolution_api","intended_use":"Confirmar consultas do piloto","consent":true,"form_opened_at":"2026-10-19T12:00:00Z","website":""}
```

`name` até 100 caracteres, `email` até 254, `company_or_project` até 120, `intended_use` até 500. `whatsapp_provider`: `evolution_api`, `other` ou `none_yet`. `consent` deve ser `true`. `form_opened_at` deve preceder o envio por pelo menos três segundos. `website` é honeypot obrigatório e vazio. Rejeite campos extras.

**Passo a passo:**
1. Valide o corpo, o consentimento e as proteções antispam.
2. Normalize o e-mail.
3. Se já houver conta ou convite não usado e válido, não crie nem envie outro convite. A resposta continua genérica.
4. Para e-mail elegível, guarde somente o hash de um token aleatório, crie convite válido por sete dias e envie o link para a tela pública de aceitação.
5. Garanta que submissões concorrentes não criem ou enviem convites duplicados.
6. Se o provider de e-mail falhar, remova o convite criado nessa tentativa e propague o erro do provider. A fila e tentativas automáticas ficam para depois do MVP.
7. Não revele se o e-mail já tem conta, convite ou se o envio foi realizado.

**Resposta:** `202` uniforme para pedido elegível ou ignorado: `{"status":"received","message":"Recebemos sua solicitação."}`. O aceite do provider não confirma entrega na caixa de entrada.

**Erros:** `400 bad_request`, `415 bad_request`, `422 validation_error` ou `submission_rejected`, `500 internal_error`, `503 service_unavailable` quando o provider recusar o envio.

O pedido público não cria uma entidade própria nem uma conta. A aceitação segue `POST /auth/invitations/accept`.

### GET /auth/invitations/inspect

**O que faz:** consulta os dados de um convite sem consumi-lo.

**Autenticação:** pública.

**Entrada:** query `token`.

**Passo a passo:**
1. Localize o convite pelo hash do token.
2. Verifique se não expirou nem foi usado.
3. Não altere o convite.
4. Retorne o e-mail e, se disponível, o nome sugerido da conta.

**Resposta:** `200` com `{"email":"marina@example.com","account_name":"Clínica Exemplo"}`. `account_name` pode ser omitido.

**Erros:** `404 invitation_invalid`.

### POST /auth/invitations/accept

**O que faz:** cria conta e acesso a partir do convite.

**Autenticação:** pública com token.

**Entrada:** `{"token":"...","password":"...","account_name":"Clínica Exemplo"}`.

**Passo a passo:**
1. Valide convite não usado e dentro dos sete dias.
2. Exija senha de 10 a 128 caracteres.
3. Se já existir identidade com o e-mail normalizado do convite, retorne `409 conflict` sem criar nada, sem consumir o convite e sem vincular o usuário existente a outra conta.
4. Crie conta ativa e acesso.
5. Consuma o convite na mesma operação.
6. Garanta que aceitações concorrentes permitam uma única conclusão.
7. Abra uma sessão.

**Resposta:** `201` com `{"account_id":"<UUID>","status":"active"}` e cookie de sessão.

**Erros:** `404 invitation_invalid`, `422 weak_password`, `409 conflict`.
