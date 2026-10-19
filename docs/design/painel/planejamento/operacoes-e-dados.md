# Operações e dados

## Regra de leitura

Rota de navegação, operação de negócio e endpoint HTTP são conceitos distintos. Os comandos abaixo são os nomes contratados; o contrato do painel informa as superfícies `/auth` e `/panel`, mas não publica paths HTTP individuais para todos os comandos. Onde o endpoint não existe, a necessidade fica pendente e não é inferida.

## Operações contratadas por tela

`/boas-vindas` não exige consulta, escrita, endpoint ou novo dado: é uma composição de apresentação após a sessão criada pelo convite. Não há marcador persistente próprio; a navegação recorrente respeita os estados existentes de sessão, autorização e operação.

| Tela | Dados necessários e origem | Consulta | Escrita/negócio | HTTP/endpoint contratado | Erros/atualização |
| --- | --- | --- | --- | --- | --- |
| Entrar | credencial; serviço de autenticação | sessão atual | autenticação por e-mail e senha no beta | `/auth`; método específico não detalhado | falha uniforme, bloqueio, sessão expirada |
| Aceitar convite | token do fragmento; convite | `InspectInvitation` | `AcceptInvitation` | `/auth`; `AcceptInvitation` HTTP 201 | `invitation_invalid`, `weak_password`, `terms_version_outdated`, `validation_error`; abre sessão |
| Recuperar/redefinir | e-mail, token, senha | status de link | pedido e redefinição | `/auth`; endpoint específico pendente | resposta uniforme; atualiza sessão/senha |
| Termos | versões vigentes e último aceite | consulta de versões/aceite pendente | `AcceptTerms` | `/panel`; path HTTP não especificado | `validation_error`; libera comandos após sucesso |
| Primeiros passos | perfil, conta, integrações, progresso | **operação necessária — contrato pendente** para perfil, situação e progresso | `ConfigureAccount`, `ConfigureProvider`, `ConfigureWebhook`, `ConfigureTemplate`, `CreateApiKey`, `SendWebhookTest` | comandos em `/panel`; métodos/paths não especificados | atualizar após cada sucesso; não assumir bloqueios não contratados |
| Visão geral | prontidão, consumo e indicadores | **operação necessária — contrato pendente** para agregados e consumo mensal | nenhuma operação exclusiva | não contratado | falha parcial deve preservar links funcionais |
| Agendamentos | lista filtrada por conta | **operação necessária — contrato pendente** para listagem | nenhuma; cancelamento é da origem via API | API pública: `GET /v1/appointments/{external_id}` só detalhe, não lista | retenção, isolamento, erro; atualizar após retorno |
| Detalhe | projeção pública, histórico, tentativas, webhook | `getAppointment` e projeção de painel; consulta HTTP do painel não especificada | `RedeliverWebhook`, `EraseAppointmentData` | `/v1/appointments/{external_id}` `GET` para consulta pública; painel usa `/panel` | 404/retido, `delivery_failed`, 202/204; recarregar após ação |
| Conta | nome, fuso, antecedência, janela | **operação necessária — contrato pendente** de leitura atual | `ConfigureAccount` | `/panel`; método/path não especificados | validação; informar efeito só em novos aceites |
| Mensagens | template atual | **operação necessária — contrato pendente** | `ConfigureTemplate` | `/panel`; método/path não especificados | `validation_error`; atualizar corpo após sucesso |
| WhatsApp | estado mascarado, versão e última verificação | **operação necessária — contrato pendente** de leitura | `ConfigureProvider` | `/panel`; método/path não especificados | `network_error`, `authentication_failed`, `instance_not_found`, `instance_not_connected`; preservar anterior |
| Webhook | URL sanitizada, status e rotação | **operação necessária — contrato pendente** | `ConfigureWebhook`, `RotateWebhookSecret`, `SendWebhookTest` | `/panel`; método/path não especificados | destino inválido; segredo apenas uma vez; atualizar status de teste |
| Chaves | ID, prefixo, datas | **operação necessária — contrato pendente** de listagem | `CreateApiKey`, `RevokeApiKey` | `/panel`; método/path não especificados | segredo uma vez; `recovery_log_unavailable` não revoga |
| Privacidade | status por telefone | **operação necessária — contrato pendente** de consulta | `UnblockContact` | `/panel`; método/path não especificados | `contact_not_blocked`, `validation_error`, 503; atualizar após confirmação |
| Exclusão de conta | nome e estado da conta | sessão/conta; consulta de lifecycle pendente | `DeleteAccount` com reautenticação | `/panel`; método/path não especificados | falha externa não altera; 202 leva a estado `deleting` |

## Endpoints públicos relevantes para o detalhe

O contrato OpenAPI formaliza somente a API do integrador:

| Operação | Método/endpoint | Uso no painel |
| --- | --- | --- |
| `createAppointment` | `POST /v1/appointments` | não é ação do painel; teste real é criado pelo integrador |
| `getAppointment` | `GET /v1/appointments/{external_id}` | referência de projeção do detalhe; painel autentica por sessão em `/panel` |
| `eraseAppointmentData` | `DELETE /v1/appointments/{external_id}` | semântica compartilhada; comando do painel é `EraseAppointmentData` |
| `cancelAppointment` | `POST /v1/appointments/{external_id}/cancel` | ação da origem, não oferecida como edição no painel |

## Dados que não podem ser expostos

O painel não exibe hash de chave, credencial de provedor, segredo de entrada, segredo de webhook, payload bruto nem dados além da retenção. O detalhe pode acrescentar tentativas e informações operacionais sanitizadas. Segredos recém-criados (`ApiKeyCreated` e rotação de webhook) aparecem completos uma vez e nunca são consultáveis novamente.

## Necessidades de atualização

Após comando de configuração, recarregar a projeção correspondente. Após reenvio, refletir a tentativa reservada e seu resultado. Após exclusão de dados, retirar o registro quando concluído e informar a pendência quando houver chamada externa. Após desbloqueio, manter bloqueio durante `pending_confirmation` e atualizar somente após confirmação `completed`.
