FROM node:24-alpine AS base
ENV CI=true
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

FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
