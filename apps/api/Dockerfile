
FROM node:24.20.0-alpine

WORKDIR /workspace

RUN apk add --no-cache openssl \
    && corepack enable \
    && corepack install --global pnpm@12.3.4

COPY . .

RUN pnpm --filter "api..." --filter . install --frozen-lockfile \
    && pnpm --filter api build

ENV NODE_ENV=production

EXPOSE 3333

CMD ["node", "apps/api/dist/common/infrastructure/http/server.js"]
