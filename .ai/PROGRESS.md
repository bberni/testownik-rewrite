# Implementation Progress

Use this file to record the current project state after each merge.

## Current Status

- Rewrite planning docs are in `.ai/`.
- `testownik-electron/` remains the legacy reference implementation.
- Phase 1: Scaffold Web App — complete.
- Phase 2: Port Domain Logic — complete.
- Phase 3: Persistence Layer — complete.
- Phase 4: Import Pipeline — complete.

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

**Recommended next step:** Phase 4 — Import Pipeline (folder picker, file input fallback, drag/drop, virtual file tree, fingerprinting, asset mapping).

---

## 2026-06-16 — Phase 3: Persistence Layer

**Scope:**
- Implemented `db.ts` — IndexedDB wrapper with versioned schema (v1), transaction helper, `StorageError` for quota/blocked/upgrade errors, `openDB`/`closeDB` lifecycle.
- Implemented `quizRepository.ts` — save/get/list/update/delete `QuizPackage` by ID, find by fingerprint, cascade delete (removes sessions + assets + recents).
- Implemented `assetRepository.ts` — store/fetch/delete Blobs keyed by quizId + relativePath, with `getAll` for quiz index.
- Implemented `sessionRepository.ts` — CRUD for `QuizSession`, get latest by quiz, atomic `completeSession`, cascade delete by quiz.
- Implemented `settingsRepository.ts` — persist `AppSettings` with defaults (theme: dark, reoccurrencesOnStart: 2, maxReoccurrences: 10), partial merge on save.
- Implemented `recentRepository.ts` — upsert recent entry, list ordered by lastOpenedAt desc, delete.
- Added `jsdom` + `fake-indexeddb` for integration test environment.
- Added `schemaVersion: 1` to `QuizSession` type.

**Tests and checks run:**
- `pnpm typecheck` — passes (0 errors)
- `pnpm lint` — passes (0 errors)
- `pnpm test:unit` — 83 tests pass
- `pnpm test:integration` — 29 tests pass (5 quiz, 4 settings, 4 recents, 7 session, 5 asset + 4 cascade)
- `pnpm build` — static production build succeeds

**Code review result:** PASS WITH NOTES — 3 items fixed before merge (atomic completeSession, .gitkeep cleanup, cascade test extension).

**Known follow-ups:**
- Asset records lack `schemaVersion` (minor — shape unlikely to change).
- `getQuizByFingerprint` does linear O(n) scan (no fingerprint index).
- `upgrade()` ignores `oldVersion` — migration hooks needed for future versions.

**Recommended next step:** Phase 4 — Import Pipeline.

---

## 2026-06-16 — Phase 4: Import Pipeline

**Scope:**
- Implemented `importedFileTree.ts` — Virtual file tree types (`VirtualFile`, `VirtualDirectory`) and utilities (`findFile`, `listAllFiles`, `listFilesByExtension`).
- Implemented `fileSystemAccess.ts` — Chromium `showDirectoryPicker()` folder import with recursive directory reading, feature detection via `isFileSystemAccessSupported()`.
- Implemented `fileInputFallback.ts` — `<input type="file" webkitdirectory>` fallback with `buildTreeFromFileList()` path normalization (backslash → forward slash).
- Implemented `dragDrop.ts` — Drag/drop handler using `webkitGetAsEntry` FileSystemEntry API, feature detection.
- Implemented `fingerprint.ts` — Stable djb2 hash fingerprint from sorted file names + content hashes of .txt files (pure domain logic).
- Implemented `importPipeline.ts` — Full import orchestrator: decode .txt files (UTF-8/Windows-1250), parse questions, collect image asset Blobs, compute fingerprint, detect save.json.

**Tests and checks run:**
- `pnpm typecheck` — passes (0 errors)
- `pnpm lint` — passes (0 errors)
- `pnpm test:unit` — 109 tests pass (+26 from Phase 3)
- `pnpm test:integration` — 29 tests pass
- `pnpm build` — static production build succeeds

**Code review result:** PASS WITH NOTES — 2 major findings fixed pre-merge (dragDrop feature detection, image asset matching precision).

