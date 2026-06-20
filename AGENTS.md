# Agent Instructions

This repository is in maintenance mode for `testownik-web`, a completed static-hosted web app rewrite of Testownik.

The rewrite phases are complete. Future work should be driven by GitHub issues, maintenance tasks, dependency updates, and explicitly requested feature changes.

## Primary References

- Follow `.ai/PLAN.md` for the maintenance and GitHub issue workflow.
- Use `.ai/ISSUE_FIX_PLAN.md` as the template for issue-sweep plans created after reading current GitHub issues.
- Follow `.ai/TESTING.md` for required verification by change type.
- Follow `.ai/CODE_REVIEW.md` for review expectations and merge gates.
- Keep `.ai/PROGRESS.md` updated after merged maintenance work.
- Use `.ai/MIGRATION.md` as user-facing migration and troubleshooting documentation.
- Treat `testownik-web/` as the active application root.

## Product Invariants

- The app must remain a static-hosted web app that works on GitHub Pages.
- Quiz data, images, settings, and progress must stay local to the browser unless the user explicitly approves a future remote feature.
- Existing imported quizzes and saved progress in IndexedDB are production user data. Preserve them across deployments.
- Parser compatibility for existing Testownik quiz formats is a high-priority maintenance requirement.
- `save.json` import/export compatibility must not regress without an explicit documented decision.
- Desktop and mobile browsers are both supported targets.

## Workflow

- Work on a feature branch. Do not make code or documentation changes directly on `main`.
- Start every maintenance session by reading `.ai/PROGRESS.md`, checking the current branch/status, and fetching the relevant GitHub issues.
- For issue sweeps, read all open issues before planning. Create or update a detailed issue-by-issue plan using `.ai/ISSUE_FIX_PLAN.md` before implementing fixes.
- Fix one issue at a time unless issues are tightly coupled and share the same root cause.
- For bugs, reproduce or identify the root cause before changing code. Add a regression test when practical.
- For features, define acceptance criteria from the issue before coding. Ask one concise clarification question if the expected behavior is ambiguous.
- Prefer small, direct changes that preserve the existing architecture.
- Use current external-library documentation before changing framework, tool, CLI, or dependency behavior.
- If you start the application for testing, always use docker compose setup

## Before Committing

- Run the relevant checks from `.ai/TESTING.md` for the files and behavior changed.
- For app behavior changes, run at least typecheck, lint, affected automated tests, and build.
- For UI changes, include desktop and mobile verification notes.
- For persistence, parser, import, or compatibility changes, include targeted regression coverage.
- Do not commit knowingly broken parser compatibility, persistence, mobile layout, or static hosting behavior.

## Before Merging

- Spawn a subagent code review using `.ai/CODE_REVIEW.md`.
- If review finds blockers or majors, fix them, rerun the required checks, and repeat review until positive.
- Merge only after tests pass and review gates are satisfied.
- After merging, update `.ai/PROGRESS.md` with the issue numbers, scope, tests, review result, deployment status, and remaining follow-ups.
- After pushing to `main`, verify the GitHub Pages deploy workflow with `gh run list` and `gh run view` when runtime behavior changed.

## GitHub Issue Handling

- Use GitHub issues as the source of truth for maintenance priority unless the user gives a direct override.
- Do not close issues until the fix is merged and, for runtime bugs, deployed or otherwise verified.
- Leave issue comments only when they add useful status, reproduction findings, workaround notes, or release verification.
- Do not batch unrelated issue fixes into one PR unless the user explicitly asks.
