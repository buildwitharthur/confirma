# Worker

## Propósito

O worker processa tarefas assíncronas, envios de mensagens, entregas de webhooks, manutenção, retenção e recuperação do Confirma.

## Tecnologias principais

Node.js, TypeScript, PostgreSQL, Prisma, Redis, BullMQ e Vitest.

## Referências

- [Componentes](../../arquitetura/componentes.md)
- [Responsabilidades](../../arquitetura/responsabilidades.md)
- [Consistência e confiabilidade](../../arquitetura/consistencia-e-confiabilidade.md)
- [Jobs e filas](../../arquitetura/processamento/jobs-e-filas.md)
- [Fluxos de mensagens e webhooks](../../arquitetura/fluxos/mensagens-e-webhooks.md)
- [Fluxo de recuperação](../../arquitetura/fluxos/recuperacao.md)
- [Contratos internos](../../contratos/internos.md)

Os detalhes de implementação serão definidos quando o desenvolvimento do worker for iniciado.
