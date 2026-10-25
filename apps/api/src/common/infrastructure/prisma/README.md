# Prisma

O schema, a configuração do Prisma, o client gerado e o histórico de migrations ficam nesta pasta. O PostgreSQL usa Prisma ORM 7 com o driver adapter `@prisma/adapter-pg`.

Configure `DATABASE_URL` no ambiente da API. Para testes, configure `DATABASE_URL_TEST` apontando para um banco de teste isolado e use `NODE_ENV=test`; o client em `testing/` recusa iniciar fora desse ambiente.

Comandos a partir de `apps/api`:

```sh
pnpm exec prisma validate --config src/common/infrastructure/prisma/prisma.config.ts
pnpm exec prisma generate --config src/common/infrastructure/prisma/prisma.config.ts
pnpm exec prisma migrate dev --config src/common/infrastructure/prisma/prisma.config.ts --name <nome>
pnpm exec prisma migrate deploy --config src/common/infrastructure/prisma/prisma.config.ts
```

Use `testing/prisma.testing.config.ts` para executar `migrate reset` e preparar migrations no banco de teste. Não use a configuração de teste contra desenvolvimento ou produção. Cada migration criada pelo Prisma deve permanecer em `migrations/`.

O schema ainda não contém modelos. A primeira migration será criada quando o modelo persistente do domínio for introduzido, sem tabelas inferidas nesta configuração inicial.
