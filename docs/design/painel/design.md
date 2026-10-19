# Especificação visual e de interação — Painel Confirma

## 1. Introdução e escopo

Este documento define a linguagem visual e os padrões de interação do painel administrativo do Confirma para as 16 telas existentes e a nova tela `T-06A — Boas-vindas`. Ele transforma o planejamento funcional, o catálogo de telas e o inventário de componentes em decisões concretas de apresentação, sem implementar interfaces.

O painel é uma ferramenta B2B para configurar integrações, acompanhar confirmações e investigar falhas. Não cria cadastro público, gestão de agenda, equipes, billing, troca de conta, telas administrativas globais ou operações não documentadas.

O design system do painel é independente da landing page. A única base visual compartilhada é a paleta de [`tokens.json`](../assets/tokens.json). Tipografia, espaçamento, raios, sombras, layout e motion são próprios do painel.

## 2. Referências e princípios

Para comportamento funcional, decisões registradas, requisitos, regras e contratos prevalecem sobre planejamento, catálogo e inventário de componentes. `tokens.json` é referência cromática; este documento orienta apresentação visual. Protótipos não substituem contrato nem homologação. Divergência sem decisão fica pendente; não se escolhe uma fonte silenciosamente.

- **Operacional antes de ornamental:** cada área ajuda a localizar, decidir ou agir.
- **Verde como ação e confiança:** a marca aparece em decisões e estados positivos, não em tudo.
- **Densidade controlada:** informação suficiente para investigar, com agrupamento claro.
- **Segurança visível:** segredos, rotação, reautenticação e exclusões recebem tratamento inequívoco.
- **Estado explicado:** cor, ícone e texto trabalham juntos.
- **Tato seletivo:** profundidade aparece em controles de decisão, não em tabelas e campos.
- **Continuidade:** onboarding e configurações compartilham a mesma linguagem de tarefas.

## 3. Direção visual

### 3.1 Central de operação verde profundo

O painel combina uma base clara e silenciosa para leitura com uma navegação em verde-noite que transmite estabilidade. A característica memorável é a transição entre a sidebar escura e o campo operacional claro: a navegação funciona como posto de controle e o conteúdo permanece leve para longas sessões.

O acabamento é preciso, não decorativo: bordas finas, superfícies com pouca elevação, divisórias discretas, números operacionais legíveis e sinais de estado compactos. Não usar estética de marketing, hero, gradientes amplos ou cartões idênticos para tudo.

### 3.2 Materialidade

- Base: `nevoa`, quase branca, para leitura e páginas extensas.
- Navegação: `noite`, com ativos em `verde-profundo` e `menta`.
- Painéis: `branco`, borda `cinza-verde-claro` e sombra curta derivada de `noite`.
- Ações: `verde` com texto `branco`; hover aproxima-se de `verde-profundo`.
- Atenção/erro: `ambar` e `vermelho` somente para significado.
- Profundidade: base, painel e ação elevada; não empilhar sombras.

### 3.3 Evitados

Não usar template administrativo genérico, dashboard apenas de cards, glassmorphism, neumorphism, fundo escuro total, gradientes decorativos, títulos gigantes, labels em caixa alta por padrão ou microanimações sem função.

## 4. Sistema cromático

Os valores são somente os definidos em `tokens.json`. Transparências são derivações do mesmo token, não novas cores.

| Papel | Token | Uso |
| --- | --- | --- |
| Fundo | `nevoa` `#F3F7F5` | Área geral de trabalho. |
| Sidebar | `noite` `#0B1F1A` | Navegação e estrutura. |
| Header/superfície | `branco` `#FFFFFF` | Contexto, formulários e leitura. |
| Superfície auxiliar | `verde-claro` `#E6F5EE` | Seleção, apoio e prévias. |
| Texto principal | `verde-escuro` `#13302A` | Títulos e dados essenciais. |
| Texto secundário | `cinza-verde-escuro` `#4A5E57` | Descrições e metadados. |
| Texto discreto | `cinza-verde` `#738A82` | Datas e placeholders não essenciais. |
| Ação primária | `verde` `#0A7F50` | Salvar, continuar, testar e criar. |
| Destaque/foco | `menta` `#3DDC97` | Foco e realces pontuais. |
| Ação alternativa | `verde-profundo` `#24443B` | Controles secundários. |
| Divisória | `cinza-verde-claro` `#D5E1DC` | Separação estrutural. |
| Atenção | `ambar` `#F5A524` / `marrom-ambar` `#3A2400` | Pendência, cautela e não homologado. |
| Erro/destrutivo | `vermelho` `#C8262C` / `coral` `#F26B6F` | Falha, validação e exclusão. |
| Desabilitado | `cinza-verde-medio` `#9DB5AC` | Ação indisponível. |
| Selecionado | `verde-claro` + `verde` | Etapa, filtro ou navegação ativa. |

