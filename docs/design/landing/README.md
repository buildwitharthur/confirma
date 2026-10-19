# Design da landing page

Índice da documentação visual da landing page do Confirma, desenvolvida com Astro.

## Documentos

| Documento | Finalidade | Estado |
| --- | --- | --- |
| [Direção e proposta](direcao-e-proposta.md) | Direção criativa, arquitetura da informação e proposta de conteúdo. | Proposta consolidada; aprovação editorial pendente |
| [Seções](secoes.md) | Conteúdo, hierarquia e composição das sete seções da landing e do fluxo de acesso. | Estrutura consolidada; copies ainda propostas |
| [Componentes](componentes.md) | Inventário e especificação dos componentes da landing. | Assets existentes rastreados; implementação pendente |
| [Design](design.md) | Especificação visual da landing. | Especificação preparada para prototipagem; aprovação visual final pendente |

## Assets e identidade

Os assets oficiais e a paleta compartilhada estão em [`../assets/`](../assets/). O arquivo de tokens existente é [`../assets/tokens.json`](../assets/tokens.json) e deve ser usado somente como referência cromática; ele não é duplicado nesta pasta.

A landing terá decisões visuais próprias. As definições do painel e da documentação técnica não são herdadas automaticamente.

## Estado da landing

A documentação orienta a experiência visual representada em `prototipo.html`. O protótipo HTML existe e possui interações locais simuladas; DEC-005 reconhece seu estado demonstrativo, sem constituir aprovação editorial/artística integral ou implementação funcional. O acesso ao beta é conduzido por um assistente guiado, determinístico e sem IA generativa, mas o envio da solicitação de acesso ainda não está integrado à API real. A biblioteca contém os três PNGs da landing; o showcase do painel é uma representação conceitual, não um screenshot de produção.

As pendências estão classificadas nos documentos de origem. Permanecem abertas a redação jurídica do consentimento, a tolerância para divergência de relógios em `form_opened_at`, a validação técnica do timeout inicial de 15 segundos, a retenção de logs técnicos e a disponibilidade pública dos destinos. O fallback sem JavaScript informa a limitação, mas não oferece canal alternativo de envio.
