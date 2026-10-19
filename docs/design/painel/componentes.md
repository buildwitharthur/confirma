# Inventário de componentes do painel

## 1. Escopo e critério

Este inventário traduz as 16 telas existentes (`T-01` a `T-16`), a nova tela `T-06A` e as jornadas/estados já documentados em responsabilidades funcionais reutilizáveis. Um componente aparece aqui quando resolve uma tarefa, concentra uma regra, coordena uma operação ou estabelece um padrão de feedback relevante. Campos simples, textos, ícones, linhas individuais e elementos decorativos não são inventariados isoladamente.

O documento é independente de tecnologia e aparência visual. Não define componentes de terceiros, estrutura de código, cores, tipografia, espaçamento, layout, tokens ou posicionamento.

Este documento mantém o inventário funcional existente e acrescenta uma camada explícita de componentes primitivos. A separação é conceitual: ela não prescreve arquitetura de código nem afirma que cada item já exista como componente independente no produto.

## Camadas de composição

| Camada | Responsabilidade | Exemplos neste painel |
| --- | --- | --- |
| **Primitivos** | Unidades de interface sem regra de negócio. | Button, Field, Select, Checkbox, Tabs, Panel, Status, Alert, Toast, Dialog, Table, Empty state, Skeleton, Spinner. |
| **Compostos** | Combinações de primitivos para uma necessidade recorrente. | FormField, PasswordField, MethodTabs, FilterBar, Pagination, SecretReveal, AuthLayout. |
| **Funcionais** | Coordenam jornada, operação, autorização e contratos do Confirma. | AUTH-01–06, ONB-01–04, OPS-01–08, INT-01–06, SEC-01–06 e demais itens do catálogo funcional. |

Primitivos não conhecem sessão, conta, endpoints, permissões, contratos ou regras de negócio. Compostos podem organizar apresentação e interação local, mas decisões de produto permanecem nos componentes funcionais e nas camadas apropriadas.

## Primitivos reutilizáveis

O inventário abaixo é a base efetivamente identificada no protótipo e nos requisitos documentados. Quando um estado não é listado, ele não é necessário para o papel descrito.

### PRIM-01 — Button

- **Responsabilidade/categoria:** executar uma ação explícita; ação, navegação ou confirmação. Usado em T-01–T-16.
- **API conceitual:** `label`, `type`, `variant` (`primary`, `default`, `quiet`, `danger`, `danger-outline`), `size` (`sm`, `md`, `lg`), `disabled`, `busy`, `icon`, `aria-label`; evento `click`/`submit`.
- **Visual:** IBM Plex Sans, 13–14/19–21 px; altura 34/38/42 px; padding horizontal 8/12/20 px; raio 8 px. Primário verde oficial com acabamento interno sutil; perigo vermelho sem sombra exagerada.
- **Estados:** default, hover, focus-visible, active, disabled e busy. Busy preserva a ação e comunica progresso com Spinner; não aceitar novo acionamento.
- **Acessibilidade/composição:** elemento `<button>` para ações e link para navegação; nome acessível, foco visível e texto de progresso. Compõe FormActions, Dialog e navegação.

### PRIM-02 — Field (Input, Select e Textarea)

- **Responsabilidade/categoria:** receber um valor simples; usado em autenticação, onboarding, integrações, configurações, privacidade e filtros.
- **API conceitual:** `label`, `name`, `value`, `type`, `placeholder`, `help`, `error`, `required`, `disabled`, `readonly`, `autocomplete`, `rows`; eventos `input`, `change`, `blur` e `submit` no composto.
- **Visual:** 40 px no desktop, 44 px como mínimo confortável em mobile; padding 8/12 px; raio 8 px; borda neutra de 1 px; fundo branco, readonly em névoa. IBM Plex Sans; valores técnicos podem usar IBM Plex Mono.
- **Estados:** default, hover, focus-visible, disabled, readonly e error. Loading pertence ao formulário/ação, não ao campo; success só quando houver mensagem funcional explícita.
- **Acessibilidade/composição:** `<label>` associado, `autocomplete` correto, descrição e erro ligados por `aria-describedby`, `aria-invalid` em erro; Select nativo sempre que possível. Compõe FormField e PasswordField.

### PRIM-03 — Checkbox

- **Responsabilidade/categoria:** escolha booleana, inclusive aceite de termos; usado em T-02, T-05 e filtros quando aplicável.
- **API conceitual:** `checked`, `name`, `label`, `description`, `required`, `disabled`; evento `change`.
- **Visual:** controle nativo/18 px, accent-color verde, área clicável com padding 12 px, borda 1 px e raio 8 px quando agrupado em superfície.
- **Estados:** unchecked, checked, focus-visible, disabled e error. Não há loading próprio.
- **Acessibilidade/composição:** `<input type="checkbox">` com label completo; `required` e mensagem de erro acessível. Compõe TermsAcceptance e FilterBar.

### PRIM-04 — Tabs

- **Responsabilidade/categoria:** alternar painéis de conteúdo quando houver uma necessidade documentada. No beta, T-01 usa somente e-mail/senha (DEC-001); não existe alternância de métodos de autenticação a implementar.
- **API conceitual:** coleção de `id`, `label`, `selected`, `disabled`; eventos `click` e setas esquerda/direita.
- **Visual:** trilho branco, borda neutra, padding 4 px, gap 4 px, raio externo 10 px; aba ativa em verde-claro com texto verde-escuro.
- **Estados:** selected, unselected, focus-visible e disabled. A troca deve preservar foco na aba ativa.
- **Acessibilidade/composição:** `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls` e painel associado; navegação por teclado. Não compõe LoginMethodTabs no beta; a descrição do primitivo não autoriza habilitar Google ou link mágico.

### PRIM-05 — Panel (superfície/card)

- **Responsabilidade/categoria:** agrupar conteúdo relacionado sem carregar regra de negócio; usado em T-05–T-16 e no showcase de T-01.
- **API conceitual:** `title`, `description`, `header`, `footer`, `tone`, `padding` e conteúdo filho.
- **Visual:** branco, borda estrutural cinza-verde-claro, raio 12 px, sombra de painel 0 1px 2px; padding 20 px (16 px em mobile). Zona perigosa pode usar borda sem transformar o painel em decoração.
- **Estados:** default; variantes informativa/perigo são semânticas. Não possui hover ou loading próprio.
- **Acessibilidade/composição:** `<section>` com heading quando houver título; não usar card para cada linha de tabela. Compõe FormPanel, DetailPanel, DemoSurface.

### PRIM-06 — Status/Badge/Tag

- **Responsabilidade/categoria:** comunicar estado curto, requisito ou classificação; usado em onboarding, listas, detalhes, integrações e chaves.
- **API conceitual:** `tone` (`ok`, `warn`, `err`, `info`, `busy`), `label`, `icon`, `kind` (`status`, `tag`), `aria-label` quando o ícone for necessário.
- **Visual:** texto 12/16–18 px, pill 999 px para status, fundo semântico dos tokens, sem depender apenas de cor; tags podem usar raio 8 px.
- **Estados:** a variação representa o estado do dado, não interação. Busy combina Spinner; erro e alerta sempre têm texto.
- **Acessibilidade/composição:** texto visível ou nome acessível equivalente; ícones decorativos com `aria-hidden`. Compõe StepState, table rows e feedback.

