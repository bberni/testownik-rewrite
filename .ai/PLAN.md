# Testownik Web Rewrite Implementation Plan

## Goal

Rewrite the existing `testownik-electron` application as a modern static-hosted web application while preserving feature parity for quiz import, quiz solving, progress persistence, recent quizzes, settings, and quiz list/library browsing.

The rewrite does not need strict Electron parity. Native desktop behaviors such as real window controls, arbitrary filesystem paths, and Electron auto-update are out of scope unless they map cleanly to web-native behavior.

## Documentation And Feasibility Checks

Context7 checks performed before selecting the stack:

| Check | Result |
|---|---|
| `Vue.js` library resolution | Resolved official/high-reputation Vue documentation, including `/websites/vuejs_guide` and `/vuejs/core`. |
| Vue 3 TypeScript docs | Confirmed Vue SFCs support `<script setup lang="ts">`. |
| Vue SPA/routing docs | Confirmed client-side routing is a normal Vue SPA pattern. |
| Vue project setup docs | Confirmed official Vue scaffolding is Vite-powered and TypeScript-ready. |
| `Vite` library resolution | Resolved official/high-reputation Vite documentation at `/vitejs/vite`. |

Exa checks performed before selecting the stack:

| Check | Result |
|---|---|
| Vite static deployment | Vite official docs support static deployment to GitHub Pages, Netlify, Cloudflare Pages, and similar hosts. `base` must be configured correctly for subpath hosting. |
| File System Access API | MDN marks `showDirectoryPicker()` as limited availability, secure-context only, and requiring user activation. |
| Chromium file access | Chrome docs confirm browser apps can read directories and write files after user permission through the File System Access API. |
| Cross-browser directory fallback | web.dev documents a fallback using `<input type="file" webkitdirectory>` when `showDirectoryPicker` is unavailable. |
| Vitest | Vitest docs support browser-like environments and component testing, including browser mode backed by tools such as Playwright. |

Exa free MCP quota was reached during broader library lookups. Because of that, this plan avoids making core product feasibility depend on unverified third-party storage libraries. The implementation should use browser-native IndexedDB behind a small internal repository layer. If a library such as Dexie, idb, fflate, or vite-plugin-pwa is added later, recheck current docs before adopting it.

## Feasibility Verdict

The rewrite is feasible as a static web app.

The browser-native product model should be:

| Current Electron concept | Web rewrite concept |
|---|---|
| Recent folder paths | Recent imported quizzes stored in browser storage. |
| Read local folder every time | Import quiz once into a local browser quiz library. |
| `save.json` written into quiz folder | Progress autosaved to IndexedDB. Optional compatibility export as `save.json`. |
| Continue from local `save.json` | Continue from stored browser session. Existing `save.json` can be imported as compatibility data. |
| Native titlebar and auto-update | Normal browser UI, static deployment, optional PWA update prompt later. |

The only browser limitation that matters is local filesystem access. Chromium can provide a high-fidelity folder picker and direct write path. Firefox and Safari need import/export fallbacks. This is acceptable because progress and recents will be stored inside the web app.

## Complete Tech Stack

Use this stack unless implementation-time docs or constraints show a better option.

