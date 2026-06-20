# Testownik Web Code Review Guidelines

## Review Goal

Review maintenance changes for bugs, data loss, compatibility regressions, browser behavior, mobile usability, and static hosting safety.

Findings are the primary output. Order findings by severity and include file and line references whenever possible.

## Severity Levels

| Severity | Meaning |
|---|---|
| `blocker` | Must fix before merge. The change can break production, lose data, violate privacy, or fail required build/tests. |
| `major` | Should fix before merge. The change likely causes a user-visible bug, compatibility regression, or important missing test. |
| `minor` | Small correctness, maintainability, accessibility, or coverage issue. |
| `nit` | Optional readability or style suggestion. |

Preferred finding format:

```text
[severity] path/to/file.ts:123 - Short issue summary.

Why it matters and what should change.
```

## Required Review Context

Before review, inspect:

| Item | Requirement |
|---|---|
| Issue | Read linked issue body, comments, and acceptance criteria. |
| Plan | Read `.ai/ISSUE_FIX_PLAN.md` if this is part of an issue sweep. |
| Diff | Review all changed files, not only latest edits. |
| Tests | Check exact commands run and whether they match `.ai/TESTING.md`. |
| Runtime risk | Identify whether deploy or browser verification is required. |

## Blockers

Do not approve if any blocker is present.

| Blocker | Why it blocks |
|---|---|
| Production build fails | Static hosting requirement is broken. |
| Typecheck or lint fails without justification | CI and maintainability are degraded. |
| Tests are removed or weakened to pass | Regression protection is lost. |
| Domain logic depends on Vue, DOM, IndexedDB, File, Blob, timers, or browser globals | Core behavior becomes hard to test and reason about. |
| Browser APIs are used without feature detection where support varies | Firefox, Safari, or mobile users may break. |
| Quiz data is sent remotely without explicit approval | Violates the local/private product model. |
| Autosave can overwrite, delete, or corrupt unrelated sessions | User progress is at risk. |
| IndexedDB schema changes without migration tests | Persistent user data is at risk. |
| Parser behavior changes without fixture coverage | Existing quiz compatibility is at risk. |
| Object URLs are stored persistently | Reload behavior will break because object URLs are session-local. |
| Binary assets are eagerly loaded for the whole library | Memory and performance risk. |
| UI-only change has no desktop/mobile verification | Responsive support cannot be trusted. |

## Architecture Checklist

| Check | Expected result |
|---|---|
| Domain purity | Parser, quiz engine, encoding, and compatibility logic remain pure TypeScript. |
| Browser isolation | IndexedDB, File APIs, Blob URLs, downloads, and visibility listeners stay in `platform/` or composables. |
| UI boundaries | Components use stores/composables rather than raw persistence modules when practical. |
| Persistence shape | Stored data remains versioned and migration-aware. |
| Randomness | Quiz question selection remains testable. |
| Paths | Imported paths are normalized and do not assume absolute local paths. |
| Dependencies | New dependencies are justified and compatible with static hosting. |

## Compatibility Checklist

| Area | Review requirement |
|---|---|
| `X` parser | Correct-answer mask mapping remains compatible. |
| `Y` parser | Placeholder and correct option mapping remains compatible. |
| Images | `[img]...[/img]` extraction and asset resolution remain compatible. |
| Encodings | UTF-8 and Windows-1250 behavior remains covered. |
| Tags | Question tags continue to match source filenames where required for save compatibility. |
| Blank lines | Filtering behavior remains intentional and tested. |
| `save.json` | Import/export shape remains compatible unless a change is explicitly documented. |

## Persistence Checklist

| Check | Requirement |
|---|---|
| Migrations | Schema changes preserve old data and include tests. |
| Transactions | Multi-record writes use transactions where consistency matters. |
| Deletes | Quiz delete cascades to sessions, assets, and recents. |
| Autosave | Saves after answer changes and batches timer writes. |
| Restore | Reload can restore the latest valid session. |
| Errors | Quota, blocked storage, corrupt records, and missing data fail gracefully. |
| Privacy | No analytics or remote persistence without explicit approval. |

## UI And Accessibility Checklist

| Area | Requirement |
|---|---|
| Quiz flow | Accept/next states are clear and cannot accidentally leak answers. |
| Keyboard | Space, number keys, numpad, Escape, and focus behavior remain sane where relevant. |
| Touch | Primary actions work by touch and do not depend on hover. |
| Mobile | Phone-sized viewport has visible primary controls and no unintended horizontal scroll. |
| Modals | Dialog semantics, close behavior, Escape handling, and focus behavior are acceptable. |
| Themes | Dark, light, and legacy themes remain readable. |
| Color | Correct/wrong states are readable and not only color-dependent where practical. |
| Errors | User-facing errors are actionable. |

## Testing Checklist

Check tests against the changed behavior, not against a generic list.

| Change type | Review expectation |
|---|---|
| Bug fix | Reproduction or root-cause evidence plus regression test when practical. |
| Parser/engine | Domain unit tests. |
| Persistence/import | Integration tests and migration tests when schema changes. |
| Vue component | Component test or E2E coverage. |
| Browser flow | Playwright or manual browser verification. |
| Mobile UI | Mobile viewport verification and notes. |
| Deployment | Production build and deploy workflow verification when runtime behavior changes. |

A PR can rely on existing tests only if the reviewer can identify the tests covering the changed behavior.

## Review Output

Return one of these verdicts:

| Verdict | Meaning |
|---|---|
| `PASS` | No findings requiring changes. |
| `PASS WITH NOTES` | Only minor or nit findings. |
| `NEEDS CHANGES` | One or more major findings. |
| `BLOCKED` | One or more blocker findings. |

If no findings are discovered, state that explicitly and mention residual risks or tests not run.

## Merge Checklist

Before merge, confirm:

| Check | Required |
|---|---|
| Linked issue or explicit task | Yes. |
| Scope is small and coherent | Yes. |
| Required tests pass | Yes. |
| Mobile verification exists for UI changes | Yes. |
| Production build passes for app changes | Yes. |
| Data migration reviewed for persistence changes | Yes. |
| User-facing docs updated when behavior changes | Yes. |
| `.ai/PROGRESS.md` update is prepared for after merge | Yes. |
