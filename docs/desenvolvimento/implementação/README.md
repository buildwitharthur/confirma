# Planos de implementação

## Objetivo

Esta pasta acompanha a implementação do Confirma por meio de planos Markdown rastreáveis. Cada plano registra entregas técnicas, critérios de aceite, dependências e os commits que comprovarem a execução.

O planejamento é derivado da documentação existente em `docs/`. Requisitos, regras de negócio, contratos e decisões aprovadas continuam sendo as fontes de verdade. Uma lacuna ou decisão ainda não aprovada deve permanecer explícita como pendência, sem ser convertida em requisito.

## Organização

| Aplicação ou frente | Documento | Escopo atual |
| --- | --- | --- |
| Site — landing | [landing.md](landing.md) | Planejamento inicial detalhado para entendimento, estudo, implementação e validação da landing. |
| API | [api.md](api.md) | Blocos previstos e responsabilidades; detalhamento depende do estudo dos fluxos e das lacunas contratuais. |
| Worker | [worker.md](worker.md) | Blocos previstos para processamento assíncrono, integrações, privacidade e recuperação. |
| Painel | [painel.md](painel.md) | Blocos de alto nível baseados no escopo documentado; detalhamento depende dos contratos de leitura e das jornadas. |
| Site — documentação pública | [documentacao.md](documentacao.md) | Estrutura inicial; a adoção e configuração do Starlight ainda precisam ser estudadas. |

Landing e Documentação são frentes do Site, aplicação registrada em `docs/desenvolvimento/aplicacoes/site/README.md`. Não há uma aplicação adicional chamada “Landing” ou “Documentação”. Infraestrutura compartilhada permanece transversal e não recebe um plano de aplicação neste diretório.

## Como usar os planos

Cada documento é dividido em blocos de implementação. Um bloco representa uma entrega técnica coerente e possui objetivo, dependências, estado, tarefas e critério de conclusão. As tarefas devem ser pequenas o suficiente para ter resultado verificável e, preferencialmente, um commit lógico próprio.

Uma tarefa planejada começa com checklist desmarcado e `Commit: Pendente`. O checklist só deve ser marcado depois que a implementação for executada e validada. Se houver trabalho iniciado mas ainda não validado, registre o estado adicional como `Em execução` sem marcar a tarefa.

Dependências entre aplicações são referenciadas pelos IDs das tarefas responsáveis. A tarefa permanece somente no plano da aplicação que executa o trabalho. Quando o ID ainda não puder ser definido, a dependência deve ser descrita pelo nome e marcada como pendente de detalhamento.

Quando uma tarefa for concluída, atualize sua descrição de aceite, marque o checklist e registre o hash real do commit. Nunca use hashes fictícios. Se a organização mudar, preserve os IDs já publicados; IDs removidos não devem ser reutilizados.

Um bloco está concluído quando todas as suas tarefas foram executadas e validadas, seus critérios de aceite foram atendidos, suas dependências estão resolvidas ou formalmente aceitas e os commits reais foram registrados. A conclusão de um bloco não autoriza marcar tarefas dependentes em outros planos.

Os planos devem ser atualizados junto com o desenvolvimento: registrar decisões aprovadas, substituir pendências resolvidas por referências normativas, acrescentar tarefas somente quando houver evidência documental e manter as tarefas não executadas desmarcadas. O objetivo é acompanhar o trabalho real, sem cronograma artificial.

## Estados

- **Não iniciado:** trabalho ainda não começou.
- **Em execução:** trabalho iniciado, mas ainda não validado.
- **Concluído:** entrega validada e commit registrado.
- **Bloqueado:** há uma dependência ou decisão pendente que impede o avanço; registrar a causa e a referência correspondente.

O checklist representa somente a conclusão da tarefa. O estado do bloco resume a situação do conjunto e não substitui os checklists.