| Area | Choice | Reason |
|---|---|---|
| Language | TypeScript, strict mode | Parser, quiz state, and persistence need type safety. |
| UI framework | Vue 3 | Lowest migration risk from current Vue 2 SFC app while modernizing. |
| Component style | Vue SFCs with `<script setup lang="ts">` | Confirmed by Vue docs; concise and type-friendly. |
| Build tool | Vite | Static deployment support confirmed; fast dev/build loop. |
| Router | Vue Router 4 with hash history | Keeps SPA refresh-safe on any static host without rewrite rules. |
| State | Pinia or small composable stores | Pinia is preferred if app state grows; composables are acceptable for small domain state. Recheck Pinia docs before adding. |
| Persistence | Native IndexedDB behind internal repositories | Stores quiz packages, images, sessions, and recents without relying on unverified libraries. |
| Settings storage | IndexedDB or localStorage | Small scalar settings can use localStorage; app data uses IndexedDB. |
| File import | File System Access API plus file input fallback | Supports folder import in Chromium and fallback elsewhere. |
| Image storage | Blob records in IndexedDB, displayed via object URLs | Replaces Electron `file:///` image paths. |
| Encoding | Browser `TextDecoder` plus existing UTF-8 validator port | Supports UTF-8 and Windows-1250 quiz files. |
| Styling | CSS variables plus SCSS using Dart Sass | Preserves current theme model without old `node-sass`. |
| Icons | Inline SVG components or a small Vue icon package | Avoid Font Awesome legacy dependency unless exact icon parity is required. |
| Time formatting | Internal duration formatter | Replaces `moment` for `HH:mm:ss`. |
| Unit tests | Vitest | Fits Vite and TypeScript. |
| Component tests | Vitest with jsdom/happy-dom or browser mode | Use browser mode for APIs that jsdom cannot model. |
| E2E tests | Playwright | Required for folder import fallback, persistence, keyboard, and cross-browser checks. Recheck current Playwright docs before setup. |
| Frontend UI inspection | chrome-devtools MCP | Required for interactive UI checks, layout debugging, mobile viewport inspection, and visual behavior verification. |
| Type checking | `vue-tsc` | Validates Vue SFC types. |
| Linting | ESLint flat config, `typescript-eslint`, `eslint-plugin-vue` | Modern linting for Vue and TS. |
| Formatting | Prettier | Keeps code review focused on behavior. |
| Package manager | pnpm | Fast, deterministic installs. If repository convention prefers npm, switch before scaffolding. |
| CI | GitHub Actions | Run typecheck, lint, unit tests, and Playwright. |
| Hosting | Static host: GitHub Pages, Cloudflare Pages, Netlify, or equivalent | Vite deployment docs confirm support. |

## Browser Support Policy

| Tier | Browsers | Required behavior |
|---|---|---|
| Tier 1 | Current Chromium-based browsers | Folder picker, drag/drop import, IndexedDB quiz library, autosave, recent quizzes, optional direct save/export. |
| Tier 2 | Firefox and Safari | File input or zip/manual import fallback, IndexedDB quiz library, autosave, recent quizzes, export/download. |
| Tier 2 | Current mobile Safari and mobile Chromium | Mobile-usable import fallback, quiz library, quiz solving, autosave, recent quizzes, settings, and export/download where browser permits. |
| Tier 3 | Older browsers | Show unsupported-browser message if IndexedDB, Blob URLs, or basic File APIs are unavailable. |

The app must work on `localhost` and HTTPS static hosting. File System Access API features must be feature-detected and never assumed globally available. Mobile is a required target, not a nice-to-have: the app must remain usable on phone-sized viewports, touch input, browser virtual keyboards, and mobile browser storage constraints.

## Product Scope

Must preserve:

| Feature | Required rewrite behavior |
|---|---|
| Import quiz | Import existing Testownik quiz folders containing `.txt` files and image references. |
| Existing quiz formats | Preserve current `X` multiple-answer and `Y` select-placeholder formats. |
| Encodings | Preserve UTF-8 and Windows-1250 decoding behavior. |
| Image questions/answers | Display referenced local images after import. |
| Recent quizzes | Show imported/recent quiz list on landing page. |
| Quiz progress | Save progress automatically and restore it after reload/reopen. |
| Continue or restart | If progress exists, allow continuing or starting a new session. |
| Quiz solving | Preserve random question selection among remaining reoccurrences. |
| Answer reveal | Preserve correct, missed, and wrong visual states. |
| Repetition settings | Preserve initial repetitions, bad-answer increment, and max repetitions. |
| Stats | Preserve correct/bad answers, learned questions, total questions, and learning time. |
| Keyboard support | Preserve number keys, numpad keys, Space, Escape, and sample quiz shortcut if retained. |
| Themes | Preserve dark, light, and legacy themes. |
| Info/settings modals | Preserve user-facing settings and informational modals. |
| `save.json` compatibility | Read old `save.json` when imported and optionally export progress in compatible shape. |
| Mobile support | Import, browse quiz list, solve quizzes, manage progress, and change settings on mobile browsers. |

