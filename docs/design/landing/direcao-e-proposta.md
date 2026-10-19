# Landing page do Confirma — Direção e proposta

> **Status:** proposta inicial para discussão, não uma especificação visual aprovada.

> **Referência histórica de direção.** A arquitetura inicial de oito seções e o formulário/CTA final abaixo foram substituídos pela especificação atual de sete seções com assistente em [secoes.md](secoes.md), [componentes.md](componentes.md) e [design.md](design.md). A tipografia já está especificada nesses documentos e em DEC-006. As propostas históricas não reabrem o acesso por convite nem comprovam aprovação editorial/artística pendente.
>
> **Escopo:** apenas a landing page. Este documento não altera requisitos, contratos, arquitetura ou decisões de outros aplicativos.

## 1. Fontes de referência e precedência

A landing deve respeitar, nesta ordem:

1. A documentação aprovada de produto e domínio, especialmente `docs/visao-geral.md`, requisitos e regras de negócio.
2. Os contratos existentes da superfície pública, especialmente `docs/desenvolvimento/contratos/site.md`.
3. A identidade cromática oficial em `docs/design/assets/tokens.json`.
4. As propostas criativas deste documento, que dependem de aprovação antes de se tornarem regras de design.

**Regra de produto já documentada:** no piloto, o acesso é por convite. O site recebe pedidos de acesso; não cria contas diretamente. Portanto, o CTA público da versão atual deve comunicar **“Solicitar acesso”** ou **“Pedir acesso ao piloto”**. O texto **“Criar minha conta”** pertence ao fluxo de convite. Cadastro aberto só poderá substituir esse fluxo após uma decisão de produto formalizada nos documentos competentes.

## 2. Objetivo da landing

Apresentar o Confirma como uma API reutilizável de confirmação de agendamentos via WhatsApp, explicar seu valor para quem já opera sistemas de agenda e conduzir o visitante qualificado a solicitar acesso ao piloto.

### Público prioritário

- Software houses e desenvolvedores de sistemas para clínicas.
- Freelancers que desenvolvem sistemas de agendamento sob medida.

Outros segmentos de mercado são hipóteses ainda não validadas, não públicos consolidados no posicionamento.

### Ações do visitante

- **Primária:** solicitar acesso ao piloto pelo formulário previsto no contrato do site.
- **Secundárias:** explorar a documentação técnica e entrar no painel, quando já tiver acesso.

Não apresentar preços, adesão imediata, funcionalidades futuras ou números de resultados não comprovados.

## 3. Mensagem e narrativa

**Slogan institucional existente:** “Agendou, confirmou.”

**Proposta de mensagem para o hero (a validar):**

> Confirmações por WhatsApp, integradas ao seu sistema.

**Mensagem complementar (a validar):**

> Envie agendamentos pela API, automatize a confirmação e receba o resultado via webhook — sem substituir o sistema de agenda existente.

A comunicação deve deixar explícito que o Confirma **não é um sistema de agendamento**: ele complementa sistemas de origem, que continuam responsáveis por aplicar o resultado recebido à própria agenda.

## 4. Referências de direção visual

### Dub — clareza e comunicação comercial

Aproveitar como referência a hierarquia do hero, a leitura rápida, a organização do conteúdo em seções, os cards bem definidos e os CTAs objetivos.

### Linear — apresentação de produto e acabamento

Aproveitar como referência composições amplas de interface, profundidade, ritmo entre seções, transições discretas e foco no produto real.

Não reproduzir literalmente identidade, elementos proprietários, imagens ou componentes dessas marcas.

### Direção cromática

A paleta oficial é definida exclusivamente por `../assets/tokens.json`. A landing decide, em seu próprio `design.md`, como aplicar essas cores a fundos, textos, ações e elementos semânticos.

Cores de marca disponíveis incluem Verde (`#0A7F50`), Menta (`#3DDC97`), Noite (`#0B1F1A`) e Névoa (`#F3F7F5`). São referências cromáticas, **não** uma obrigação de herdar temas, tipografia, espaçamentos, raios, sombras ou componentes de outros apps.

## 5. Arquitetura da informação proposta

A sequência abaixo é uma hipótese editorial inicial; será validada antes de consolidar o `design.md`.

