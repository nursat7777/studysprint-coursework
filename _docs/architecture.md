# Technical specification
## Boundaries
React renders the UI; pure TypeScript functions validate, filter, sort, and summarize assignments and backups. Storage reads/writes are centralized. Suggested modules: `src/model.ts`, `src/storage.ts`, `src/App.tsx`, `src/styles.css`; names may change with documented equivalence.

## Data
Assignment: stable unique id, title, subject, dueDate (YYYY-MM-DD), priority low/medium/high, notes, completed boolean, createdAt ISO timestamp. Session: unique id, optional taskId, durationMinutes, completedAt ISO timestamp. Settings: focusMinutes default 25. Timer persisted snapshot includes remainingSeconds, configured duration and selected task; restore paused. Backup has schemaVersion 1, tasks, sessions, settings, and optional timer snapshot. Reject unsupported versions, malformed dates, duplicate IDs, invalid enum values, excessive lengths and invalid numeric ranges. Validate every record before replacing any data.

## Behavior
Compare calendar dates as local ISO day strings, not UTC midnight conversions. Count completed tasks separately. Search is case-insensitive. Sort ties deterministically. Deleting a task must not break historical sessions or timer; detach obsolete task references. Timer interval cleanup prevents multiple ticking loops; complete a session exactly once. Browser storage exceptions produce a visible message; do not crash or falsely promise persistence.

## Security and reliability
Render text through React, never raw HTML. No network data or credentials. Import file size may be capped and explained. JSON export contains personal task text; it is a user-triggered download. Successful import replaces current records only after explicit confirmation. Demo data is explicit and requires empty tasks.

## Backup canonicalization and timestamp/reference policy
Version 1 timestamps must be canonical UTC ISO strings in `YYYY-MM-DDTHH:mm:ss.sssZ` form, round-trip exactly, and contain actual calendar dates. Date-only, impossible and normalized dates are rejected. Imported title/subject text is trimmed before persistence. An optional timer must be an object when present; null/false/zero are invalid. A timer's taskId must point to an existing task. Historical sessions may retain string IDs for deleted tasks and render as “Unlinked session”; live deletion detaches links. Backup input is capped at 1 MB. Complete validation precedes replacement confirmation, then one storage write replaces state; successful replacement remounts the timer paused. Invalid/cancelled imports preserve running timer and data. Corrupt initial storage is blocked until an explicit confirmed valid import or destructive reset.

## Final implementation and tooling
The implemented UI is split into App (assignment and persistence coordination), FocusTimer (countdown lifecycle), and BackupPanel (backup/demo/recovery interaction), with pure model and storage modules. Source and tests use pinned Prettier 3.6.2 conventional formatting; `format:check` enforces readability. Explicit `typecheck` complements automated tests and production build. Local-user development/preview scripts bind loopback; managed preview deployment is handled separately by the orchestrator rather than by starting a server here.