### PRIM-07 — Alert e Toast

- **Responsabilidade/categoria:** feedback persistente no contexto (Alert) ou breve e global (Toast); usados em todos os fluxos que têm erro, sucesso, aviso ou bloqueio.
- **API conceitual:** `tone`, `title`, `body`, `actions`, `critical`, `dismissible`; Toast aceita `duration` apenas quando não remove informação essencial.
- **Visual:** Alert em névoa/branco e cores semânticas; padding 12/16 px, gap 8/12 px, raio 8 px. Toast até 360 px, branco, borda e sombra flutuante controlada.
- **Estados:** info, success, warning, error e busy quando aplicável. Não criar alerta decorativo.
- **Acessibilidade/composição:** Alert com `role="status"` ou `role="alert"` conforme urgência; Toast anuncia sem roubar foco e oferece fechamento. Ações ficam em botões nomeados.

### PRIM-08 — Dialog

- **Responsabilidade/categoria:** confirmação ou revelação de informação sensível/irreversível; usado em revogação, exclusão e revelação de segredo.
- **API conceitual:** `open`, `title`, `body`, `tone`, `confirmLabel`, `cancelLabel`, `busy`, `onConfirm`, `onClose`.
- **Visual:** superfície branca, raio 12 px, sombra flutuante, espaçamento 20/24 px; tom de perigo usa semântica vermelha, sem ornamentação.
- **Estados:** closed, open, validating/busy, error e success quando o fluxo retornar ao contexto. Escape fecha apenas operações canceláveis.
- **Acessibilidade/composição:** `<dialog>`/modal com `aria-labelledby`, foco inicial, foco confinado e retorno ao acionador; consequência irreversível em texto. Regra de negócio permanece no funcional.

### PRIM-09 — Table

- **Responsabilidade/categoria:** exibir registros comparáveis e suas ações; usado em T-08, T-09, T-14 e listas de operação.
- **API conceitual:** `caption`, `columns`, `rows`, `sort`, `loading`, `empty`, `rowActions` e paginação composta; eventos de ordenação/paginação.
- **Visual:** cabeçalho 12/16 px sem caixa alta, dados 14/20 px, padding 12/16 px, divisórias neutras; IDs em IBM Plex Mono. Sem card/sombra por linha.
- **Estados:** loading, populated, empty, partial error e error. Não inventar ordenação ou paginação antes do requisito correspondente.
- **Acessibilidade/composição:** `<table>` semântico, caption, `scope="col"`, região com rolagem horizontal identificada e ações com contexto da linha. Compõe ListScreen e DeliveryHistory.

### PRIM-10 — Empty state, Skeleton e Spinner

- **Responsabilidade/categoria:** comunicar ausência de dados, carregamento estrutural e progresso local; usados em listas, consultas e ações assíncronas.
- **API conceitual:** Empty `title/body/action`; Skeleton `shape/width`; Spinner `label/size`.
- **Visual:** Empty com padding e ícone discreto; Skeleton em névoa/cinza-verde com animação curta; Spinner semântico e compacto. Respeitam `prefers-reduced-motion`.
- **Estados:** Empty não é erro; Skeleton loading; Spinner busy. Erro usa Alert/Empty error, não apenas Spinner.
- **Acessibilidade/composição:** texto equivalente, `aria-busy` no contêiner durante loading e `role="status"` para progresso; não bloquear leitura com animação. Compõem Table, Form e telas funcionais.

## 2. Fontes e princípios de reutilização

Fontes principais: [escopo](planejamento/escopo.md), [mapa de rotas](planejamento/mapa-de-rotas.md), [jornadas](planejamento/jornadas.md), [catálogo de telas](planejamento/catalogo-de-telas.md), [operações e dados](planejamento/operacoes-e-dados.md) e [estados e acesso](planejamento/estados-e-acesso.md). Requisitos, regras, casos de uso e contratos do Confirma prevalecem quando uma decisão funcional estiver em dúvida.

Princípios:

- Reutilizar comportamento e responsabilidade, não apenas semelhança visual.
- Manter no mesmo componente regras que precisam permanecer consistentes entre telas.
- Não transformar cada campo ou bloco em componente independente.
- Não esconder diferenças de autorização, retenção ou irreversibilidade sob uma abstração genérica.
- Componentes podem ser compartilhados entre onboarding e configurações quando executam a mesma operação e exibem os mesmos estados.

## 3. Visão geral

| Categoria | IDs | Total |
| --- | --- | ---: |
| Estrutura e navegação | NAV-01–04 | 4 |
| Autenticação e acesso | AUTH-01–06 | 6 |
| Onboarding | ONB-01–04 | 4 |
| Boas-vindas | WEL-01 | 1 |
| Operação e acompanhamento | OPS-01–08 | 8 |
| Integrações | INT-01–06 | 6 |
| Segurança e privacidade | SEC-01–06 | 6 |
| Estados e feedback | STATE-01–04 | 4 |
| **Total** |  | **39** |

Classificação: 23 componentes compartilhados ou reutilizáveis entre contextos de uso; 16 específicos de uma experiência, incluindo AUTH-06 e WEL-01. Total: 39 componentes funcionais. A classificação detalhada aparece em cada especificação.

## 4. Estrutura e navegação

### NAV-01 — Estrutura autenticada

- **Tipo:** compartilhado. **Prioridade:** essencial para operação.
- **Responsabilidade:** delimitar a experiência autenticada, carregar o contexto da sessão e impedir que uma tela opere fora da conta autorizada.
- **Telas:** T-05 a T-16; rotas R-05 a R-16.
- **Informações:** sessão, conta determinada pelo servidor, estado `active`/`deleting`, pendência de termos e destino pretendido.
- **Ações:** entrar na rota autorizada, sair, reagir a sessão expirada ou termos pendentes.
- **Estados:** inicial, carregando sessão, autenticado, não autenticado, sessão expirada, termos pendentes, conta em exclusão, acesso negado.
- **Regras/operações:** `/panel` aceita somente sessão; toda consulta é filtrada pela conta; não aceitar `account_id` de entrada. Consulta de perfil/lifecycle depende do contrato de leitura.
- **Acessibilidade:** ordem de leitura coerente, foco anunciado ao trocar de contexto e comunicação textual de bloqueios.
- **Rastreabilidade:** T-05–T-16, J-02/J-11/J-12, RNF-001, RNF-014, contrato do painel.

### NAV-02 — Navegação principal por tarefa

