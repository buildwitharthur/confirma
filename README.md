# Confirma

Monorepo do Confirma, preparado para receber aplicações e pacotes de acordo com as especificações vigentes do produto.

## Pré-requisitos

- Node.js `>=24.20.0`
- pnpm `12.3.4`

O repositório utiliza pnpm como gerenciador exclusivo de pacotes.

## Instalação

```bash
pnpm install
```

## Comandos

```bash
pnpm dev          # inicia tarefas de desenvolvimento dos workspaces
pnpm build        # executa os builds dos workspaces
pnpm lint         # verifica o código com ESLint
pnpm lint:fix     # aplica correções automáticas do ESLint
pnpm format       # formata os arquivos incluídos na política do Prettier
pnpm format:check # verifica a formatação
pnpm typecheck    # executa typecheck nos workspaces
pnpm check        # lint, formatação e typecheck para CI
```

Nesta etapa, `apps/` e `packages/` contêm somente marcadores `.gitkeep`; por isso, o Turbo ainda não encontra projetos de aplicação para executar. Cada futuro workspace deverá definir scripts `build`, `dev`, `lint`, `typecheck` e `test` conforme as tarefas que implementar.

O comando usado pelo CI é:

```bash
pnpm check
```

## Estrutura inicial

```text
apps/       # aplicações futuras
packages/   # pacotes compartilhados futuros
docs/       # especificações do produto e referências visuais
```

As configurações compartilhadas ficam na raiz: pnpm, Turborepo, TypeScript, ESLint, Prettier e EditorConfig.
