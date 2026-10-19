# Design do Confirma

Esta pasta organiza a documentação de identidade visual e as futuras especificações de design das interfaces do Confirma.

## Princípio de organização

O Confirma compartilha uma identidade de marca, mas não possui um design system único entre suas aplicações. A identidade visual comum serve como referência de marca; cada aplicação poderá definir, de forma independente, sua própria tipografia, espaçamento, componentes, layouts, densidade visual e comportamento responsivo.

## Estrutura

| Área | Escopo | Documento |
| --- | --- | --- |
| Identidade compartilhada | Logotipos, variantes, tokens oficiais fornecidos e outros materiais de marca. | [`assets/`](assets/) |
| Landing page | Direção visual e padrões da landing page desenvolvida com Astro. | [README da landing](landing/README.md) |
| Painel | Design system específico do painel administrativo desenvolvido com React. | [README do painel](painel/README.md) |
| Documentação | Diretrizes visuais da interface técnica construída com Starlight. | [README da documentação](documentacao/README.md) |

## Identidade compartilhada

Os materiais oficiais da marca devem ser mantidos em [`assets/`](assets/), sem duplicação desnecessária. A paleta de cores da marca será uma referência visual compartilhada entre as aplicações.

O arquivo oficial atualmente disponível é [`tokens.json`](assets/tokens.json) e deve ser preservado conforme fornecido pelo responsável pelo projeto. Propriedades que não sejam cores não se tornam automaticamente obrigatórias para todas as aplicações.

Nenhum asset ou token é criado ou alterado nesta etapa.

## Evolução

As definições visuais de cada aplicação devem ser registradas em sua própria área, após aprovação. Esta pasta não estabelece componentes, tokens específicos, tipografia, espaçamentos, layouts, protótipos ou padrões de interação.
