# Confirma

Monorepo do Confirma, serviço de confirmação de agendamentos por WhatsApp. A API, o painel e a landing ficam em `apps/`; os contratos de produto ficam em `docs/specs/` e os protótipos em `docs/design/`.

## Pré-requisitos

- Node.js `>=24.20.0`
- pnpm `12.3.4`
- Docker, para o PostgreSQL local e as imagens das aplicações

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
```

O CI executa `pnpm install --frozen-lockfile`, `pnpm check` e `pnpm build`. A suíte de testes da API está sendo reconstruída e ainda não integra o CI.

## Estrutura

```text
apps/api/      # API e persistência PostgreSQL/Prisma
apps/panel/    # painel React/Vite
apps/landing/  # landing Astro
docs/specs/    # contratos do produto
docs/design/   # protótipos e direção visual
```

As imagens Docker de API, painel e landing são definidas nos respectivos `Dockerfile`. Painel e landing servem os builds estáticos com Nginx; a API executa em Node.js.
