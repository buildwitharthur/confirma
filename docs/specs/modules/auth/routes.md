# Auth

A sessão é um JWT assinado, guardado em cookie seguro, host-only, `HttpOnly` e `SameSite=Lax`; o JWT nunca é exposto ao JavaScript nem ao corpo das respostas. Comandos autenticados validam `Origin` e proteção anti-CSRF. Não há contador de falhas nem bloqueio por tentativas.

### POST /auth/login

**O que faz:** abre uma sessão do painel.

**Autenticação:** pública.

**Entrada:** `{"email":"marina@example.com","password":"..."}`.

**Passo a passo:**
1. Normalize o e-mail.
2. Não revele se o e-mail existe; credenciais inválidas recebem sempre a mesma resposta.
3. Em credenciais válidas, emita o JWT da sessão no cookie.

**Resposta:** `204`, sem corpo, com o cookie da sessão.

**Erros:** `401 unauthorized`.

### POST /auth/logout

**O que faz:** encerra a sessão atual.

**Autenticação:** sessão.

**Entrada:** sem corpo.

**Passo a passo:**
1. Remova o cookie da sessão.

**Resposta:** `204`, sem corpo.

**Erros:** `401 unauthorized`.

### POST /auth/password/forgot

**O que faz:** solicita um link de redefinição de senha.

**Autenticação:** pública.

**Entrada:** `{"email":"marina@example.com"}`.

**Passo a passo:**
1. Aceite o e-mail informado.
2. Se houver conta, envie link de uso único válido por uma hora.
3. Retorne a mesma resposta exista ou não a conta.
4. Limite a cinco pedidos por hora por origem, como no pedido público de acesso.
5. Não espere o envio do e-mail para responder.

**Resposta:** `202`, sem corpo, igual exista ou não a conta.

**Erros:** `400 bad_request`, `429 too_many_requests`.

### POST /auth/password/reset

**O que faz:** troca a senha usando um link válido.

**Autenticação:** pública com token de uso único.

**Entrada:** `{"token":"...","password":"..."}`.

**Passo a passo:**
1. Valide o token e seu prazo de uma hora.
2. Exija senha de 10 a 128 caracteres.
3. Consuma o token uma única vez.
4. Salve a nova senha e registre o instante da troca em `passwordChangedAt`.
5. Todos os JWTs emitidos antes da troca deixam de autenticar.

**Resposta:** `204`, sem corpo. Não abre sessão; o usuário entra com a nova senha.

**Erros:** `400 bad_request`, `422 weak_password`.

### POST /auth/reauthenticate

**O que faz:** confirma a senha do usuário da sessão antes de uma operação protegida.

**Autenticação:** sessão.

**Entrada:** `{"password":"..."}`.

**Passo a passo:**
1. Valide a senha do usuário da sessão.
2. Em caso de sucesso, emita novo JWT no cookie com o instante da reautenticação, válido para esse fim por 5 minutos.
3. Use a reautenticação somente para `DELETE /panel/account`; ela não amplia outras permissões.

**Resposta:** `200` com `{"reauthenticated_until":"2026-10-19T12:05:00Z"}`.

**Erros:** `401 unauthorized`.

## Processos internos

- O JWT expira 12 horas após a emissão, sem renovação automática; o cookie tem o mesmo prazo. Depois disso, as rotas respondem `401 unauthorized` e o usuário entra novamente.
- Cada requisição do painel valida assinatura e expiração do JWT, confirma que o usuário e a conta ainda existem e recusa JWT emitido antes de `passwordChangedAt`.
- O JWT não é revogado no servidor; o logout remove o cookie.
- A chave de assinatura do JWT é segredo de ambiente, nunca versionado nem registrado em logs.