Texto principal usa `verde-escuro` sobre `branco`/`nevoa`; texto sobre `noite` usa `branco` ou `cinza-verde-claro`. `menta` não é texto sobre `branco`. Atenção e erro sempre combinam cor com texto e ícone.

## 5. Tipografia

- **Principal:** IBM Plex Sans, fallback `Arial, sans-serif`; escolhida pela distinção de caracteres e densidade adequada a formulários e tabelas em português.
- **Técnica:** IBM Plex Mono, fallback `ui-monospace, monospace`; somente para chaves, IDs, endpoints, códigos e valores técnicos.

| Papel | Tamanho / line-height | Peso | Uso |
| --- | --- | ---: | --- |
| Título de página | 28 / 34 px | 600 | Nome da tela. |
| Título de seção | 20 / 26 px | 600 | Grupos de configuração. |
| Título de painel | 16 / 22 px | 600 | Superfícies e blocos. |
| Corpo | 14 / 21 px | 400 | Conteúdo e ajuda. |
| Corpo enfatizado | 14 / 21 px | 500 | Valores e instruções. |
| Label | 12 / 16 px | 600 | Campos, em sentence case. |
| Meta | 12 / 17 px | 400 | Datas e última verificação. |
| Dado operacional | 14 / 20 px | 500 | Estados e valores de lista. |
| Código | 12 / 18 px | 500 | IDs e códigos. |
| Botão/navegação | 14 / 20 px / 13 / 20 px | 600 / 500 | Ações e menu. |
| Feedback | 13 / 19 px | 500 | Erros, sucesso e pendências. |

Títulos cabem em duas linhas no notebook; corpo prefere linhas de até 80 caracteres. Não usar itálico ou caixa alta como única hierarquia.

## 6. Layout, grid e espaçamento

- Sidebar desktop: **216 px**; padding interno de 16 px. Pode variar para 208 px em larguras menores, desde que os rótulos permaneçam legíveis.
- Header autenticado: **56 px**, separado por divisória neutra de 1 px.
- Conteúdo autenticado: ocupa toda a largura disponível entre sidebar/drawer e os paddings laterais; não possui `max-width` global.
- Padding horizontal: 32 px desktop, 24 px notebook, 20 px tablet, 16 px mobile.
- Grid: 12 colunas desktop, 8 tablet, 4 mobile; gaps 24/20/16 px.
- Limites internos: formulários até 720 px, texto corrido até 72ch, diálogos até 560 px e áreas sensíveis até 720 px. Esses limites não devem ser aplicados ao container da página.
- Tabelas, listas operacionais, dashboards e grids podem ocupar toda a largura útil entre os paddings, com colunas e gaps que preservem leitura.
- Formulários em duas colunas só permanecem em duas colunas quando cada campo conserva no mínimo 240 px úteis e a área do formulário tem ao menos 520 px; caso contrário, usar uma coluna.
- Tabela: largura útil total, com ação preservada e rolagem controlada em mobile.

