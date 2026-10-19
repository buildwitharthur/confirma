# Plano de implementação — Documentação pública

**Aplicação:** Site, frente de documentação pública em `https://docs.useconfirma.com.br`.

**Estado do plano:** Preliminar. A arquitetura registra Starlight como tecnologia prevista, mas a estratégia de implementação ainda será estudada.

## BLOCO 01 — Entendimento da documentação pública

**Objetivo:** delimitar o conteúdo público e suas fontes antes de escolher estrutura ou componentes.

**Dependências:** contratos do sistema; documentação do domínio; arquitetura e design de documentação.

**Estado:** Não iniciado.

### Tarefas

- [ ] **DOCS-001 — Mapear os públicos e objetivos da documentação**
  - **Descrição:** Identificar, a partir dos documentos existentes, os objetivos de referência da API, integração e tratamento de eventos.
  - **Critério de aceite:** O mapa usa somente conteúdos já documentados e separa referência normativa de orientação.
  - **Dependências:** Nenhuma.
  - **Commit:** Pendente.

- [ ] **DOCS-002 — Catalogar as fontes normativas publicáveis**
  - **Descrição:** Relacionar OpenAPI, webhooks, contratos de integração e orientações públicas que poderão alimentar a documentação.
  - **Critério de aceite:** Cada fonte possui referência e autoridade identificadas; nenhuma definição paralela é criada.
  - **Dependências:** DOCS-001.
  - **Commit:** Pendente.

### Critério de conclusão do bloco

O escopo inicial e as fontes de verdade da documentação pública estão identificados.

## BLOCO 02 — Estudo da solução de publicação

**Objetivo:** estudar o uso de Starlight e as necessidades reais de publicação sem fechar uma arquitetura prematuramente.

**Dependências:** BLOCO 01; stack tecnológica; implantação por papéis.

**Estado:** Não iniciado.

### Tarefas

- [ ] **DOCS-003 — Avaliar Starlight para o escopo documentado**
  - **Descrição:** Estudar se Starlight atende a publicação da referência e das orientações previstas.
  - **Critério de aceite:** A decisão registra adequação, limitações e pendências sem escolher plugins ou layouts antecipadamente.
  - **Dependências:** DOCS-001; DOCS-002.
  - **Commit:** Pendente.

- [ ] **DOCS-004 — Definir a estratégia de geração da referência da API**
  - **Descrição:** Estudar como a referência será gerada a partir do contrato executável, sem manter uma definição independente.
  - **Critério de aceite:** A estratégia preserva o OpenAPI como fonte de verdade e inclui validação no CI como dependência futura.
  - **Dependências:** DOCS-002; DOCS-003.
  - **Commit:** Pendente.

### Critério de conclusão do bloco

Starlight e a geração da referência foram estudados, e as decisões de publicação estão registradas antes de qualquer implementação.

## Decisões pendentes

- Confirmação da adoção e versão do Starlight.
- Plugins, componentes, layouts e estrutura de conteúdo.
- Fluxo de geração e publicação da referência OpenAPI.
- Navegação entre documentação técnica, integração e orientação de eventos.

