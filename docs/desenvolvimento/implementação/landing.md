# Plano de implementação — Landing

**Aplicação:** Site, frente de landing pública (`https://useconfirma.com`).

**Fontes principais:** contrato do site, documentação de design da landing, arquitetura de contexto, componentes e implantação, requisitos e regras de negócio aplicáveis ao pedido de acesso.

## BLOCO 01 — Entendimento funcional

**Objetivo:** delimitar o conteúdo e o comportamento real da landing antes de escolher detalhes de implementação.

**Dependências:** documentação de design da landing; contrato do site.

**Estado:** Não iniciado.

### Tarefas

- [ ] **LAND-001 — Mapear as responsabilidades da landing**
  - **Descrição:** Consolidar, a partir do design e da arquitetura, as seções e responsabilidades da landing institucional, incluindo o direcionamento para o painel e para a documentação pública.
  - **Critério de aceite:** O mapa referencia as fontes existentes e separa conteúdo público, navegação e comportamento de negócio.
  - **Dependências:** Nenhuma.
  - **Commit:** Pendente.

- [ ] **LAND-002 — Classificar interações reais e demonstrativas**
  - **Descrição:** Classificar cada interação prevista no design como conteúdo, navegação, demonstração visual ou operação real.
  - **Critério de aceite:** Nenhuma interação demonstrativa é tratada como requisito de backend e toda interação real possui fonte documental.
  - **Dependências:** LAND-001.
  - **Commit:** Pendente.

- [ ] **LAND-003 — Mapear a navegação para painel e documentação**
  - **Descrição:** Relacionar os pontos de entrada da landing aos endereços aprovados do painel e da documentação.
  - **Critério de aceite:** Os destinos usam as superfícies documentadas e não introduzem rotas ou destinos não aprovados.
  - **Dependências:** LAND-001.
  - **Commit:** Pendente.

- [ ] **LAND-004 — Identificar a chamada de solicitação de acesso**
  - **Descrição:** Registrar a interação que usa `POST /site/access-requests`, incluindo sua origem autorizada e seu limite próprio.
  - **Critério de aceite:** O fluxo aponta para o contrato do site e distingue o pedido de acesso da criação de conta.
  - **Dependências:** LAND-002; API-001.
  - **Commit:** Pendente.

- [ ] **LAND-005 — Mapear o fluxo de solicitação de acesso**
  - **Descrição:** Descrever a abertura do formulário, preenchimento, consentimento, envio e resposta pública uniforme.
  - **Critério de aceite:** O fluxo inclui os estados de sucesso, validação, rejeição por proteção antispam e limite de origem previstos no contrato.
  - **Dependências:** LAND-004.
  - **Commit:** Pendente.

### Critério de conclusão do bloco

Responsabilidades, interações, destinos e fluxo de solicitação de acesso estão mapeados com referências aos documentos de origem, sem decisões de produto ou arquitetura inventadas.

## BLOCO 02 — Fluxo e modelagem de dados

**Objetivo:** transformar o contrato de solicitação de acesso em um fluxo de interface verificável e alinhado à API.

**Dependências:** BLOCO 01; contrato do site; contrato da API para a operação de acesso.

**Estado:** Não iniciado.

### Tarefas

- [ ] **LAND-006 — Analisar o contrato do formulário de acesso**
  - **Descrição:** Mapear campos obrigatórios, limites, `consent`, `form_opened_at` e campo isca `website`.
  - **Critério de aceite:** O formulário possui correspondência um a um com `SubmitAccessRequest` e não envia propriedades não contratadas.
  - **Dependências:** LAND-005; API-001.
  - **Commit:** Pendente.

- [ ] **LAND-007 — Definir a validação de entrada da interface**
  - **Descrição:** Planejar a validação de campos e a apresentação de erros devolvidos pelo envelope comum da API.
  - **Critério de aceite:** Campos, limites e mensagens de erro são rastreáveis ao contrato; a validação do cliente não substitui a validação da API.
  - **Dependências:** LAND-006.
  - **Commit:** Pendente.

