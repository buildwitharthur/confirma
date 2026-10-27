# Landing

## Direção visual

Direção minimalista, compacta e profissional. A página usa superfícies claras e a paleta compartilhada em [`../assets/tokens.json`](../assets/tokens.json). Tipografia: Bricolage Grotesque em títulos, Manrope em texto e componentes, Geist Mono em conteúdo técnico. O rodapé pode usar Noite e logo Branco. A landing tem identidade própria e não herda a tipografia do painel.

## Seções e navegação

O protótipo apresenta sete seções, nesta ordem: Hero; Benefícios e posicionamento; Como funciona; Automação pelo WhatsApp; Painel de acompanhamento; Integração para desenvolvedores; Confiabilidade e privacidade. O fluxo geral é API → confirmação por WhatsApp → webhook ao sistema de origem.

O CTA principal do Hero abre o assistente de solicitação de acesso. O botão flutuante aparece somente quando o Hero sai da viewport. O assistente tem quatro etapas: identificação, contexto do projeto, revisão com consentimento e resultado. Header e footer oferecem navegação e links conforme representados no protótipo. A interface atual é uma demonstração local e ainda não envia solicitação à API.

## Estados e responsividade

Fluxo futuro ao conectar a landing: após validação e envio, `POST /site/access-requests` recebe o formulário; para e-mail elegível, o módulo de convites da API cria e envia automaticamente o convite ao endereço informado. Não há triagem manual da equipe nem persistência do pedido. A conta só é criada quando a pessoa aceita o convite. A interface apresenta confirmação genérica de recebimento, sem revelar se já existe conta ou convite e sem afirmar que o e-mail foi entregue. Estados visuais incluem progresso, validação por campo, envio, confirmação, falha de comunicação, resultado incerto e rejeição antispam genérica. Respostas ficam somente em memória durante a página aberta.

Em desktop, o assistente é um painel flutuante não modal. Em telas móveis, ocupa o espaço disponível como diálogo modal, com teclado, foco e áreas seguras considerados. A página reflowa a partir de 320 px e em zoom de 200%; demonstrações e blocos de código podem rolar sem causar overflow da página. Foco visível, operação por teclado e `prefers-reduced-motion` são preservados. O botão flutuante móvel tem rótulo acessível e não cobre controles.