- **Tipo:** compartilhado. **Prioridade:** essencial para operação.
- **Responsabilidade:** oferecer acesso estável aos grupos de operação, integrações, configurações e privacidade sem expor cada ação como rota.
- **Telas:** T-06 a T-16.
- **Informações:** grupos, rota atual, indicação de onboarding incompleto e estado de acesso.
- **Ações:** navegar, retornar à preparação, abrir visão geral ou configurações.
- **Estados:** carregando permissões, disponível, rota atual, item indisponível, termos pendentes.
- **Regras/operações:** segue R-06–R-16; não cria rotas para criação de agendamento, redelivery como tela ou cada operação.
- **Acessibilidade:** cada destino deve possuir nome compreensível, estado atual identificável e navegação por teclado sem dependência de apontador.
- **Rastreabilidade:** mapa de rotas, T-06–T-16, J-03/J-04.

### NAV-03 — Contexto da conta

- **Tipo:** compartilhado. **Prioridade:** essencial para primeiro acesso.
- **Responsabilidade:** tornar explícita a conta em uso sem oferecer troca de conta no MVP.
- **Telas:** T-06 a T-16.
- **Informações:** nome da conta, estado e, quando contratado, usuário vinculado.
- **Ações:** abrir configuração da conta; não alternar contas.
- **Estados:** carregando, conta ativa, conta em exclusão, dados indisponíveis.
- **Regras/operações:** a sessão resolve a conta; leitura de perfil/situação depende do contrato de leitura.
- **Acessibilidade:** contexto lido no início da área autenticada; mudança de estado anunciada.
- **Rastreabilidade:** T-06/T-07/T-10/T-16, escopo, RF-019, RNF-001.

### NAV-04 — Orientação contextual

- **Tipo:** compartilhado. **Prioridade:** essencial para operação.
- **Responsabilidade:** explicar onde o usuário está, de onde veio e quais saídas são válidas, especialmente em detalhe, onboarding e rotas sensíveis.
- **Telas:** T-02, T-05, T-06, T-09, T-15, T-16.
- **Informações:** tela atual, etapa, rota de retorno e condição que levou à tela.
- **Ações:** voltar, continuar para correção ou retornar ao contexto de origem.
- **Estados:** disponível, origem indisponível, acesso negado.
- **Regras/operações:** não expor dados de uma rota inexistente ou retida; não reexecutar ação sensível ao voltar.
- **Acessibilidade:** foco vai ao título/contexto após navegação; retorno tem nome e destino claros.
- **Rastreabilidade:** mapa de rotas, J-01/J-03/J-04/J-10/J-12.

### WEL-01 — Introdução de boas-vindas

- **Tipo:** específico da experiência de primeiro acesso. **Prioridade:** essencial para primeiro acesso.
- **Responsabilidade:** receber o usuário após a criação da conta e encaminhá-lo aos primeiros passos com uma introdução mínima, sem duplicar o onboarding.
- **Tela:** T-06A (`/boas-vindas`).
- **Informações:** saudação curta, orientação de uma ou duas frases e demonstração visual conceitual central do fluxo de confirmação.
- **Ações:** uma única ação principal: começar configuração (`/primeiros-passos`). Navegação de sessão permanece estrutural, não como CTA concorrente.
- **Estados:** apresentação após convite, conta com onboarding iniciado, sessão expirada e acesso negado.
- **Regras/operações:** não cria endpoint, não altera autenticação/prontidão e não exige nova configuração. Não há marcador persistente próprio de visualização; a navegação recorrente segue sessão, autorização e estado operacional.
- **Acessibilidade:** título recebe foco após entrada; ação principal tem nome claro; a demonstração tem descrição textual equivalente e não é necessária para concluir a tarefa.
- **Rastreabilidade:** T-06A, R-06A, J-01/J-03 e catálogo.

## 5. Autenticação e acesso

### AUTH-01 — Formulário de autenticação

- **Tipo:** específico de acesso, reutilizável entre entrada e retorno após sessão. **Prioridade:** essencial para primeiro acesso.
- **Responsabilidade:** permitir e-mail e senha durante o beta.
- **Telas:** T-01.
- **Informações:** e-mail, senha e caminhos de recuperação/convite.
- **Ações:** autenticar e recuperar acesso.
- **Estados:** inicial, enviando, sucesso, credencial inválida, bloqueio de 15 minutos, indisponibilidade.
- **Regras/operações:** respostas de erro não revelam existência; cinco falhas consecutivas bloqueiam o e-mail por 15 minutos. Link mágico e Google OAuth não fazem parte do beta.
- **Acessibilidade:** rótulos associados, erros ligados aos campos, status de envio anunciado e foco no primeiro erro.
- **Rastreabilidade:** T-01, J-02, RF-025, RNF-002.

### AUTH-06 — Showcase demonstrativo de autenticação

- **Tipo:** específico de apresentação do acesso. **Prioridade:** complementar; não é requisito funcional de autenticação.
- **Responsabilidade:** reforçar visualmente a proposta do Confirma por meio de uma demonstração conceitual subordinada ao formulário.
- **Tela:** T-01.
- **Informações:** frame de interface, acompanhamento de confirmação e sequência ilustrativa de agendamento, mensagem e resultado; somente dados fictícios/demonstrativos.
- **Ações:** nenhuma ação de produto, autenticação ou navegação. Pode responder a microanimação de demonstração sem capturar foco.
- **Estados:** estático, demonstração em andamento, reduzido, oculto e `prefers-reduced-motion`.
- **Regras/operações:** não cria métricas, dados, endpoints, marcas de terceiros ou funcionalidades; não altera métodos, erros, sessão ou fluxo de login.
- **Responsividade:** largura recomendada de 420–520 px, limite de 560 px; reduz no notebook, pode virar faixa/ser oculto no tablet e é oculto no mobile.
- **Acessibilidade:** texto alternativo/descrição equivalente, contraste e hierarquia suficientes; ausência do showcase não reduz a capacidade de entrar.
- **Rastreabilidade:** T-01, J-02, design do painel e critérios de validação visual.

### AUTH-02 — Aceitação de convite

- **Tipo:** específico. **Prioridade:** essencial para primeiro acesso.
- **Responsabilidade:** inspecionar token e coletar dados mínimos para criação transacional de conta.
- **Telas:** T-02.
- **Informações:** e-mail convidado, nome sugerido, nome da conta, senha, versões dos documentos e aceite obrigatório.
- **Ações:** inspecionar, aceitar, reenviar após atualização de versões.
- **Estados:** token carregando, válido, inválido, expirado/usado indistinguível, validação, sucesso com sessão, concorrência.
- **Regras/operações:** `InspectInvitation` e `AcceptInvitation`; token permanece no fragmento; senha 10–128 e não comum; aceite desmarcado por padrão.
- **Acessibilidade:** aceite e links têm nome completo; erros de versão e senha são lidos; não depender do fragmento para comunicar o resultado.
- **Rastreabilidade:** T-02, J-01, RF-025, CU-020, contrato do painel.

### AUTH-03 — Recuperação e redefinição de acesso

