# Design visual da landing page do Confirma

> **Status:** especificação visual consolidada para o protótipo.

Este documento é a referência visual da landing. Não altera requisitos, contratos, arquitetura, painel, API, infraestrutura, `prototipo.html` ou [`tokens.json`](../assets/tokens.json).

## 1. Escopo e precedência

A landing possui sete seções: Hero; Benefícios e posicionamento; Como funciona; Automação pelo WhatsApp; Painel de acompanhamento; Integração para desenvolvedores; Confiabilidade e privacidade. A antiga seção final de CTA com formulário foi removida; a última seção transita naturalmente para o footer.

A ordem de precedência é: requisitos e contratos; tokens oficiais; `secoes.md`; `componentes.md`; esta especificação. O site comunica “Solicitar acesso ao piloto”, recebe pedidos por `POST /site/access-requests` e não cria contas diretamente.

## 2. Direção visual

Direção minimalista, compacta, profissional e clara, com identidade verde do Confirma, superfícies claras, hierarquia tipográfica limpa e formulários progressivos. A interface combina naturalidade de conversa com eficiência de formulário.

Evitar mascotes, avatares humanos, indicadores de digitação fictícios, bolhas grandes, microseções decorativas, bordas verticais coloridas, muitos cards aninhados e animações prolongadas. Não simular atendimento humano nem IA generativa.

Usar a paleta somente como referência cromática de [`tokens.json`](../assets/tokens.json). O footer pode usar Noite e logo Branco; o assistente usa superfícies claras e contraste validado.

## 3. Tipografia oficial

| Uso | Família |
| --- | --- |
| Títulos e headlines | Bricolage Grotesque |
| Textos, labels, navegação e componentes | Manrope |
| Código, rotas, eventos, campos e identificadores técnicos | Geist Mono |

No protótipo HTML e na implementação Astro, o carregamento externo das fontes usa Google Fonts com `display=swap` e fallbacks com métricas ajustadas. Em ambos os casos, as famílias aprovadas são Bricolage Grotesque para títulos, Manrope para textos e componentes e Geist Mono para conteúdo técnico. Não manter Manrope + DM Sans, Inter ou Plus Jakarta Sans como especificações concorrentes. A tipografia do painel permanece independente, baseada em IBM Plex Sans e IBM Plex Mono. O carregamento externo permanece identificado para futura revisão de privacidade; isso não constitui aprovação jurídica.

Títulos usam `text-wrap: balance`, sem `<br>` para corrigir largura e sem depender de peso 700/800. Corpo mínimo de 16px; labels e código podem ser menores quando legíveis.

## 4. Layout e componentes

- Container fluido, sem overflow horizontal; conteúdo reflowa em 320px e zoom de 200%.
- Breakpoints de referência: mobile 0–639px; mobile amplo 640–767px; tablet 768–1023px; desktop 1024px ou mais.
- Hero preserva headline, descrição e showcase existentes. O CTA principal “Solicitar acesso ao piloto” abre o assistente.
- Header simplificado, sem CTA destacado de solicitação e sem botões concorrentes.
- Footer preservado, com links aprovados para documentação, painel, termos, privacidade e solicitação quando disponíveis.
- Hover é apenas refinamento; foco visível, active discreto e nenhuma função depende de hover.

## 5. Botão flutuante

O acionador fica fixo no canto inferior direito e aparece somente quando o Hero deixar de estar visível na viewport. Enquanto o Hero está visível, o CTA principal é suficiente.

No desktop, exibe ícone e “Solicitar acesso”, com distância confortável das bordas, hover e foco refinados e sem efeitos chamativos. No mobile, prefere-se apenas o ícone, com nome acessível, área segura respeitada e sem bloquear conteúdo ou controles. Não abre automaticamente e não exibe indicador falso de atendente online.

## 6. Assistente guiado

### Desktop

Painel flutuante não modal, aproximadamente 400px de largura, altura limitada à viewport, cabeçalho fixo, conteúdo rolável, ações acessíveis e possibilidade de fechar e continuar navegando.

### Mobile

Ocupa a tela disponível como diálogo modal, com foco inicial, retorno de foco ao acionador, fechamento por Escape, teclado virtual, scroll, campos confortáveis, controles visíveis e área segura.

