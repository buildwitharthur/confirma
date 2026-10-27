
FROM node:24.20.0-alpine AS build

WORKDIR /app

RUN corepack enable && corepack install --global pnpm@12.3.4

COPY . .

RUN pnpm --filter "@confirma/landing..." --filter . install --frozen-lockfile

RUN pnpm turbo run build --filter=@confirma/landing

FROM nginx:1.29-alpine

COPY --from=build /app/apps/landing/dist /usr/share/nginx/html

EXPOSE 80