Escala única: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64` px. Use 4–8 para relações próximas, 12–16 entre controles, 20–24 em grupos, 32 entre seções e 40–64 em mudanças de contexto. Não introduzir valores intermediários arbitrários.

Raios: 8 px em campos/controles, 12 px em painéis, 16 px em destaques de onboarding, 999 px somente para estados compactos. Bordas de 1 px `cinza-verde-claro`.

## 7. Navegação e estrutura global

### Sidebar

Usar `noite` e quatro grupos: Operação (Visão geral, Agendamentos), Preparação (Primeiros passos), Integrações (WhatsApp, Webhook e testes, Chaves de API) e Configurações (Conta, Mensagens, Privacidade). A conta fica no topo; saída e sessão no final. Não oferecer troca de conta. Exclusão não é item primário.

O ativo usa `verde-claro` de modo sutil, texto `branco`/`menta` e ícone coerente; não depende de uma barra lateral espessa. Grupos expansíveis não podem esconder a rota atual. A conta é uma identificação compacta, não um card destacado. Badges só aparecem quando comunicam pendência ou erro acionável. Em tablet/mobile, a sidebar vira drawer controlado pelo usuário, com foco, Escape e área de toque preservados.

### Header

Tem 56 px no desktop, com título/contexto, breadcrumbs discretos e ação principal quando houver. Em detalhe, mostra retorno e identificação do registro; em configuração, estado atual ou última verificação. Não repetir o nome da conta em todos os níveis. No mobile, pode reduzir a quantidade de ancestrais, mas preserva o retorno à tela anterior sem overflow.

Breadcrumbs usam 12/17 px, separador sutil e baixo espaçamento. O item atual tem maior contraste e não é link; ancestrais são navegáveis. Truncar nomes longos com nome acessível completo. O breadcrumb localiza; o título nomeia a tela; a descrição orienta; a ação executa — não repetir a mesma informação nos quatro elementos.

### Área de conteúdo

Toda página começa com título, orientação de uma linha e ação primária quando houver. O container autenticado é fluido e não centraliza artificialmente páginas largas. Configurações e textos aplicam seus limites internos; tabelas, listas, dashboards e grids aproveitam a largura útil. Configurações priorizam estado atual e edição; operação prioriza localização e investigação. Não usar a mesma composição rígida em todas as telas.

## 8. Superfícies e elevação

1. **Base:** `nevoa`, sem sombra.
2. **Painel:** `branco`, borda neutra de `cinza-verde-claro`, raio de 12 px e sombra curta opcional derivada de `noite` a 8–12% de opacidade.
3. **Ação elevada:** controle interativo ou confirmação, com elevação curta apenas quando isso explica a ação.

Referência: sombra de 0 4px 12px para painéis e 0 2px 5px para controles. Não usar sombra em cada linha de tabela ou gradiente em grandes superfícies. Estados de sucesso, atenção e erro não recebem borda colorida, barra lateral ou sombra adicional apenas por sua semântica; usam ícone, título, texto e background suavemente diferenciado quando necessário. A exceção de maior profundidade fica limitada a credenciais recém-reveladas, controles interativos e áreas técnicas.

## 9. Skeuomorphism seletivo

A direção é **skeuomorphism seletivo e contemporâneo**, sujeito à validação no protótipo. Ele reforça ação, pressão e confirmação, não simula um dispositivo físico.

- Botão primário: iluminação superior discreta, borda de 1 px e sombra inferior curta; pressionado reduz elevação e usa sombra interna.
- Seletor de etapa e controles de teste: superfície elevada discreta; ativo parece encaixado.
- Revelação de segredo: profundidade ligeiramente maior para sinalizar momento sensível.
- Tabelas, textos longos, campos comuns e sidebar: aparência plana.
- Microtextura não aparece na base e, se validada, só existe em superfície de destaque quase imperceptível.
- Não misturar skeuomorphism com glassmorphism ou neumorphism.

Transições táteis: 160–220 ms. Pressão não desloca conteúdo nem o foco.

## 10. Linguagem de componentes

### Ações

| Tipo | Linguagem | Uso |
| --- | --- | --- |
| Primária | `verde` + texto `branco`, elevação leve | Salvar, continuar, testar, criar; uma por contexto. |
| Secundária | `branco`/`verde-claro`, borda `verde-profundo` | Voltar, revisar, abrir configuração. |
| Discreta | Texto `verde`, sem superfície elevada | Copiar, limpar filtro, ver histórico. |
| Destrutiva | `vermelho` + texto `branco` após confirmação | Excluir dados/conta; revogar tem confirmação. |
| Desabilitada | Contraste reduzido e sem sombra | Em andamento ou sem elegibilidade; explicar causa. |

Escala visual: `small` 34 px para ações contextuais, `default` 38 px para ações de formulário e `large` 42 px somente para a ação principal de uma composição acolhedora ou de alta prioridade. Padding horizontal de 12/16/20 px conforme a escala. Todos têm disponível, hover, pressionado, foco, desabilitado e processamento. Hover nunca é a única indicação. A área interativa deve atingir 44 × 44 px quando necessária, especialmente em mobile, mesmo que a superfície visual seja menor.

### Formulários

Labels ficam acima e sempre visíveis. A ordem estrutural é **label → controle → ajuda → erro**. Texto auxiliar não deve ficar entre label e controle quando desalinha campos da mesma linha; instruções longas vão abaixo do controle, antes do erro, ou antes do grupo quando forem compartilhadas. Erros usam associação semântica, texto e orientação de correção; a borda vermelha é um apoio, não a única indicação. Segredos são mascarados; valores persistidos nunca reaparecem. O template informa variáveis permitidas e separa a instrução fixa. Salvar mostra processamento no próprio controle e preserva o valor anterior em falha.

Em uma linha de formulário, labels e controles começam no mesmo eixo vertical. Cada coluna usa largura mínima de 240 px, gap horizontal de 16 px e gap vertical de 16 px; mensagens podem crescer naturalmente sem altura fixa. Em mobile ou quando a largura útil for insuficiente, os campos empilham. Placeholders são curtos e exemplificam formato sem substituir o label: `Ex.: minha-instancia`, `Ex.: +5511900000000`, `https://seusistema.com/webhooks/confirma`, `Ex.: Clínica Exemplo`, `nome@empresa.com` e `Informe o segredo`, sempre validados contra o contrato real. Campos de segredo nunca exibem valor sensível como placeholder.