- **Tipo:** específico de acesso. **Prioridade:** essencial para primeiro acesso.
- **Responsabilidade:** solicitar link sem enumeração e definir nova senha com token de uso único.
- **Telas:** T-03, T-04.
- **Informações:** e-mail, prazo do link, senha nova e confirmação.
- **Ações:** solicitar, abrir token, salvar nova senha, voltar ao login.
- **Estados:** enviando, resposta uniforme, token válido, expirado/usado, senha inválida, sucesso, indisponibilidade.
- **Regras/operações:** recuperação válida por 1 hora e uma utilização; pedido tem mesma resposta exista ou não a conta.
- **Acessibilidade:** instruções e prazo são lidos; erros não são apenas cor; foco é reposicionado após troca de etapa.
- **Rastreabilidade:** T-03/T-04, J-02, RF-025.

### AUTH-04 — Gate de aceite de termos

- **Tipo:** compartilhado. **Prioridade:** essencial para primeiro acesso.
- **Responsabilidade:** impedir comandos do painel até o aceite das versões vigentes, preservando saída e exclusão conforme contrato.
- **Telas:** T-02, T-05, NAV-01.
- **Informações:** versões e datas de vigência, links dos documentos, motivo do bloqueio.
- **Ações:** aceitar `AcceptTerms`, sair, iniciar exclusão de conta.
- **Estados:** sem pendência, pendente, validando, aceito, versão inválida, indisponível.
- **Regras/operações:** 403 `terms_acceptance_required`; `/v1` não é bloqueado; versões desconhecidas retornam `validation_error`.
- **Acessibilidade:** bloqueio anunciado antes do conteúdo; links identificados; confirmação e erro persistem até serem lidos.
- **Rastreabilidade:** T-02/T-05, J-01/J-11, RF-025, `AcceptTerms`.

### AUTH-05 — Feedback de sessão expirada

- **Tipo:** compartilhado. **Prioridade:** essencial para operação.
- **Responsabilidade:** explicar por que uma consulta ou comando foi interrompido e orientar novo login.
- **Telas:** T-01, T-05 a T-16.
- **Informações:** sessão expirada, ação não repetida automaticamente e rota de retorno segura.
- **Ações:** entrar novamente, cancelar retorno.
- **Estados:** detectado, aguardando login, retorno concluído, falha.
- **Regras/operações:** não repetir exclusão, rotação, revogação ou desbloqueio sem nova confirmação.
- **Acessibilidade:** anúncio assertivo do estado e foco no caminho de recuperação.
- **Rastreabilidade:** mapa de rotas, estados e acesso, RNF-001.

## 6. Onboarding

### ONB-01 — Resumo dos primeiros passos

- **Tipo:** específico do onboarding. **Prioridade:** essencial para primeiro acesso.
- **Responsabilidade:** organizar as tarefas de preparação sem afirmar bloqueios não contratados.
- **Telas:** T-06.
- **Informações:** etapas, estados derivados, dependências, tarefas pendentes e caminho para operação.
- **Ações:** abrir/revisar etapa, retomar, continuar e ir à visão geral conforme sessão e autorização; não impor prontidão de criação à consulta operacional.
- **Estados:** não iniciado, em andamento, incompleto, etapa com erro, concluído, preparado, consulta indisponível.
- **Regras/operações:** progresso e situação da conta dependem do contrato de leitura. Criação real exige provedor previamente configurado, URL de webhook e autenticação por chave válida em `/v1`. Não exige editar o template nem criar chave especificamente no wizard. Ver [pré-condições](../../dominio/pre-condicoes.md).
- **Acessibilidade:** cada etapa tem nome, estado textual e ação; progresso não depende apenas de indicador visual.
- **Rastreabilidade:** T-06, J-03, RF-019/RF-021, contrato de leitura e matriz de pré-condições.

### ONB-02 — Estado de etapa

- **Tipo:** compartilhado no onboarding. **Prioridade:** essencial para primeiro acesso.
- **Responsabilidade:** representar a situação de cada configuração com semântica comum.
- **Telas:** T-06 e T-10 a T-14.
- **Informações:** não iniciado, em andamento, concluído, erro, revisão necessária, última verificação.
- **Ações:** iniciar, revisar, corrigir, repetir teste quando permitido.
- **Estados:** carregando, disponível, sucesso, erro persistente, indisponibilidade.
- **Regras/operações:** não confundir teste concluído com operação real; configuração anterior permanece em falha de substituição.
- **Acessibilidade:** estado e ação são lidos juntos; mudanças são anunciadas sem mover foco indevidamente.
- **Rastreabilidade:** T-06/T-10–T-14, J-03, estados e acesso.

### ONB-03 — Navegação e retomada de etapa

- **Tipo:** específico. **Prioridade:** essencial para primeiro acesso.
- **Responsabilidade:** permitir pausar, retomar e revisar etapas sem perder configurações salvas.
- **Telas:** T-06.
- **Informações:** etapa atual, etapas visitadas, pendências e destino de retorno.
- **Ações:** continuar, voltar, sair e retomar posteriormente.
- **Estados:** disponível, etapa em execução, erro, sessão expirada, acesso perdido.
- **Regras/operações:** não reexecutar operações concluídas por navegação; comandos devem ser idempotentes conforme contrato.
- **Acessibilidade:** foco e título acompanham a etapa; sequência comunicada textualmente.
- **Rastreabilidade:** T-06, J-03; validação futura da jornada de retomada.

### ONB-04 — Prontidão para operação

- **Tipo:** compartilhado entre onboarding e visão geral. **Prioridade:** essencial para operação.
- **Responsabilidade:** comunicar o que a conta pode fazer agora e o que ainda impede criação real.
- **Telas:** T-06, T-07.
- **Informações:** provedor previamente configurado, conexão atual como indicador separado, webhook cadastrado e condições da operação pretendida.
- **Ações:** abrir correção, continuar para operação, revisar pendência.
- **Estados:** condições pendentes, elegível para a operação pretendida, indisponível, conta em exclusão; a nomenclatura final depende da matriz detalhada.
- **Regras/operações:** o backend avalia a elegibilidade por operação; o componente apresenta as condições pendentes sem tratar a conclusão visual como autorização global. Não declarar sucesso baseado apenas em teste simulado. A [matriz](../../dominio/pre-condicoes.md) consolida as regras existentes; contratos HTTP e lacunas específicas continuam pendentes.
- **Acessibilidade:** comunicar causa e ação corretiva em texto, sem status somente por cor.
- **Rastreabilidade:** T-06/T-07, J-03, RF-001, RF-019, matriz de pré-condições.

## 7. Operação e acompanhamento

### OPS-01 — Resumo operacional

- **Tipo:** específico. **Prioridade:** essencial para operação.
- **Responsabilidade:** orientar a rotina com indicadores e alertas sem virar uma agenda completa.
- **Telas:** T-07.
- **Informações:** prontidão, integração, uso mensal, indicadores e alertas disponíveis.
- **Ações:** abrir lista, detalhe ou correção.
- **Estados:** carregando, com dados, vazio, erro parcial, indisponível.
- **Regras/operações:** consultas agregadas/consumo dependem do contrato de leitura; não inventar métricas ou ações.
- **Acessibilidade:** cada indicador tem nome, valor, período e contexto; alertas são navegáveis.
- **Rastreabilidade:** T-07, J-04, RF-022, contrato de leitura.

### OPS-02 — Lista de agendamentos