Nice to have:

| Feature | Notes |
|---|---|
| Zip import | Useful for Safari/Firefox and sharing quizzes. Add after docs recheck for chosen zip library. |
| Full backup export | Export all browser-stored quizzes and sessions as one backup file. |
| PWA installability | Useful, but not required for static hosting or persistence. Add after docs recheck. |
| Search/filter quiz library | Useful once many quizzes are imported. |
| Tablet layout optimization | Useful after phone and desktop parity are stable. |

Out of scope:

| Feature | Reason |
|---|---|
| Native Electron titlebar | Browser tabs cannot minimize/maximize/close native windows. |
| Electron auto-updater | Static hosts deploy by replacing assets. Optional PWA update prompt can be added later. |
| Absolute local path recents | Browsers cannot persist arbitrary absolute folder paths in a portable way. |
| Silent write to arbitrary folders | Browser security requires user permission or download fallback. |

## Target Data Model

Use explicit schema versions for every persisted record.

```ts
type QuizPackage = {
  schemaVersion: 1
  id: string
  name: string
  fingerprint: string
  importedAt: number
  updatedAt: number
  questionCount: number
  questions: Question[]
  assets: StoredAssetRef[]
}

type QuizSession = {
  schemaVersion: 1
  id: string
  quizId: string
  startedAt: number
  updatedAt: number
  completedAt: number | null
  numberOfLearnedQuestions: number
  numberOfCorrectAnswers: number
  numberOfBadAnswers: number
  time: number
  reoccurrences: QuestionReoccurrence[]
}

type RecentQuiz = {
  schemaVersion: 1
  quizId: string
  lastOpenedAt: number
}

type AppSettings = {
  schemaVersion: 1
  theme: 'dark' | 'light' | 'legacy'
  reoccurrencesIfBad: number
  reoccurrencesOnStart: number
  maxReoccurrences: number
}
```

Keep `save.json` compatibility separate from the internal session schema.

Current compatible `save.json` shape:

```json
{
  "location": "optional-compatibility-label",
  "numberOfQuestions": 10,
  "numberOfLearnedQuestions": 0,
  "numberOfCorrectAnswers": 0,
  "numberOfBadAnswers": 0,
  "time": 0,
  "reoccurrences": [
    { "tag": "001.txt", "value": 2 }
  ]
}
```

Do not embed parsed questions into compatibility `save.json`, matching the current Electron app behavior.

## Architecture

Create a new app next to the legacy app rather than editing the old Electron code in place.

Recommended structure:

```text
testownik-web/
  src/
    app/
      main.ts
      router.ts
      stores/
      version.ts
    domain/
      quizTypes.ts
      parseQuestionFile.ts
      decodeQuestionText.ts
      createQuizSession.ts
      restoreQuizSession.ts
      quizEngine.ts
      saveJsonCompat.ts
      duration.ts
    platform/
      files/
        fileSystemAccess.ts
        fileInputFallback.ts
        dragDrop.ts
        importedFileTree.ts
      persistence/
        indexedDb.ts
        quizRepository.ts
        sessionRepository.ts
        settingsRepository.ts
        recentRepository.ts
      assets/
        assetRepository.ts
        objectUrlRegistry.ts
    ui/
      components/
      pages/
      modals/
      styles/
    fixtures/
      sampleQuiz.ts
  tests/
    fixtures/
    unit/
    integration/
    e2e/
```

Layering rules:

| Layer | Rule |
|---|---|
| `domain/` | Pure TypeScript only. No Vue, DOM, IndexedDB, File, Blob, or browser globals. |
| `platform/` | Browser APIs, persistence, file import, asset handling. No quiz UI logic. |
| `ui/` | Vue components and styling. Call stores/services, not raw IndexedDB or parser internals. |
| `tests/fixtures/` | Golden quiz samples and compatibility data. No production imports from tests. |

## Implementation Phases

### Phase 0: Legacy Behavior Inventory

Objectives:

| Task | Output |
|---|---|
| Document existing parser behavior | Parser behavior table for `X`, `Y`, images, blank lines, and encodings. |
| Build synthetic fixture set | Fixture quiz directories for unit and E2E tests. |
| Capture UI behavior | Screenshots or notes for landing page, quiz page, modals, and themes. |
| Identify intentional behavior vs bugs | Short compatibility notes before changing behavior. |

Acceptance criteria:

| Criterion | Required result |
|---|---|
| Fixture coverage | Fixtures cover every parser branch in current code. |
| Compatibility decisions | Any intentional behavior changes are listed before implementation. |

### Phase 1: Scaffold Web App

Objectives:

| Task | Output |
|---|---|
| Create `testownik-web/` | Vite + Vue 3 + TypeScript app. |
| Configure strict TS | `strict`, `noUncheckedIndexedAccess` where practical, and Vue SFC typecheck. |
| Configure routing | Hash history with landing, quiz, and not-found routes. |
| Configure styles | Global CSS variables for dark/light/legacy themes. |
| Configure quality tooling | ESLint, Prettier, Vitest, Playwright skeleton. |

Acceptance criteria:

| Criterion | Required result |
|---|---|
| Build | Static production build succeeds. |
| Typecheck | `vue-tsc` succeeds. |
| Empty app E2E | Playwright can open the landing page. |

### Phase 2: Port Domain Logic

Objectives:

| Task | Output |
|---|---|
| Port encoding detector | `isUtf8(bytes)` equivalent to current `encodingDetector.js`. |
| Port decoder | UTF-8 if valid, otherwise Windows-1250. |
| Port `X` parser | Multiple-answer parser with same answer indexing and image syntax. |
| Port `Y` parser | Select-placeholder parser with same option indexing. |
| Port quiz creation | New session uses settings-controlled initial reoccurrences. |
| Port quiz restore | Attach imported questions to saved session state. |
| Port quiz engine | Check answer, update counters, update reoccurrences, detect finish. |
| Remove `moment` dependency | Internal `formatDuration(ms)` returns `HH:mm:ss`. |

Acceptance criteria:

| Criterion | Required result |
|---|---|
| Unit tests | Parser and engine fixture tests pass. |
| No browser dependencies | Domain tests run in Node environment. |
| Save compatibility | `save.json` serializer omits questions. |

### Phase 3: Persistence Layer

Objectives:

| Task | Output |
|---|---|
| Implement IndexedDB wrapper | Versioned database open, migrations, transactions, errors. |
| Implement quiz repository | Store and fetch quiz packages by ID/fingerprint. |
| Implement asset repository | Store blobs and metadata by quiz ID and normalized relative path. |
| Implement session repository | Create, update, complete, delete, and list sessions. |
| Implement settings repository | Persist theme and repetition settings. |
| Implement recent repository | List recent quizzes ordered by last opened time. |
| Add storage error handling | User-facing errors for quota, blocked storage, corrupt records. |

Acceptance criteria:

| Criterion | Required result |
|---|---|
| Reload persistence | Imported quiz and progress survive browser refresh. |
| Migration safety | DB version upgrades are tested. |
| Privacy | No quiz data leaves the browser. |

### Phase 4: Import Pipeline

Objectives:

| Task | Output |
|---|---|
| Define virtual file tree | Common representation for folder picker, drag/drop, and file input. |
| Implement Chromium folder import | Use `showDirectoryPicker` when available. |
| Implement fallback file import | Use `input[type=file][webkitdirectory]` when needed. |
| Implement drag/drop import | Accept dropped directories/files where browser supports it. Must use both `getAsEntry()` (Firefox) and `webkitGetAsEntry()` (Chromium) for entry retrieval. |
| Normalize paths | Use forward slashes, strip root prefix, preserve relative asset links. |
| Detect `save.json` | Offer continue/import saved progress or start fresh. |
| Build asset map | Store referenced image blobs and resolve object URLs at render time. |
| Compute fingerprint | Stable fingerprint based on file names, sizes, timestamps if available, and content hash for `.txt` files. |

Acceptance criteria:

| Criterion | Required result |
|---|---|
| Import existing quiz | Existing `.txt` quiz folders import. |
| Import images | Image questions and answers display correctly. |
| Import saved progress | Existing `save.json` can seed a session. |
| Duplicate handling | Reimporting same quiz updates or asks before duplicating. |