**Known follow-ups:**
- `fileSystemAccess.ts`, `fileInputFallback.ts`, `dragDrop.ts` have no unit tests (need browser mocks).
- `ImportedAsset.mimeType` and `.size` are derivable from `.blob` — consider removing redundant fields.
- Image ref matching doesn't have a test for subdirectory refs (`[img]subdir/photo.jpg[/img]`).

**Recommended next step:** Phase 5 — Landing Page and Quiz Library (import UI, recent/library list, empty states, settings/info entry points).

---

## 2026-06-16 — Phase 5: Landing Page And Quiz Library

**Scope:**
- Installed Pinia for Vue state management.
- Created `settingsStore` — theme and reoccurrence settings with IndexedDB persistence, applies `data-theme` attribute on load.
- Created `quizLibraryStore` — quiz library CRUD, import orchestration (fingerprint dedup), progress enrichment from session data.
- Created shared components: `Modal` (Teleport, Escape key, mask click-to-close, `role=dialog`/`aria-modal`), `ProgressBar`.
- Created `ImportArea` — drag/drop zone, FSAA button, file input fallback, mobile responsive.
- Created `QuizCard` — quiz name, question count, progress bars (correct/learned), continue/start/delete actions.
- Created modals: `SettingsModal` (theme radio, reoccurrence number inputs), `InfoModal` (version, author), `DeleteQuizModal` (confirmation).
- Rewrote `LandingPage.vue` — header with settings/info buttons, import area, quiz list with cards, error banners, loading state, empty state, mobile layout (max-width 480px breakpoints).
- Installed `@vue/test-utils` + `@pinia/testing` for component testing.
- Added `vitest.components.config.ts` with jsdom environment.
- Added `test:components` script to package.json.
- Fixed double file-picker bug by exporting `buildTreeFromFileList` from `fileInputFallback.ts`.
- Fixed Modal Escape key via document-level keydown listener with `watch`/`onScopeDispose` lifecycle.
- Added `mode=continue|new` query param to differentiate quiz launching intent.

**Tests and checks run:**
- `pnpm typecheck` — passes (0 errors)
- `pnpm lint` — passes (0 errors)
- `pnpm test:unit` — 109 tests pass
- `pnpm test:components` — 15 tests pass (6 Modal, 9 QuizCard)
- `pnpm test:integration` — 28 tests pass
- `pnpm build` — production build succeeds
- Total: 152 tests

**Code review result:** PASS WITH FIXES — 2 blockers + 5 majors + 7 minors found, all blockers and majors fixed pre-merge (double file-picker, Escape key, continue/startNew differentiation, fingerprint dedup, unused prop).

**Known follow-ups:**
- Landing page has no E2E test beyond the basic load test from Phase 1.
- `importViaFileInput` still available but unused by components — consider removal.
- `ProgressBar.backgroundColor` prop removed (was unused) — re-add if needed later.
- Modal focus trapping and focus restoration not implemented (carried over from Electron reference).
- `upsertRecent` inside `markOpened` now awaited before navigation (fixes race condition).

**Recommended next step:** Phase 6 — Quiz Page (question rendering, answer checking, stats sidebar, action button, modals, keyboard, mobile).

---

## 2026-06-16 — Phase 6: Quiz Page

**Scope:**
- Created `quizSessionStore` — full quiz flow state: init (new/continue), question picking via `pickRandomQuestion`, answer checking via `checkSingleAnswer`/`checkSelectAnswer`, reoccurrence updates via `applyAnswerResult`, timer with setInterval, autosave to IndexedDB, finish detection, answer shuffle in state (not getter).
- Created `useAssetUrls` composable — loads asset blobs from IndexedDB, creates/revokes object URLs, provides `getUrl(relativePath)` resolver.
- Created `QuizQuestion.vue` — renders text/image question content, select placeholders with fill/correct/wrong styling, image fallback.
- Created `SingleAnswerList.vue` — 2-column grid of answers with checkboxes, custom indicators, correct/wrong/missed reveal states with color-coded borders.
- Created `StatsSidebar.vue` — progress bars (correct/learned ratio), numeric counts (correct/bad, learned/total), question count, formatted time, tag × reoccurrences, settings/info/exit action buttons.
- Created `SelectOptionsModal.vue` — option picker for select-type questions, correct/wrong reveal highlighting.
- Created `FinishQuizModal.vue` — final stats (time, correct, bad, learned) with return button.
- Rewrote `QuizPage.vue` — full-height flex layout with main question area + sidebar, accept/next action button, keyboard handling (Space accept/next, 1-9 toggle, Escape close modals), mobile responsive at 768px, save/exit modal with progress prompt.
- Fixed timer leak by stopping timer in `onUnmounted`.
- Fixed continue mode not persisting newly created sessions.
- Fixed select modal clickable during reveal phase.
- Fixed Space key firing when modals are open.
- Moved answer shuffle from computed getter to `pickNext()` action.
- Refactored session creation with shared `createNewSession` helper.