| Ordem | Seção | Intenção | Conteúdo principal | Tratamento visual preliminar |
| --- | --- | --- | --- | --- |
| 1 | Hero | Explicar o que é e convidar à ação | Proposta de valor, CTA de solicitar acesso e caminho para documentação | Composição de produto com hierarquia forte |
| 2 | Para quem é e o problema | Demonstrar relevância | Reutilizar a infraestrutura de confirmação sem reconstruir fluxos por projeto | Texto objetivo e benefícios verificáveis |
| 3 | Como funciona | Demonstrar o fluxo em segundos | API recebe agendamento → WhatsApp conduz a confirmação → webhook comunica resultado | Walkthrough contextual de três etapas, preferencialmente em HTML/CSS |
| 4 | Comunicação por WhatsApp | Tornar a experiência concreta | Mensagem e respostas por texto (1 confirma, 2 cancela, PARAR interrompe) | Prévia de conversa fiel às regras do MVP |
| 5 | Painel de acompanhamento | Mostrar capacidade operacional | Configuração e acompanhamento das confirmações autorizadas | Prévia baseada em protótipo real, sem inventar funcionalidades |
| 6 | Integração para desenvolvedores | Reduzir incerteza técnica | API, eventos e referência de documentação | Código legível em HTML, com exemplos retirados dos contratos |
| 7 | Confiabilidade e privacidade | Construir confiança | Idempotência, isolamento por conta e execução recuperável, sem promessas absolutas | Cards ou blocos técnicos discretos |
| 8 | CTA final | Retomar a conversão | Síntese do valor e acesso ao formulário do piloto | Seção de contraste e foco em uma ação |

**Estruturas de apoio:** cabeçalho com âncoras para seções, link para documentação, acesso ao painel e CTA; rodapé com termos, privacidade e informações institucionais exigidas.

Não adicionar nesta fase: preços, depoimentos fictícios, métricas inventadas, FAQ sem evidência de dúvidas recorrentes ou demonstrações de funções fora do MVP.

## 6. Direção dos componentes

O futuro `componentes.md` registrará componentes por função, com estados de **proposto**, **aprovado** e **implementado**. Um componente só será marcado como existente após inspeção do código real.

**Candidatos iniciais:** cabeçalho, navegação responsiva, hero, CTA, destaque editorial de benefícios, walkthrough contextual de três etapas, preview de conversa, showcase do painel, prévia de API/webhook, cards de confiabilidade, formulário de solicitação de acesso e rodapé.

Priorizar HTML/CSS semântico para textos, códigos, diagramas simples, cards e elementos responsivos. Não transformar screenshots ou imagens em substitutos de conteúdo essencial.

## 7. Estratégia de assets

Os assets produzidos especificamente para a landing são mantidos em `docs/design/landing/assets/`. Logos e paleta oficiais permanecem em `docs/design/assets/`.

A biblioteca contém três composições:

1. **Hero:** visual de agendamento, conversa e retorno de resultado em uma peça coerente.
2. **Conversa:** representação da confirmação via WhatsApp, seguindo o MVP.
3. **Painel:** representação conceitual do acompanhamento; não é captura real nem protótipo aprovado.

Para imagens geradas: alta resolução, transparência real por canal alfa, enquadramento com margens seguras, sem fundo embutido, sem textos obrigatórios rasterizados e sem interface ou dados fictícios apresentados como recursos reais. Definir proporções e pontos de inserção **antes** de gerar cada peça.

## 8. Responsabilidade dos documentos

- `direcao-e-proposta.md` (este arquivo): intenção, público, narrativa, referências e hipóteses de seção.
- `componentes.md`: inventário de componentes, responsabilidades, relação com seções e estado de aprovação/implementação.
- `assets/`: materiais visuais específicos da landing, acompanhados de identificação de uso.
- `design.md` (etapa final): decisões visuais aprovadas para a landing, como tipografia própria, composição, espaçamentos, responsividade, interações, acessibilidade e aplicação contextual da paleta.

O `design.md` registra propostas visuais consolidadas para prototipagem, sem transformar copies ou aprovação artística em decisões definitivas. A landing possui seu próprio sistema de tipografia, layout, espaçamento e movimento; nada disso modifica o `tokens.json` compartilhado.

## 9. Critérios para aprovar a direção

A direção poderá ser consolidada quando:

- A mensagem representar corretamente o produto definido na documentação.
- A conversão estiver compatível com o fluxo de convite do MVP.
- Cada seção tiver uma finalidade identificável e não repetir desnecessariamente outra.
- A ordem de leitura funcionar em desktop e mobile.
- Os componentes planejados puderem representar funcionalidades reais.
- Os assets necessários e seus usos estiverem definidos antes da geração.
- As escolhas visuais respeitarem a paleta oficial, sem impor padrões às outras aplicações.

O fluxo de produto está consolidado para esta landing: o site recebe pedido de acesso ao piloto e não cria contas. Qualquer mudança para cadastro público exigiria decisão de produto fora desta documentação.
