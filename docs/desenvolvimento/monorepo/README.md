# Monorepo

Esta pasta documenta as ferramentas, práticas de qualidade, containers e ambientes compartilhados do monorepo do Confirma.

Os documentos registram decisões e responsabilidades futuras. Não criam configurações executáveis nem definem a organização interna das aplicações e dos pacotes.

## Documentos

| Documento | Finalidade |
| --- | --- |
| [Ferramentas](ferramentas.md) | Registrar pnpm, Turborepo e TypeScript como ferramentas compartilhadas. |
| [Qualidade](qualidade.md) | Registrar lint, formatação, typecheck, testes e build. |
| [Containers](containers.md) | Documentar as diretrizes futuras de conteinerização das aplicações executáveis. |
| [Ambiente local](ambiente-local.md) | Documentar a infraestrutura local planejada com Docker Compose. |
| [CI/CD](ci-cd.md) | Registrar a automação planejada de integração contínua e a separação conceitual de CD. |

## Estrutura futura de referência

```text
confirma/
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── apps/
│   ├── api/
│   │   └── Dockerfile
│   ├── worker/
│   │   └── Dockerfile
│   ├── painel/
│   │   └── Dockerfile
│   └── site/
│       └── Dockerfile
│
├── packages/
│
├── docs/
│   └── desenvolvimento/
│
├── compose.yaml
├── eslint.config.mjs
├── prettier.config.mjs
├── .prettierignore
├── .dockerignore
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── pnpm-lock.yaml
```

Essa estrutura é uma referência inicial para a localização planejada das configurações. A organização interna das aplicações e dos pacotes compartilhados será definida posteriormente.
