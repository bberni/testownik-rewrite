# GitHub Issue Fix Plan Template

Use this file as the working template for an issue sweep. Before implementing fixes, an agent should read all open GitHub issues, copy this template into a concrete plan, and fill it with the current issue inventory.

Do not pre-fill this file with stale issue details. GitHub issues are the source of truth at the start of each maintenance session.

## Source Commands

Record the commands used to build the plan:

```bash
gh issue list --state open --limit 200 --json number,title,state,labels,assignees,milestone,updatedAt,url
gh issue view <number> --json number,title,state,body,comments,labels,assignees,milestone,updatedAt,url
```

## Issue Inventory

| Issue | Title | Type | Priority | Area | Confidence | Status |
|---|---|---|---|---|---|---|
| `#<number>` | `<title>` | `bug` | `high` | `quiz-ui` | `needs-repro` | `planned` |

Status values:

| Status | Meaning |
|---|---|
| `planned` | Included in current pass. |
| `blocked` | Needs user input, missing repro assets, or depends on another fix. |
| `deferred` | Valid but intentionally not handled in this pass. |
| `duplicate` | Should be linked to another issue. |
| `not-reproducible` | Current evidence does not reproduce the issue. |

## Work Order

| Order | Issue | Reason |
|---|---|---|
| 1 | `#<number>` | `<why this comes first>` |

Default ordering:

| Order | Class |
|---|---|
| 1 | Security, privacy, data loss, deploy-down issues. |
| 2 | Reproducible core quiz flow regressions. |
| 3 | Parser, import, persistence, and compatibility issues. |
| 4 | Mobile, accessibility, and visible UI issues. |
| 5 | Feature requests and enhancements. |
| 6 | Docs, tests, cleanup, and dependencies. |

## Per-Issue Plan

Copy this section once per planned issue.

### Issue `#<number>`: `<title>`

| Field | Details |
|---|---|
| Type | `<bug/feature/docs/dependency/etc>` |
| Priority | `<blocker/high/medium/low>` |
| Area | `<affected area>` |
| Current status | `<planned/blocked/deferred>` |
| User impact | `<what the user experiences>` |
| Expected behavior | `<desired result>` |
| Actual behavior | `<reported or reproduced result>` |
| Reproduction path | `<steps, fixture, viewport, browser, or code path>` |
| Root-cause hypothesis | `<suspected cause before coding>` |
| Affected files | `<likely files>` |
| Smallest fix | `<intended implementation approach>` |
| Regression coverage | `<unit/component/integration/e2e/manual coverage>` |
| Manual verification | `<browser, viewport, deployed check if needed>` |
| Risks | `<data, compatibility, mobile, deploy, dependency>` |
| Close criteria | `<what must be true before closing the issue>` |

## Cross-Issue Notes

Record any shared root causes, shared tests, duplicate issues, or ordering constraints.

## Deferrals

| Issue | Reason | Next action |
|---|---|---|
| `#<number>` | `<why deferred>` | `<what should happen later>` |

## Verification Summary

Fill this after implementation and before merge.

| Check | Result |
|---|---|
| Typecheck | `<command and result>` |
| Lint | `<command and result>` |
| Unit tests | `<command and result>` |
| Integration tests | `<command and result>` |
| Component tests | `<command and result>` |
| E2E tests | `<command and result or reason not run>` |
| Mobile verification | `<result or reason not run>` |
| Build | `<command and result>` |
| Code review | `<subagent result>` |
| Deploy verification | `<required/result/not required>` |
