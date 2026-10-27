# Convites

O convite dura sete dias e só pode ser consumido uma vez.

No fluxo de acesso ao piloto, o convite é criado e enviado automaticamente após um pedido elegível, conforme [Acesso](../access/routes.md). O envio usa o e-mail normalizado do pedido. A criação do convite não cria a conta; isso ocorre somente em `POST /auth/invitations/accept`.

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