### Phase 5: Landing Page And Quiz Library

Objectives:

| Task | Output |
|---|---|
| Build import area | Primary import button and drag/drop zone. |
| Build recent/library list | Show quiz name, question count, progress, last opened, and status. |
| Add list actions | Continue, start new, export progress, delete quiz. |
| Add empty states | Clear guidance before any quiz is imported. |
| Add settings/info entry points | Preserve current settings and info modal access. |
| Add mobile library layout | Single-column touch-friendly quiz library, import controls, and actions for phone-sized screens. |

Acceptance criteria:

| Criterion | Required result |
|---|---|
| Recent list | Imported quizzes appear after reload. |
| Progress summary | List shows current progress for active sessions. |
| Delete | Deleting removes quiz, assets, sessions, and recent entry after confirmation. |
| Mobile library | Recent/import/list actions are usable at 360px viewport width with touch input. |

### Phase 6: Quiz Page

Objectives:

| Task | Output |
|---|---|
| Render single questions | Text/image question body and shuffled text/image answers. |
| Render select questions | Inline placeholders, option modal, selected visible values. |
| Preserve answer checking | Exact same correctness semantics as current app. |
| Preserve reveal state | Correct, missed, and wrong answer styling. |
| Preserve stats sidebar | Correct/bad, learned/not learned, total, time. |
| Preserve action button | Accept/next toggle and finish modal. |
| Preserve modals | Select options, save/exit, finish, settings, info. |
| Preserve keyboard | Number keys, numpad, Space, Escape. |
| Add mobile quiz layout | Touch-first answer selection, readable question content, accessible action button, and stats that do not consume excessive screen width. |

Acceptance criteria:

| Criterion | Required result |
|---|---|
| Solve flow | User can complete a quiz from import to finish. |
| Repetition logic | Learned count and remaining reoccurrences match domain tests. |
| Timer | Timer pauses/stops on finish and persists during session. |
| Mobile solve flow | User can complete single and select questions on phone-sized screens without horizontal scrolling or hidden controls. |

### Phase 7: Autosave, Restore, And Export

Objectives:

| Task | Output |
|---|---|
| Autosave answers | Save after every accepted answer. |
| Autosave timer | Persist timer periodically and on route/page visibility changes. |
| Restore session | Continue after refresh without data loss. |
| Start new session | Keep or archive old completed session according to UX decision. |
| Export progress | Download compatible `save.json`. |
| Import progress | Apply compatible `save.json` to matching quiz by tags. |

Acceptance criteria:

| Criterion | Required result |
|---|---|
| Refresh safety | Refresh after answering does not lose progress. |
| Export/import | Exported `save.json` can be imported back and restored. |
| Cross-browser fallback | Progress works without File System Access API. |

### Phase 8: Static Hosting And Optional PWA

Objectives:

| Task | Output |
|---|---|
| Configure Vite base | Host-specific `base` setting documented. |
| Use hash routing | Works on static hosts without rewrite rules. |
| Add deployment workflow | GitHub Actions or chosen host config. |
| Add update/version prompt | Simple version check if needed. |
| Evaluate PWA | Recheck docs before adding a PWA plugin. |
| Verify mobile static build | Test deployed/preview build in mobile viewport and at least one real or emulated mobile browser. |

Acceptance criteria:

| Criterion | Required result |
|---|---|
| Static deploy | Built `dist/` works when served by a static server. |
| Subpath deploy | App works under a non-root base path if configured. |
| Offline behavior | If PWA is added, offline/update tests are mandatory. |

### Phase 9: Migration Cutover

Objectives:

| Task | Output |
|---|---|
| Keep Electron app read-only | Legacy app remains available for comparison. |
| Document migration | Explain import folder, saved progress, and browser storage model. |
| Add troubleshooting | Storage quota, unsupported browser, missing images, encoding issues. |
| Final QA pass | Full checklist from `.ai/TESTING.md`. |

Acceptance criteria:

| Criterion | Required result |
|---|---|
| User docs | User can import and continue quizzes without Electron knowledge. |
| Behavior parity | Required product features are covered by automated or manual tests. |