- [ ] **LAND-008 — Mapear estados de sucesso e erro do envio**
  - **Descrição:** Documentar os estados de edição, envio, sucesso uniforme, erro de validação, submissão rejeitada, limite excedido e falha de comunicação.
  - **Critério de aceite:** Cada estado define feedback e possibilidade de correção ou nova tentativa sem revelar se o e-mail já existe.
  - **Dependências:** LAND-006; LAND-007.
  - **Commit:** Pendente.

- [ ] **LAND-009 — Documentar a dependência da operação da API**
  - **Descrição:** Relacionar a submissão da landing à operação da API que persiste `access_requests` e dispara o aviso operacional.
  - **Critério de aceite:** A landing não duplica persistência, convite, rejeição ou envio de e-mail; a dependência aponta para API-001.
  - **Dependências:** LAND-006; API-001.
  - **Commit:** Pendente.

### Critério de conclusão do bloco

O fluxo da interface está alinhado ao contrato, os dados enviados e os estados exibidos estão definidos, e a dependência da API está registrada sem criar entidades, endpoints ou regras adicionais.

## BLOCO 03 — Arquitetura da aplicação

**Objetivo:** estudar como a landing será organizada no Site, mantendo as decisões ainda abertas explícitas.

**Dependências:** BLOCO 01; BLOCO 02; stack e arquitetura do Site.

**Estado:** Não iniciado.

### Tarefas

- [ ] **LAND-010 — Avaliar a estratégia de renderização do Astro**
  - **Descrição:** Estudar quais partes podem ser renderizadas estaticamente e qual comportamento exige execução no navegador.
  - **Critério de aceite:** A decisão de renderização fica registrada com justificativa baseada nas necessidades reais; nenhuma escolha é feita apenas por convenção.
  - **Dependências:** LAND-001; LAND-002.
  - **Commit:** Pendente.

- [ ] **LAND-011 — Separar componentes de conteúdo e interação**
  - **Descrição:** Planejar a decomposição da interface conforme as seções e componentes já documentados.
  - **Critério de aceite:** A proposta identifica componentes estáticos e pontos de interação sem criar componentes fora do design aprovado.
  - **Dependências:** LAND-001; LAND-002.
  - **Commit:** Pendente.

- [ ] **LAND-012 — Avaliar as necessidades reais de hidratação**
  - **Descrição:** Estudar quais componentes do formulário e estados de envio precisam de hidratação no Astro.
  - **Critério de aceite:** Cada necessidade de hidratação está vinculada a uma interação real; pontos ainda incertos ficam como pendência.
  - **Dependências:** LAND-008; LAND-010.
  - **Commit:** Pendente.

- [ ] **LAND-013 — Definir a comunicação da landing com a API**
  - **Descrição:** Planejar a chamada para a origem `https://api.useconfirma.com/site`, incluindo origem autorizada, envelope de erro e limites de responsabilidade.
  - **Critério de aceite:** O plano não introduz autenticação de painel, chave de API ou acesso direto a dados.
  - **Dependências:** LAND-009; API-001.
  - **Commit:** Pendente.

- [ ] **LAND-014 — Planejar a organização do código do Site**
  - **Descrição:** Propor a organização dos arquivos da landing respeitando a estrutura existente ou, se ela ainda não existir, registrar a decisão pendente.
  - **Critério de aceite:** A organização proposta é compatível com Astro e com a separação futura da documentação pública, sem instalar dependências nesta etapa.
  - **Dependências:** LAND-010; LAND-011.
  - **Commit:** Pendente.

### Critério de conclusão do bloco

As decisões de renderização, composição, hidratação, comunicação e organização do código foram estudadas e registradas. Questões sem evidência permanecem pendentes.

## BLOCO 04 — Implementação da landing

**Objetivo:** decompor a futura implementação em entregas verificáveis, depois que os blocos de entendimento e arquitetura forem validados.

**Dependências:** BLOCO 03; LAND-013; API-001.

**Estado:** Não iniciado.

### Tarefas

- [ ] **LAND-015 — Implementar a estrutura visual documentada**
  - **Descrição:** Construir a composição das seções e componentes definidos no design aprovado.
  - **Critério de aceite:** A estrutura corresponde ao design e não contém operações de negócio não documentadas.
  - **Dependências:** LAND-011; LAND-014.
  - **Commit:** Pendente.

