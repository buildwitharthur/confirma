# Plano de implementação — Painel

**Aplicação:** Painel web em `https://app.useconfirma.com.br`.

**Escopo documentado:** autenticação, onboarding, acompanhamento de agendamentos, configurações, integrações, privacidade e exclusão de conta, sempre por sessão e pela API em `/panel` ou `/auth`.

**Estado do plano:** Preliminar. As jornadas e telas foram planejadas, mas as consultas e muitos métodos HTTP do painel ainda não estão formalizados.

## BLOCO 01 — Acesso e sessão

**Objetivo:** organizar o acesso autenticado, convite, termos e proteção da sessão.

**Dependências:** contrato do painel; serviço de autenticação; decisões de segurança.

**Estado:** Não iniciado.

### Tarefas

- [ ] **PAINEL-001 — Detalhar as jornadas de autenticação**
  - **Descrição:** Mapear entrada, convite, recuperação, redefinição, sessão expirada e reautenticação conforme o escopo documentado.
  - **Critério de aceite:** As jornadas não inventam métodos de autenticação além dos requisitos e pendências registradas.
  - **Dependências:** contrato de autenticação do beta, que define e-mail e senha.
  - **Commit:** Pendente.

- [ ] **PAINEL-002 — Planejar aceite de convite e termos**
  - **Descrição:** Decompor `InspectInvitation`, `AcceptInvitation` e `AcceptTerms`, incluindo versões e bloqueio do painel.
  - **Critério de aceite:** O fluxo respeita os contratos e abre sessão somente após aceitação válida.
  - **Dependências:** PAINEL-001.
  - **Commit:** Pendente.

### Critério de conclusão do bloco

As jornadas de acesso, convite, termos e reautenticação estão prontas para detalhamento visual e de integração.

## BLOCO 02 — Onboarding e prontidão

**Objetivo:** organizar boas-vindas e primeiros passos sem definir bloqueios ainda não aprovados.

**Dependências:** BLOCO 01; escopo e jornadas do painel; contratos de comandos.

**Estado:** Não iniciado.

### Tarefas

- [ ] **PAINEL-003 — Detalhar boas-vindas e primeiros passos**
  - **Descrição:** Mapear a tela `/boas-vindas` e o fluxo `/primeiros-passos`, distinguindo apresentação, configuração e operação.
  - **Critério de aceite:** A boas-vindas não replica o wizard nem cria endpoint sem decisão; o onboarding preserva retomada e progresso documentados.
  - **Dependências:** PAINEL-002; matriz de pré-condições e decisão de boas-vindas.
  - **Commit:** Pendente.

- [ ] **PAINEL-004 — Definir a matriz de prontidão da conta**
  - **Descrição:** Resolver quais etapas são obrigatórias, opcionais ou bloqueantes para entrada na operação.
  - **Critério de aceite:** A decisão é aprovada e compatível com API, provedor, webhook, template, chave e teste.
  - **Dependências:** PAINEL-003; matriz de pré-condições.
  - **Commit:** Pendente.

### Critério de conclusão do bloco

O fluxo de onboarding possui critério aprovado de prontidão e não depende de consultas ou comandos ainda não contratados sem que isso esteja registrado.

## BLOCO 03 — Operação e configurações

**Objetivo:** organizar as telas de acompanhamento, integrações, conta, mensagens e privacidade.

**Dependências:** BLOCO 02; contrato do painel; contrato de webhooks; contrato OpenAPI.

**Estado:** Não iniciado.

### Tarefas

- [ ] **PAINEL-005 — Detalhar acompanhamento de agendamentos**
  - **Descrição:** Decompor visão geral, lista, detalhe, filtros, projeções, estados e ações permitidas.
  - **Critério de aceite:** A lista não inventa critérios de filtro, paginação ou consultas; o detalhe não expõe payloads ou segredos.
  - **Dependências:** PAINEL-004; contratos de leitura, projeções operacionais e critérios de consulta do painel.
  - **Commit:** Pendente.

- [ ] **PAINEL-006 — Detalhar configurações da conta e mensagens**
  - **Descrição:** Organizar configuração de conta e template, incluindo validações e efeito somente em novos agendamentos.
  - **Critério de aceite:** Os campos e variáveis correspondem aos contratos e o valor vigente é preservado em erro.
  - **Dependências:** PAINEL-004; contrato de leitura do painel.
  - **Commit:** Pendente.

- [ ] **PAINEL-007 — Detalhar integrações e chaves de API**
  - **Descrição:** Organizar provedor, webhook, teste, rotação e ciclo das chaves, com exibição única de segredos.
  - **Critério de aceite:** Credenciais não são consultáveis novamente e as falhas preservam configurações anteriores quando previsto.
  - **Dependências:** PAINEL-004; contratos de leitura e comandos HTTP do painel e homologação da Evolution API.
  - **Commit:** Pendente.

- [ ] **PAINEL-008 — Detalhar privacidade e exclusões**
  - **Descrição:** Organizar desbloqueio, exclusão de dados e exclusão de conta conforme reautenticação, estados assíncronos e registro externo.
  - **Critério de aceite:** O painel apresenta `pending_confirmation`, `deleting` e demais resultados contratados sem declarar conclusão antes da evidência.
  - **Dependências:** PAINEL-004; projeção operacional sanitizada.
  - **Commit:** Pendente.

### Critério de conclusão do bloco

As jornadas operacionais estão detalhadas por tela e comando, com as lacunas de leitura e contrato resolvidas ou apontadas para decisão.

## Decisões pendentes

- Operações de leitura, paths, métodos, paginação e envelopes do `/panel`.
- Métodos de autenticação efetivamente habilitados no MVP.
- Matriz de prontidão e sequência bloqueante do onboarding.
- Critérios de listagem e filtros de agendamentos.

