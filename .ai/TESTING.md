# Testownik Web Testing Requirements

## Goal

Testing should prove that maintenance changes do not break quiz compatibility, browser persistence, static hosting, or desktop/mobile quiz flows.

Run commands from `testownik-web/` unless a command explicitly targets the repository root.

## Current Scripts

| Command | Purpose |
|---|---|
| `pnpm typecheck` | Vue and TypeScript type checking. |
| `pnpm lint` | ESLint checks. |
| `pnpm format:check` | Prettier formatting check. |
| `pnpm test:unit` | Domain and pure logic tests. |
| `pnpm test:integration` | Persistence and browser-adapter integration tests. |
| `pnpm test:components` | Vue component tests. |
| `pnpm test:e2e` | Playwright desktop E2E tests. |
| `pnpm test:e2e:mobile` | Playwright mobile project tests. |
| `pnpm build` | Typecheck plus production Vite build. |
| `pnpm preview` | Serve the production build locally. |

## Default Verification Sets

### Documentation-Only Change

Required checks:

```bash
git diff --check
```

Run app tests only if docs include executable examples or workflow changes that can be validated locally.

### Small Non-UI Code Change

Required checks:

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
```

Add integration or component tests if the changed code touches persistence, browser adapters, stores, or Vue components.

### App Behavior Change

Required checks:

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm test:integration
pnpm test:components
pnpm build
```

Run E2E tests when the behavior can be exercised through the browser.

### Broad Release Candidate

Run the full local gate:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test:unit
pnpm test:integration
pnpm test:components
pnpm test:e2e
pnpm test:e2e:mobile
pnpm build
```

The GitHub Pages workflow currently runs typecheck, lint, unit tests, integration tests, component tests, and build. Local E2E and mobile checks are still required for browser-flow changes even when CI does not run them.

## Required Tests By Change Type

| Change type | Required verification |
|---|---|
| Parser or encoding | Unit tests with fixtures covering changed format behavior. |
| Quiz engine or repetitions | Deterministic unit tests for answer checking, counters, random selection, and completion. |
| `save.json` compatibility | Unit tests for import/export shape plus manual or integration check when user-visible. |
| IndexedDB schema | Integration tests for migrations, old data preservation, and CRUD behavior. |
| Persistence CRUD | Integration tests for repository success and failure paths. |
| Import pipeline | Unit or integration tests for virtual file tree, asset matching, decoding, save detection, and duplicates. |
| Browser API adapter | Tests for supported and unsupported capability branches where practical. |
| Store logic | Unit/component/integration coverage for state transitions and persistence effects. |
| Vue component | Component test or E2E coverage for changed interaction. |
| Quiz page UI | Component or E2E coverage plus keyboard and touch verification where relevant. |
| Landing page UI | Component or E2E coverage for import, list, settings, delete, or empty states. |
| Styling/theme | Desktop and mobile visual/manual checks, with screenshots when reviewing a PR. |
| Mobile layout | Playwright mobile or browser mobile viewport verification. |
| CI/deploy | Production build and, after merge to main, GitHub Actions run verification. |
| Dependency update | Relevant test suite plus build. Use current docs for changed tool or library behavior. |

## Manual Browser Verification

Manual browser verification is required when automated tests do not cover the changed user flow.

Record:

| Field | Required detail |
|---|---|
| Browser | Browser name and version when available. |
| Viewport | Desktop, tablet, or exact mobile dimensions. |
| Data setup | Imported quiz, fixture, storage state, or settings used. |
| Flow | Exact user actions performed. |
| Result | Expected behavior observed or remaining discrepancy. |
| Console | Whether console errors appeared. |

Required viewport checks for UI changes:

| Target | Minimum check |
|---|---|
| Desktop | 1280px-wide viewport or comparable. |
| Mobile | 360px to 390px wide viewport. |
| Touch flow | Verify primary controls do not depend on hover. |

Use chrome-devtools MCP inspection for frontend UI changes when available. If unavailable, record the browser/manual verification that replaced it.

## Regression Test Expectations

For every bug fix, prefer this order:

| Step | Requirement |
|---|---|
| Reproduce | Capture the failing behavior manually, with a test, or by code-path analysis. |
| Guard | Add an automated regression test when practical. |
| Fix | Make the smallest code change that addresses the root cause. |
| Confirm | Show the new test fails before the fix when practical, then passes after the fix. |

It is acceptable to skip a new automated test only when the behavior is impractical to automate in the current test stack. Record the reason and manual verification.

## Static Deploy Verification

After changes merge to `main`, verify deploy for runtime behavior changes:

```bash
gh run list --workflow "Deploy to GitHub Pages" --limit 5
gh run view <run-id> --log-failed
```

Then check the live app when the issue affects runtime behavior:

| Check | Requirement |
|---|---|
| Page load | `https://bberni.github.io/testownik-rewrite/` loads. |
| Console | No new uncaught errors in the changed flow. |
| Routing | Hash routes still work for affected pages. |
| Mobile | Changed UI remains usable on phone-sized viewport. |

## Evidence Format

Use this format in PRs, issue comments, or `.ai/PROGRESS.md`:

```text
Tests:
- pnpm typecheck: pass
- pnpm lint: pass
- pnpm test:unit: pass
- pnpm build: pass

Manual verification:
- Chrome desktop 1280x720: changed flow works, no console errors
- Chrome mobile 390x844: changed flow works, no horizontal overflow
```

If a check was not run, say why. Do not imply unrun checks passed.
