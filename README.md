# Testownik Web

A static web app rewrite of [testownik-electron](https://github.com/Kamill90/testownik-electron) - credits to [Kamil Golec](https://github.com/kumalg) and [Jakub Kozłowski](https://github.com/kubukoz)

100% vibecoded with DeepSeek V4 Pro as an experiment.

You can run it locally, or use the Github Pages version on **[bberni.github.io/testownik-rewrite](https://bberni.github.io/testownik-rewrite/)**. Regardless of which one you choose, all the data stays in your browser.

Should work both on desktop and mobile browsers.

If something is broken/missing from original app, or you have a feature proposal, please create a Github issue with description and screenshots.

If you find any security issues, please DM me at Discord (@bberni) with details.

Enjoy the rest of the readme, courtesy of DeepSeek of course:

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
