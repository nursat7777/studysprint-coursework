# Genuine engineer execution log

## Draft 01 — scaffold
Status: implemented; awaiting independent QA. This draft does not have a verified GitHub issue number.

- Read AGENTS.md, process, engineer role, product specification, architecture, design system and groomed draft before implementation.
- Created pinned React / TypeScript / Vite package and npm lockfile, responsive minimal shell, Vitest jsdom environment, Testing Library smoke test and setup instructions.
- Actually executed `npm install`: success, 162 packages installed. npm emitted an environment `http-proxy` configuration warning and a transitive whatwg-encoding deprecation warning.
- Actually executed `npm test`: 1 test file, 1 test passed; test asserts StudySprint heading belongs to the main landmark.
- Actually executed `npm run build`: TypeScript compilation and Vite production build succeeded, 29 modules transformed.
- Implementation commit: `[private local development commit]` (`build: bootstrap React TypeScript app with passing smoke test`).
- No feature functionality implemented yet. No GitHub issue claimed or closed. Independent QA must verify before feature work.
- Environment clock output differed from conversation time; no execution timestamps are asserted here.

### Draft 01 QA correction
Independent QA reported that `vite --host 0.0.0.0` fails in this environment with `ERR_SYSTEM_ERROR uv_interface_addresses`. Changed the documented dev script to bind explicitly to `127.0.0.1`. Engineer did not start a preview server; managed Sites preview remains the intended environment path. Actually reran `npm test` (1 passed) and `npm run build` (success). Local user startup remains to be verified on the user's machine; no successful dev server startup is claimed.

## Draft 02 — assignments and safe local persistence
Implemented validated creation/editing, completion/reopen, confirmed deletion, stable IDs and creation timestamps, centralized schema validation and storage. Storage writes occur before state updates; write failures preserve prior saved and UI records. Corrupt data is never automatically overwritten and blocks changes pending an explicit recovery action (backup/reset arrives in draft 05). Deletion detaches session/timer references. Responsive warm ivory/teal UI uses persistent form labels, associated field errors and textual priority badges.

Actually ran `npm test`: 10 tests in 2 files passed. Tests exercise boundary lengths, trimming, calendar validity, identity/completion preservation, missing/corrupt storage, quota failure, and component create/edit/complete/reopen/delete cancellation/confirmed deletion/remount persistence. First build identified an invalid Testing Library type option in tests; removed it and reran the complete checks. Final `npm run build`: TypeScript and Vite succeeded (31 modules). No server started. Independent QA pending; no real GitHub issue status asserted.

## Draft 03 — urgency dashboard and finding assignments
Added independent summary cards for all/completed/overdue/due-today counts using local calendar dates, textual urgency indicators, case-insensitive combined search/status/priority filters, deterministic due-date/priority sorting, clear-filter no-results state and an explicit create action in the empty state. Labeled native controls and responsive CSS support keyboard semantics and narrow layout; actual viewport rendering/focus visual inspection remains unavailable and is not claimed. No placeholder focus panel is displayed before timer implementation.

Actually executed `npm test`: 14 tests across 2 files passed, including combined filters/order/no mutation, local date summary excluding completed urgency and labeled DOM filters/totals preservation. `npm run build`: TypeScript and Vite succeeded, 31 modules. Independent QA pending; no preview server started and no real GitHub issue status asserted.

## Draft 04 — focus timer and session history
Added isolated FocusTimer component with validated 1–120 whole-minute duration (default 25), optional task link, start/pause/resume/reset, one interval with cleanup, persisted remaining snapshot and settings, paused restoration, and exactly-once completed session recording. Meaningful status announces completion without live ticking. Task deletion detaches timer/history links. Storage failure prevents starting or stops a running countdown rather than claiming saved progress. History displays the five most recent completed sessions and total count; deleted task links remain readable as unlinked.

Actually ran `npm test`: 19 tests in 3 files passed, including executed fake-timer lifecycle/zero crossing/exactly-once/cleanup, validation boundaries, paused snapshot restoration, persistence failure and App linked-task deletion/remount. `npm run build`: TypeScript and Vite succeeded, 32 modules. Background throttling is described in UI; no wall-clock charge on reload and no notifications promised. Independent QA pending; no browser server or real GitHub status asserted.

## Draft 05 — backups, demo and recovery
Added user-triggered JSON downloads, full-schema atomic imports with validated-before-confirmation replacement, 1 MB upload cap, visible errors and retry, explicit empty-only demo tasks, and confirmed recovery/reset for preserved corrupt data. Successful replacement remounts FocusTimer paused; invalid/cancelled/failed imports preserve current state. Tightened parser to reject null/false/zero timer values, impossible/noncanonical timestamps and dangling live timer task references; documented historical session-link policy and canonical trimmed imported text.

Actually executed `npm test`: 28 tests in 4 files passed, covering blank/full roundtrips, malformed nested/version/type/date/duplicate/range/timer data, import cancel/confirm/quota/corrupt recovery/oversize, real Blob/download invocation and running-timer replacement. Initial build exposed a mock-function TypeScript tuple type; typed its Blob parameter and reran all checks. Final `npm run build` succeeded (33 modules). Independent QA pending; no browser download completion or real issue status claimed.

## Draft 06 — local review readiness and readable source
Added pinned Prettier 3.6.2 and conventional formatting across source, tests, CSS and configuration; explicit typecheck/format checks and loopback local-user preview script. Added complete feature/setup/data-limit/demo/documentation inventory README, local-interface API document, metadata description, and updated design/testing/architecture/compliance to match actual behavior and separate unavailable browser/GitHub/source evidence.

Actually ran `npm run format`, `npm test` (28 passed in 4 files), `npm run typecheck` (success), `npm run build` (success, 33 modules), `npm run format:check` (all matched files conform), and `python -m unittest discover -s scripts -p 'test_*.py' -v` (7 passed). No development or preview server started. No publication success asserted; authenticated GitHub work is separate draft 07. Independent final QA pending.

## Portability correction — test storage globals
The user reported local Mac test failures because `localStorage.clear` was unavailable. Their Node version was not supplied; native Node Web Storage shadowing jsdom is a plausible cause, not a verified diagnosis of that machine. Added a deterministic in-memory Storage API in test setup, installed as the same object and constructor on globalThis/window; production storage code is unchanged. Prototype methods preserve existing quota-failure spy tests. Set a nonopaque jsdom URL and added regression checks for shared globals, Storage identity/API and interception of actual writes.

Actually executed under Node v24.19.0: `npm run format`, `npm test` (30 tests in 5 files passed), `npm run typecheck` (success), `npm run build` (success, unchanged production assets), and `npm run format:check` (success). The user's Mac rerun remains unverified. A separately attempted `NODE_OPTIONS=--no-webstorage npm test` failed before testing with `--no-webstorage is not allowed in NODE_OPTIONS`; this is not a portable workaround on the verified environment. Existing historical QA records were not rewritten.
