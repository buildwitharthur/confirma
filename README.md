# Confirma

Monorepo do Confirma, serviço de confirmação de agendamentos por WhatsApp. A API, o painel e a landing ficam em `apps/`; os contratos de produto ficam em `docs/specs/` e os protótipos em `docs/design/`.

## Pré-requisitos

- Node.js `>=24.20.0`
- pnpm `12.3.4`
- Docker, para o PostgreSQL local e as imagens das aplicações; testes também podem usar um PostgreSQL exclusivo fornecido por outro meio

O repositório utiliza pnpm como gerenciador exclusivo de pacotes.

## Desenvolvimento

Copie `apps/api/.env.example` para `apps/api/.env` e ajuste `JWT_SECRET` e `RESEND_API_KEY` para o seu ambiente. O Compose publica o PostgreSQL local na porta `5434`, já usada no exemplo de ambiente para a API executada fora do Docker. A API usa `http://localhost:3333` por padrão e o painel usa `http://localhost:3000`.

```bash
pnpm install
docker compose -f apps/api/compose.yaml up -d postgres
pnpm --filter api prisma:migrate:deploy
pnpm dev
```

## Comandos

```bash
pnpm dev           # inicia os servidores de desenvolvimento
pnpm build         # compila os workspaces
pnpm lint          # executa o ESLint
pnpm lint:fix      # aplica correções automáticas do ESLint
pnpm format        # formata os arquivos com Prettier
pnpm format:check  # verifica a formatação
pnpm typecheck     # verifica os tipos
pnpm check         # lint, formatação e tipos
pnpm test          # testes dos workspaces; requer banco de testes disponível
```

O CI executa `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm check` e `pnpm build`. Ele fornece PostgreSQL e configura `.env.test`; os testes da API aplicam migrations antes do Vitest. Os tipos da API são verificados pelo build (`tsc`).

## Guias de desenvolvimento

- [AGENTS.md](AGENTS.md): simplicidade, legibilidade, construção de features e critérios de conclusão.
- [Padrões da API](apps/api/src/AGENTS.md): responsabilidade de cada pasta, dependências, schemas, providers e exemplos de testes.
- [Padrões do painel](apps/panel/AGENTS.md): telas, componentes, formulários e integração com a API.
- [Validação](docs/development/validation.md): comandos locais e de CI, banco de testes, limpeza e interpretação dos resultados.

Implemente a menor solução que cumpra o contrato. Comece pelas especificações do módulo, defina critérios de aceite, siga os padrões locais e valide a mudança. Não crie infraestrutura antecipada para necessidades futuras.

## Testes locais da API

Configure `apps/api/.env.test` para um banco exclusivo de testes. Na pasta `apps/api`, `pnpm run pre:test` inicia o container local na porta `5433`; aguarde o PostgreSQL aceitar conexões antes de executar `pnpm test`. Ao terminar, mesmo em falhas, execute `pnpm run post:test`. Esses comandos são separados e não são hooks automáticos.

Para um banco de testes já disponível, configure `.env.test` e execute `pnpm test`, sem Docker. Consulte o [procedimento completo](docs/development/validation.md): os testes de repositório limpam tabelas.

## Estrutura

```text
apps/api/      # API e persistência PostgreSQL/Prisma
apps/panel/    # painel React/Vite
apps/landing/  # landing Astro
docs/specs/    # contratos do produto
docs/design/   # protótipos e direção visual
```

As imagens Docker de API, painel e landing são definidas nos respectivos `Dockerfile`. Painel e landing servem os builds estáticos com Nginx; a API executa em Node.js.
