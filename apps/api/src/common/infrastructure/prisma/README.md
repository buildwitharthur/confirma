# Prisma

O schema, a configuração do Prisma, o client gerado e o histórico de migrations ficam nesta pasta. O PostgreSQL usa Prisma ORM 7 com o driver adapter `@prisma/adapter-pg`.

Configure `DATABASE_URL` no ambiente da API. Para testes, configure `DATABASE_URL_TEST` em `apps/api/.env.test`, apontando para um banco de teste isolado, e use `NODE_ENV=test`; o client em `testing/` recusa iniciar fora desse ambiente. Consulte `apps/api/.env.test.example` para os valores locais de referência. O arquivo `.env.test` não deve ser versionado.

Comandos a partir de `apps/api`:

```sh
pnpm exec prisma validate --config src/common/infrastructure/prisma/prisma.config.ts
pnpm exec prisma generate --config src/common/infrastructure/prisma/prisma.config.ts
pnpm exec prisma migrate dev --config src/common/infrastructure/prisma/prisma.config.ts --name <nome>
pnpm exec prisma migrate deploy --config src/common/infrastructure/prisma/prisma.config.ts
```

Use `pnpm prisma:test:migrate:deploy` a partir de `apps/api` para aplicar as migrations no banco de teste; o script carrega `.env.test` e usa `testing/prisma.testing.config.ts`. Não use a configuração de teste contra desenvolvimento ou produção. Cada migration criada pelo Prisma deve permanecer em `migrations/`.

O schema já contém os models persistentes do domínio. A pasta `migrations/` ainda não possui uma migration inicial; crie e aplique essa migration antes de executar testes de integração que consultem o banco.
