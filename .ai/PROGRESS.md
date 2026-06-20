# Maintenance Progress

Use this file to record the current project state after each merged maintenance change.

## Current Status

| Area | Status |
|---|---|
| Rewrite | Complete. The old rewrite phases are closed. |
| Active app | `testownik-web/` |
| Deployment | GitHub Pages via `.github/workflows/deploy.yml` |
| Runtime URL | `https://bberni.github.io/testownik-rewrite/` |
| Workflow | Future work is issue-driven using `.ai/PLAN.md` and `.ai/ISSUE_FIX_PLAN.md`. |

## Current Known Maintenance Backlog

These are persistent follow-ups from the completed rewrite and later maintenance. GitHub issues remain the source of truth for active work.

| Area | Follow-up |
|---|---|
| E2E coverage | Existing Playwright coverage is minimal and should grow around real quiz flows. |
| Manual QA | Real historical quiz fixtures are still valuable for import, images, Windows-1250, save import/export, and full solve flows. |
| Accessibility | Modal focus trapping and focus restoration can be improved. |
| UI polish | Some legacy animations and image-failure states are incomplete. |
| PWA | Deferred unless a future issue explicitly prioritizes install/offline update behavior. |

## After Each Merge

Add a new entry at the top of the log with:

| Field | Required content |
|---|---|
| Date and branch | Merge date and branch name. |
| Issues | GitHub issue numbers or direct task reference. |
| Scope | What changed and why. |
| Tests | Exact commands and manual checks run. |
| Review | Subagent code review verdict and important notes. |
| Deploy | GitHub Pages workflow and live-site verification when required. |
| Follow-ups | Remaining risks, deferred work, or recommended next issue. |

Template:

```md
## YYYY-MM-DD - <branch>

**Issues:** #<number>

**Scope:**
- <what changed>

**Tests and checks:**
- `<command>` - pass/fail
- Manual: <browser/viewport/flow/result>

**Code review:** <PASS/PASS WITH NOTES/NEEDS CHANGES/BLOCKED>

**Deploy:** <not required / workflow run URL / live verification notes>

**Follow-ups:**
- <remaining risk or next step>
```

---

## 2026-06-20 - fix/issue-19-answer-flash-key

**Issues:** #19

**Scope:**
- Fixed correct-answer green flash on spacebar question transition in quiz flow.
- Root cause: Vue reused DOM elements for answer `<label>` when `:key="answer.id"` overlapped between questions. Old `--correct` CSS class animated via 150ms transition.
- Fix: composite key `\`${questionTag}-${answer.id}\`` prevents DOM reuse across questions.
- Also reset `revealedCorrectIds` and `revealedSelectResults` in `pickNext()` (latent stale-data bug).

**Tests and checks:**
- `pnpm typecheck` — pass
- `pnpm lint` — pass
- `pnpm test:unit` — 109/109 pass
- `pnpm test:integration` — 28/28 pass
- `pnpm test:components` — 15/15 pass
- `pnpm build` — pass
- Manual: Chrome DevTools via Docker — imported 5-question fixture, transitioned through 3+ questions via spacebar, no leaked `--correct`/`--wrong`/`--missed` classes, fresh DOM elements per question, zero console errors

**Code review:** PASS WITH NOTES — `revealedSelectResults` reset and `?? ''` fallback applied before merge.

**Deploy:** Workflow #31 — success.

**Follow-ups:**
- No remaining risks from this fix.

---

## Baseline - Completed Rewrite

The rewrite completed through CI/CD and GitHub Pages deployment verification. Historical phase-by-phase details remain available in git history. Future entries in this file should describe maintenance merges, not old rewrite phases.
