# Testownik Web

A modern static-hosted rewrite of [testownik-electron](https://github.com/Kamill90/testownik-electron) — an offline quiz solving app for Polish university students.

Deployed at **[bberni.github.io/testownik-rewrite](https://bberni.github.io/testownik-rewrite/)**.

## Quick Start

```bash
cd testownik-web
pnpm install
pnpm dev        # http://localhost:5173
```

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | Typecheck + production build to `dist/` |
| `pnpm preview` | Serve built `dist/` locally |
| `pnpm typecheck` | Run `vue-tsc --noEmit` |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format with Prettier |
| `pnpm test:unit` | Run domain unit tests (Vitest) |
| `pnpm test:integration` | Run persistence/integration tests |
| `pnpm test:components` | Run Vue component tests |
| `pnpm test:e2e` | Run Playwright E2E tests |

## Docker

```bash
# Development (hot-reload on :5173)
docker compose up dev

# Production (static build served by nginx on :8080)
docker compose up prod
```

The production image runs `pnpm build` and serves `dist/` through nginx, matching the GitHub Pages deploy.

## Tech Stack

- **Vue 3** + **TypeScript** — UI framework
- **Vue Router** — hash-based routing for static hosting
- **Pinia** — state management (settings, quiz library, quiz session)
- **Vite** — build tool and dev server
- **IndexedDB** — browser-native persistence (quizzes, sessions, assets, settings)
- **Vitest** — unit/integration/component tests
- **Playwright** — E2E tests

## Architecture

```
testownik-web/
  src/
    domain/          Pure logic (parser, engine, session, encoding)
    platform/        Browser API adapters
      browser/       Download, visibility listeners
      files/         Import (FSAA, drag-drop, file input fallback)
      persistence/   IndexedDB repositories
    ui/
      components/    Vue components (shared, landing, quiz)
      composables/   Vue composables
      pages/         Route pages (LandingPage, QuizPage)
      stores/        Pinia stores (settings, quizLibrary, quizSession)
      styles/        CSS variables (dark/light/legacy themes)
```

## Browser Support

Chrome 90+, Firefox 90+, Safari 15+. File System Access API is used when available; falls back to `<input type="file">` otherwise. All data stays local — no network requests to any server.

## Migration From Electron

See [.ai/MIGRATION.md](.ai/MIGRATION.md) for importing quizzes, transferring saved progress, and troubleshooting.