Inputs, selects e controles equivalentes usam altura visual de 40 px no desktop, com raio de 8 px, padding horizontal de 12 px e borda neutra de 1 px. Textarea cresce conforme o conteúdo e não usa sombra interna profunda. Em mobile, a altura visual pode ser 44 px para preservar conforto touch. Estados `focus`, `disabled`, `readonly`, ajuda e erro são distintos e textuais; o focus usa `menta` sem introduzir cor fora dos tokens. Todos os campos editáveis com placeholder aplicável recebem exemplo de formato, inclusive autenticação, convite, recuperação, onboarding, integrações, configurações, templates, privacidade e operações sensíveis.

### Tabelas e informações

Cabeçalhos: 12/16 px, peso 600, sentence case. Dados: 14/20 px; IDs em IBM Plex Mono. Prioridade: estado, identificador, data/hora, falha e ação. O detalhe concentra informação técnica. Linhas não recebem cards ou sombra. Estado de confirmação e entrega de webhook aparecem separados. Filtros, ordenação e paginação só após os critérios de consulta serem definidos no contrato do painel.

### Feedback

Feedback combina título, ícone e explicação e responde: o que aconteceu, o que significa e qual ação existe. A semântica não depende somente de cor.

- **Toast:** resultado breve de uma ação concluída ou falha recuperável, sem conteúdo que precise ser consultado depois. É neutro, compacto, com ícone contextual, título, descrição opcional, fechar acessível e sombra suave; entra e sai sem barra lateral colorida. Duração padrão de 4 s para sucesso informativo; erro, ação sensível ou conteúdo com ação explícita permanece até leitura/fechamento.
- **Alerta contextual:** informação persistente dentro da área afetada quando muda a decisão, a prontidão ou a segurança. Usa superfície neutra ou background suavemente semântico, título, texto e ação contextual; não usa contorno colorido como decoração.
- **Erro junto ao campo:** somente para validação ou correção local. Fica associado ao controle e não é substituído por toast.
- **Confirmação:** antes de rotação, revogação, reenvio, exclusão ou outra ação com consequência relevante; explicita alvo, efeito e reversibilidade.
- **Aviso persistente:** para risco de bloqueio, credenciais, exclusão, falha de integração ou operação pendente. Permanece até resolver, reconhecer ou mudar de estado. Deve ser claramente identificável por hierarquia, texto e iconografia.

Toasts não substituem alertas persistentes nem registram informação necessária para investigação posterior. Estados críticos mantêm a informação na tela de origem mesmo que também emitam um toast.

## 11. Autenticação

### Layout compartilhado — fonte visual de verdade

T-01 a T-05 usam o mesmo layout externo implementado em `authLayout` no protótipo. O agrupamento visual é de autenticação/entrada: inclui login, convite, recuperação, redefinição e aceite de termos pendentes. Ele não é aplicado às páginas autenticadas do painel e não substitui o layout separado de `/boas-vindas`.

- **Estrutura:** página de altura mínima da viewport, com duas colunas no desktop. A área principal contém marca, conteúdo da rota e rodapé demonstrativo; a área complementar é opcional e não recebe navegação operacional.
- **Background e identidade:** fundo `nevoa`; logo Confirma em `verde-escuro`, com altura de 36 px na área principal. A marca é o mesmo SVG usado no login e permanece alinhada ao início do formulário.
- **Container:** conteúdo principal fluido até 440 px; padding vertical 64/48 px e horizontal 24 px no desktop. A coluna complementar usa superfície `verde-claro`, divisória estrutural de 1 px e container interno de 420 px. O login usa até 500 px para o showcase.
- **Alinhamento e espaçamento:** conteúdo centralizado verticalmente; marca, formulário e rodapé formam uma pilha com gaps de 24/32 px. Campos usam a escala compacta do painel; o CTA principal do login usa 42 px de altura.
- **Superfícies e decoração:** cards brancos com bordas discretas e raios do sistema. Só o showcase do login recebe iluminação radial suave e sobreposições conceituais; não adicionar gradientes, bordas coloridas ou métricas de landing.
- **Tipografia:** IBM Plex Sans para interface e IBM Plex Mono apenas para valores técnicos. A hierarquia existente do painel permanece; não usar a tipografia da landing.
- **Variação por rota:** somente o conteúdo funcional muda. O login pode preencher a coluna complementar com o showcase; convite, recuperação, redefinição e termos podem usar a coluna única ou informação complementar, sem criar outra moldura externa.
- **Responsividade:** em notebook o showcase reduz para 360–460 px antes de comprimir o formulário; em tablet a coluna complementar é ocultada e a autenticação vira uma coluna; em mobile mantém uma coluna, padding de 16 px e CTA/controles com área mínima de toque de 44 px. Não permitir overflow horizontal.

