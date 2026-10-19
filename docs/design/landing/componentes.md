# Componentes da landing page

> **Status:** inventário consolidado para o protótipo do assistente guiado.

Este documento define os componentes da landing descrita em [`secoes.md`](secoes.md). A landing tem sete seções, footer e um fluxo de acesso ao beta separado da narrativa editorial. O pedido usa exclusivamente `POST /site/access-requests`; não há API de chat, armazenamento de conversas ou IA generativa.

## 1. Inventário geral

| Componente | Categoria | Uso | Responsabilidade | Estado |
| --- | --- | --- | --- | --- |
| Header e navegação | Estrutural | Global | Marca, âncoras, documentação e painel; sem CTA destacado | Aprovado |
| Ação do Hero | Conversão | Hero | Abrir o assistente com “Solicitar acesso ao piloto” | Aprovado |
| Botão flutuante | Conversão | Após o Hero | Reabrir o assistente quando o Hero não estiver visível | Aprovado |
| Painel do assistente | Conversacional | Hero, botão flutuante e links aprovados | Conduzir coleta progressiva, sem IA generativa | Aprovado |
| Etapas de coleta | Conversacional | Painel | Identificação, contexto, revisão/consentimento e resultado | Aprovado |
| Campos e respostas rápidas | Conversacional | Etapas 1 e 2 | Coletar somente os campos autorizados pelo contrato | Aprovado |
| Resumo editável | Conversacional | Etapa 3 | Revisar e editar respostas antes do envio | Aprovado |
| Consentimento | Conversacional | Etapa 3 | Registrar consentimento conforme RNF-003; texto jurídico pendente | Aprovado |
| Feedback de envio | Conversacional | Etapa 4 | Estados de envio, sucesso, validação, rejeição, falha e incerteza | Aprovado |
| Cabeçalho de seção | Estrutural | Sete seções | Organizar título, apoio e intenção | Aprovado |
| Walkthrough de três etapas | Demonstrativo | Como funciona | Relacionar controles e demonstrações contextuais | Aprovado |
| Prévia de conversa | Demonstrativo | WhatsApp | Exibir `1`, `2` e `PARAR` | Aprovado |
| Showcase do painel | Demonstrativo | Painel | Representação conceitual da operação | Pendente |
| Prévia técnica | Demonstrativo | Desenvolvedores | Apoiar compreensão de API, evento e webhook | Aprovado |
| Rodapé institucional | Estrutural | Global | Marca e destinos aprovados, incluindo solicitação | Aprovado |

## 2. Header e ações

- O header preserva a marca, âncoras essenciais, documentação e acesso secundário ao painel.
- Não há CTA destacado de solicitação no header e não há botões concorrentes.
- O CTA do Hero abre o assistente. A ação usa “Solicitar acesso ao piloto”.
- O botão flutuante aparece somente quando o Hero deixa de estar visível na viewport. No desktop mostra ícone e “Solicitar acesso”; no mobile prefere-se apenas o ícone, sempre com nome acessível.
- O botão respeita distância das bordas, área segura, foco, teclado e conteúdo; não bloqueia controles, não depende de hover, não abre automaticamente e não exibe indicador falso de atendente online.

## 3. Painel e jornada do assistente

### Desktop

Painel flutuante não modal, aproximadamente 400px de largura, altura limitada à viewport, cabeçalho fixo, conteúdo rolável, ações acessíveis e fechamento que permite continuar navegando.

### Mobile

Ocupa a tela disponível como diálogo modal. Gerencia foco inicial, foco de retorno, Escape, teclado virtual, scroll, campos confortáveis, controles visíveis e área segura.

### Etapas

1. **Identificação:** saudação integrada à primeira etapa, finalidade breve e campos exigidos pelo contrato.
2. **Contexto do projeto:** empresa/projeto, provedor e uso pretendido. Os rótulos seguem RF-026: Evolution API, outro ou ainda não tenho.
3. **Revisão e consentimento:** resumo claro e editável, edição das respostas anteriores e consentimento para contato sobre o piloto. A redação jurídica definitiva permanece pendente conforme RNF-003.
4. **Resultado:** enviando, solicitação recebida, erro de validação, solicitação rejeitada, falha de comunicação e resultado incerto após timeout, quando aplicável.

As mensagens são contextuais e acompanham controles estruturados; não há sequência longa de mensagens artificiais, respostas abertas produzidas por modelo, avatar, typing indicator ou simulação humana.

## 4. Dados, contrato e estados

Preservar sem alteração o payload de `POST /site/access-requests`:

- `name` até 100 caracteres;
- `email` até 254 caracteres;
- `company_or_project` até 120 caracteres;
- `whatsapp_provider`: `evolution_api`, `other` ou `none_yet`;
- `intended_use` opcional até 500 caracteres;
- `consent: true`;
- `form_opened_at`, relacionado à abertura efetiva da coleta;
- `website`, honeypot vazio.

Aplicar trim de textos quando apropriado, preservar valores estruturados e validar tipos/obrigatoriedade do contrato. Não enviar respostas parciais, não criar endpoint adicional e não criar armazenamento de conversas.

Ao fechar durante o preenchimento, preservar respostas somente em memória enquanto a página permanecer carregada. Não usar `localStorage` ou `sessionStorage`; ao recarregar, reiniciar o fluxo. Impedir múltiplos cliques durante o envio. O timeout inicial de 15 segundos é proposta técnica pendente de validação; não fazer retry automático após resultado incerto.

## 5. Acessibilidade, responsividade e motion

- Labels associados aos campos, foco visível, navegação por teclado, Escape, retorno de foco e anúncios de erro e conclusão.
- No desktop, o painel é não modal; no mobile, é diálogo modal com tratamento apropriado.
- Estados não dependem apenas de cor ou hover. Redução de movimento remove transições não essenciais.
- Campos e controles têm alvo mínimo confortável; a interface não bloqueia conteúdo e reflowa em 320px e zoom de 200%.
- Animações são curtas e discretas. Não usar typing indicator, pulsação, loop ou efeitos chamativos.

## 6. Relações e pendências

O painel é a única experiência de solicitação. O footer pode conter links funcionais que abrem o assistente, além de documentação, painel, termos e privacidade quando publicados.

Continuam pendentes: texto jurídico do consentimento; tolerância para divergência de relógios em `form_opened_at`; retenção de logs técnicos; validação do timeout de 15 segundos; e fallback `noscript` informativo sem oferecer `contato@useconfirma.com` como canal funcional. O contrato de sucesso, `submission_rejected`, `details`, erros de servidor e preflight CORS estão definidos em [Contrato do site](../../desenvolvimento/contratos/site.md).

Não modificar `prototipo.html`, `tokens.json`, requisitos, contratos, painel, API ou infraestrutura nesta tarefa.
