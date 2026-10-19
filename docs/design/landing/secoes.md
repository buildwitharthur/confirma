# Seções da landing page

> **Status:** estrutura e comportamento consolidados para o protótipo; copies visuais ainda podem exigir validação editorial.
>
> Este documento define a narrativa, a hierarquia e as necessidades visuais da landing. Não define componentes, tokens, tipografia, espaçamentos, breakpoints ou o design final.

## 1. Visão geral da narrativa

A landing deve apresentar o Confirma como uma API reutilizável para confirmação de agendamentos por WhatsApp, destinada a software houses e desenvolvedores de sistemas para clínicas. A mensagem precisa deixar claro que o Confirma complementa o sistema de agenda existente: recebe o agendamento, conduz a confirmação pelo WhatsApp e comunica o resultado ao sistema de origem por webhook.

A sequência proposta é:

1. explicar o produto e orientar a primeira ação;
2. demonstrar para quem ele é relevante;
3. tornar o fluxo compreensível rapidamente;
4. concretizar a experiência de comunicação pelo WhatsApp;
5. mostrar o acompanhamento operacional;
6. reduzir a incerteza técnica da integração;
7. transmitir confiança sem promessas absolutas;
8. conduzir a solicitação de acesso pelo assistente guiado, acionado pelo hero ou pelo botão flutuante.

Esta é uma landing com **sete seções**. A antiga seção final de CTA com formulário não faz mais parte da estrutura; a sétima seção conduz naturalmente ao footer.

