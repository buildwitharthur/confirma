# Containers

Cada aplicação executável terá seu próprio Dockerfile:

- `apps/api/Dockerfile`;
- `apps/worker/Dockerfile`;
- `apps/painel/Dockerfile`;
- `apps/site/Dockerfile`.

As imagens deverão permitir a implantação independente das aplicações. Pacotes compartilhados que não sejam aplicações executáveis não precisam de Dockerfile próprio.

Na implementação futura, considerar:

- builds multi-stage;
- imagens de produção enxutas;
- instalação de dependências reproduzível;
- aproveitamento do cache de build;
- compatibilidade com pnpm e Turborepo;
- contexto de build na raiz do monorepo;
- separação entre dependências de desenvolvimento e execução.

Os Dockerfiles não fazem parte desta etapa.