O detalhamento dos primitivos usados nessa composição está em [componentes.md](componentes.md), especialmente Button, Field, Checkbox, Tabs, Panel, Alert, Toast, Dialog, Skeleton e Spinner. A regra é composição: o layout fornece estrutura visual; cada componente funcional mantém a lógica do fluxo.

### Showcase do login

No desktop amplo, a autenticação usa duas colunas de proporção aproximada 1:1. A coluna do formulário mantém largura útil de 400–440 px; a coluna direita centraliza um showcase com largura recomendada de 420–520 px e limite de 560 px, alinhado verticalmente ao conjunto do login. O showcase não é uma landing page: é um frame principal de interface, com elementos de acompanhamento de confirmações e uma sequência visual curta de agendamento → mensagem → resultado. Pode usar uma ou duas sobreposições discretas para indicar relação entre estados, sem inventar métricas, dados reais, funcionalidades ou marcas de terceiros.

O frame usa superfícies do painel, profundidade controlada e pouco texto complementar. Estados demonstrativos devem ser conceituais, estáticos ou derivados de dados fictícios explicitamente demonstrativos; não representam consumo, desempenho ou disponibilidade real. O showcase é subordinado ao formulário: não recebe CTA, não altera métodos de autenticação, não captura foco e não compete com erros ou mensagens de acesso.

Em notebook, reduzir o showcase para uma composição de 360–460 px e diminuir seus elementos secundários antes de comprimir o formulário. Em tablet, o showcase pode ocupar uma faixa superior ou ser ocultado quando a largura útil não comportar as duas colunas. Em mobile, ocultar a demonstração e manter o login em uma coluna, com o mesmo fluxo, campos, mensagens e foco. A proporção nunca deve produzir overflow horizontal ou empurrar a ação principal para fora da primeira área útil.

- Entrar: e-mail e senha como método do beta; recuperação e convite como ações secundárias. Google e link mágico ficam fora do beta.
- Convite: e-mail convidado e nome sugerido antes do formulário; aceite desmarcado e visível.
- Recuperação: confirmação sem informar existência de conta.
- Redefinição: foco no novo segredo e prazo do link.
- Termos: documentos, consequência do bloqueio e ações permitidas; exclusão separada.
- Erros próximos ao campo/ação e resumo no topo quando houver vários.
- Mobile: uma coluna, 16 px laterais, sem painel auxiliar que empurre o formulário.

## 12. Boas-vindas e primeiro acesso

`/boas-vindas` é uma introdução autenticada, minimalista e não substitui `/primeiros-passos`. Sua composição definitiva contém somente: identificação discreta da marca; uma demonstração visual central de uma confirmação; título curto; descrição de uma ou duas frases; e um único CTA primário **Começar configuração**, que leva a `/primeiros-passos`. A demonstração pode ser uma mini interface conceitual de agendamento, mensagem e resultado, construída com elementos de UI e sem imagem gerada.

A composição é centralizada, com bastante espaço negativo, superfícies discretas e sem cards informativos, listas de benefícios, resumo detalhado de etapas ou ações secundárias concorrentes. A demonstração comunica início da experiência, não explica integralmente o produto nem cria uma nova etapa de onboarding. Em telas estreitas, reduzir a demonstração mantendo sua leitura ou ocultá-la antes de reduzir o CTA e a descrição a uma composição apertada.

Após `AcceptInvitation` abrir a sessão, a entrada proposta é `/boas-vindas`; a página não cria nova regra de autenticação, prontidão ou backend. Não há marcador persistente próprio, cookie exclusivo ou endpoint para registrar visualização. Se o usuário já iniciou a configuração, a navegação deve seguir diretamente para `/primeiros-passos` ou para a rota pretendida, sem criar uma nova condição de acesso. Sessão expirada segue o fluxo comum de login e não repete operação sensível.

## 13. Onboarding — prioridade máxima

T-06 usa duas áreas em desktop: trilha de etapas à esquerda e configuração no centro, com ajuda contextual opcional à direita. Em notebook, a ajuda recolhe; em mobile, a trilha vira cabeçalho compacto com etapa atual e consulta das etapas anteriores.

Sequência visual: conta → WhatsApp → webhook → template → chave de API → testes → operação. Marcar o que foi salvo, o que exige correção e o que é recomendação. Criação real exige provedor previamente configurado e URL de webhook; desconexão posterior não impede aceite. Toda chamada `/v1`, real ou simulada, exige chave válida, independentemente de onde ela foi criada. Editar o template, concluir teste ou terminar o wizard não são bloqueios globais de consulta. Ver [matriz de pré-condições](../../dominio/pre-condicoes.md).

