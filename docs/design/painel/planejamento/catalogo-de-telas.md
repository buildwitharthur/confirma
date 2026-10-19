# Catálogo de telas

Esta especificação descreve comportamento e conteúdo; não define cor, tipografia, espaçamento, componente ou tecnologia. As operações e consultas são detalhadas em [operações e dados](operacoes-e-dados.md).

## Convenções de estados

Toda tela autenticada deve prever inicial/carregando, vazio, com dados, erro de consulta, validação, operação em andamento, sucesso e indisponibilidade quando aplicável. “Em envio” e “tentando novamente” não são estados públicos de agendamento.

## Composição visual compartilhada de autenticação

As telas **T-01 a T-05** utilizam o mesmo layout externo de autenticação documentado em [design.md](../design.md#11-autenticação): fundo `nevoa`, área de identidade com logo Confirma, container central de até 440 px, espaçamentos e responsividade comuns. Cada tela altera somente o conteúdo necessário à sua função. O showcase conceitual é exclusivo de T-01.

Essa regra não se aplica a T-06A (`/boas-vindas`) nem às telas autenticadas T-06 a T-16, que preservam seus layouts e comportamentos planejados.

## T-01 — Entrar

- **Rota/grupo:** `/entrar`, acesso.
- **Layout:** compartilhado de autenticação; pode exibir o showcase conceitual na coluna complementar.
- **Objetivo:** iniciar sessão por e-mail e senha durante o beta.
- **Acesso:** público; sessão válida pode ir à rota pretendida.
- **Apresenta:** campo de e-mail e senha, recuperação, convite e um showcase conceitual no lado direito. O showcase ilustra agendamento, mensagem e resultado com dados fictícios e não é uma landing page.
- **Ações:** entrar, recuperar acesso e seguir para o convite.
- **Validações/exceções:** mensagem uniforme para credencial incorreta; bloqueio de 15 minutos após cinco falhas; sessão expirada exige novo login.
- **Navegação/aceite:** sai para destino autenticado, `/recuperar-acesso`, `/convite#token` ou erro compreensível. Completa quando uma sessão válida é aberta sem revelar existência de conta. O showcase não cria ação, rota ou alteração no fluxo.
- **Responsividade:** duas colunas no desktop; showcase reduzido no notebook, opcional no tablet e oculto no mobile. O formulário permanece utilizável e prioritário em todos os casos.
- **Rastreabilidade:** RF-025, RNF-001, RNF-002.

## T-02 — Aceitar convite

- **Rota/grupo:** `/convite#token`, acesso.
- **Layout:** compartilhado de autenticação, sem assumir o showcase do login.
- **Objetivo:** inspecionar convite e criar conta, vínculo, senha e primeiro aceite.
- **Apresenta:** e-mail convidado, nome de conta sugerido, nome editável, senha e aceite obrigatório com links aos termos/política.
- **Ações:** inspecionar, aceitar convite, voltar ao login.
- **Validações:** token no fragmento; senha 10–128 e não comum; conta não vazia; aceite verdadeiro; versões vigentes.
- **Estados/exceções:** inválido/expirado/usado indistinguível; versão desatualizada; concorrência; sucesso abre sessão.
- **Rastreabilidade:** RF-025, contrato `InspectInvitation`/`AcceptInvitation`, CU-020.

## T-03 — Recuperar acesso

- **Rota/grupo:** `/recuperar-acesso`, acesso.
- **Layout:** compartilhado de autenticação, com conteúdo próprio de solicitação e resposta uniforme.
- **Objetivo:** solicitar link de redefinição sem revelar existência de conta.
- **Apresenta:** e-mail, instrução e prazo de 1 hora.
- **Ações:** solicitar, voltar ao login.
- **Estados:** sucesso uniforme, limite/indisponibilidade de envio, validação de e-mail.
- **Rastreabilidade:** RF-025.

## T-04 — Redefinir senha

- **Rota/grupo:** `/redefinir-senha#token`, acesso.
- **Layout:** compartilhado de autenticação, com os campos exigidos pelo token de redefinição.
- **Objetivo:** definir senha com link único.
- **Ações/validações:** nova senha e confirmação; mesma política do convite; token válido por 1 hora e uso único.
- **Estados:** carregando token, inválido/expirado/usado, sucesso e falha de gravação.
- **Rastreabilidade:** RF-025.

## T-05 — Aceitar termos

- **Rota/grupo:** `/termos/aceite`, sensível.
- **Layout:** compartilhado de autenticação, embora exija sessão válida; não é uma página do shell operacional.
- **Objetivo:** registrar as versões vigentes antes de voltar ao painel.
- **Apresenta:** versões de termos e privacidade, links, data de vigência e motivo do bloqueio.
- **Ações:** continuar/aceitar, sair, excluir conta.
- **Restrições:** apenas `AcceptTerms`, saída e `DeleteAccount` conforme contrato; `/v1` permanece independente.
- **Rastreabilidade:** RF-025, contrato `AcceptTerms`.

## T-06A — Boas-vindas

- **Rota/grupo:** `/boas-vindas`, primeiro acesso.
- **Objetivo:** receber o usuário após a criação da conta e oferecer contexto antes da configuração técnica.
- **Apresenta:** identificação discreta da marca, demonstração visual central de uma confirmação, saudação curta e orientação breve de uma ou duas frases.
- **Ação principal:** único CTA **Começar configuração**, direcionando para `/primeiros-passos`. Não há ações secundárias concorrentes.
- **Estados:** primeira apresentação; conta que já iniciou o onboarding; sessão expirada; acesso negado; apresentação já vista quando essa informação estiver disponível sem bloquear o acesso.
- **Navegação:** entra após `AcceptInvitation` abrir a sessão; não exige prontidão operacional; não substitui nem replica etapas, progresso, formulários, testes ou retomada de `/primeiros-passos`.
- **Critérios de aceitação:** a ação principal leva à rota existente; a tela não inventa operações/endpoints; a sessão expirada segue o login; configurações concluídas não são repetidas; a demonstração não é necessária para concluir; o conteúdo permanece compreensível sem depender de cor ou elemento decorativo; a experiência não reproduz o wizard nem instruções detalhadas.
- **Rastreabilidade:** R-06A, J-01/J-03, RF-019 e CU-016–018.

## T-06 — Primeiros passos

- **Rota/grupo:** `/primeiros-passos`, onboarding.
- **Objetivo:** coordenar as configurações necessárias e indicar elegibilidade por operação.
- **Apresenta:** status de conta, conta, WhatsApp, webhook, template, chave, teste e dependências; distinção entre teste isolado, simulação e teste real.
- **Ações:** abrir/revisar cada etapa, salvar, retomar, ir à operação.
- **Estados:** não iniciado, em andamento, incompleto, erro de etapa, concluído e preparado; não declarar uma etapa bloqueante sem contrato.
- **Critérios:** progresso persiste; erro não perde configuração anterior; retorno é possível; cada operação respeita sua condição de elegibilidade.
- **Rastreabilidade:** RF-019, RF-021, CU-016–018.

## T-07 — Visão geral

- **Rota/grupo:** `/visao-geral`, operação.
- **Objetivo:** oferecer orientação operacional e atalhos para investigação/configuração.
- **Apresenta:** elegibilidade da operação em foco, status das integrações, consumo mensal, agendamentos recentes/indicadores e alertas disponíveis por contrato; não apresentar agenda completa.
- **Ações:** abrir agendamentos, detalhe, correção de integração e onboarding.
- **Lacuna:** consultas agregadas e consumo não estão formalizadas no contrato do painel.
- **Rastreabilidade:** RF-014, RF-019, RF-022; depende do contrato de leitura do painel.

## T-08 — Agendamentos

- **Rota/grupo:** `/agendamentos`, operação.
- **Objetivo:** consultar agendamentos da conta e localizar um caso.
- **Apresenta:** external_id, contato minimizado conforme retenção, data/hora no fuso gravado, estado, origem do cancelamento, falha, teste e situação de webhook.
- **Ações:** filtrar/buscar, abrir detalhe; não criar, editar ou reagendar.
- **Estados:** lista, vazia, nenhum filtro, erro, retenção/anonimização e acesso negado.
- **Critérios:** isolamento por conta, paginação/ordenação contratada quando definida, nenhum dado após retenção.
- **Rastreabilidade:** RF-014, RF-015, RF-020; depende do contrato de leitura do painel.

## T-09 — Detalhe de agendamento

- **Rota/grupo:** `/agendamentos/:external_id`, operação/contextual.
- **Objetivo:** investigar um agendamento e executar ações elegíveis.
- **Apresenta:** projeção pública, `delivery_uncertain`, motivo de falha, histórico somente de inserção, tentativas sanitizadas, eventos e estado de entrega do webhook.
- **Ações principais:** reenvio manual quando `delivery_failed`; exclusão de dados; voltar à lista. Ações secundárias: abrir correção da integração.
- **Estados/exceções:** consulta não encontrada/retida; reenvio em andamento, sucesso, falha e concorrência; exclusão concluída 204 ou pendente 202.
- **Critérios:** reenvio preserva evento e não abre ciclo; exclusão impede novas tentativas; não mostrar payload bruto ou segredos.
- **Rastreabilidade:** RF-013, RF-014, RF-020, CU-012–013.

## T-10 — Conta

- **Rota/grupo:** `/configuracoes/conta`, configurações.
- **Objetivo:** editar parâmetros copiados para novos agendamentos.
- **Apresenta:** nome, fuso IANA, antecedência, janela e avisos de efeito somente futuro.
- **Ações:** salvar e recuperar valores atuais.
- **Validações:** nome não vazio, fuso conhecido, antecedência maior que corte, janela não vazia.
- **Estados:** configuração carregando/salva, inválida, indisponível, conta em exclusão.
- **Rastreabilidade:** RF-019, `ConfigureAccount`.

## T-11 — Mensagens

- **Rota/grupo:** `/configuracoes/mensagens`, configurações.
- **Objetivo:** configurar o template da solicitação de confirmação.
- **Apresenta:** corpo salvo, variáveis válidas e separação da instrução fixa; padrão documentado.
- **Ações:** editar/salvar, restaurar padrão mediante salvamento.
- **Validações:** não vazio; somente `{{nome}}`, `{{profissional}}`, `{{data}}`, `{{hora}}`; erro não substitui vigente.
- **Estados:** atual, edição, inválido, salvo, indisponível.
- **Rastreabilidade:** RF-006, RF-019, RN-008, `ConfigureTemplate`.

## T-12 — WhatsApp

- **Rota/grupo:** `/integracoes/whatsapp`, integrações.
- **Objetivo:** conectar ou substituir a instância fornecida pelo cliente.
- **Apresenta:** instância/número mascarados, versão, homologação, estado e última verificação; nunca credenciais.
- **Ações:** informar credenciais, testar e salvar, substituir.
- **Estados:** não configurado, verificando, operacional, falha com configuração anterior preservada, não homologado, substituindo e desconectado.
- **Validações/exceções:** códigos seguros de adaptador; teste 10s; chamadas antigas até 15s; nova conexão é usada em novos envios.
- **Rastreabilidade:** RF-019, CU-016, `ConfigureProvider`.

## T-13 — Webhook e testes

- **Rota/grupo:** `/integracoes/webhook`, integrações.
- **Objetivo:** configurar destino, rotacionar segredo e comprovar receptor.
- **Apresenta:** URL sanitizada, última alteração, estado, prefixo do segredo e resultado do teste; segredo somente na criação/rotação.
- **Ações:** salvar URL, rotacionar, copiar segredo uma vez, enviar `webhook.test`.
- **Validações:** HTTPS, sem credenciais, destinos locais/privados ou redirecionamento proibidos.
- **Estados:** não configurado, configurado, testando, entregue, falhou, rotação em 24h e indisponível.
- **Rastreabilidade:** RF-011–013, RF-021, `ConfigureWebhook`, `RotateWebhookSecret`, `SendWebhookTest`.

## T-14 — Chaves de API

- **Rota/grupo:** `/integracoes/chaves-api`, integrações.
- **Objetivo:** criar e revogar credenciais do integrador.
- **Apresenta:** ID, prefixo, criação, revogação; segredo completo apenas imediatamente após criação.
- **Ações:** criar, copiar/reconhecer, revogar; rotação é criar nova e depois revogar antiga.
- **Estados:** lista vazia, criada uma vez, operação em andamento, revogada, erro de registro externo.
- **Critérios:** não exibir hash nem recuperar segredo; `recovery_log_unavailable` não revoga.
- **Rastreabilidade:** RF-018, CU-017, `CreateApiKey`, `RevokeApiKey`.

## T-15 — Privacidade e contatos

- **Rota/grupo:** `/privacidade`, configurações.
- **Objetivo:** consultar bloqueio de telefone e registrar novo consentimento para desbloqueio.
- **Apresenta:** estado `blocked`, `pending_confirmation` ou `unblocked`, método/data do consentimento quando aplicável; não expor dados além do necessário.
- **Ações:** consultar telefone, informar método/data, solicitar desbloqueio.
- **Validações:** E.164; data não futura nem anterior ao último `PARAR`; métodos `whatsapp`, `in_person`, `form`, `other`.
- **Estados:** não bloqueado, bloqueado, em confirmação, liberado, erro de validação, registro externo indisponível.
- **Critérios:** bloqueio permanece até `completed`; não reativa agendamentos em falha; `PARAR` posterior vence pedido.
- **Rastreabilidade:** RF-017, RF-019, RN-019–020, `UnblockContact`.

## T-16 — Exclusão de conta

- **Rota/grupo:** `/configuracoes/excluir-conta`, sensível.
- **Objetivo:** iniciar exclusão definitiva da conta.
- **Acesso:** sessão, conta ativa, reautenticação e nome exato normalizado.
- **Apresenta:** consequências, irreversibilidade, conta alvo, confirmação e estado assíncrono.
- **Ações:** reautenticar, confirmar, sair.
- **Estados/exceções:** senha/reautenticação inválida, nome divergente, indisponibilidade externa sem alteração, aceito 202, `deleting`, conclusão por e-mail.
- **Critérios:** nenhuma operação nova após aceite; não há cancelamento/recuperação; identidade só é removida se sem outra conta.
- **Rastreabilidade:** RF-023–024, RN-033, CU-019, `DeleteAccount`.