A narrativa usa clareza comercial e progressão editorial como referência do [Dub](https://dub.co/) e apresentação de produto, demonstrações de interface e ritmo visual como referência do [Linear](https://linear.app/). Essas referências são padrões de comunicação, não modelos de identidade ou materiais a serem copiados.

## 2. Navegação global

### Header

O header deve apresentar a marca e permitir acesso às partes principais da página, sem CTA destacado de solicitação. A prioridade é orientar o visitante sem competir com a mensagem do hero.

### Navegação desktop

Usar links de âncora para as seções relevantes da própria página, um acesso à documentação técnica e um acesso ao painel para quem já possui acesso. Não adicionar CTA concorrente no header.

Não criar destinos, rotas ou páginas adicionais nesta etapa.

### Navegação mobile

A navegação deve preservar o acesso à marca, às âncoras essenciais, à documentação e ao painel. A ordem de leitura deve evitar que a navegação ocupe espaço desproporcional antes do conteúdo.

### Links entre as seções

As âncoras devem acompanhar a sequência da narrativa. Links contextuais e links do footer podem abrir o assistente quando isso reduzir uma dúvida real, sem interromper desnecessariamente a leitura.

### Acesso à plataforma

O acesso ao painel deve ser tratado como ação secundária para pessoas que já possuem acesso. Ele não deve ser apresentado como cadastro público.

### Footer

O footer deve reunir a marca, os links institucionais e os destinos já previstos para documentação, painel, termos e privacidade, quando esses destinos estiverem disponíveis e aprovados. Não adicionar links sem destino documental ou contratual definido.

### Conversão e pendência de produto

O objetivo comercial é gerar pedidos de acesso ao piloto. O contrato do site prevê `POST /site/access-requests`, com `name`, `email`, `company_or_project`, `whatsapp_provider`, `intended_use` opcional, `consent`, `form_opened_at` e o honeypot `website`.

O piloto cria contas por convite; o site não cria contas diretamente. Portanto, a comunicação deve usar “Solicitar acesso” ou “Pedir acesso ao piloto”. A hipótese “Criar minha conta” não deve ser resolvida com cadastro público ou nova rota.

### Fluxo de acesso e botão flutuante

O CTA do hero “Solicitar acesso ao piloto” abre o assistente. Depois que o Hero deixar de estar visível na viewport, aparece um botão fixo no canto inferior direito com ícone e “Solicitar acesso” no desktop; no mobile, prefere-se apenas o ícone com nome acessível. O botão respeita área segura, foco e conteúdo, não abre automaticamente e não simula atendente online.

No desktop, o assistente é painel flutuante não modal, com cerca de 400px de largura, altura limitada à viewport, cabeçalho fixo, conteúdo rolável, fechamento e continuidade da navegação. No mobile, ocupa a tela disponível como diálogo modal, com foco gerenciado, retorno de foco ao acionador, Escape e área segura.

### Jornada do assistente

1. **Identificação:** saudação integrada à primeira etapa, finalidade breve e coleta apenas dos campos de identificação do contrato.
2. **Contexto do projeto:** coleta de empresa/projeto, provedor e uso pretendido, usando os rótulos do RF-026: Evolution API, outro ou ainda não tenho. Campos e respostas rápidas são estruturados; não há IA generativa nem resposta aberta produzida por modelo.
3. **Revisão e consentimento:** resumo editável, edição das respostas anteriores e consentimento para contato sobre o piloto, respeitando RNF-003. A redação jurídica definitiva permanece pendente.
4. **Resultado:** estados de enviando, solicitação recebida, erro de validação, solicitação rejeitada, falha de comunicação e resultado incerto após timeout, quando aplicável. Não prometer aprovação ou acesso imediato.

Fechamento durante o preenchimento preserva as respostas somente em memória enquanto a página estiver carregada; não usar `localStorage` ou `sessionStorage`, não enviar dados parciais e reiniciar após recarregar. O frontend impede envio duplicado. Timeout inicial de 15 segundos é proposta técnica pendente de validação, sem retry automático após resultado incerto.

## 3. Especificação das seções

### 3.1 Hero

#### Objetivo

Apresentar imediatamente o que o Confirma faz, para quem é e qual é a próxima ação. Resolve a dúvida inicial “isso é um sistema de agenda ou uma capacidade de integração?”. Ao terminar, o visitante deve compreender que pode integrar confirmações por WhatsApp ao sistema que já opera.

#### Conteúdo proposto

- Slogan institucional: **“Agendou, confirmou.”**
- Headline provisória: **“Confirmações por WhatsApp, integradas ao seu sistema.”**
- Texto de apoio provisório: “Envie agendamentos pela API, automatize a confirmação e receba o resultado via webhook — sem substituir o sistema de agenda existente.”
- CTA primário: **“Solicitar acesso ao piloto”**.
- CTA secundário: acesso à documentação técnica.

Os textos são propostas editoriais sujeitas à aprovação. Não apresentar preços, métricas, depoimentos ou promessa de cadastro imediato.

#### Hierarquia da informação

1. proposta de valor;
2. explicação breve da relação com o sistema de agenda;
3. CTA de solicitação de acesso;
4. caminho secundário para entender a integração;
5. demonstração visual do produto.

#### Composição visual

Composição ampla, com a mensagem e as ações em primeiro plano e uma demonstração visual coerente do fluxo ao lado ou abaixo. A demonstração deve conectar agendamento, conversa e resultado, sem representar funcionalidades não documentadas.

#### Desktop e mobile

No desktop, texto e demonstração podem ocupar áreas complementares. No mobile, o texto, o CTA primário e a explicação do produto devem preceder a demonstração; a composição visual pode ser simplificada ou empilhada para manter legibilidade.

#### Recursos visuais

- Demonstração de interface ou composição visual do fluxo API → WhatsApp → webhook.
- A representação deve ser construída com elementos legíveis na interface quando contiver texto ou estados.
- Usar `assets/hero-confirmation-flow.png` como apoio visual, mantendo rótulos e distinções essenciais em HTML/CSS.

#### Referência

Combinação de Dub, pela clareza do hero e CTA objetivo, com Linear, pela apresentação ampla e orientada ao produto.

### 3.2 Benefícios e posicionamento

#### Objetivo

Responder por que uma software house ou um desenvolvedor usaria o Confirma. A seção deve comunicar o valor de uma capacidade de confirmação reutilizável, complementar aos sistemas de agenda existentes, sem transformar a explicação em uma lista do fluxo operacional.

#### Conteúdo proposto

- Headline provisória: **“Uma capacidade de confirmação reutilizável para os sistemas que você já construiu.”**
- Texto de apoio: o Confirma complementa a aplicação existente, concentrando a confirmação por WhatsApp para que a mesma capacidade possa ser incorporada a diferentes sistemas e projetos.
- Benefício principal: reutilizar a capacidade de confirmação sem reconstruir essa infraestrutura em cada projeto.
- Benefícios complementares, apresentados como capacidades e não como sequência: integração com sistemas existentes; comunicação de confirmação pelo WhatsApp; recebimento do resultado pelo sistema cliente.
- CTA contextual: “Ver como funciona”, conduzindo à demonstração operacional da seção seguinte.

Preservar as referências a API e webhook como meios de integração, sem antecipar a ordem detalhada das etapas. Não transformar benefícios em métricas ou promessas mensuráveis sem evidência aprovada.

#### Hierarquia da informação

1. benefício principal e complementaridade com o sistema existente;
2. explicação curta do reaproveitamento entre sistemas e projetos;
3. três capacidades de apoio, em menor escala: integração, comunicação e retorno;
4. ligação para o fluxo explicado na seção seguinte.

#### Composição visual

Composição editorial assimétrica: uma área principal de destaque concentra headline, explicação e reaproveitamento; uma área secundária organiza três blocos compactos de apoio. O benefício principal deve ocupar mais espaço, ter maior densidade tipográfica e funcionar como âncora da seção. Os blocos secundários não devem formar quatro cards equivalentes nem desenhar um fluxo.

#### Desktop e mobile

No desktop, usar duas áreas em proporção aproximada de 7/12 e 5/12, com o destaque principal alinhado ao início do cabeçalho e os complementares agrupados verticalmente ou em uma matriz compacta. No mobile, reordenar para cabeçalho, destaque principal, complementares e CTA contextual; os blocos devem permanecer distintos, sem tentar preservar a proporção desktop.

#### Recursos visuais

- Destaque editorial e blocos textuais compactos, com relação visual discreta entre sistema existente e Confirma.
- Tratamento de superfície mais contido no benefício principal e mínimo nos complementares; nenhum elemento deve sugerir uma etapa do processo.
- Não usar números, logos de clientes ou depoimentos sem fonte aprovada.

#### Comportamentos esperados

- A seção é informativa; o benefício principal e os complementares não são controles.
- O CTA contextual é o único elemento interativo específico da seção, quando usado.
- A leitura deve permanecer completa sem JavaScript e sem depender de hover.
- API, WhatsApp e webhook aparecem como capacidades de apoio; a sequência temporal fica reservada ao walkthrough.

#### Critérios de validação

- O visitante responde “por que usar o Confirma?” antes de chegar ao fluxo.
- O benefício de reutilização tem protagonismo inequívoco.
- A composição não pode ser lida como quatro cards equivalentes nem como uma sequência operacional.
- Integração, comunicação e retorno continuam documentados, sem novas promessas.
- O Confirma é apresentado como complemento, não como sistema responsável pela agenda.
- A hierarquia funciona em desktop, mobile, teclado e leitura sem JavaScript.

#### Referência

Mais próxima do Dub: comunicação comercial clara, progressão de benefícios e CTA contextual.

### 3.3 Como funciona

#### Objetivo

Demonstrar o que acontece desde que o sistema cliente envia um agendamento até receber o resultado. Ao terminar, o visitante deve compreender a responsabilidade de cada sistema e distinguir recebimento pela API, comunicação com o contato e retorno por webhook.

#### Conteúdo proposto

- Headline provisória: **“Do agendamento ao resultado da confirmação.”**
- Walkthrough com três etapas selecionáveis:
  1. **Agendamento recebido pela API:** o sistema cliente envia os dados do agendamento; o recebimento não equivale à confirmação do contato.
  2. **Confirmação conduzida por mensagem:** o Confirma envia a solicitação pelo WhatsApp e reconhece as respostas previstas pelo produto, sem inventar uma conversa inteligente.
  3. **Resultado enviado ao sistema cliente:** o Confirma comunica o evento por webhook; o sistema cliente continua responsável por aplicar o resultado à própria agenda.
- A demonstração pode representar conceitualmente estados e eventos documentados, incluindo confirmado, cancelado, sem resposta ou falha, sem escolher um resultado como garantido.

#### Hierarquia da informação

1. etapas em lista vertical, com a etapa selecionada claramente identificada;
2. demonstração contextual correspondente à etapa selecionada;
3. distinção entre entrada, comunicação e saída;
4. nota sobre o papel do sistema cliente e limites da demonstração;
5. link para a documentação técnica, sem recontar contratos completos.

#### Composição visual

Walkthrough de dois eixos no desktop: lista vertical de três controles reais à esquerda e painel de demonstração contextual à direita. A demonstração troca de estado quando a etapa é selecionada, preservando dimensões reservadas para evitar deslocamentos excessivos. Não usar três cards textuais equivalentes nem conectores lineares como estrutura principal.

#### Desktop e mobile

No desktop, distribuir aproximadamente 5/12 para etapas e 7/12 para demonstração, com alinhamento pelo topo e painel dimensionado para comportar os três estados. No mobile, abandonar a alternância entre eixos: cada etapa aparece seguida de sua demonstração correspondente, na ordem 01 → demonstração 01 → 02 → demonstração 02 → 03 → demonstração 03. Não usar sticky storytelling, scroll horizontal ou hover como requisito.

#### Recursos visuais

- Lista de etapas operável por teclado e painel de demonstração contextual.
- Demonstração de agendamento recebido, confirmação por mensagem e webhook de resultado.
- Rótulos legíveis para API, WhatsApp e webhook, sempre acompanhados de texto explicativo.
- Conteúdo HTML/CSS sem chamadas, mensagens ou eventos reais; não usar métricas fictícias.

#### Comportamentos esperados

- Estado inicial: etapa 01 selecionada e demonstração do agendamento visível.
- Seleção: atualizar o estado selecionado, o painel correspondente e o nome acessível do painel, sem deslocar a composição.
- Sem JavaScript: as três etapas, descrições e três demonstrações permanecem acessíveis em sequência; nenhuma informação essencial fica escondida.
- Sem animação: o conteúdo e a relação entre etapa e demonstração continuam compreensíveis.
- Movimento: transições curtas de opacidade/transform entre estados, sem autoplay, loop ou sequência obrigatória.
- Semântica futura: usar um padrão de abas somente se a implementação mantiver o conteúdo das três demonstrações no DOM e fornecer fallback linear; controles devem ser botões reais com `aria-selected`, `aria-controls` e `role="tab"`, dentro de um `tablist`, ou um padrão equivalente de disclosure se o fallback não puder ser preservado.

#### Acessibilidade

- Etapas operáveis por teclado, com foco visível, ordem lógica e alvo mínimo de 44px.
- Estado selecionado identificado por texto/indicador e atributo sem depender apenas de cor.
- Cada controle nomeia o painel correspondente; o painel expõe seu título e descrição.
- Conteúdo compreensível sem animações e com `prefers-reduced-motion: reduce`.
- Conectores e ornamentos são decorativos; textos de API, WhatsApp, webhook e estados permanecem no conteúdo semântico.

#### Critérios de validação

- O walkthrough demonstra entrada → confirmação → retorno, sem parecer uma segunda grade de benefícios.
- A demonstração muda de forma contextual e não sugere execução real.
- A etapa 01 não confunde recebimento do agendamento com confirmação.
- A etapa 03 não sugere que o Confirma altera diretamente a agenda.
- As três etapas continuam acessíveis sem JavaScript, teclado, leitor de tela e reduced motion.
- A seção não antecipa a profundidade das seções de WhatsApp, painel ou integração para desenvolvedores.

#### Referência

Combina a progressão didática do Dub com a apresentação de produto do Linear, sem usar uma estética proprietária de nenhuma das referências.

### 3.4 Automação pelo WhatsApp

#### Objetivo

Tornar concreta a experiência que o contato recebe e mostrar que a automação segue regras claras. A seção resolve a dúvida sobre o canal e sobre como o contato responde.

#### Conteúdo proposto

- Headline provisória: **“Uma confirmação simples para quem tem o horário marcado.”**
- Texto de apoio: o contato recebe a solicitação e responde por texto.
- Demonstração fiel ao MVP:
  - `1` confirma;
  - `2` cancela;
  - `PARAR` interrompe as mensagens.
- Explicar que o template da conta pode compor a solicitação e que a instrução fixa de resposta é acrescentada pelo serviço, sem prometer aprovação externa do template.

#### Hierarquia da informação

1. experiência do contato;
2. mensagem e respostas possíveis;
3. consequência comunicacional de cada resposta;
4. relação do resultado com o sistema do cliente.

#### Composição visual

Prévia de conversa em formato de interface, com mensagens e respostas claramente identificadas. A composição deve mostrar apenas o que é necessário para entender o fluxo e não simular dados ou recursos inexistentes.

#### Desktop e mobile

No desktop, a conversa pode acompanhar um texto explicativo. No mobile, a conversa deve permanecer legível, com o texto explicativo antes ou depois dela conforme a ordem de leitura, sem depender de largura excessiva.

#### Recursos visuais

- Demonstração de interface de conversa.
- Pode exigir composição visual específica para a landing, a ser produzida depois.
- Textos e estados essenciais devem existir como conteúdo legível, não apenas dentro de uma imagem.

#### Referência

Mais próxima do Linear: demonstração de produto em destaque, profundidade e foco na experiência real; com a clareza de mensagem do Dub.

### 3.5 Painel de acompanhamento

#### Objetivo

Mostrar a capacidade operacional disponível para configurar e acompanhar as confirmações. A seção deve reforçar que o painel apoia a operação da conta, sem apresentá-lo como o produto principal para o paciente ou como uma tela com funções não aprovadas.

#### Conteúdo proposto

- Headline provisória: **“Acompanhe a operação das suas confirmações.”**
- Texto de apoio: o painel autenticado permite configurar a conta, a conexão de WhatsApp, o template, o webhook e consultar os agendamentos conforme as operações previstas.
- Estados que podem ser apresentados com cautela: agendado, enviado, confirmado, cancelado, sem resposta e falha.
- CTA contextual: acesso ao painel, somente para quem já possui acesso.

#### Hierarquia da informação

1. visão operacional;
2. exemplos de configuração e acompanhamento autorizados;
3. estados públicos do agendamento;
4. acesso secundário à plataforma.

#### Composição visual

Showcase de interface baseado em protótipo ou tela real aprovada. Cada elemento visível deve corresponder às operações documentadas; evitar dashboards inventados, dados fictícios apresentados como métricas ou ações não previstas.

#### Desktop e mobile

No desktop, a demonstração pode ocupar uma área ampla. No mobile, priorizar a mensagem e um recorte compreensível da interface; tabelas ou detalhes densos devem ser simplificados sem esconder a ideia principal.

#### Recursos visuais

- Demonstração de interface baseada em material aprovado.
- Usar `assets/dashboard-showcase.png` somente como representação conceitual, com legenda explícita; não apresentar como screenshot ou interface aprovada.

#### Referência

Mais próxima do Linear, pela centralidade da interface real e pela composição de produto. A organização de benefícios pode aproveitar a clareza do Dub.

### 3.6 Integração para desenvolvedores

#### Objetivo

Reduzir a incerteza técnica de quem avalia integrar o Confirma. A seção deve indicar que existe uma API `/v1`, autenticação por chave de API, retorno correlacionável e comunicação de eventos por webhook, sem substituir a documentação técnica.

#### Conteúdo proposto

- Headline provisória: **“Integre a confirmação ao seu produto.”**
- Texto de apoio: envie o agendamento, acompanhe o resultado por webhook e consulte a documentação dos contratos.
- Exemplo curto e legível, derivado dos contratos, apenas para ilustrar a ideia de entrada e retorno.
- CTA: **“Ler a documentação”**.

O exemplo não deve introduzir campos, limites ou eventos além dos documentos aprovados. A documentação técnica continua sendo a fonte de detalhe.

#### Hierarquia da informação

1. benefício da integração;
2. visão do fluxo técnico;
3. exemplo de código ou payload;
4. link para a documentação.

#### Composição visual

Bloco de código curto acompanhado de uma explicação visual do caminho API → webhook. O código deve ser um elemento de apoio, não a única forma de compreender a proposta.

#### Desktop e mobile

No desktop, código e explicação podem ficar em colunas complementares. No mobile, a explicação deve preceder o bloco e o código deve permitir leitura e rolagem sem quebrar a página.

#### Recursos visuais

- Exemplo de código derivado de contratos aprovados.
- Representação de API, evento e webhook.
- Não incluir credenciais, segredos, URLs inventadas ou dados pessoais reais.

#### Referência

Combinação de Dub, pela clareza orientada à ação, com Linear, pela apresentação cuidadosa do produto técnico.

### 3.7 Confiabilidade e segurança

#### Objetivo

Transmitir confiança por meio de comportamentos técnicos reais, sem converter propriedades do MVP em promessas absolutas ou certificações. A seção deve ajudar o visitante a avaliar se o serviço é adequado para uma integração responsável.

#### Conteúdo proposto

- Headline provisória: **“Uma integração preparada para operar com controle.”**
- Temas a comunicar com linguagem precisa:
  - idempotência por `external_id` dentro da conta;
  - isolamento entre contas;
  - webhooks e eventos com estados documentados;
  - execução recuperável e registro de tentativas;
  - políticas de privacidade, retenção e exclusão previstas no produto.
- Evitar afirmar SLA, disponibilidade garantida, certificação ou entrega no aparelho, pois não estão aprovados para o MVP.

#### Hierarquia da informação

1. ideia de controle operacional;
2. mecanismos concretos;
3. limites e escopo do piloto, quando necessários;
4. link para documentação técnica ou de privacidade.

#### Composição visual

Cards ou blocos técnicos discretos, com títulos orientados ao benefício e descrição curta do mecanismo real. A densidade deve ser menor que na seção de integração para funcionar como reforço de confiança, não como novo manual técnico.

#### Desktop e mobile

No desktop, os temas podem formar uma grade. No mobile, devem seguir uma ordem de prioridade: isolamento e privacidade, consistência dos eventos, recuperação e limites do piloto.

#### Recursos visuais

- Elementos gráficos simples, ícones sem significado exclusivo de segurança absoluta e blocos de texto.
- Não usar selos, escudos ou símbolos que impliquem certificação não documentada.

#### Referência

Combinação equilibrada: clareza comercial do Dub e sobriedade orientada ao produto do Linear.

### Transição para o footer (sem seção final de CTA)

#### Objetivo

Encerrar a narrativa após “Confiabilidade e privacidade” e conduzir naturalmente ao footer. Não criar faixa promocional, formulário tradicional ou nova microseção.

#### Conteúdo proposto

- A seção anterior mantém seu fechamento editorial e o footer segue em continuidade.
- O acesso ao assistente permanece disponível pelo CTA do Hero, pelo botão flutuante após o Hero e por links de solicitação já existentes no footer.

#### Hierarquia da informação

1. conclusão da seção de confiabilidade;
2. footer institucional e links aprovados.

#### Composição visual

Sem faixa promocional adicional. A transição deve preservar ritmo, contraste e continuidade visual até o footer.

#### Desktop e mobile

No desktop e no mobile, o footer segue a seção anterior sem exigir nova ação local.

#### Recursos visuais

- Nenhuma imagem ou componente de CTA final é necessária.

#### Referência

Encerramento editorial simples, com os links funcionais do footer.

## 4. Continuidade da narrativa e conversão

### Progressão

O hero apresenta a promessa; benefícios e posicionamento qualificam o visitante; o fluxo explica o funcionamento; WhatsApp e painel tornam o produto concreto; a integração responde à avaliação técnica; confiabilidade e privacidade reduzem riscos percebidos; a página transita para o footer. A conversão ocorre pelo assistente, sem seção final dedicada.

### Possíveis redundâncias

- “Benefícios e posicionamento” e “Como funciona” podem se sobrepor se ambos repetirem a mesma descrição. O primeiro deve responder por que usar; o segundo, como o fluxo acontece.
- “Painel de acompanhamento” e “Confiabilidade e segurança” podem repetir estados operacionais. O painel deve mostrar a experiência de operação; confiabilidade deve explicar mecanismos e limites.
- “Integração para desenvolvedores” pode repetir o fluxo. Deve aprofundar a entrada, o retorno e a documentação, sem recontar toda a narrativa.

Essas são observações para validação, não alterações unilaterais da sequência aprovada.

### Continuidade entre contextos

O visitante deve passar do comercial ao técnico gradualmente. A transição para código e detalhes operacionais precisa ser acompanhada por explicações simples. A seção de confiança deve evitar uma mudança brusca para linguagem jurídica ou promessas de segurança que os documentos não sustentem.

### Conversão

O objetivo é o pedido de acesso ao piloto. O CTA do hero abre o assistente; o botão flutuante reaparece somente quando o Hero não está visível. O header não contém CTA destacado. O footer preserva links de solicitação funcionais sem recriar o formulário tradicional.

O assistente segue `POST /site/access-requests` sem alterar o payload: `name`, `email`, `company_or_project`, `whatsapp_provider` (`evolution_api`, `other` ou `none_yet`), `intended_use` opcional, `consent`, `form_opened_at` relacionado à abertura efetiva da coleta e `website` vazio. Sucesso é HTTP 202 com `status: received`, mensagem pública estável e `request_id` da tentativa HTTP; a resposta é uniforme e não revela pedido preexistente, aprovação, estado interno, ID ou criação de conta. A validação usa o envelope e os códigos do contrato do site; rejeição técnica não registra pedido. O timeout inicial de 15 segundos é pendente de validação técnica, apresenta resultado incerto e não faz retry automático.

## 5. Referência cromática e limites de design

A paleta oficial compartilhada permanece em [`../assets/tokens.json`](../assets/tokens.json), somente como referência cromática. A tipografia e os padrões atuais da landing estão especificados em `design.md` e DEC-006; não devem ser tratados como ainda ausentes. A aprovação editorial/artística dos elementos marcados como proposta continua pendente.

## 6. Pendências para validação

- Aprovar a headline e os textos provisórios do hero.
- Validar a proposta de conteúdo de cada seção com produto e negócio.
- Usar os destinos documentados — `https://docs.useconfirma.com`, `https://app.useconfirma.com`, `https://useconfirma.com/termos` e `https://useconfirma.com/privacidade` — apenas quando estiverem publicados; a disponibilidade pública continua dependência externa.
- Preservar a decisão já estabelecida de pedido de acesso e convite (RF-025/026); cadastro público exigiria nova decisão de produto, não é pendência do recorte atual.
- Aprovar qualquer exemplo de código, payload, estado ou interface antes de transformá-lo em asset ou componente.
- Avaliar visualmente os três PNGs existentes e aprovar sua aplicação final.
- Validar se a apresentação de estados e mecanismos técnicos está compreensível sem prometer mais do que o MVP oferece.
- Verificar a não duplicação entre benefícios, funcionamento, painel e confiabilidade antes de consolidar o design.
- Validar os pontos visuais/editoriais ainda propostos na especificação já existente em `design.md`, sem declarar aprovação ausente.