### Jornada

1. **Identificação:** saudação integrada, finalidade breve e campos de identificação exigidos pelo contrato.
2. **Contexto do projeto:** empresa/projeto, provedor e uso pretendido. Os rótulos de provedor seguem RF-026: Evolution API, outro ou ainda não tenho.
3. **Revisão e consentimento:** resumo claro e editável, edição dos dados anteriores e consentimento para contato sobre o piloto, respeitando RNF-003.
4. **Resultado:** enviando, solicitação recebida, erro de validação, solicitação rejeitada, falha de comunicação e resultado incerto após timeout, quando aplicável. O sucesso da API é HTTP 202 com resposta uniforme; não indica aprovação nem criação de conta.

Usar mensagens contextuais com campos estruturados e respostas rápidas. Não criar tela de apresentação separada, botão “Começar”, sequência longa de mensagens artificiais, API de chat ou armazenamento de conversas.

## 7. Dados e estados visuais

Preservar sem alteração o payload de `POST /site/access-requests`: `name`, `email`, `company_or_project`, `whatsapp_provider`, `intended_use` opcional, `consent: true`, `form_opened_at` e `website` vazio. Validar tipos, obrigatoriedade e limites do contrato; aparar espaços de textos quando apropriado e não modificar valores estruturados.

`form_opened_at` deve estar relacionado à abertura efetiva do fluxo de coleta, não ser gerado artificialmente somente no envio. Não enviar respostas parcialmente preenchidas.

Ao fechar, preservar respostas apenas em memória enquanto a página permanecer carregada. Não usar `localStorage` ou `sessionStorage`; recarregar reinicia o fluxo. Impedir múltiplos cliques durante o envio. O timeout de 15 segundos é proposta inicial pendente de validação técnica; não realizar retry automático após resultado incerto.

Nunca prometer aprovação ou acesso imediato, nem revelar pedido preexistente, estado de aprovação ou criação de conta.

## 8. Motion e acessibilidade

- Transições curtas de opacidade/transform; sem bounce, pulsação, loop, autoplay, typing indicator ou parallax no assistente.
- `prefers-reduced-motion: reduce` remove deslocamentos e transições não essenciais, preservando conteúdo, foco e função.
- Labels devem estar associados aos campos; erros junto ao campo e anunciados; conclusão anunciada em região apropriada.
- Navegação por teclado, foco visível, Escape, ordem lógica, áreas de toque confortáveis e ausência de dependência de hover.
- Desktop não modal; mobile modal com tratamento de diálogo e retorno de foco.
- Estados usam texto e/ou ícone além de cor. Testar contraste, teclado, leitor de tela, touch, 320px e zoom 200%.

## 9. Fallback e pendências

O `noscript` deve informar que a solicitação requer JavaScript. Isso informa a limitação, mas não constitui alternativa funcional de envio. Não oferecer `contato@useconfirma.com` como canal público.

Permanecem pendentes:

- texto jurídico definitivo do consentimento para contato sobre o piloto, conforme RNF-003;
- tolerância para divergência entre relógios do cliente e servidor em `form_opened_at`;
- validação técnica do timeout inicial de 15 segundos;
- retenção de logs técnicos e redação jurídica final do consentimento;
- disponibilidade pública dos destinos do footer e homologação da integração real.

Não modificar esses contratos ou infraestrutura nesta tarefa.

## 10. Critérios de validação

1. A landing tem sete seções e não contém a antiga seção final com formulário.
2. O CTA do Hero abre o assistente; o botão flutuante só aparece após o Hero.
3. O header permanece sem CTA destacado.
4. A jornada em quatro etapas, revisão editável, consentimento e estados de envio estão documentados.
5. Os campos e rótulos respeitam o contrato e RF-026.
6. As pendências jurídicas, de relógio e de validação técnica do timeout permanecem explícitas; HTTP de sucesso/erro e CORS de produção seguem o contrato do site e DEC-008–010, já consolidados.
7. A tipografia é Bricolage Grotesque, Manrope e Geist Mono.
8. Não há especificação concorrente de formulário final, CTA final ou tipografia anterior.
