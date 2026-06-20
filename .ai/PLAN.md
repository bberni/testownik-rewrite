# Testownik Web Maintenance Plan

## Goal

Maintain and extend the completed Testownik Web app through GitHub issues, small feature updates, dependency maintenance, and production bug fixes.

This file replaces the rewrite-phase plan. The default agent workflow is now: fetch all current issues, triage them, create a detailed issue-by-issue plan, fix one issue at a time, verify, review, merge, deploy, and update progress.

## Active App

| Area | Location |
|---|---|
| App root | `testownik-web/` |
| Source | `testownik-web/src/` |
| Domain logic | `testownik-web/src/domain/` |
| Browser adapters | `testownik-web/src/platform/` |
| Vue UI | `testownik-web/src/ui/` |
| Tests | `testownik-web/tests/` |
| Deploy workflow | `.github/workflows/deploy.yml` |
| Live app | `https://bberni.github.io/testownik-rewrite/` |

## Maintenance Principles

| Principle | Requirement |
|---|---|
| Static hosting | Keep the app deployable as static files under GitHub Pages. |
| Local privacy | Do not upload quiz content or progress to a remote service unless explicitly approved. |
| Data safety | Treat IndexedDB data as persistent production data. Schema changes need migrations and tests. |
| Compatibility | Preserve parser behavior and `save.json` import/export compatibility. |
| Mobile support | Keep phone-sized layouts and touch flows usable. |
| Minimality | Prefer the smallest correct fix over broad rewrites. |
| Evidence | Every issue fix should include reproduction notes or root-cause evidence and test evidence. |

## Issue Sweep Workflow

### 1. Prepare The Workspace

Run these checks before planning issue work:

```bash
git status --short --branch
gh issue list --state open --limit 200 --json number,title,state,labels,assignees,milestone,updatedAt,url
```

If the workspace has unrelated changes, leave them alone. If they conflict with the intended issue work, ask the user how to proceed.

### 2. Read All Issues

For each open issue, fetch complete details before creating the plan:

```bash
gh issue view <number> --json number,title,state,body,comments,labels,assignees,milestone,updatedAt,url
```

Read closed issues only when an open issue may be a duplicate, regression, or follow-up.

Useful search command when duplicates or regressions are suspected:

```bash
gh search issues "<keywords>" --repo bberni/testownik-rewrite --state all --json number,title,state,url,updatedAt
```

### 3. Triage

Assign every issue a type, priority, affected area, and confidence level.

| Field | Values |
|---|---|
| Type | `bug`, `regression`, `feature`, `compatibility`, `docs`, `test`, `dependency`, `maintenance` |
| Priority | `blocker`, `high`, `medium`, `low` |
| Area | `parser`, `quiz-engine`, `persistence`, `import`, `quiz-ui`, `landing-ui`, `mobile`, `ci-deploy`, `docs`, `dependencies` |
| Confidence | `confirmed`, `likely`, `needs-repro`, `needs-clarification` |

Priority order:

| Priority | Criteria |
|---|---|
| `blocker` | Production unavailable, deploy broken, user data loss, security/privacy issue. |
| `high` | Reproducible core quiz flow bug, parser/import regression, save/progress corruption, severe mobile breakage. |
| `medium` | Normal UI bug, accessibility issue, incomplete feature, missing coverage for important behavior. |
| `low` | Cosmetic issue, documentation cleanup, small enhancement, non-urgent refactor. |

### 4. Create The Detailed Fix Plan

Create or update an issue plan using `.ai/ISSUE_FIX_PLAN.md` before writing code.

The plan must include:

| Section | Required content |
|---|---|
| Issue inventory | All open issues with number, title, type, priority, area, and status. |
| Work order | The exact order issues will be fixed and why. |
| Per-issue diagnosis | Reproduction path, expected behavior, actual behavior, suspected root cause, and affected files. |
| Per-issue implementation | Smallest proposed fix, test plan, manual verification, and close criteria. |
| Risk notes | Data, compatibility, mobile, deployment, and dependency risks. |
| Deferrals | Issues not being fixed in this pass and why. |

Do not turn the generic plan into a code implementation. The issue plan is a working document that guides implementation.

### 5. Fix One Issue At A Time

For each issue in the approved work order:

| Step | Requirement |
|---|---|
| Reproduce | Confirm the bug or derive a root-cause reproduction from code/tests. |
| Baseline | Run the smallest relevant failing test or manual flow when practical. |
| Implement | Make the smallest correct code change. Preserve architecture boundaries. |
| Test | Add or update automated regression coverage when practical. |
| Verify | Run the relevant commands from `.ai/TESTING.md`. |
| Review | Run a code review subagent before merge. |
| Record | Update `.ai/PROGRESS.md` after merge. |

If a fix reveals that the issue report is inaccurate, update the plan with the finding before continuing.

### 6. Branch And PR Shape

Default branch naming:

| Work type | Branch pattern |
|---|---|
| Single issue bug | `fix/issue-<number>-short-name` |
| Single feature | `feature/issue-<number>-short-name` |
| Docs only | `docs/issue-<number>-short-name` |
| Dependency update | `deps/<package-or-group>` |
| Small related batch | `maintenance/<short-theme>` |

Default PR shape:

| Field | Requirement |
|---|---|
| Title | Include issue number when applicable. |
| Summary | Explain user-visible behavior change. |
| Tests | List exact commands and manual checks. |
| Screenshots | Required for visible UI changes. |
| Data impact | Required for persistence or import changes. |
| Deployment | State whether GitHub Pages verification is required. |

Only commit, push, open PRs, merge, or close issues when the user explicitly asks or the current task explicitly includes that responsibility.

## Feature Update Workflow

Feature issues follow the same issue workflow with extra acceptance work.

Before implementation, define:

| Item | Requirement |
|---|---|
| User story | Who benefits and what problem is solved. |
| Acceptance criteria | Observable behavior that marks the feature complete. |
| Non-goals | What the feature intentionally does not include. |
| Data impact | New records, migrations, export/import changes, or storage growth. |
| Mobile behavior | How the feature works on phone-sized screens. |
| Static hosting impact | Confirmation that no server-only behavior is introduced. |

Feature changes that add dependencies require current documentation checks and a short justification.

## Architecture Rules

| Layer | Rule |
|---|---|
| `domain/` | Pure TypeScript only. No Vue, DOM, IndexedDB, File, Blob, timers, or browser globals. |
| `platform/` | Browser APIs, persistence, file import, asset handling, download, visibility. No quiz UI decisions. |
| `ui/` | Vue components, pages, stores, composables, and styles. Do not bypass stores to access persistence from components. |
| `tests/` | Fixtures and tests. Do not import from tests in production code. |

Persistent schema rules:

| Rule | Requirement |
|---|---|
| Versioning | Keep persisted records or stores versioned. |
| Migration | Any IndexedDB schema version change must include migration tests. |
| Deletes | Deleting a quiz must also remove sessions, assets, and recents for that quiz. |
| Object URLs | Store Blobs, create object URLs at display time, revoke them on cleanup. |

## Common Maintenance Areas

| Area | First files to inspect |
|---|---|
| Quiz page keyboard/touch flow | `src/ui/pages/QuizPage.vue`, `src/ui/stores/quizSession.ts`, quiz components. |
| Parser behavior | `src/domain/parseQuestionFile.ts`, parser unit tests. |
| Quiz engine/repetition | `src/domain/quizEngine.ts`, `src/domain/quizSession.ts`, engine tests. |
| Import pipeline | `src/platform/files/importPipeline.ts`, file adapters, import tests. |
| Persistence/autosave | `src/platform/persistence/`, `src/ui/stores/quizSession.ts`, integration tests. |
| Assets/images | `src/platform/assets/`, `src/ui/composables/useAssetUrls.ts`, quiz image components. |
| Landing/library | `src/ui/pages/LandingPage.vue`, landing components, quiz library store. |
| CI/deploy | `.github/workflows/deploy.yml`, `vite.config.ts`, package scripts. |

## Done Criteria

An issue or feature is done when:

| Area | Requirement |
|---|---|
| Behavior | The reported behavior is fixed or the requested feature meets acceptance criteria. |
| Regression | Automated coverage exists where practical, or a clear reason is recorded. |
| Verification | Required checks from `.ai/TESTING.md` pass. |
| Review | `.ai/CODE_REVIEW.md` review gates pass. |
| Docs | User-facing behavior changes are reflected in README or `.ai/MIGRATION.md` when relevant. |
| Progress | `.ai/PROGRESS.md` is updated after merge. |
| Deploy | Runtime changes are verified on GitHub Pages after main deploy when required. |