- **Tipo:** específico. **Prioridade:** essencial para operação.
- **Responsabilidade:** localizar registros da conta para investigação, sem criar ou editar compromissos.
- **Telas:** T-08.
- **Informações:** `external_id`, contato minimizado, data/hora e fuso gravado, estado, teste, falha e situação de webhook.
- **Ações:** abrir detalhe, buscar/filtrar e paginar quando contratado.
- **Estados:** carregando, com dados, vazia, nenhum resultado, erro, retido/anonimizado.
- **Regras/operações:** listagem depende do contrato de leitura e dos critérios de consulta; respeitar retenção e isolamento.
- **Acessibilidade:** estrutura tabular/listável com cabeçalhos e leitura de estado; filtros têm nomes e resultado anunciado.
- **Rastreabilidade:** T-08, J-04, RF-014, contrato de leitura e critérios de consulta.

### OPS-03 — Busca e filtros de agendamentos

- **Tipo:** específico da lista. **Prioridade:** essencial para operação.
- **Responsabilidade:** reduzir o conjunto consultado sem alterar dados.
- **Telas:** T-08.
- **Informações:** critérios suportados e quantidade/estado do resultado.
- **Ações:** informar busca, aplicar, limpar e repetir.
- **Estados:** vazio, resultado, nenhum resultado, validação, consulta indisponível.
- **Regras/operações:** filtros e limites dependem de critérios de consulta; não prometer filtro sem consulta contratada.
- **Acessibilidade:** cada filtro tem rótulo, valor atual e ação de limpar; nenhum resultado é anunciado.
- **Rastreabilidade:** T-08, RF-014, critérios de consulta.

### OPS-04 — Paginação e carregamento incremental da lista

- **Tipo:** específico da lista. **Prioridade:** complementar/contextual.
- **Responsabilidade:** apresentar conjuntos grandes sem carregar tudo de uma vez, caso o contrato defina isso.
- **Telas:** T-08.
- **Informações:** página/continuação e quantidade quando disponível.
- **Ações:** avançar, voltar ou carregar mais.
- **Estados:** carregando página, disponível, fim, erro de página.
- **Regras/operações:** não inventar paginação; depende do contrato de leitura e dos critérios de consulta.
- **Acessibilidade:** posição e fim do conjunto anunciados; foco não salta de forma inesperada.
- **Rastreabilidade:** T-08, contrato de leitura e critérios de consulta.

### OPS-05 — Detalhe de agendamento

- **Tipo:** específico. **Prioridade:** essencial para operação.
- **Responsabilidade:** permitir compreender um resultado e suas dimensões operacionais.
- **Telas:** T-09.
- **Informações:** projeção pública, `delivery_uncertain`, motivo, teste, histórico e tentativas sanitizadas.
- **Ações:** solicitar redelivery, excluir dados, voltar e corrigir configuração.
- **Estados:** carregando, encontrado, não encontrado/retido, erro, ação em andamento, atualizado.
- **Regras/operações:** `getAppointment`/projeção de painel, `RedeliverWebhook`, `EraseAppointmentData`; sem payload bruto.
- **Acessibilidade:** título identifica o registro sem depender só do external_id; status, ação elegível e conclusão são anunciados.
- **Rastreabilidade:** T-09, J-04/J-05/J-10, RF-013/RF-014/RF-020, CU-012/013.

### OPS-06 — Histórico de eventos e tentativas

- **Tipo:** compartilhado entre detalhe e acompanhamento contextual. **Prioridade:** essencial para operação.
- **Responsabilidade:** explicar a sequência imutável de eventos e tentativas sem confundir resultado com entrega.
- **Telas:** T-09.
- **Informações:** tipo, momento, ator, sequência, motivo, tentativa e resultado sanitizado.
- **Ações:** expandir/ler detalhe permitido; não editar nem reordenar o histórico.
- **Estados:** sem histórico, carregando, disponível, anonimizado, erro.
- **Regras/operações:** histórico somente de inserção; payload apagado na anonimização; consulta detalhada depende da projeção operacional sanitizada.
- **Acessibilidade:** ordem temporal explicitamente informada; cada evento possui nome e estado compreensíveis.
- **Rastreabilidade:** T-09, RF-010/RF-012/RF-014, RN-018/RN-024, projeção operacional sanitizada.

### OPS-07 — Situação de entrega do webhook

- **Tipo:** compartilhado entre detalhe, resumo e integração. **Prioridade:** essencial para operação.
- **Responsabilidade:** separar `delivered`, retentativa, `delivery_failed` e supressão do estado do agendamento.
- **Telas:** T-07, T-09, T-13.
- **Informações:** estado, tentativa atual/histórico, próxima tentativa quando contratada e elegibilidade de redelivery.
- **Ações:** abrir detalhe, redeliver quando elegível.
- **Estados:** pendente, em andamento, entregue, falha de entrega, suprimido, indisponível.
- **Regras/operações:** `RedeliverWebhook`; até seis tentativas automáticas e uma manual isolada; consulta depende da projeção operacional sanitizada.
- **Acessibilidade:** status não depende de cor; mudanças assíncronas e ação disponível são anunciadas.
- **Rastreabilidade:** T-07/T-09/T-13, J-04/J-05, RF-012/RF-013, contrato webhooks e projeção operacional sanitizada.

### OPS-08 — Ações contextuais autorizadas

- **Tipo:** compartilhado. **Prioridade:** essencial para operação.
- **Responsabilidade:** apresentar apenas ações permitidas pelo estado, retenção e autorização atuais.
- **Telas:** T-09, T-12, T-13, T-14, T-15, T-16.
- **Informações:** motivo da disponibilidade/indisponibilidade e efeito esperado.
- **Ações:** redelivery, exclusão de dados, substituição, rotação, revogação, desbloqueio e exclusão da conta conforme contexto.
- **Estados:** disponível, bloqueada por estado, em andamento, concluída, falhou, conta em exclusão.
- **Regras/operações:** elegibilidade é validada no servidor; estado de botão não substitui concorrência/autorização.
- **Acessibilidade:** ação indisponível tem motivo textual; confirmações e resultados são relacionados à ação.
- **Rastreabilidade:** estados e acesso, catálogo T-09/T-12–T-16, RF-013/RF-018/RF-020/RF-023.

## 8. Integrações

### INT-01 — Configuração e teste do provedor WhatsApp

- **Tipo:** compartilhado entre onboarding e integração. **Prioridade:** essencial para operação.
- **Responsabilidade:** coletar credenciais, testar conexão e exibir configuração segura da Evolution API.
- **Telas:** T-06, T-12.
- **Informações:** instância, número, credenciais de entrada/envio durante edição, versão, homologação, estado e última verificação; valores persistidos mascarados.
- **Ações:** informar, testar, salvar, substituir e corrigir.
- **Estados:** não configurado, verificando, operacional, não homologado, falha preservando anterior, desconectado, substituindo.
- **Regras/operações:** `ConfigureProvider`; timeout de 10s; versão `2.3.7` como alvo ainda não homologado; conexão antiga recebe chamadas novas proibidas durante substituição.
- **Acessibilidade:** erros por código e ação corretiva; campos de segredo identificados; resultado do teste anunciado.
- **Rastreabilidade:** T-06/T-12, J-03/J-06, RF-019, CU-016, painel.

