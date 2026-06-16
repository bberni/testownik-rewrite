# Testownik Web Rewrite Code Review Guidelines

## Review Priorities

Reviewers should focus on behavior preservation, data safety, browser compatibility, and maintainability.

Priority order:

| Priority | Review focus |
|---|---|
| 1 | User data is not lost or corrupted. |
| 2 | Legacy quiz formats keep working. |
| 3 | Static web constraints are respected. |
| 4 | Browser fallbacks are implemented and tested. |
| 5 | Code is simple, typed, and maintainable. |
| 6 | UI remains accessible and understandable. |

## Required PR Information

Every implementation PR should include:

| Item | Requirement |
|---|---|
| Scope | Short description of changed feature or layer. |
| Testing | Exact commands run and result. |
| User impact | Any behavior change from Electron app. |
| Data impact | Any IndexedDB schema, migration, or save format change. |
| Screenshots | Required for visible UI changes. |
| Browser notes | Required for file import, storage, or browser API changes. |

## Blockers

Do not approve if any blocker is present.

| Blocker | Why it blocks |
|---|---|
| Domain logic depends on Vue, DOM, IndexedDB, File, or Blob | Core behavior becomes hard to test and port. |
| Code assumes `showDirectoryPicker` exists | Breaks Firefox/Safari and static fallback strategy. |
| Quiz data is uploaded remotely | Violates local/private product model. |
| Autosave can overwrite or delete unrelated sessions unexpectedly | Risks user progress. |
| IndexedDB schema changes without migration tests | Risks persistent data loss. |
| Parser changes without fixture tests | Risks legacy quiz compatibility. |
| Object URLs are stored persistently | Object URLs are session-local and invalid after reload. |
| Binary assets are eagerly loaded for the whole library | Causes memory/performance issues. |
| Tests are removed or weakened to pass CI | Masks regressions. |
| Production build fails | Static hosting requirement not met. |

## Architecture Review Checklist

Check layering:

| Question | Expected answer |
|---|---|
| Is parser logic in `domain/`? | Yes. |
| Is quiz engine logic independent from Vue? | Yes. |
| Are browser APIs isolated in `platform/`? | Yes. |
| Do UI components call repositories through stores/services? | Yes. |
| Are persistence schemas versioned? | Yes. |
| Is randomness injected for testability? | Yes. |
| Are imports path-normalized? | Yes. |

Prefer small, direct modules. Do not add broad abstractions before there are multiple real implementations.

## Parser And Compatibility Review

Parser changes require careful review against legacy behavior.

Checklist:

| Check | Requirement |
|---|---|
| `X` parser | Correct answer mask remains zero-index mapped from first line after `X`. |
| `Y` parser | Correct option digits remain zero-index mapped. |
| Placeholder syntax | Existing `{wybor N}` or exact legacy spelling is preserved. |
| Image syntax | `[img]...[/img]` extraction remains compatible. |
| Blank lines | Filtering matches legacy behavior. |
| Tags | Question tag remains source filename. |
| Encodings | UTF-8 and Windows-1250 fixtures pass. |
| Save JSON | Compatible export omits questions. |

Any intentional compatibility break must be documented in `.ai/PLAN.md` or release notes before approval.

## Quiz Engine Review

Check behavior against tests and legacy semantics.

Checklist:

| Check | Requirement |
|---|---|
| Correct single answer | Selected IDs and correct IDs compare order-independently. |
| Correct select answer | Every select must match its correct option. |
| Correct answer count | Increments only after accepted correct answer. |
| Bad answer count | Increments only after accepted incorrect answer. |
| Reoccurrence decrement | Correct answer decrements by exactly one. |
| Learned count | Increments exactly when reoccurrence reaches zero. |
| Bad answer increment | Uses current setting. |
| Max cap | Never exceeds max reoccurrences. |
| Completion | Quiz finishes when no reoccurrence value is greater than zero. |
| Timer | Does not keep running after finish or page disposal. |

## Persistence Review

Persistent browser data is production data. Treat it like a database.

Checklist:

| Check | Requirement |
|---|---|
| Schema version | Every stored record has a schema version or belongs to a versioned store. |
| Migrations | Version changes include tests. |
| Transactions | Multi-record writes use transactions where consistency matters. |
| Deletes | Deleting a quiz removes sessions, assets, and recents for that quiz. |
| Quota errors | User gets actionable feedback. |
| Missing data | App fails gracefully on missing assets or corrupt records. |
| Privacy | No analytics or remote persistence without explicit future decision. |
| Backup/export | Exported data has documented shape. |

Autosave review:

| Check | Requirement |
|---|---|
| Answer autosave | Happens after state update. |
| Timer autosave | Batched to avoid excessive writes. |
| Route change | Active progress saved or already current. |
| Reload | Latest saved state restores correctly. |

## Browser API Review

Browser API usage must be feature-detected and permission-aware.

Checklist:

| API | Requirement |
|---|---|
| File System Access | Guard with capability checks and user activation. |
| Directory picker | Fallback exists when unavailable. |
| File input | Supports directory import through `webkitdirectory` where available. |
| Drag/drop | Does not assume `path` exists on dropped files. |
| Blob URLs | Created only at display time and revoked on cleanup. |
| IndexedDB | Open errors and blocked upgrades are handled. |
| Unload | Do not rely on custom modal during tab close. Autosave instead. |

## UI Review

Checklist:

| Area | Requirement |
|---|---|
| Landing page | Import and quiz list states are clear. |
| Recent quizzes | Continue/start/delete/export actions are understandable. |
| Quiz page | Accept/next state is visually obvious. |
| Modals | Close behavior, Escape key, and focus are sane. |
| Themes | Dark, light, and legacy themes remain usable. |
| Responsive layout | Desktop, tablet, and mobile widths are not broken. |
| Mobile UX | Phone-sized screens have visible primary controls, readable content, and no unintended horizontal scrolling. |
| Touch UX | Primary interactions work with touch and do not depend on hover. |
| Loading states | Import and persistence operations show feedback. |
| Error states | Parser/import/storage errors are actionable. |

Do not approve UI that only works at one desktop size unless the PR is explicitly scoped to non-UI domain work. UI PRs must include chrome-devtools MCP inspection notes for desktop and mobile viewports, or reference automated coverage that exercises the same states.

## Accessibility Review

Checklist:

| Check | Requirement |
|---|---|
| Buttons | Icon-only buttons have accessible names. |
| Keyboard | Core quiz flow works without pointer input. |
| Focus | Opening/closing modals does not lose focus unexpectedly. |
| Dialog semantics | Modals use appropriate role/ARIA if custom. |
| Color states | Correct/wrong states are readable and not only color-dependent where practical. |
| Form labels | Settings inputs have labels. |
| Reduced motion | Avoid disruptive transitions; respect reduced motion if added. |
| Touch accessibility | Mobile controls are large enough to tap and do not rely on hover-only affordances. |

## Testing Review

For each PR, verify tests match the change.

Required tests by change type:

| Change type | Required tests |
|---|---|
| Parser | Domain unit tests with fixtures. |
| Quiz engine | Deterministic unit tests. |
| Persistence | Repository integration tests and migration tests if schema changes. |
| Import | Integration tests for success and failure paths. |
| UI component | Component tests or E2E coverage. |
| Browser API | Feature-available and feature-unavailable tests. |
| Mobile UI | Playwright mobile coverage plus chrome-devtools MCP inspection notes. |
| Styling/theme | Screenshots or visual/manual QA notes. |
| Deployment | Production build and preview smoke test. |

A PR can rely on existing tests only if the reviewer can point to the exact tests covering the changed behavior.

## Performance Review

Checklist:

| Check | Requirement |
|---|---|
| Import | Large imports do not perform unnecessary repeated parsing. |
| Storage | Binary assets are not duplicated without reason. |
| Rendering | Quiz list does not load all image blobs. |
| Mobile rendering | Low-width layouts do not require unnecessary heavy DOM duplication. |
| Object URLs | Revoked when no longer needed. |
| Autosave | Writes are batched where appropriate. |
| Bundle size | New dependencies are justified. |

Before adding any dependency, answer:

| Question | Required answer |
|---|---|
| Is it needed for core behavior? | Yes, or reject. |
| Can the browser platform handle this directly? | If yes, prefer platform for small cases. |
| Is it actively maintained? | Must be checked before adoption. |
| Does it affect static hosting? | Must not require a server. |

## Security And Privacy Review

Checklist:

| Check | Requirement |
|---|---|
| Local-only data | Quiz content and progress stay in browser storage. |
| No remote uploads | No network persistence unless explicitly approved later. |
| External links | Open safely and clearly. |
| User files | File names and contents are handled as untrusted input. |
| HTML content | Quiz text is rendered as text, not unsanitized HTML. |
| Asset URLs | Only use Blob/object URLs or static bundled assets. |

## Review Comment Style

Use direct, actionable findings.

Preferred format:

```text
[severity] file:line - Issue summary.

Why it matters and what should change.
```

Severity levels:

| Severity | Meaning |
|---|---|
| blocker | Must fix before merge. |
| major | Should fix before merge unless explicitly accepted. |
| minor | Small correctness, clarity, or maintainability issue. |
| nit | Optional style/readability suggestion. |

Reviews should prioritize bugs, data loss, compatibility regressions, and missing tests over style preferences.

## Merge Checklist

Before approving, confirm:

| Check | Required |
|---|---|
| Typecheck passes | Yes. |
| Lint passes | Yes. |
| Relevant tests pass | Yes. |
| Mobile tests or inspection completed for UI changes | Yes. |
| Production build passes | Yes for app changes. |
| No unexpected Electron/Node dependency added | Yes. |
| No unreviewed persistence schema change | Yes. |
| User-facing behavior documented if changed | Yes. |
| Screenshots included for UI changes | Yes. |
| chrome-devtools MCP notes included for frontend UI changes | Yes. |

If any required item is missing, request changes rather than approving with assumptions.