- **Conta:** nome, fuso, antecedência e janela; avisar que mudanças valem para novos agendamentos.
- **WhatsApp:** teste antes de salvar, versão e homologação; preservar configuração anterior em falha.
- **Webhook:** URL, validação, rotação e teste isolado; separar receptor de teste de agendamento.
- **Template:** editor com variáveis, padrão restaurável e prévia textual sem dados reais.
- **Chave:** criação com revelação única, cópia e confirmação de armazenamento.
- **Testes:** conexão, webhook, simulação `test: true` e teste real, com efeitos diferentes.

Sair preserva etapas salvas e identifica a etapa com erro. Voltar não desfaz configuração. Ao retornar, carregar estados atuais antes de nova ação. Operação externa em andamento impede clique duplicado e informa que aguarda conclusão.

## 14. Visão geral

T-07 é orientada a decisão, não uma grade de números. Ordem: (1) estado operacional e elegibilidade da operação em foco; (2) pendência mais importante; (3) integrações; (4) informações operacionais documentadas; (5) alertas e investigação somente se houver dados/contratos. Usar poucos painéis assimétricos. Não criar gráficos, metas ou métricas sem contrato.

## 15. Agendamentos e investigação

### Lista

T-08 usa área operacional larga. Cabeçalho contém título, busca e filtros somente quando os critérios de consulta forem definidos no contrato do painel. A tabela prioriza identificador, horário/fuso gravado, estado da confirmação, falha e entrega de webhook. Ação primária é abrir detalhe; ações destrutivas não aparecem na linha.

Vazio diferencia “a conta ainda não possui registros” de “nenhum resultado para o filtro”. Em mobile, preservar estado e data antes de campos secundários; detalhes técnicos ficam no detalhe.

### Detalhe

T-09 organiza: (1) cabeçalho com estado, identificador, data/hora e ações; (2) resumo e situação separada do webhook; (3) histórico, tentativas e privacidade. `delivery_uncertain` é indicador explicativo, não novo estado. Redelivery é recuperação contextual; exclusão fica isolada.

## 16. Integrações e configurações

T-10 a T-15 seguem o padrão: estado atual primeiro, edição depois, ajuda próxima ao campo, ação de salvar no fim do grupo e feedback contextual. Configuração salva é visualmente distinta de formulário em edição.

- WhatsApp: conexão, última verificação, versão e homologação acima dos campos.
- Webhook: URL, teste e rotação separados; segredo novo em revelação única.
- Chaves: prefixos/datas; criação e revogação com riscos distintos.
- Mensagens: editor com variáveis e instrução fixa explicadas.
- Conta: valores atuais e efeito somente em novos agendamentos.
- Privacidade: consulta mínima de telefone, estado e consentimento.
- Exclusão: composição de risco, reautenticação e confirmação; não usar aparência de configuração comum.

## 17. Estados de interface

| Estado | Aparência e comportamento | Mensagem mínima |
| --- | --- | --- |
| Loading | Preserva a estrutura, indicador no contexto | O que está carregando. |
| Vazio | Superfície simples, ação de começo quando existir | O que ainda não existe. |
| Nenhum resultado | Mantém filtros e limpar | Nenhum registro corresponde ao filtro. |
| Validação | Borda `vermelho`, erro junto ao campo e resumo se necessário | O que corrigir. |
| Falha de comunicação | Preserva valor anterior e oferece nova tentativa | O que não foi salvo/consultado. |
| Indisponibilidade | Área de atenção para dependência externa | Qual condição impede a ação. |
| Sessão expirada | Bloqueia operação e leva ao login | A ação não foi repetida. |
| Incompleta | `ambar`, causa e ação corretiva | O que falta. |
| Operacional | `verde`, estado e data | O que funciona e quando. |
| Concluída | Feedback persistente para ação sensível | O efeito concluído. |
| Destrutiva | Área separada, `vermelho`, consequência e confirmação | O que será removido e reversibilidade. |

Nenhum estado depende apenas de cor ou ícone.

## 18. Motion e microinterações

Motion responde à ação e explica mudança de estado. Não usar animação decorativa contínua.

| Interação | Duração | Regra |
| --- | ---: | --- |
| Foco/hover | 120–160 ms | Mudar borda/superfície sem deslocar layout. |
| Pressionar controle | 160 ms | Reduzir elevação, sem mover foco. |
| Troca de conteúdo | 180 ms | Fade e deslocamento máximo de 4 px. |
| Sidebar/grupo | 180 ms | Expansão vertical previsível. |
| Etapa de onboarding | 220 ms | Trocar conteúdo e atualizar trilha. |
| Loading | ciclo 1000–1400 ms | Parar ao concluir; sem ciclo em reduced motion. |
| Feedback | 180–240 ms | Entrar no contexto, sem bounce. |
| Confirmação | 180 ms | Foco no título e retorno ao acionador. |