### INT-02 — Configuração e rotação de webhook

- **Tipo:** compartilhado entre onboarding e integração. **Prioridade:** essencial para operação.
- **Responsabilidade:** cadastrar destino seguro e iniciar rotação de segredo.
- **Telas:** T-06, T-13.
- **Informações:** URL sanitizada, estado, data de alteração, prefixo e janela de rotação.
- **Ações:** salvar URL, rotacionar segredo, confirmar consequência.
- **Estados:** não configurado, validando, configurado, erro de destino, rotação ativa, indisponível.
- **Regras/operações:** `ConfigureWebhook`, `RotateWebhookSecret`; HTTPS, sem credenciais, destinos locais/privados ou redirecionamentos proibidos; duas assinaturas por 24h.
- **Acessibilidade:** validação da URL associada ao campo; janela de rotação e risco lidos antes da confirmação.
- **Rastreabilidade:** T-06/T-13, J-03/J-07, RF-011–013, contrato de painel/webhooks.

### INT-03 — Teste de webhook

- **Tipo:** específico da integração. **Prioridade:** essencial para operação.
- **Responsabilidade:** testar o receptor sem criar agendamento.
- **Telas:** T-06, T-13.
- **Informações:** exigência de endpoint/segredo, ID do evento e resultado da tentativa.
- **Ações:** disparar, acompanhar e interpretar resultado.
- **Estados:** disponível, testando, aceito, entregue, falhou, configuração ausente.
- **Regras/operações:** `SendWebhookTest` cria `webhook.test`; falha do receptor não comprova integração; status de entrega não é estado de agendamento.
- **Acessibilidade:** resultado e falha comunicados com causa; operação em andamento impede duplicidade.
- **Rastreabilidade:** T-13, J-03/J-04, RF-021, contrato de painel/webhooks.

### INT-04 — Gerenciamento de chaves de API

- **Tipo:** compartilhado entre onboarding e integração. **Prioridade:** essencial para operação.
- **Responsabilidade:** listar metadados, criar chave e revogar credencial.
- **Telas:** T-06, T-14.
- **Informações:** ID, prefixo, data de criação/revogação, segredo somente na criação.
- **Ações:** criar, copiar/reconhecer, revogar e iniciar rotação criando nova chave.
- **Estados:** lista vazia, carregando, criada, revelação, revogada, erro externo, indisponível.
- **Regras/operações:** `CreateApiKey`, `RevokeApiKey`; hash nunca exibido; revogação depende do registro externo e é idempotente.
- **Acessibilidade:** segredo revelado tem instrução de cópia e aviso de irreversibilidade; revogação confirma alvo por prefixo.
- **Rastreabilidade:** T-06/T-14, J-03/J-08, RF-018, CU-017 e contratos de leitura/comandos.

### INT-05 — Revelação única de segredo

- **Tipo:** compartilhado. **Prioridade:** essencial para operação.
- **Responsabilidade:** entregar credencial recém-criada uma única vez e evitar falsa expectativa de recuperação.
- **Telas:** T-06, T-13, T-14.
- **Informações:** valor completo temporariamente, prefixo/identificação, aviso de não recuperação.
- **Ações:** copiar, confirmar armazenamento seguro, fechar sem recuperar depois.
- **Estados:** aguardando revelação, revelado, copiado, fechado, erro.
- **Regras/operações:** `ApiKeyCreated.secret` e `SecretCreated.secret`; nunca consultar novamente; não registrar o segredo em histórico.
- **Acessibilidade:** valor e instrução podem ser lidos sem expor além do necessário; cópia tem feedback textual.
- **Rastreabilidade:** T-13/T-14, J-07/J-08, RF-011/RF-018, painel.

### INT-06 — Editor de template de mensagens

- **Tipo:** compartilhado entre onboarding e configuração. **Prioridade:** essencial para operação.
- **Responsabilidade:** salvar o texto livre da solicitação de confirmação e restaurar o padrão.
- **Telas:** T-06, T-11.
- **Informações:** corpo atual, variáveis permitidas, padrão, instrução fixa separada e efeito da alteração em novos envios.
- **Ações:** editar, salvar, restaurar padrão mediante salvamento.
- **Estados:** carregando, atual, editando, inválido, salvo, indisponível.
- **Regras/operações:** `ConfigureTemplate`; não vazio; variáveis restritas; erro preserva vigente; lembrete não usa template.
- **Acessibilidade:** campo com nome/descrição, erro identifica variável inválida e instrução fixa é diferenciada textualmente.
- **Rastreabilidade:** T-06/T-11, J-03, RF-006/RF-019, RN-008 e contratos de leitura/comandos.

## 9. Segurança e privacidade

### SEC-01 — Confirmação de operação sensível

- **Tipo:** compartilhado. **Prioridade:** essencial para operação.
- **Responsabilidade:** tornar explícitos efeitos irreversíveis ou que alteram credenciais antes de executar.
- **Telas:** T-09, T-13, T-14, T-15, T-16.
- **Informações:** alvo, consequência, reversibilidade, estado atual e operação que será executada.
- **Ações:** confirmar ou cancelar; confirmação não repete comando já aceito.
- **Estados:** aguardando, enviando, aceito, cancelado, falhou, indisponível.
- **Regras/operações:** redelivery, rotação, revogação, exclusão de dados e conta; concorrência é do servidor.
- **Acessibilidade:** foco inicial no título, descrição de consequência, foco retorna ao acionador e resultado é anunciado.
- **Rastreabilidade:** estados e acesso, J-05/J-07/J-08/J-10/J-12.

### SEC-02 — Reautenticação

- **Tipo:** específico de operação sensível. **Prioridade:** complementar/contextual.
- **Responsabilidade:** provar presença recente do usuário antes da exclusão definitiva.
- **Telas:** T-16.
- **Informações:** motivo, método e resultado da reautenticação.
- **Ações:** autenticar novamente, cancelar.
- **Estados:** exigida, em andamento, aprovada, recusada, sessão expirada.
- **Regras/operações:** `DeleteAccount.reauthentication_proof`; falha não altera conta.
- **Acessibilidade:** erro ligado ao campo e instrução de recuperação sem revelar segredo.
- **Rastreabilidade:** T-16, J-12, RF-023, `DeleteAccount`.

### SEC-03 — Exibição mascarada de dados sensíveis

- **Tipo:** compartilhado. **Prioridade:** essencial para operação.
- **Responsabilidade:** mostrar identificadores úteis sem exibir credenciais, segredos ou payloads pessoais indevidamente.
- **Telas:** T-07, T-09, T-12–T-15.
- **Informações:** instância/número mascarados, prefixos, IDs e dados sanitizados.
- **Ações:** copiar somente valores autorizados; abrir detalhe permitido.
- **Estados:** mascarado, revelação única, anonimizado, não disponível.
- **Regras/operações:** painel nunca exibe hash, credencial de provedor, segredo de entrada/webhook ou payload bruto.
- **Acessibilidade:** informar que o valor está mascarado e por quê; não depender de truncamento visual para significar ocultação.
- **Rastreabilidade:** catálogo T-09/T-12–T-15, RNF-002/RNF-003, painel.

