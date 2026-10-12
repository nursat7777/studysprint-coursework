# StudySprint

A quiet student workspace for coursework deadlines and focused study. React + TypeScript, Vite, browser-local storage, no paid APIs or account required.

## Features

- Create, edit, complete, reopen and confirm deletion of assignments with subject, due date, priority and notes.
- See total, overdue, due-today and completed counts; search and combine status/priority filters; sort by due date or priority.
- Run a 1–120 minute focus session, optionally linked to an assignment. Pause, resume or reset; completed sessions persist.
- Export JSON backups, validate imports completely before confirmed replacement, or explicitly try demo assignments when the list is empty.
- Recover corrupt saved data through a confirmed valid backup import or explicit destructive reset.

## Install and run

Requires Node.js 20.19+ or 22.12+ and npm. From the repository root:

```bash
npm ci
npm run dev
```

Open the URL printed by Vite (normally `http://127.0.0.1:5173`). No environment variables or credentials are needed for the application.

```bash
npm test
npm run typecheck
npm run build
npm run format:check
```

The production bundle is generated in `dist/`. To inspect that build on your own machine, use `npm run preview` and open its printed loopback URL. Server/browser visual startup was not verified in the managed development environment; automated jsdom tests and production compilation were executed.

## Two-minute demonstration

1. Start with an empty browser and click **Try demo assignments**. Confirm one overdue task, one due today, and one future task.
2. Create an assignment. Edit its title, complete it, then reopen it. Search by subject and combine status/priority filters; **Clear filters** restores the list without changing summary counts.
3. Set **Focus duration** to **1**, choose an assignment and start. Pause, resume, then let it finish. Verify one saved session. Reload: saved data returns and an unfinished timer restores paused.
4. **Export backup**. Import the exported file, cancel replacement first and verify unchanged data. Import again and confirm; timer restores paused. A malformed JSON file must show an error without replacing data.
5. Delete an assignment, cancelling first, then confirming. Demo seeding disappears when any assignment exists.

## Data and limits

Records stay in the current browser/device; there is no cloud sync, account, notification service or shared database. Clearing browser data removes them, so keep exported backups. Backup import replaces all assignments, sessions and settings after confirmation; upload limit is 1 MB. Version 1 timestamps use canonical UTC ISO strings; assignment due dates use local calendar dates. Historical deleted task links appear as unlinked sessions. The timer counts while the tab runs; background throttling may slow it. Refresh restores it paused without counting elapsed wall time. The panel shows the latest five finished sessions and total count; export retains all history. Failed storage writes show an alert and preserve prior saved data.

## AI-native development documentation

| File | Purpose |
| --- | --- |
| `AGENTS.md` | Shared agent instructions (the article uses the plural filename) |
| `CLAUDE.md` | Directs compatible agents to shared instructions |
| `chat-brainstorm.md` | Genuine available conversation and explicitly provisional assistant decisions |
| `_docs/plan.md` | Product requirements and scope |
| `_docs/tech-options.md` | Technology options and choice |
| `_docs/architecture.md` | Data, modules, persistence and backup policies |
| `_docs/process.md` | PM → engineer → independent QA workflow |
| `_docs/tasks.md` | Initial draft backlog |
| `_docs/task-template.md` | Goal / acceptance criteria / out-of-scope / constraints template |
| `_docs/team/pm.md` | PM grooming and verification responsibilities |
| `_docs/team/software-engineer.md` | Implementation and handoff responsibilities |
| `_docs/team/qa-engineer.md` | Independent acceptance verification responsibilities |
| `_docs/design-system.md` | Implemented visual/accessibility rules |
| `_docs/testing-guidelines.md` | Reproducible test instructions and browser-check limitations |
| `_docs/api.md` | Local TypeScript/data interfaces; no HTTP API |
| `_docs/source-review.md` | Source access and methodology evidence |
| `_docs/implementation-log.md` | Actual engineer commands/results and handoffs |
| `_docs/qa/01.md`–`06.md` | Independent per-draft QA acceptance evidence |
| `_docs/code-review.md` | Independent review findings and their resolution |
| `_docs/compliance.md` | Completed/provisional/blocked requirement checklist |
| `_docs/issues/01.md`–`07.md` | Reviewed specifications; drafts are not proof of actual GitHub issues |
| `SUBMISSION_STEPS.md` | Remaining publication and submission actions |

The user delegated autonomous progress; submission timing is private at their request. App choice and product details are assistant defaults, **not user-approved interview answers**. Full spoken video content and real-browser visual verification remain unavailable; see source/QA notes. Local drafts 01–06 passed independent QA: 28 application tests, 7 publication safety tests, typecheck, production build and formatting checks. All 140 local acceptance checks are recorded in `_docs/qa-results.json`. Publication, real issue readback, public visibility, pushed commits and actual deadline comparison require authenticated GitHub operations; do not infer those from local drafts.

## GitHub publication helper

`scripts/publish_github.py` automates real repository/issue publication only with an authenticated GitHub CLI; inspect `SUBMISSION_STEPS.md` for its exact commands and safety requirements. Run its local safety checks with `python -m unittest discover -s scripts -p 'test_*.py' -v`. Creating issue descriptions locally does not create remote issues. Actual remote evidence belongs in a verified publication record, not invented timestamps.

## Storage test portability follow-up

The original release passed 28 tests. After a user reported missing `localStorage` in a newer Node test environment, test setup now explicitly installs a shared test-only Storage API. Independent follow-up QA on Node 24.19.0 passed all 30 tests, typecheck, production build and formatting checks. Production persistence is unchanged. The user's macOS rerun and Node 25+ execution remain unverified; see `_docs/qa/storage-regression.md`.


The user subsequently reported 28 tests passing on macOS after the storage patch. Public publication uses three genuine new snapshot-publication stages; original development history remains private and is not reconstructed as public activity.
