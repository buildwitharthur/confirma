# Plano de implementação — API

**Aplicação:** API HTTP.

**Responsabilidades documentadas:** integrações de clientes, comandos autenticados do painel, recebimento de eventos do provedor e solicitação de acesso do Site. A API não espera horários de envio nem executa ciclos de retentativa na requisição.

**Estado do plano:** Preliminar. O contrato OpenAPI, o contrato do Site, o contrato do Painel e os contratos internos ainda precisam ser consolidados em um backlog executável por fluxo.

## BLOCO 01 — Fundação e fronteiras HTTP

**Objetivo:** preparar as fronteiras públicas, autenticação por superfície, validação comum e isolamento por conta.

**Dependências:** decisões arquiteturais aprovadas; contratos do sistema; infraestrutura compartilhada.

**Estado:** Não iniciado.

### Tarefas

- [ ] **API-001 — Detalhar a operação de solicitação de acesso do Site**
  - **Descrição:** Transformar `POST /site/access-requests` em backlog executável, mantendo validações, idempotência e resposta uniforme do contrato do Site.
  - **Critério de aceite:** O detalhamento cobre origem, limites, antispam, persistência e aviso operacional sem criar conta.
  - **Dependências:** Contrato do Site; LAND-004.
  - **Commit:** Pendente.

- [ ] **API-002 — Detalhar as superfícies e o isolamento por conta**
  - **Descrição:** Decompor `/v1`, `/panel`, `/auth`, `/inbound` e `/site` conforme autenticação, limites e origem aprovados.
  - **Critério de aceite:** Cada superfície tem autenticação, autorização, envelope de erro e limite rastreáveis à documentação.
  - **Dependências:** Nenhuma.
  - **Commit:** Pendente.

- [ ] **API-003 — Planejar validação e tratamento de erros comum**
  - **Descrição:** Identificar a validação de entradas, datas, limites de corpo, propriedades desconhecidas e envelope de erro.
  - **Critério de aceite:** A lista de trabalho referencia os contratos normativos e não altera regras do domínio.
  - **Dependências:** API-002.
  - **Commit:** Pendente.

### Critério de conclusão do bloco

As fronteiras HTTP e a operação de acesso do Site estão detalhadas o suficiente para decomposição posterior, com isolamento e erros alinhados aos contratos.

## BLOCO 02 — API pública e comandos do painel

**Objetivo:** organizar a implementação das operações públicas e administrativas sem antecipar decisões ainda pendentes.

**Dependências:** BLOCO 01; contrato OpenAPI; contrato do painel; documentação de domínio.

**Estado:** Não iniciado.

### Tarefas

- [ ] **API-004 — Decompor as operações públicas de agendamento**
  - **Descrição:** Detalhar criação, consulta, cancelamento e exclusão de dados conforme o OpenAPI e os requisitos funcionais.
  - **Critério de aceite:** Cada operação possui validação, idempotência, autorização, resultado e dependências com worker ou registro externo identificados.
  - **Dependências:** API-003.
  - **Commit:** Pendente.

- [ ] **API-005 — Decompor os comandos autenticados do painel**
  - **Descrição:** Organizar os comandos de configuração, chaves, webhooks, privacidade, reenvio e exclusão de conta.
  - **Critério de aceite:** Nenhum comando recebe path ou operação de leitura inventados; lacunas do contrato permanecem pendentes.
  - **Dependências:** API-003; decisões pendentes do painel.
  - **Commit:** Pendente.

- [ ] **API-006 — Planejar o recebimento de mensagens e webhooks de entrada**
  - **Descrição:** Detalhar autenticação por conexão, persistência idempotente e entrega do processamento ao worker.
  - **Critério de aceite:** O recebimento não decide sozinho o estado final e respeita a serialização e os contratos internos.
  - **Dependências:** API-002; WORK-003.
  - **Commit:** Pendente.

### Critério de conclusão do bloco

As operações públicas e do painel estão decompostas por fronteira e as integrações assíncronas possuem dependências explícitas, sem fechar lacunas ainda não decididas.

## BLOCO 03 — Integração com aplicação, persistência e confiabilidade

**Objetivo:** planejar a entrega das transações, comandos duráveis e registro externo usados pela API.

**Dependências:** BLOCO 02; contratos internos; decisões de consistência e recuperação.

**Estado:** Não iniciado.

### Tarefas

- [ ] **API-007 — Mapear transações e comandos duráveis da API**
  - **Descrição:** Relacionar cada alteração de negócio às gravações transacionais e ao `durable_commands` correspondente.
  - **Critério de aceite:** A API não depende de publicação em memória como única cópia de trabalho.
  - **Dependências:** API-004; API-005.
  - **Commit:** Pendente.

- [ ] **API-008 — Planejar efeitos protegidos pelo registro externo**
  - **Descrição:** Identificar as operações que exigem confirmação externa antes do efeito local e seu comportamento de indisponibilidade.
  - **Critério de aceite:** Revogação, exclusões, cancelamento de origem e desbloqueio estão classificados conforme os contratos.
  - **Dependências:** API-005.
  - **Commit:** Pendente.

### Critério de conclusão do bloco

As responsabilidades transacionais e as pré-condições de recuperação da API estão rastreadas, com as decisões de implementação ainda abertas identificadas.

## Decisões pendentes

- Métodos, paths, envelopes e consultas HTTP do `/panel` ainda não formalizados.
- Consultas de onboarding, prontidão, consumo, listagem de agendamentos e projeções do painel.
- Detalhamento de configuração operacional e observabilidade da API.