### SEC-04 — Consentimento e desbloqueio de contato

- **Tipo:** específico. **Prioridade:** complementar/contextual.
- **Responsabilidade:** consultar bloqueio e registrar consentimento para solicitar desbloqueio sem liberar antes da confirmação externa.
- **Telas:** T-15.
- **Informações:** telefone em formato E.164, estado, método, data do consentimento, pendência e último bloqueio.
- **Ações:** consultar, informar consentimento, solicitar desbloqueio.
- **Estados:** `blocked`, `pending_confirmation`, `unblocked`, `contact_not_blocked`, validação, registro indisponível.
- **Regras/operações:** `UnblockContact`; data não futura nem anterior ao último `PARAR`; novo `PARAR` vence pendência; não reativa falhas.
- **Acessibilidade:** método e data têm rótulos; estado de bloqueio e retenção são comunicados; erro não depende de cor.
- **Rastreabilidade:** T-15, J-09, RF-017/RF-019, RN-019/RN-020 e contratos de leitura/comandos.

### SEC-05 — Exclusão antecipada de dados

- **Tipo:** específico. **Prioridade:** complementar/contextual.
- **Responsabilidade:** solicitar remoção dos dados pessoais de um agendamento sem confundir exclusão com cancelamento.
- **Telas:** T-09.
- **Informações:** external_id no contexto, dados abrangidos, chamada externa em andamento, efeito na consulta e webhook.
- **Ações:** confirmar `EraseAppointmentData`, acompanhar pendência.
- **Estados:** elegível, confirmando, concluído/204, pendente/202, retido, erro.
- **Regras/operações:** não iniciar tentativas novas, encerrar reentregas pendentes, não criar webhook de exclusão, permitir reutilização posterior.
- **Acessibilidade:** consequência e possível chamada já iniciada são lidas antes da confirmação; sucesso assíncrono é anunciado.
- **Rastreabilidade:** T-09, J-10, RF-020, RN-022, contrato painel/OpenAPI.

### SEC-06 — Exclusão definitiva da conta

- **Tipo:** específico. **Prioridade:** complementar/contextual.
- **Responsabilidade:** confirmar e iniciar operação irreversível de remoção da conta.
- **Telas:** T-16.
- **Informações:** conta alvo, consequência, nome esperado, estado `deleting`, aviso de e-mail posterior.
- **Ações:** reautenticar, digitar nome, confirmar, sair.
- **Estados:** disponível, reautenticação, validação, aceito 202, `deleting`, indisponível sem alteração.
- **Regras/operações:** `DeleteAccount`; sem cancelamento/recuperação; erro do registro externo mantém conta ativa; identidade preservada se houver outro vínculo.
- **Acessibilidade:** consequência irreversível é lida antes da ação; campo de confirmação tem instrução exata; estado assíncrono é anunciado.
- **Rastreabilidade:** T-16, J-12, RF-023/RF-024, RN-033, CU-019.

## 10. Estados e feedback

### STATE-01 — Estado de carregamento e operação em andamento

- **Tipo:** compartilhado. **Prioridade:** essencial para primeiro acesso e operação.
- **Responsabilidade:** comunicar consulta/comando em curso e evitar ações duplicadas sem substituir a proteção do servidor.
- **Telas:** T-01 a T-16.
- **Informações:** operação em andamento e escopo afetado.
- **Ações:** aguardar, cancelar apenas quando o contrato permitir, sair com aviso quando necessário.
- **Estados:** carregando, reservando, aguardando confirmação externa, concluído, falhou.
- **Regras/operações:** cobre testes, redelivery, rotação, revogação, desbloqueio e exclusões; não criar estado público de agendamento “tentando”.
- **Acessibilidade:** status anunciado de modo não intrusivo; foco permanece previsível; conclusão/falha tem mensagem textual.
- **Rastreabilidade:** estados e acesso, RNF-005, T-01–T-16.

### STATE-02 — Vazio, nenhum resultado e erro de consulta

- **Tipo:** compartilhado. **Prioridade:** essencial para operação.
- **Responsabilidade:** distinguir ausência de dados, filtro sem resultado e indisponibilidade da consulta.
- **Telas:** T-06 a T-15.
- **Informações:** causa, escopo consultado e ação de recuperação.
- **Ações:** tentar novamente, limpar filtros, configurar recurso ou voltar.
- **Estados:** vazio inicial, nenhum resultado, erro recuperável, indisponibilidade prolongada.
- **Regras/operações:** não criar dado fictício; consultas sem contrato devem ser indicadas como dependência de contrato.
- **Acessibilidade:** título e causa explícitos; ação principal identificável por teclado; anúncio quando o resultado muda.
- **Rastreabilidade:** catálogo T-06–T-15 e estados e acesso; depende dos contratos e critérios de consulta.

### STATE-03 — Validação e erro de comunicação

- **Tipo:** compartilhado. **Prioridade:** essencial para primeiro acesso e operação.
- **Responsabilidade:** relacionar erro ao campo/operação e preservar o estado anterior quando o contrato exigir.
- **Telas:** T-01 a T-16.
- **Informações:** código seguro, mensagem, request_id quando útil e detalhes permitidos.
- **Ações:** corrigir, tentar novamente, consultar suporte/integração conforme o caso.
- **Estados:** erro de campo, conflito, sessão, indisponibilidade externa, rate limit, sucesso parcial.
- **Regras/operações:** envelope `code`, `message`, `request_id`, `details`; não exibir segredos; usar códigos contratados como `validation_error`, `recovery_log_unavailable`, falhas do adaptador e `account_not_configured`.
- **Acessibilidade:** erro associado ao campo e resumo anunciado; texto não depende de cor ou posição.
- **Padrão de feedback:** erro de campo fica junto ao controle; falha recuperável pode usar toast curto; falha que exige consulta posterior usa alerta contextual persistente. Nenhum desses padrões usa barra lateral colorida.
- **Rastreabilidade:** painel, OpenAPI, RF-002/RF-024/RF-025, todos os catálogos.

### STATE-04 — Sucesso, pendência e acesso restrito

- **Tipo:** compartilhado. **Prioridade:** essencial para operação.
- **Responsabilidade:** comunicar resultado efetivo, aceitação assíncrona ou bloqueio de acesso sem prometer conclusão inexistente.
- **Telas:** T-02, T-05, T-06, T-09, T-12–T-16.
- **Informações:** operação, estado final/pending, próximos passos e limitações.
- **Ações:** continuar, acompanhar, corrigir ou retornar.
- **Estados:** sucesso síncrono, aceito/pending, acesso negado, conta em exclusão, termos pendentes.
- **Regras/operações:** 202 não é conclusão; `pending_confirmation` mantém bloqueio; exclusão de conta não pode ser cancelada; acesso deve respeitar sessão/conta.
- **Acessibilidade:** resultado anunciado e associado à operação; restrição informa motivo e caminho permitido.
- **Padrão de feedback:** toast é reservado a resultado breve; alerta contextual permanece na área afetada; confirmação antecede ações irreversíveis; avisos de credencial, bloqueio, exclusão e falha de integração permanecem visíveis até resolução ou reconhecimento.
- **Rastreabilidade:** estados e acesso, J-03/J-05/J-09/J-10/J-11/J-12, RF-017/RF-020/RF-023/RF-024.

