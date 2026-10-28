# Build a partir da raiz do monorepo:
#   docker build -f apps/landing/Dockerfile .

# Etapa 1: gera o site estático em apps/landing/dist.
FROM node:24.20.0-alpine AS build

WORKDIR /app

RUN corepack enable && corepack install --global pnpm@12.3.4

COPY . .

# Instala só a landing, suas dependências internas e a raiz (turbo).
RUN pnpm --filter "@confirma/landing..." --filter . install --frozen-lockfile

RUN pnpm turbo run build --filter=@confirma/landing

# Etapa 2: serve os arquivos com Nginx; Node não vai para a imagem final.
FROM nginx:1.29-alpine

# Configuração do servidor: gzip, cache e página 404 (ver nginx.conf).
COPY apps/landing/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/apps/landing/dist /usr/share/nginx/html

EXPOSE 80
