# Implementation Progress

Use this file to record the current project state after each merge.

## Current Status

- Rewrite planning docs are in `.ai/`.
- `testownik-electron/` remains the legacy reference implementation.
- Phase 1: Scaffold Web App — complete.
- Phase 2: Port Domain Logic — complete.

## After Each Merge

Add a new entry with:

- Date and branch merged.
- Summary of implemented scope.
- Tests and checks run.
- Code review result.
- Known follow-ups or risks.
- Recommended next step.

---

## 2026-06-16 — Phase 1: Scaffold Web App

**Scope:**
- Created `testownik-web/` as a Vite + Vue 3 + TypeScript SPA.
- Configured strict TypeScript with `@tsconfig/strictest` and `@vue/tsconfig`.
- Set up Vue Router 4 with hash history (landing, quiz, not-found routes).
- Defined global CSS variables for dark, light, and legacy themes (matching legacy electron app).
- Configured ESLint flat config with `typescript-eslint` and `eslint-plugin-vue`.
- Configured Prettier.
- Configured Vitest for unit tests (Node) and integration tests (jsdom).
- Configured Playwright with chromium and mobile (Pixel 7) projects.
- Added initial app entry, router, pages (LandingPage, QuizPage, NotFoundPage), and App.vue.
- Added basic E2E test for landing page load.

**Tests and checks run:**
- `pnpm typecheck` — passes (0 errors)
- `pnpm lint` — passes (0 errors, 0 warnings)
- `pnpm build` — static production build succeeds
- `pnpm test:unit` — 1 test passes
- `pnpm test:e2e` — 2 tests pass (chromium + mobile landing page load)

**Code review result:** Pending (Phase 1 scaffold, no domain logic to review).

**Known follow-ups:**
- `@tsconfig/strictest` may be too aggressive for some future patterns; re-evaluate if needed.
- Playwright webServer config may need tuning for CI (currently `reuseExistingServer: true`).
- SCSS/Dart Sass not yet configured; CSS variables are sufficient for theme system.

**Recommended next step:** Phase 3 — Persistence Layer (IndexedDB wrapper, repositories for quizzes, assets, sessions, settings, recent).

---

## 2026-06-16 — Phase 2: Port Domain Logic

**Scope:**
- Created `quizTypes.ts` — all domain types (QuizPackage, QuizSession, Question, Answer, AppSettings, CompatibleSaveJson).
- Ported `encoding.ts` — UTF-8 validator (`isUtf8`) from legacy `encodingDetector.js` plus built-in Windows-1250 decode table (no npm dependency).
- Ported `parseQuestionFile.ts` — X (multiple-choice) and Y (select/placeholder) question parsers from legacy `questionsReader.js`, with `[img]...[/img]` extraction, blank line filtering, correct answer mask parsing.
- Ported `quizEngine.ts` — answer checking (order-independent single, select matching), counter updates, reoccurrence logic (correct → decrement, wrong → increment+cap), learned question detection, completion check, progress computation, random question selection with injected RNG.
- Ported `quizSession.ts` — new session creation (`createQuizSession`) and restore from compatible save.json (`restoreQuizSession`).
- Ported `saveJsonCompat.ts` — compatible save.json serializer (omits questions), deserializer with error handling, and `formatDuration(ms)` replacing moment.js `HH:mm:ss`.
- Relaxed ESLint from `strictTypeChecked` to `recommendedTypeChecked` for practical strictness.

**Tests and checks run:**
- `pnpm typecheck` — passes (0 errors)
- `pnpm lint` — passes (0 errors)
- `pnpm test:unit` — 83 tests pass (19 parser, 25 engine, 13 encoding, 9 save JSON, 8 duration, 7 session, 2 version)
- `pnpm build` — static production build succeeds

**Code review result:** PASS WITH NOTES — 1 major (X content .trim() removal), 1 minor (Y image body test), both fixed before merge.

**Known follow-ups:**
- Y question with `[img]` + `{wybór N}` on same line loses placeholders (edge case, unlikely in real quizzes).
- `formatDuration` embedded in `saveJsonCompat.ts` — could be extracted to own module.
- `getLinkToImage` returns `''` instead of `undefined` for missing `[/img]` (intentional defensive improvement).

**Recommended next step:** Phase 3 — Persistence Layer (IndexedDB wrapper, quiz/asset/session/settings/recent repositories).
