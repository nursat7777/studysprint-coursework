# Development process
1. Product discovery: genuine chat, one question at a time where time and user availability permit; label autonomous defaults and incomplete interview.
2. Save product plan and initialize Git; commit before technical planning.
3. Compare technical options, choose architecture, draft small initial tasks. First task is an empty working project with a passing test.
4. Create public GitHub repository and real issues from reviewed drafts. Preserve the initial `_docs/tasks.md` as an archived planning record after transfer; issues are the active backlog.
5. Add agent instructions, role definitions, task template and contextual documentation.
6. PM grooms the next issue with testable criteria and dependencies.
7. Engineer implements that issue, tests it and commits genuine changes with traceable issue references.
8. QA independently checks acceptance and records evidence. Failure returns to engineer; only verified work is closed.
9. Repeat, then verify public repo, pushed code, documentation, issue timestamps, and deadline.

## Evidence limitations
The parent reported reading the article but video transcript/playback was inaccessible. Example issue HTML access initially failed; its full public GitHub API representation was subsequently recovered and reviewed. See the source-review record for exact evidence. Source verification gaps must be disclosed rather than invented. Under the user's time pressure the assistant selected provisional defaults; no complete PM interview is claimed. Draft issues are not real GitHub issues until creation is verified.

## Handoffs
PM → engineer: plan, architecture, groomed issue drafts and dependency order. Engineer → QA: changed files, actual test commands/results and acceptance mapping. QA → PM: pass/fail with observed evidence. GitHub credentials must never be committed. Current submission timing is privately supplied during publication; do not manipulate timestamps.

## Orchestrator role discipline
The orchestrator selects the next task and launches the PM, software engineer and QA roles in order. It does not substitute its own grooming, implementation or test assertions for the role deliverables. Keep one implementation task active at a time. PM produces the groomed issue and dependencies; engineer implements and records actual checks; independent QA verifies acceptance and returns PASS or FAIL. FAIL returns to the engineer for fixes and another QA review. The orchestrator closes an actual issue only after QA PASS and a verified successful GitHub closure action. When no GitHub issue exists, record local status and evidence honestly without pretending a comment or closure occurred.

Drafts 01–06 cover local deliverable readiness; draft 07 covers authenticated remote publication and timestamp readback. Passing local readiness does not imply public submission. The initial backlog remains an archive after real issue creation. The branch is `main`.
