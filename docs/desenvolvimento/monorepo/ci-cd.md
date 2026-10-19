# CI/CD

O workflow de integração contínua está em `.github/workflows/ci.yml`. Esta etapa configura somente CI; deployments continuam sendo realizados manualmente pelo Coolify.

## O que o CI valida

O workflow instala as dependências com o lockfile, executa as verificações centralizadas do monorepo e valida a mesma imagem Docker de produção utilizada pelo Coolify:

1. `pnpm install --frozen-lockfile`;
2. `pnpm typecheck`, orquestrado pelo Turborepo;
3. `pnpm lint`;
4. `pnpm format:check`;
5. build da imagem com `docker build --file apps/landing/Dockerfile --tag confirma-landing:ci .`;
6. smoke test do container na porta local `8080`, verificando inicialização, execução do Nginx e resposta HTML HTTP 200.

Qualquer falha reprova a execução. O repositório ainda não possui scripts ou arquivos de testes automatizados, portanto não há uma etapa de testes a executar neste momento. Quando um workspace passar a ter testes, eles deverão ser adicionados ao fluxo por meio de um script não interativo real.

O Dockerfile usa a raiz do monorepo como contexto e o próprio Dockerfile da landing executa a compilação Astro dentro do estágio `builder`. Por isso, o workflow não executa um build Astro isolado antes do `docker build`.

## Quando o workflow é executado

O CI é executado nos seguintes eventos:

- push para `main`;
- push para `develop`;
- pull requests direcionados a `main` ou `develop`;
- execução manual por `workflow_dispatch`.

As duas branches usam exatamente as mesmas verificações. `main` representa a versão destinada à produção; `develop` é a branch de desenvolvimento e testes. O workflow não cria deployments em nenhuma delas.

Execuções concorrentes da mesma branch ou pull request são canceladas quando uma nova execução começa. O job usa runner `ubuntu-latest`, permissões somente de leitura do conteúdo e timeout de 15 minutos.

## Como verificar os resultados

Na aba **Actions** do GitHub, selecione o workflow **CI** e abra a execução correspondente ao push ou pull request. Em pull requests, o resultado também aparece nos checks da própria conversa. O log da primeira etapa que falhar indica se o problema ocorreu na instalação, no lint, na formatação, no typecheck ou no build.

Para exigir o CI antes do merge, recomenda-se configurar no GitHub uma regra de proteção para `main` e `develop` exigindo o check `Validate`. Essa configuração é remota e não é alterada por este repositório. A disponibilidade pode depender do plano e da visibilidade do repositório.

## Execução local

Na raiz do monorepo:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm format:check
docker build --file apps/landing/Dockerfile --tag confirma-landing:ci .
docker run --detach --name confirma-landing-ci --publish 8080:80 confirma-landing:ci
curl --fail --max-time 5 http://127.0.0.1:8080/
docker rm --force confirma-landing-ci
```

## Expansão futura

O typecheck já usa o Turborepo e as verificações da raiz podem incorporar novos workspaces conforme eles adquirirem scripts funcionais. Builds, lint e testes de dashboard, API ou documentação devem ser adicionados somente quando esses aplicativos e seus scripts estiverem implementados e validados.

## Assets públicos

O Dockerfile copia `apps/landing/public` para o estágio de build antes da compilação Astro. Os arquivos públicos são, portanto, incluídos no `dist` e transferidos para a imagem final do Nginx junto com os demais artefatos estáticos.

## CD

Publicação de imagens e implantação das aplicações pertencem conceitualmente à entrega contínua. Não há job de deploy, integração com Coolify, secrets de produção, publicação de imagens ou acesso à VPS neste workflow.
