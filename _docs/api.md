# Local module and data interfaces

StudySprint is a browser-local web application. It exposes no HTTP API and requires no backend or credentials. This contextual document maps the implemented boundaries; it does not imply an article-mandated network service.

## Model (`src/model.ts`)

- `Task`: stable unique id, trimmed title/subject, actual local ISO dueDate, low/medium/high priority, optional-text notes, completed boolean, canonical UTC ISO createdAt.
- `Session`: unique id, optional historical taskId, integer durationMinutes 1–120, canonical completedAt. Deleted task history remains readable.
- `State`: schemaVersion 1, tasks, sessions, settings.focusMinutes 1–120, optional timer with integer remainingSeconds from 0 through durationMinutes × 60 and optional existing taskId.
- `validateTask` produces field errors without mutating input; `saveTask` creates a genuine UUID/time or preserves edit identity, creation time and completion.
- `validDate` checks local calendar roundtrip; `validTimestamp` requires exact canonical UTC timestamp roundtrip.
- `parseState` validates every nested record and duplicate ID before returning canonically trimmed task text. Invalid imports throw before storage writes.
- `summarize` computes full-list counts; `findTasks` combines filters and returns a sorted copy with deterministic ties. `localToday` derives browser-local calendar fields.

## Persistence (`src/storage.ts`)

`STORAGE_KEY` is `studysprint-v1`. `loadState` returns state, error and blocked flags. Missing storage starts empty; unreadable storage is preserved and blocks mutations. `persistState` writes JSON or throws. App commits storage before updating React; failed writes retain previous state. Confirmed valid replacement or explicit destructive reset can recover blocked storage.

## UI boundaries

`App` owns tasks, state, validation and persistence decisions. `FocusTimer` owns running/paused lifecycle and interval cleanup, while snapshots/settings/history remain in App state. `BackupPanel` owns file reading/download requests and complete validation before confirmation. Successful replacement remounts FocusTimer paused; cancellation or failure preserves running state. `backupJson` produces validated schema JSON; `demoState` rejects nonempty lists. Uploads are capped at 1 MB.

## Example blank backup

```json
{"schemaVersion":1,"tasks":[],"sessions":[],"settings":{"focusMinutes":25}}
```

No merge operation exists: importing replaces the complete state only after validation, confirmation and successful persistence.