`prefers-reduced-motion` remove deslocamentos, ciclos e efeitos de pressão, mantendo estados, foco e feedback textual. Motion mobile não bloqueia rolagem ou teclado.

Showcases podem usar microanimação funcional curta, como avanço de um estado de mensagem para resultado, com duração entre 600–1200 ms, no máximo uma repetição após entrada na tela e sem loop contínuo. A animação não deve mover o formulário, roubar foco ou simular atividade operacional real. Na página de boas-vindas, uma entrada suave da demonstração é suficiente; não animar múltiplos elementos em sequência. `prefers-reduced-motion` transforma essas demonstrações em estado estático.

## 19. Responsividade

- **Desktop amplo, ≥1440 px:** sidebar fixa de 216 px, conteúdo autenticado fluido entre paddings de 32 px, 12 colunas; tabelas, dashboards e grids podem expandir.
- **Notebook, 1024–1439 px:** sidebar fixa, 24 px laterais, showcase do login reduzido, ajuda recolhida; páginas largas continuam fluidas.
- **Tablet, 768–1023 px:** sidebar como drawer, header com título/ação, 8 colunas, conteúdo com 20 px laterais; showcase pode virar faixa ou ser ocultado.
- **Mobile, <768 px:** drawer, header compacto, 4 colunas, 16 px laterais; showcase do login oculto, páginas e formulários em uma coluna.

Autenticação vira uma coluna. Onboarding compacta a trilha e mantém ajuda recolhível. Visão geral empilha por prioridade. Tabelas usam rolagem horizontal controlada ou redução comprovada de colunas; não transformar automaticamente cada linha em card. Detalhe e configurações empilham blocos; ações sensíveis permanecem separadas.

## 20. Acessibilidade

Usar WCAG 2.2 AA como referência; conformidade só pode ser declarada após validação real.

- Verificar contraste de texto, controles, foco e estados com os tokens definidos.
- Foco visível com anel de `menta`, distinguível sobre `noite` e `branco`.
- Todo campo tem label; ajuda e erro ficam associados ao campo.
- Teclado cobre sidebar, menus, filtros, tabela, histórico, confirmação, cópia e revelação.
- Ordem de leitura: contexto, estado, dados, ação e consequência.
- Tabelas têm cabeçalhos e relação célula/coluna; mobile mantém contexto.
- Feedback assíncrono é anunciado sem roubar foco.
- Estados usam texto/ícone além de cor.
- Alvos touch têm pelo menos 44 × 44 px.
- Zoom de 200% mantém ação principal; 400% não oculta campos essenciais.
- Confirmadores prendem foco enquanto abertos, devolvem foco ao acionador e permitem Escape antes da confirmação.
- Segredos não são lidos em voz alta sem ação explícita; revelação orienta armazenamento seguro.
- Movimento reduzido remove transições não essenciais.

## 21. Matriz visual por tela

