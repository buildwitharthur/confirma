# Acesso ao piloto e administração

O envio público é a única rota deste módulo. Cada pedido válido elegível inicia automaticamente o envio de um convite para o e-mail informado; não há etapa de aprovação manual da equipe no fluxo do MVP.

### POST /site/access-requests

**O que faz:** recebe um pedido público de acesso ao piloto e, quando elegível, envia automaticamente um convite por e-mail. O pedido e o convite não criam a conta; ela só é criada quando a pessoa aceita o convite.

**Autenticação:** pública.

**Entrada:** exatamente os campos abaixo; `intended_use` pode ser omitido.

```json
{"name":"Marina Costa","email":"marina@example.com","company_or_project":"Clínica Exemplo","whatsapp_provider":"evolution_api","intended_use":"Confirmar consultas do piloto","consent":true,"form_opened_at":"2026-10-19T12:00:00Z","website":""}
```

`name` até 100 caracteres, `email` até 254, `company_or_project` até 120, `intended_use` até 500. `whatsapp_provider`: `evolution_api`, `other` ou `none_yet`. `consent` deve ser `true`. `form_opened_at` deve preceder o envio por pelo menos três segundos. `website` é honeypot obrigatório e vazio. Rejeite campos extras.

**Passo a passo:**
1. Valide os oito campos.
2. Normalize o e-mail para identificar pedidos.
3. Se o e-mail já pertencer a uma conta, não crie pedido nem envie convite.
4. Se já houver convite não usado e ainda válido para o e-mail, não crie outro convite. Retome eventual envio ainda pendente ligado a esse convite e não repita um envio já aceito pelo provedor.
5. Para e-mail sem conta e sem convite válido, crie ou atualize o pedido e emita um convite de sete dias para o próprio e-mail informado. Se o registro existente estiver `rejected` por fluxo legado, uma nova solicitação válida o reabre como `pending` e segue o envio automático.
6. Se existir convite anterior vencido ou usado, não o reutilize; sem conta e sem convite válido, emita um novo convite.
7. Guarde somente o hash do token; envie o token em link de uso único para a tela pública de aceitação. A conta continua sendo criada somente na aceitação.
8. Garanta que envios concorrentes e novas submissões não criem ou enviem convites duplicados.
9. Registre o pedido e a intenção de envio antes do efeito externo. Mantenha o pedido `pending` enquanto o envio estiver pendente; marque-o `invited` quando o provedor aceitar a solicitação de envio. A entrega de e-mail deve ser retomável e idempotente; uma falha de entrega não pode criar outra identidade ou convite válido concorrente.
10. Se o resultado da chamada ao provedor for incerto, não repita cegamente o envio; aplique a política de reconciliação/retry definida para e-mails transacionais.
11. Não registre rejeições antispam nem revele se o e-mail já tem conta, convite ou se o envio foi realizado.

**Resposta:** `202` uniforme para pedido novo, atualizado ou ignorado: `{"status":"received","message":"Recebemos sua solicitação."}`. A resposta confirma o recebimento da solicitação, não a entrega do e-mail.

**Erros:** `400 bad_request`, `415 bad_request`, `422 validation_error` ou `submission_rejected`, `500 internal_error`, `503 service_unavailable`.

## Administração interna

O fluxo do MVP não exige painel, comando operacional ou decisão manual da equipe para aceitar pedidos e enviar convites. Ações administrativas futuras ficam fora deste contrato.

## Processos internos

- Retenha pedidos `pending` por 180 dias após a última atualização, `rejected` (estado legado, sem novas recusas automáticas no fluxo do MVP) por 180 dias após recebimento e `invited` por 30 dias após o provedor aceitar o envio.
- Apague pedido em até 15 dias após solicitação por e-mail.
- O pedido não cria conta; a aceitação do convite segue o contrato de [Convites](../invites/routes.md).

O prazo e a política de tentativas do envio, bem como o tratamento operacional de um resultado incerto do provedor de e-mail, devem seguir o contrato transacional de e-mail quando definido; não considerar o aceite do provedor como confirmação de entrega na caixa de entrada.