- [ ] **LAND-016 — Implementar as navegações públicas**
  - **Descrição:** Implementar os links da landing para painel e documentação conforme os endereços aprovados.
  - **Critério de aceite:** Cada link aponta para o destino documentado e funciona sem depender de dados de conta.
  - **Dependências:** LAND-003; LAND-015.
  - **Commit:** Pendente.

- [ ] **LAND-017 — Implementar o formulário de solicitação de acesso**
  - **Descrição:** Implementar campos, consentimento, campo isca, captura do instante de abertura e submissão ao contrato do site.
  - **Critério de aceite:** O payload respeita o contrato e a interface impede submissões obviamente inválidas antes da chamada.
  - **Dependências:** LAND-006; LAND-007; LAND-013; LAND-015.
  - **Commit:** Pendente.

- [ ] **LAND-018 — Implementar estados e tratamento de erros**
  - **Descrição:** Implementar feedback para sucesso uniforme, validação, rejeição, limite, indisponibilidade e nova tentativa.
  - **Critério de aceite:** Os estados não expõem a existência ou situação de um e-mail e preservam os dados editados quando apropriado.
  - **Dependências:** LAND-008; LAND-017.
  - **Commit:** Pendente.

### Critério de conclusão do bloco

A landing implementada corresponde ao design aprovado, navega para os destinos previstos e envia a solicitação de acesso conforme o contrato, com estados verificáveis e sem lógica de negócio duplicada.

## BLOCO 05 — Qualidade e entrega

**Objetivo:** validar a landing antes da publicação do Site.

**Dependências:** BLOCO 04; infraestrutura de publicação compartilhada; contrato do site.

**Estado:** Não iniciado.

### Tarefas

- [ ] **LAND-019 — Validar comportamento funcional da landing**
  - **Descrição:** Verificar navegação, preenchimento, submissão e estados de resposta com casos válidos e inválidos derivados do contrato.
  - **Critério de aceite:** Os cenários previstos passam e não há chamada indevida para superfícies autenticadas.
  - **Dependências:** LAND-016; LAND-018.
  - **Commit:** Pendente.

- [ ] **LAND-020 — Validar responsividade e acessibilidade**
  - **Descrição:** Verificar a interface nas larguras previstas e os critérios de teclado, foco, nomes acessíveis, mensagens e independência de cor.
  - **Critério de aceite:** A validação registra evidências e não identifica bloqueios de uso nas seções e no formulário.
  - **Dependências:** LAND-015; LAND-018.
  - **Commit:** Pendente.

- [ ] **LAND-021 — Validar SEO e performance**
  - **Descrição:** Verificar metadados, conteúdo indexável, imagens, carregamento e impacto do JavaScript da landing.
  - **Critério de aceite:** Os critérios de qualidade definidos nos requisitos não funcionais são verificados e pendências ficam registradas.
  - **Dependências:** LAND-015; LAND-012.
  - **Commit:** Pendente.

- [ ] **LAND-022 — Validar build e publicação do Site**
  - **Descrição:** Verificar o build, os caminhos públicos, o domínio principal e os redirecionamentos previstos para publicação estática.
  - **Critério de aceite:** O build reproduz os artefatos esperados e a publicação não concede acesso a dados operacionais.
  - **Dependências:** LAND-019; LAND-020; LAND-021.
  - **Commit:** Pendente.

- [ ] **LAND-023 — Registrar a validação final da landing**
  - **Descrição:** Consolidar evidências, pendências aceitas e referências aos commits de entrega.
  - **Critério de aceite:** A validação final referencia os critérios atendidos e nenhum checklist é marcado sem evidência.
  - **Dependências:** LAND-022.
  - **Commit:** Pendente.

### Critério de conclusão do bloco

Os cenários funcionais, a qualidade da interface, SEO, performance, build e publicação foram verificados, e os resultados estão associados aos commits reais das tarefas.

## Decisões pendentes

- Estratégia final de renderização e hidratação do Astro.
- Organização concreta do código do Site.
- Critérios de observabilidade do envio do formulário no cliente, caso necessários.
- Detalhamento final da operação HTTP da API, além do contrato funcional existente.

