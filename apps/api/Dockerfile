FROM node:24.20.0-slim

WORKDIR /workspace

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack install --global pnpm@12.3.4

COPY . .

RUN pnpm install --frozen-lockfile \
  && pnpm --filter api build

ENV NODE_ENV=production

EXPOSE 3333

CMD ["node", "apps/api/dist/common/infrastructure/http/server.js"]
