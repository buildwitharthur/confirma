# Planejamento funcional do painel Confirma

## Objetivo

Estabelecer a arquitetura funcional e da informação do painel antes da etapa de UI/UX. O planejamento traduz requisitos, casos de uso, regras e contratos existentes em telas, rotas, jornadas, operações, dados, estados e pendências.

## Escopo atual

Inclui o painel autenticado do MVP: primeiro acesso, boas-vindas, onboarding, configuração da conta e integrações, testes, acompanhamento de agendamentos, privacidade, chaves de API e exclusão de conta. Não inclui design visual, protótipos, wireframes ou implementação.

## Fontes e hierarquia

`docs/` é a fonte de verdade. Requisitos funcionais e não funcionais, regras de negócio, casos de uso e contratos prevalecem sobre propostas deste planejamento. Capacidades sem contrato permanecem explicitamente delimitadas nas especificações de operações, contratos e pré-condições.

## Índice

| Documento | Responsabilidade |
| --- | --- |
| [Escopo](planejamento/escopo.md) | Objetivo, público, responsabilidades, limites e princípios. |
| [Mapa de rotas](planejamento/mapa-de-rotas.md) | Rotas, grupos, acesso e conexões de navegação. |
| [Jornadas](planejamento/jornadas.md) | Fluxos completos e dependências entre telas. |
| [Catálogo de telas](planejamento/catalogo-de-telas.md) | Especificação funcional de cada tela. |
| [Operações e dados](planejamento/operacoes-e-dados.md) | Dados, operações, contratos HTTP e lacunas por tela. |
| [Estados e acesso](planejamento/estados-e-acesso.md) | Estados transversais, autorização e comportamento de exceções. |
| [Inventário de componentes](componentes.md) | Responsabilidades funcionais, reutilização, estados, acessibilidade e matriz de uso dos componentes. |
| [Especificação visual](design.md) | Direção visual, layout, tipografia, componentes, responsividade, motion e critérios de validação. |

## Estado e próximas etapas

O arquivo `prototipo.html` está presente como demonstração local, não como aplicação implementada ou homologada em navegador. Use a [matriz de pré-condições](../../dominio/pre-condicoes.md) para interpretar elegibilidade; não inferir backend a partir dos estados simulados.

Planejamento funcional, inventário funcional e especificação visual refinados como base para validação de produto, contratos e futura prototipagem. A tela introdutória `/boas-vindas` está documentada como uma introdução minimalista separada de `/primeiros-passos`, e o login possui showcase conceitual não funcional. As páginas autenticadas usam container fluido com limites apenas nos conteúdos que exigem leitura concentrada. O inventário complementa o catálogo de telas; a especificação visual define a apresentação sem implementar interfaces. Pendências de contrato permanecem registradas e decisões tecnológicas continuam fora deste conjunto.