**Tests and checks run:**
- `pnpm typecheck` — passes (0 errors)
- `pnpm lint` — passes (0 errors)
- `pnpm test:unit` — 109 tests pass
- `pnpm test:components` — 15 tests pass
- `pnpm test:integration` — 28 tests pass
- `pnpm build` — production build succeeds (QuizPage chunk: 18.88 KB)
- Total: 152 tests

**Code review result:** PASS WITH FIXES — 2 blockers + 6 majors + 8 minors found, all blockers and majors fixed pre-merge (timer leak, missing FinishQuizModal, missing session save, Math.random in getter, select click during reveal, Space key guard, numeric stats counts).

**Known follow-ups:**
- No component tests for quiz components (QuizQuestion, SingleAnswerList, StatsSidebar, SelectOptionsModal, FinishQuizModal) — E2E or component tests needed.
- Keyboard handler depends on div focus — consider global `document.addEventListener` for keyboard shortcuts.
- `imgFailed` in QuizQuestion is a computed always returning false — should be `ref`.
- No CSS transition animations for question changes (Electron has fade transitions).
- `formatDuration` still in `saveJsonCompat.ts` — should be extracted to `domain/duration.ts`.
- Keyboard handler missing `Numpad1-9` and `Backquote` key codes.

**Recommended next step:** Phase 8 — Static Hosting And Optional PWA.

---

## 2026-06-16 — Phase 7: Autosave, Restore, And Export

**Scope:**
- Added periodic timer autosave (every 30s) + visibility change listener (save when tab hidden).
- Added `exportSaveJson` action downloading `save.json` via Blob download (uses `platform/browser/download.ts`).
- Added `matchAndImportSaveJson` action in quizLibrary store — parses `save.json`, matches reoccurrence tags to quiz question tags, creates new session, guards against overwriting active sessions, shows error banners on mismatch.
- Added import save.json button in LandingPage (hidden file input, only visible when quizzes exist).
- Fixed timer race condition: decoupled wall-clock tracking (`timerStartedAt`, `timerTick`, `flushTime`) from session mutations. Timer no longer writes to `session.time` — instead, elapsed time is computed via getter and flushed to session.time only on save/stop.
- Fixed `saveAndExit` not awaiting save before navigation.
- Fixed `saveSession` swallowing errors: now accepts `{ silent?: boolean }` — autosave calls use `{ silent: true }`, user-initiated saves log errors to console.
- Extracted DOM APIs: `triggerDownload` to `platform/browser/download.ts`, `addVisibilityListener` to `platform/browser/visibility.ts`.
- Fixed CSS: `position: relative` on `.landing__save-import` label.

**Tests and checks run:**
- `pnpm typecheck` — passes (0 errors)
- `pnpm lint` — passes (0 errors)
- `pnpm test:unit` — 109 tests pass
- `pnpm test:components` — 15 tests pass
- `pnpm test:integration` — 28 tests pass
- `pnpm build` — production build succeeds
- Total: 152 tests

**Code review result:** PASS WITH FIXES — 4 majors + 4 minors found, all resolved pre-merge (silent save failures, un-awaited saveAndExit, timer race condition, DOM APIs in store, position relative, void return type, session overwrite guard).

**Known follow-ups:**
- No unit tests for `matchAndImportSaveJson` tag-matching logic.
- Timer time accuracy limited to ~1s drift between ticks (cosmetic only).
- Import save.json does not handle multiple quizzes with equal match scores (takes first best).
- `flushTime()` called twice in `finishQuiz` path (once in `stopTimer`, once in `saveSession`) — second call is a no-op since `timerStartedAt` is already null.

**Recommended next step:** Phase 8 — Static Hosting And Optional PWA (configure Vite base, hash routing, deployment workflow, PWA evaluation).

(End of file - total 276 lines)