### Phase 10: CI/CD And GitHub Pages Deployment Verification

Objectives:

| Task | Output |
|---|---|
| CI pipeline passes | Typecheck, lint, all test suites, and build succeed in GitHub Actions. |
| Pages deploy succeeds | Artifact uploaded and deployed without errors. |
| Deployed URL verified | Live site loads, hash routing works, no console errors. |
| Regression guard | CI must fail on type/lint/test failures before deploy proceeds. |
| Troubleshooting docs | Common CI failures documented (pnpm build scripts, frozen lockfile, strict typecheck). |

Acceptance criteria:

| Criterion | Required result |
|---|---|
| CI green | All steps pass on push to main. |
| Deploy succeeds | `actions/deploy-pages` completes, live URL returns 200. |
| Hash routing | Navigating to `/#/` and `/#/quiz/<id>` works on the deployed domain. |
| No console errors | Chrome DevTools on deployed page shows 0 errors. |
| CI blocks deploy on failure | A failing typecheck or test prevents the deployment step from running. |
| Mobile deploy | Deployed page renders correctly at 375px viewport. |

Key CI concerns:

| Concern | Resolution |
|---|---|
| pnpm v11 blocks native build scripts | `pnpm-workspace.yaml` with `allowBuilds: { esbuild: true }` |
| `vue-tsc` strict mode | Unused imports and dead code are compile errors — lint and typecheck in CI catch them before deploy. |
| `--frozen-lockfile` | Prevents lockfile drift between local dev and CI. |
| Cache | `pnpm/action-setup` with `cache: pnpm` avoids re-downloading dependencies. |
| Hash routing on GitHub Pages | `base: './'` in Vite config + `createWebHashHistory()` in router — no server-side redirects needed. |

Definition of done:

- CI workflow passes (`typecheck`, `lint`, `test:unit`, `test:integration`, `test:components`, `build`) on every push to main.
- `actions/deploy-pages` completes and the live URL is accessible.
- Chrome DevTools on the deployed page shows 0 console errors at both desktop and 375px mobile viewport.

## Implementation Rules

| Rule | Rationale |
|---|---|
| Keep domain logic pure | Makes parser and quiz behavior testable and stable. |
| Inject randomness | Random question selection must be testable. |
| Never depend on absolute paths | Static web apps cannot rely on local filesystem paths. |
| Feature-detect browser APIs | File System Access support varies by browser. |
| Do not store object URLs | Store Blobs, create object URLs at runtime, revoke them on cleanup. |
| Version persisted schemas | IndexedDB records will live across deployments. |
| Autosave by default | Browser tab close cannot reliably show custom save UI. |
| Keep compatibility import/export | Users may have old `save.json` files. |
| Avoid remote services | Quiz data should remain local and private. |

## Open Decisions

| Decision | Recommended default |
|---|---|
| UI redesign level | Preserve structure and themes first, modernize only after parity. |
| Start-new behavior | Ask whether to replace, archive, or keep multiple sessions. |
| Reimport same quiz | Detect same fingerprint and offer update existing package. |
| Zip import | Add after folder/file import is stable. |
| PWA | Add after core static app is tested. |
| Package manager | Use pnpm unless repository policy prefers npm. |

## Definition Of Done

The rewrite is done when:

| Area | Requirement |
|---|---|
| Import | Existing Testownik quiz folders import successfully. |
| Quiz library | Imported quizzes appear in a persistent list with progress. |
| Progress | User can close/reload/reopen and continue where they left off. |
| Solving | Single and select questions behave like the Electron app. |
| Settings | Theme and repetition settings persist. |
| Compatibility | Existing `save.json` can be imported; current progress can be exported. |
| Static hosting | Production build runs from static files. |
| Mobile | Landing page, quiz library, quiz flow, modals, settings, and progress restore work on mobile. |
| Tests | Required checks in `.ai/TESTING.md` pass. |
| Review | Review gates in `.ai/CODE_REVIEW.md` pass. |
| Progress log | `.ai/PROGRESS.md` is updated after each merge. |
