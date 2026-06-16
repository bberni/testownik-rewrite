# Testownik Web Rewrite Testing Requirements

## Testing Goals

The test suite must prove that the web rewrite preserves the important Testownik product behavior while safely adapting Electron-only filesystem behavior to browser-native storage and import flows.

Primary risks to test:

| Risk | Required protection |
|---|---|
| Parser behavior drift | Golden fixture tests for every supported quiz format. |
| Progress loss | Autosave, reload, and restore tests. |
| Browser API variation | Chromium full path and Firefox/Safari fallback tests. |
| IndexedDB corruption or migration issues | Repository and migration tests. |
| Image resolution bugs | Import, storage, object URL, and cleanup tests. |
| Repetition logic changes | Deterministic quiz engine tests with injected randomness. |
| Static hosting breakage | Production build and hosted E2E smoke tests. |

## Test Tooling

Use this tooling unless implementation-time docs suggest a better option.

| Test type | Tool |
|---|---|
| Domain unit tests | Vitest in Node environment. |
| Browser API integration tests | Vitest with jsdom/happy-dom where sufficient; Vitest browser mode where real APIs are needed. |
| Vue component tests | Vitest plus Vue component test utilities or Vitest browser mode. |
| End-to-end tests | Playwright. |
| Mobile E2E tests | Playwright mobile device projects and at least one manual chrome-devtools MCP viewport pass. |
| Frontend UI inspection | chrome-devtools MCP for layout, responsive behavior, interaction debugging, screenshots, console errors, and network/storage inspection. |
| Type checking | `vue-tsc --noEmit`. |
| Linting | ESLint. |
| Formatting check | Prettier. |