| ID / rota | Layout e objetivo visual | Componentes principais | Interações | Responsividade | Estados | Pendências |
| --- | --- | --- | --- | --- | --- | --- |
| T-01 `/entrar` | Formulário seguro com showcase conceitual subordinado | AUTH-01, AUTH-06, STATE-01/03 | Entrar, recuperar | Duas colunas no desktop; showcase reduzido/oculto em telas menores | erro, bloqueio, indisponibilidade | — |
| T-02 `/convite#token` | Formulário contextualizado ao convite | AUTH-02/04, STATE-* | Inspecionar e aceitar | Aceite sempre visível | token, senha, termos, sucesso | — |
| T-03 `/recuperar-acesso` | Jornada curta sem enumeração | AUTH-03, STATE-01/03 | Solicitar link | Uma coluna | resposta uniforme, erro | contrato `/auth` |
| T-04 `/redefinir-senha#token` | Nova senha com prazo claro | AUTH-03, STATE-01/03 | Salvar senha | Uma coluna | token, validação | contrato `/auth` |
| T-05 `/termos/aceite` | Leitura e decisão | AUTH-04/05, SEC-01, STATE-04 | Aceitar, sair, excluir | Documento rolável; ações acessíveis | pendente, aceito, erro | — |
| T-06A `/boas-vindas` | Introdução minimalista com demonstração central | NAV-01/04, WEL-01, STATE-01/04 | Uma única ação: começar configuração | Composição centralizada; demo reduzida/oculta quando necessário | primeiro acesso, retomada, sessão expirada | — |
| T-06 `/primeiros-passos` | Trilha e configuração orientada | ONB-01–04, INT-01/02/04/05/06 | Retomar, revisar, testar, salvar | Trilha compacta e ajuda recolhível | incompleto, erro, elegibilidade por operação, pending | contrato de leitura e matriz de pré-condições |
| T-07 `/visao-geral` | Resumo para decisão | OPS-01/07, ONB-04, STATE-02/04 | Corrigir e investigar | Painéis empilhados | vazio, erro parcial, alerta | contrato de leitura |
| T-08 `/agendamentos` | Lista densa para localização | OPS-02–04, STATE-02/03 | Buscar, filtrar, abrir | Tabela com estratégia mobile | vazio, filtro, erro | contrato de leitura e critérios de consulta |
| T-09 `/agendamentos/:external_id` | Investigação e ações separadas | OPS-05–08, SEC-01/03/05 | Redeliver, excluir | Blocos empilhados | falha, pending, retenção | projeção operacional sanitizada |
| T-10 `/configuracoes/conta` | Formulário temporalmente explícito | ONB-02, STATE-* | Editar e salvar | Uma coluna | inválido, salvo | contratos de leitura e comandos |
| T-11 `/configuracoes/mensagens` | Editor técnico legível | ONB-02, INT-06, STATE-* | Salvar/restaurar | Textarea fluida | inválido, salvo | contratos de leitura e comandos |
| T-12 `/integracoes/whatsapp` | Estado antes da edição | ONB-02, INT-01, SEC-03 | Testar, salvar, substituir | Formulário empilhado | verificando, falha, não homologado | contratos do painel e homologação da Evolution API |
| T-13 `/integracoes/webhook` | Destino, teste e rotação distintos | INT-02/03/05, OPS-07, SEC-01/03 | Configurar, testar, rotacionar | Áreas empilhadas | testando, entregue, falha | contratos de leitura e comandos |
| T-14 `/integracoes/chaves-api` | Lista e criação protegida | INT-04/05, SEC-01/03 | Criar, copiar, revogar | Lista com rolagem controlada | vazia, revelação, revogada | contratos de leitura e comandos |
| T-15 `/privacidade` | Consulta mínima e consentimento | SEC-03/04, STATE-* | Consultar, desbloquear | Formulário curto | bloqueado, pending, liberado | contratos de leitura e comandos |
| T-16 `/configuracoes/excluir-conta` | Risco, reautenticação, confirmação | SEC-01/02/06, STATE-04 | Reautenticar e excluir | Uma coluna | erro, 202, deleting | comandos do painel e projeção operacional sanitizada |

## 22. Critérios de validação visual

- As 16 telas existentes e a `T-06A` têm composição definida, sem alterar as etapas do onboarding.
- A sidebar verde-noite e o campo claro distinguem navegação de trabalho sem criar dois produtos.
- A paleta usa somente tokens oficiais e os estados têm texto além de cor.
- A tipografia mantém leitura de tabela, formulário, código e mensagens em português.
- Grid e espaçamento não introduzem valores arbitrários.
- Ações primárias, secundárias, discretas e destrutivas são reconhecíveis pela consequência e pela escala contextual.
- Cards e feedback não usam barras laterais ou contornos coloridos decorativos; avisos críticos permanecem persistentes e identificáveis.
- Campos de uma mesma linha alinham controles, possuem placeholders aplicáveis e empilham quando a largura mínima não é atendida.
- `/boas-vindas` introduz a jornada sem duplicar o wizard de `/primeiros-passos`.
- O login mantém o formulário como foco e usa o showcase apenas como demonstração conceitual; em mobile ele pode desaparecer sem perda funcional.
- A página de boas-vindas contém uma única ação principal e não repete conteúdo detalhado do onboarding.
- O container autenticado ocupa a largura disponível; limites existem somente nos conteúdos que precisam de leitura ou interação concentrada.
- Onboarding comunica progresso, retomada, dependências e modalidades de teste.
- Lista e detalhe separam confirmação, webhook, histórico e ações sensíveis.
- Segredos aparecem uma vez; valores persistidos permanecem mascarados.
- Loading, vazio, filtro sem resultado, erro, indisponibilidade, sucesso e pending têm mensagem e recuperação.
- Mobile reorganiza sem esconder estados ou ações essenciais.
- Teclado, foco, zoom, leitor de tela e reduced motion têm critérios verificáveis.
- Nenhuma pendência de contrato é apresentada como capacidade disponível.

## 23. Pendências de aprovação

- A matriz de pré-condições consolida as condições deriváveis; transporte, provisionamento e precedência ainda precisam ser formalizados nas fontes correspondentes.
- Consultas, projeções sanitizadas e endpoints HTTP do painel continuam dependentes de contratos executáveis.
- Filtros, ordenação e paginação da lista dependem de critérios de consulta aprovados.
- A interface deve comunicar o risco da versão não homologada da Evolution API.
- **Direção tátil:** validar no protótipo se o skeuomorphism seletivo melhora a percepção sem reduzir densidade, contraste ou velocidade.

Este documento não cria protótipo, não altera o planejamento funcional e não substitui validação visual, de acessibilidade ou de usabilidade.