## 11. Matriz de utilização por tela

Legenda: **S** compartilhado/reutilizável; **E** específico da experiência; **P** depende de consulta/contrato ainda pendente. Os IDs são os do catálogo de telas e do mapa de rotas. `T-06A` é uma tela introdutória adicional e é coberta especificamente por `WEL-01`; a matriz histórica `T-01`–`T-16` permanece sem renumeração do onboarding.

| Componente | T-01 | T-02 | T-03 | T-04 | T-05 | T-06 | T-07 | T-08 | T-09 | T-10 | T-11 | T-12 | T-13 | T-14 | T-15 | T-16 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NAV-01 |  |  |  |  | S | S | S | S | S | S | S | S | S | S | S | S |
| NAV-02 |  |  |  |  |  | S | S | S | S | S | S | S | S | S | S | S |
| NAV-03 |  |  |  |  |  | S | S | S | S | S | S | S | S | S | S | S |
| NAV-04 |  | S |  |  | S | S |  |  | S |  |  |  |  |  | S | S |
| AUTH-01 | S |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| AUTH-06 | E |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| AUTH-02 |  | E |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| AUTH-03 |  |  | S | S |  |  |  |  |  |  |  |  |  |  |  |  |
| AUTH-04 |  | S |  |  | S |  |  |  |  |  |  |  |  |  |  |  |
| AUTH-05 | S |  |  |  |  | S | S | S | S | S | S | S | S | S | S | S |
| ONB-01 |  |  |  |  |  | E/P |  |  |  |  |  |  |  |  |  |  |
| ONB-02 |  |  |  |  |  | S/P |  |  |  | S | S | S | S | S |  |  |
| ONB-03 |  |  |  |  |  | E |  |  |  |  |  |  |  |  |  |  |
| ONB-04 |  |  |  |  |  | S/P | S/P |  |  |  |  |  |  |  |  |  |
| OPS-01 |  |  |  |  |  |  | E/P |  |  |  |  |  |  |  |  |  |
| OPS-02 |  |  |  |  |  |  |  | E/P |  |  |  |  |  |  |  |  |
| OPS-03 |  |  |  |  |  |  |  | E/P |  |  |  |  |  |  |  |  |
| OPS-04 |  |  |  |  |  |  |  | E/P |  |  |  |  |  |  |  |  |
| OPS-05 |  |  |  |  |  |  |  |  | E/P |  |  |  |  |  |  |  |
| OPS-06 |  |  |  |  |  |  |  |  | E/P |  |  |  |  |  |  |  |
| OPS-07 |  |  |  |  |  |  | S/P |  | S/P |  |  |  | S/P |  |  |  |
| OPS-08 |  |  |  |  |  |  |  |  | S |  |  | S | S | S | S | S |
| INT-01 |  |  |  |  |  | S/P |  |  |  |  |  | E/P |  |  |  |  |
| INT-02 |  |  |  |  |  | S/P |  |  |  |  |  |  | E/P |  |  |  |
| INT-03 |  |  |  |  |  | S/P |  |  |  |  |  |  | E/P |  |  |  |
| INT-04 |  |  |  |  |  | S/P |  |  |  |  |  |  |  | E/P |  |  |
| INT-05 |  |  |  |  |  | S/P |  |  |  |  |  |  | S | S |  |  |
| INT-06 |  |  |  |  |  | S/P |  |  |  |  | E/P |  |  |  |  |  |
| SEC-01 |  |  |  |  |  |  |  |  | S |  |  | S | S | S | S | S |
| SEC-02 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | E |
| SEC-03 |  |  |  |  |  |  | S |  | S |  |  | S | S | S | S |  |
| SEC-04 |  |  |  |  |  |  |  |  |  |  |  |  |  |  | E/P |  |
| SEC-05 |  |  |  |  |  |  |  |  | E |  |  |  |  |  |  |  |
| SEC-06 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | E |
| STATE-01 | S | S | S | S | S | S | S | S | S | S | S | S | S | S | S | S |
| STATE-02 |  |  |  |  |  | S/P | S/P | S/P | S/P | S/P | S/P | S/P | S/P | S/P | S/P | S/P |
| STATE-03 | S | S | S | S | S | S | S | S | S | S | S | S | S | S | S | S |
| STATE-04 |  | S |  |  | S | S |  |  | S |  |  | S | S | S | S | S |

## 12. Dependências, contratos e lacunas

Os componentes dependem de comandos já nomeados no contrato do painel, mas várias consultas e paths HTTP ainda não estão formalizados. Em particular, as telas de estado, progresso, listas, detalhes e lifecycle dependem de um contrato de leitura; os comandos em `/panel` precisam de método, path, envelope de sucesso e erros HTTP; a matriz de pré-condições deve orientar a elegibilidade; as telas de operação precisam de uma projeção sanitizada de tentativas, eventos, entregas e exclusão; e filtros ou paginação só podem ser usados após definição dos critérios de consulta.

Nenhum componente introduz criação de agendamento, gestão de agenda, equipes, billing, troca de conta, administração global ou operação de recuperação. Teste de webhook, simulação `test: true` e teste real continuam experiências distintas, conforme J-03 e RF-021.

## 13. Priorização

### Essencial para primeiro acesso

NAV-01, NAV-03, NAV-04, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, ONB-01, ONB-02, ONB-03, ONB-04, INT-01, INT-02, INT-04, INT-05, INT-06, STATE-01, STATE-03 e STATE-04.

### Essencial para operação

NAV-02, OPS-01, OPS-02, OPS-03, OPS-05, OPS-06, OPS-07, OPS-08, INT-03, SEC-01 e SEC-03.

### Complementar ou contextual

OPS-04, SEC-02, SEC-04, SEC-05 e SEC-06, além dos estados de feedback que aparecem apenas quando a operação correspondente é acionada.

Essa classificação organiza o inventário para as jornadas existentes; não cria prioridade de produto diferente dos requisitos.

## 14. Revisão crítica

O inventário evita duplicações principais: configuração do provedor, webhook, template e chave são os mesmos comportamentos no onboarding e nas telas de integração; status e feedback são transversais; redelivery permanece ação contextual do detalhe; exclusão de dados não vira uma tela própria; teste de webhook permanece dentro da integração. Também evita componentes decorativos ou campos isolados.

As principais dependências não resolvidas são a formalização dos contratos de leitura e comandos HTTP, a projeção operacional sanitizada e os critérios de consulta. A matriz de pré-condições foi consolidada a partir das regras existentes. Não foram tomadas novas decisões visuais ou tecnológicas neste documento.
