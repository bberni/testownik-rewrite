FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS dev
COPY testownik-web/package.json testownik-web/pnpm-lock.yaml testownik-web/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY testownik-web/ ./
EXPOSE 5173
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

FROM base AS build
COPY testownik-web/package.json testownik-web/pnpm-lock.yaml testownik-web/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY testownik-web/ ./
RUN pnpm build

FROM node:22-alpine AS preview
WORKDIR /app
COPY --from=build /app/dist ./dist
RUN corepack enable && npm install -g vite
EXPOSE 4173
CMD ["vite", "preview", "--host", "0.0.0.0"]
