# @confirma/panel

Aplicação do painel web do Confirma. O pacote usa React, Vite e TanStack Router com roteamento baseado em arquivos.

Consulte o [guia do painel](AGENTS.md) para estrutura e implementação, o [guia geral](../../AGENTS.md) para simplicidade e legibilidade e o [procedimento de validação](../../docs/development/validation.md) para checks locais e CI.

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

O pacote não possui script de testes de interface atualmente. Typecheck e build não substituem conferir os estados da tela, teclado e responsividade conforme o protótipo.

Com a API local disponível em `http://localhost:3333`, atualize os tipos OpenAPI com:

```sh
pnpm --filter @confirma/panel api:types
```
