# Acesso ao piloto e administração

O envio público é a única rota deste módulo. A administração dos pedidos pela equipe é interna e fica fora da API até que se defina o acesso da equipe.

### POST /site/access-requests

**O que faz:** recebe pedido público de acesso ao piloto sem criar conta.

**Autenticação:** pública.

**Entrada:** exatamente os campos abaixo; `intended_use` pode ser omitido.

```json
{"name":"Marina Costa","email":"marina@example.com","company_or_project":"Clínica Exemplo","whatsapp_provider":"evolution_api","intended_use":"Confirmar consultas do piloto","consent":true,"form_opened_at":"2026-10-19T12:00:00Z","website":""}
```

`name` até 100 caracteres, `email` até 254, `company_or_project` até 120, `intended_use` até 500. `whatsapp_provider`: `evolution_api`, `other` ou `none_yet`. `consent` deve ser `true`. `form_opened_at` deve preceder o envio por pelo menos três segundos. `website` é honeypot obrigatório e vazio. Rejeite campos extras.

**Passo a passo:**
1. Valide os oito campos.
2. Normalize o e-mail para identificar pedidos.
3. Crie pedido `pending` se não houver pedido.
4. Atualize pedido `pending` existente; não altere pedidos `invited` ou `rejected`.
5. Garanta que envios concorrentes não dupliquem o pedido.
6. Não registre rejeições antispam nem revele decisão interna.

**Resposta:** `202` uniforme para novo, atualizado ou ignorado: `{"status":"received","message":"Recebemos sua solicitação."}`.

**Erros:** `400 bad_request`, `415 bad_request`, `422 validation_error` ou `submission_rejected`, `500 internal_error`, `503 service_unavailable`.

## Administração interna

Fora do escopo da API até que se defina o acesso da equipe. As regras abaixo continuam valendo para qualquer forma de administração:

- Somente a equipe responsável analisa pedidos, e cada ação fica registrada para auditoria.
- Convidar um pedido cria o convite, envia o e-mail e marca o pedido como `invited`. Repetir a ação não cria convites duplicados.
- Recusar marca o pedido como `rejected` e não envia mensagem à pessoa. Um novo envio público não reabre o pedido; a reabertura exige ação explícita da equipe.

## Processos internos

- Retenha pedidos `pending` por 180 dias após a última atualização, `rejected` por 180 dias após recebimento e `invited` por 30 dias após o convite.
- Apague pedido em até 15 dias após solicitação por e-mail.
- O comando de exclusão administrativa de pedido não está definido; o usuário pode solicitar exclusão por e-mail e o prazo de retenção se aplica.