Required CI commands:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm test:e2e:mobile
pnpm build
```

If the project uses npm instead of pnpm, keep the same script names.

## Fixture Requirements

Create test fixtures before or during the domain port.

Required fixture categories:

| Fixture | Purpose |
|---|---|
| `x-basic-utf8` | Standard `X` multiple-answer text quiz. |
| `x-windows-1250` | Windows-1250 encoded Polish text. |
| `x-image-question` | `[img]...[/img]` question body. |
| `x-image-answer` | Image answers mixed with text answers. |
| `x-blank-lines` | Blank lines and trailing whitespace. |
| `x-multiple-correct` | More than one correct answer. |
| `x-no-correct` | Edge case for no correct answers, if legacy parser allows it. |
| `y-basic-select` | Basic `{wybor N}` style placeholder question. |
| `y-multiple-selects` | Multiple select placeholders and multiple answer rows. |
| `y-image-options` | Select options containing image tags, if supported by current parser. |
| `with-save-json` | Existing compatible saved progress. |
| `with-missing-image` | Missing referenced image error handling. |
| `large-quiz` | Performance fixture with many questions and assets. |

The current parser expects Polish placeholders with `wybor` spelled as `wybór` in source files. Fixture filenames and test descriptions may be ASCII, but fixture content must include the exact legacy syntax where needed.

## Domain Unit Tests

Domain tests must not use Vue, DOM, IndexedDB, File, Blob, or browser globals.

### Encoding Tests

Required tests:

| Case | Expected result |
|---|---|
| Valid UTF-8 ASCII | Decode as UTF-8. |
| Valid UTF-8 Polish characters | Decode as UTF-8. |
| Windows-1250 Polish characters | Fallback decode as Windows-1250. |
| Invalid UTF-8 byte sequences | Do not corrupt text; use fallback. |
| Empty file | Parser handles or rejects consistently. |

### Parser Tests

Required `X` question tests:

| Case | Expected result |
|---|---|
| First line starts with `X` | Parsed as `single`. |
| Correct answer mask | `1` positions map to answer indexes. |
| Text question body | `contentType` is `text`. |
| Image question body | `contentType` is `image`, content is extracted from `[img]`. |
| Text answer | Answer type is `text`. |
| Image answer | Answer type is `image`, content is extracted from `[img]`. |
| Blank answer lines | Ignored like legacy app. |
| Filename | Question tag equals source filename. |

Required `Y` question tests:

| Case | Expected result |
|---|---|
| First line does not start with `X` | Parsed as `select`. |
| Correct option digits | Digits map to zero-based correct option IDs. |
| Placeholder parsing | `{wybor N}` placeholders map to zero-based select IDs. |
| Static text chunks | Preserved in content array. |
| Options split by `;;` | Empty options filtered like legacy app. |
| Correct option marker | `isCorrect` true only for correct option. |
| Filename | Question tag equals source filename. |

### Quiz Engine Tests

Required tests:

| Case | Expected result |
|---|---|
| New quiz creation | Initializes counts to zero and reoccurrences from settings. |
| Restore from save | Reattaches parsed questions to saved session. |
| Single answer correct | Correct count increments and reoccurrence decrements. |
| Single answer incorrect | Bad count increments and reoccurrence increases. |
| Multiple answers order-independent | Sorted selected IDs match sorted correct IDs. |
| Select answer correct | All selected option IDs match correct option IDs. |
| Select answer incorrect | Any mismatch is incorrect. |
| Learned question | Learned count increments exactly when reoccurrence reaches zero. |
| Bad answer cap | Reoccurrence does not exceed `maxReoccurrences`. |
| Zero remaining questions | Quiz is complete. |
| Random question selection | Selection uses injected RNG and only chooses remaining questions. |
| Duration formatting | Milliseconds format as `HH:mm:ss`. |
| Save serialization | Compatible save JSON omits `questions`. |

## Persistence Integration Tests

Persistence tests must use an isolated test database name per test file or per test run.

Required tests:

| Repository | Required behavior |
|---|---|
| Quiz repository | Create, fetch, update, list, delete. |
| Session repository | Create, autosave update, complete, fetch latest, delete by quiz. |
| Recent repository | Upsert recent quiz, order by last opened, delete. |
| Settings repository | Defaults, update, persistence after reopen. |
| Asset repository | Store Blob, fetch Blob, delete by quiz, handle missing asset. |
| Migration layer | Upgrade from previous schema version without data loss. |

Storage error tests:

| Case | Expected behavior |
|---|---|
| IndexedDB unavailable | Show actionable unsupported-storage message. |
| Quota exceeded | Show actionable storage-full message. |
| Corrupt record | Isolate bad record and avoid app crash. |
| Missing asset | Show missing image placeholder and keep quiz usable. |

## Import Integration Tests

Required tests:

| Case | Expected result |
|---|---|
| File tree import | Builds normalized virtual file tree. |
| Folder picker import | Reads nested files where File System Access API is mocked or tested in browser mode. |
| File input fallback | Reads `webkitRelativePath` file lists. |
| Drag/drop import | Accepts supported dropped files and directories. |
| `.txt` filtering | Only `.txt` files become questions. |
| Asset collection | Referenced image files are stored and resolvable. |
| Existing `save.json` | Import pipeline exposes saved progress decision. |
| Duplicate import | Same fingerprint is detected. |
| Reimport changed quiz | User can update existing quiz or import as copy. |

## Component Tests

Required landing/library tests:

| Component behavior | Expected result |
|---|---|
| Empty state | Shows import guidance. |
| Import button | Calls import flow. |
| Drag state | Shows drag-over styling. |
| Recent list | Renders quiz name, question count, progress, last opened. |
| Continue action | Opens latest session. |
| Start new action | Creates new session after confirmation if needed. |
| Delete action | Requires confirmation and updates list. |
| Settings button | Opens settings modal. |
| Info button | Opens info modal. |

Required quiz page tests:

| Component behavior | Expected result |
|---|---|
| Single question render | Shows question and answers. |
| Select question render | Shows placeholders and option modal. |
| Image render | Uses resolved object URLs. |
| Accept click | Reveals answers and updates stats. |
| Next click | Loads next question and clears selected answers. |
| Finish modal | Shows after last reoccurrence reaches zero. |
| Save/exit modal | In-app quit asks about active progress where needed. |
| Theme switch | Applies CSS variables for dark/light/legacy. |
| Keyboard numbers | Toggle answer selection. |
| Keyboard numpad | Toggle answer selection. |
| Space | Accepts or advances. |
| Escape | Closes modal. |

## End-To-End Tests

Run E2E against the production build preview whenever possible.

Required Chromium E2E tests:

| Scenario | Expected result |
|---|---|
| Import basic quiz | Quiz appears in library. |
| Continue after reload | Progress persists after browser reload. |
| Complete quiz | Finish modal shows final time. |
| Import with images | Images display in question/answer views. |
| Existing save JSON | User can continue imported saved progress. |
| Start new despite save | User can ignore imported save and start fresh. |
| Recent list ordering | Last opened quiz moves to top. |
| Delete quiz | Quiz disappears and cannot be opened. |
| Export progress | Downloaded file is compatible JSON. |
| Import exported progress | Restores matching progress. |
| Settings persist | Theme and repetition settings survive reload. |
| Static subpath | App works under configured base path. |

Required mobile E2E tests:

| Scenario | Expected result |
|---|---|
| Mobile landing import fallback | User can import through mobile-compatible file input or documented fallback. |
| Mobile quiz library | Quiz cards/list actions are visible, touch-friendly, and do not require horizontal scrolling. |
| Mobile continue after reload | Progress persists after reload in a mobile viewport. |
| Mobile single question flow | User can select answers, accept, reveal, and advance by touch. |
| Mobile select question flow | User can open option modal, select an option, reveal, and advance by touch. |
| Mobile settings | User can change theme and repetition settings without layout breakage. |
| Mobile finish flow | Finish modal is readable and dismissible. |
| Mobile export/download | Export works where browser permits, or app shows clear unsupported/download guidance. |

Required fallback browser E2E tests:

| Browser | Required result |
|---|---|
| Firefox | File input fallback imports quiz and progress persists. |
| WebKit | File input fallback imports quiz and progress persists, unless unsupported API constraints are documented. |

Required chrome-devtools MCP UI checks:

| Check | Required result |
|---|---|
| Console | No uncaught errors during landing, import, quiz, settings, and finish flows. |
| Mobile viewport | 360x640 and 390x844 viewports are usable without hidden primary controls. |
| Tablet viewport | 768x1024 viewport uses available space without desktop-only assumptions. |
| Touch targets | Primary controls are comfortably tappable. |
| Layout overflow | No unintended horizontal page scroll in landing, quiz, modals, or settings. |
| Storage inspection | IndexedDB records are created/updated for quiz packages, sessions, assets, and recents. |
| Reload behavior | Reload from chrome-devtools MCP preserves active progress and list state. |
| Screenshots | Capture desktop and mobile screenshots for changed UI states. |

Browser API mocking requirements:

| API | Requirement |
|---|---|
| `showDirectoryPicker` | Tests must cover available and unavailable branches. |
| `FileSystemWritableFileStream` | Tests must cover write success and permission failure if direct export is implemented. |
| IndexedDB | Tests must isolate database state. |

## Accessibility Requirements

Minimum checks:

| Area | Requirement |
|---|---|
| Keyboard | All core quiz actions reachable without mouse. |
| Focus | Modals trap or manage focus predictably. |
| Labels | Buttons and icon-only controls have accessible names. |
| Color | Correct/incorrect state is not conveyed by color alone where practical. |
| Motion | Animations are tolerable and respect reduced-motion if implemented. |
| Semantics | Lists, buttons, dialogs, and forms use appropriate HTML semantics. |
| Touch | Mobile touch interactions do not depend on hover or keyboard-only shortcuts. |

Automated accessibility checks should run in at least one E2E or component test path if tooling is added.

## Visual Regression Requirements

At minimum, keep screenshots for manual comparison.

Recommended visual snapshots:

| Screen | Themes |
|---|---|
| Landing empty state | Dark, light, legacy. |
| Landing with quiz list | Dark, light, legacy. |
| Single question before answer | Dark, light, legacy. |
| Single question reveal | Dark, light, legacy. |
| Select question before answer | Dark, light, legacy. |
| Select question reveal | Dark, light, legacy. |
| Settings modal | Dark, light, legacy. |
| Finish modal | Dark, light, legacy. |

Required mobile visual snapshots:

| Screen | Viewports |
|---|---|
| Landing empty state | 360x640, 390x844. |
| Landing with quiz list | 360x640, 390x844. |
| Single question before answer | 360x640, 390x844. |
| Single question reveal | 360x640, 390x844. |
| Select question with option modal | 360x640, 390x844. |
| Settings modal | 360x640, 390x844. |
| Finish modal | 360x640, 390x844. |

Full automated visual regression is optional, but manual screenshots must be updated before release.

## Performance Requirements

Performance tests can be automated or manually measured during release candidates.

Required checks:

| Case | Target |
|---|---|
| Import 500 text questions | Completes without UI freeze severe enough to trigger browser warning. |
| Import images | Object URLs are revoked when quiz is closed or assets are replaced. |
| Library list | Remains responsive with at least 100 imported quizzes. |
| Autosave | Does not noticeably delay answer acceptance. |
| Large IndexedDB | Opening app does not eagerly load all binary assets. |
| Mobile layout | Quiz page remains responsive and usable on low-width viewports. |

Implementation expectations:

| Expectation | Reason |
|---|---|
| Lazy load blobs | Avoid unnecessary memory use. |
| Batch timer saves | Avoid writing every second if not necessary. |
| Keep parser synchronous only if fast | Move heavy import to worker if fixtures show jank. |
| Revoke object URLs | Prevent memory leaks. |

## Release Gates

A release candidate cannot ship unless all gates pass:

| Gate | Requirement |
|---|---|
| Typecheck | No TypeScript or Vue type errors. |
| Lint | No lint errors. |
| Unit tests | All domain unit tests pass. |
| Integration tests | Persistence and import tests pass. |
| E2E tests | Chromium suite passes. |
| Mobile E2E tests | Playwright mobile projects pass. |
| chrome-devtools MCP UI pass | Required UI states inspected with mobile viewport and no blocking issues found. |
| Fallback tests | Firefox/WebKit fallback behavior passes or documented as unsupported. |
| Static build | Production build succeeds and preview serves correctly. |
| Manual QA | Checklist below completed. |

## Manual QA Checklist

Before release, manually verify:

| Check | Result |
|---|---|
| Import a real historical quiz folder. | Pass/Fail |
| Solve several questions, refresh, continue. | Pass/Fail |
| Finish a quiz and start again. | Pass/Fail |
| Import quiz containing images. | Pass/Fail |
| Import quiz with Windows-1250 Polish text. | Pass/Fail |
| Change each setting and reload. | Pass/Fail |
| Switch each theme. | Pass/Fail |
| Use keyboard-only quiz flow. | Pass/Fail |
| Export progress and import it back. | Pass/Fail |
| Delete a quiz and confirm assets/session removal. | Pass/Fail |
| Test deployed static build, not only dev server. | Pass/Fail |
| Test landing page and quiz library at 360px mobile width. | Pass/Fail |
| Complete a quiz flow with touch interactions in mobile viewport. | Pass/Fail |
| Inspect mobile UI with chrome-devtools MCP for console errors and layout overflow. | Pass/Fail |

## Coverage Expectations

Minimum coverage expectations:

| Area | Expectation |
|---|---|
| Domain parser | Near exhaustive branch coverage. |
| Quiz engine | Near exhaustive branch coverage. |
| Save compatibility | Exhaustive shape and migration coverage. |
| Persistence repositories | Major success and failure branches covered. |
| UI components | Critical user flows covered, not every CSS state. |

Avoid coverage theater. A lower numeric coverage with strong fixture and E2E coverage is better than high coverage that misses parser and persistence edge cases.
