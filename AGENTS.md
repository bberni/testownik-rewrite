# Agent Instructions

This repo is for rewriting `testownik-electron` into a modern static-hosted web app.

## Primary References

- Follow `.ai/PLAN.md` for implementation scope, architecture, phases, and tech stack.
- Follow `.ai/TESTING.md` for required verification before commits and merges.
- Follow `.ai/CODE_REVIEW.md` for review expectations and merge gates.
- Keep `.ai/PROGRESS.md` updated after merges.
- Use `testownik-electron/` as the reference implementation for legacy behavior, parser details, quiz flow, settings, themes, and UI behavior.

## Workflow

- Work on a feature branch. Do not make implementation changes directly on the main branch.
- Keep changes small and aligned with the current phase in `.ai/PLAN.md`.
- Read the progress from `.ai/PROGRESS.md` to know from which point on to continue.
- Preserve feature parity with the Electron reference where the plan requires it.
- Prefer pure domain logic for parser and quiz engine code; isolate browser APIs in platform/adapters.
- Keep mobile support as a required target, not an optional follow-up.

## Before Committing

- Run the relevant checks from `.ai/TESTING.md` for the files and behavior changed.
- For broad app changes, run the full required test suite listed in `.ai/TESTING.md`.
- For frontend UI changes, include mobile coverage and chrome-devtools MCP inspection notes as required by `.ai/TESTING.md`.
- Do not commit changes that knowingly break parser compatibility, persistence, mobile layout, or static hosting.

## Before Merging

- Spawn a subagent to perform a code review using `.ai/CODE_REVIEW.md`.
- If the review is negative, fix the findings, rerun the required tests from `.ai/TESTING.md`, and run the subagent code review again.
- Repeat the fix, test, and review loop until the review is positive.
- Merge only after tests pass and the code review gates are satisfied.
- After merging, write the current implementation progress, merged scope, tests run, and next recommended step in `.ai/PROGRESS.md`.
- Push to the remote repository after a successful merge. Use `git push origin main`.
