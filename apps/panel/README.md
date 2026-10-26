# @confirma/panel

Aplicação do painel web do Confirma. O pacote usa React, Vite e TanStack Router com roteamento baseado em arquivos.

## Desenvolvimento

Na raiz do monorepo:

```sh
pnpm --filter @confirma/panel dev
```

## Verificações

```sh
pnpm --filter @confirma/panel typecheck
pnpm --filter @confirma/panel build
```

## Tipos da API

Com a API local disponível em `http://localhost:3333`, atualize os tipos OpenAPI com:

```sh
pnpm --filter @confirma/panel api:types
```
