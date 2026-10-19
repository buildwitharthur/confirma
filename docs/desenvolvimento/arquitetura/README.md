# Arquitetura do Confirma

Esta pasta reúne a documentação arquitetural do Confirma, organizada por contexto, componentes, processamento, fluxos, estados, confiabilidade, implantação, capacidades e decisões. Os contratos técnicos permanecem em [`../contratos/`](../contratos/).

## Visão e estrutura

| Documento | Finalidade |
| --- | --- |
| [Contexto](contexto.md) | Fronteiras do sistema, atores, integrações externas e visão geral. |
| [Componentes](componentes.md) | Componentes, acesso aos dados e relacionamentos principais. |
| [Responsabilidades](responsabilidades.md) | Limites de responsabilidade e responsabilidades negativas de cada componente. |
| [Estados](estados.md) | Estados, transições e eventos dos agendamentos. |
| [Consistência e confiabilidade](consistencia-e-confiabilidade.md) | Transações, concorrência, idempotência, falhas, recuperação e observabilidade. |
| [Implantação](implantacao.md) | Separação operacional, superfícies HTTP e controles de segurança. |
| [Capacidades](capacidades.md) | Capacidades técnicas exigidas para atender às decisões do produto. |
| [Decisões](decisoes.md) | Decisões arquiteturais, justificativas e alternativas descartadas. |
| [Stack tecnológica](stacks.md) | Tecnologias oficialmente selecionadas para o projeto. |

## Processamento e fluxos

| Documento | Finalidade |
| --- | --- |
| [Jobs e filas](processamento/jobs-e-filas.md) | Comandos duráveis, reservas, processamento assíncrono, retentativas e reconciliação. |
| [Agendamentos](fluxos/agendamentos.md) | Criação de agendamentos e primeiro envio. |
| [Mensagens e webhooks](fluxos/mensagens-e-webhooks.md) | Respostas, webhooks, PARAR, falhas de envio e retentativas. |
| [Privacidade](fluxos/privacidade.md) | Desbloqueio e exclusões antecipadas e por retenção. |
| [Recuperação](fluxos/recuperacao.md) | Restauração de backup e retomada controlada do serviço. |

Os documentos preservam as decisões, garantias e diagramas da arquitetura original. Cada assunto tem uma fonte principal; os contratos em [`../contratos/`](../contratos/) continuam independentes e normativos para suas interfaces.
