FROM node:24.20.0-alpine AS builder

ENV COREPACK_HOME=/tmp/corepack
WORKDIR /workspace

RUN corepack enable \
  && corepack install --global pnpm@12.3.4

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/landing/package.json apps/landing/tsconfig.json apps/landing/astro.config.mjs ./apps/landing/
COPY apps/landing/src ./apps/landing/src

RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@confirma/landing

FROM nginx:1.29-alpine AS runtime

COPY apps/landing/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /workspace/apps/landing/dist/ /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --spider --quiet http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
