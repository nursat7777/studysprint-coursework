# StudySprint product specification

Status: provisional assistant-selected MVP, not a user-approved interview specification.

## Discovery evidence
The user requested maximal autonomous completion; submission timing is private at their request. They supplied the assignment and deadline but did not choose an application or answer product questions. The assistant proposed five ideas: student planner, expense tracker, revision cards, pantry planner, and job application tracker. StudySprint was selected as a reversible default because student deadlines, a focus timer, and backup are easy to demonstrate without paid services. No user preferences or interview answers have been invented. See `chat-brainstorm.md` for genuine conversation excerpts and limitations.

## Problem and users
Students need a simple way to see upcoming coursework, distinguish urgent work, and focus on one assignment. The target persona is a student using one browser on a personal device. This persona is an assistant assumption.

## MVP
- Create, edit, delete, and complete assignments with title, subject, local due date, low/medium/high priority, and optional notes.
- Search titles, subjects, and notes; filter completion and priority; sort due date or priority.
- Show total, overdue, due-today, and completed counts independent of visible filters. Completed assignments are never overdue.
- Link a configurable 1–120 minute focus timer to an assignment; pause, resume, reset, and record completed sessions.
- Persist assignments, timer settings, and session history locally. On refresh an in-progress timer restores paused to avoid silently charging elapsed time.
- Export JSON; validate imported JSON completely before replacement; require replacement confirmation. Invalid files leave state unchanged.
- Provide optional demonstration data only when the task list is empty, with no automatic overwrite.

## Validation and experience
Title and subject are trimmed and nonempty; title is at most 120 characters, subject 80, notes 2000. Due dates must be real ISO local calendar dates. Empty states explain the next action. Inputs have visible labels and errors. Delete and replacement require confirmation. Layout must work at phone and desktop widths, with keyboard-accessible controls and focus indicators.

## Success criteria
A new visitor can create an assignment, find it, complete it, run a short focus session, reload persisted data, and export/import a backup. Automated checks cover validation and data safety; production build and manual smoke verification must be actually executed and recorded.

## Explicit exclusions
Accounts, cloud sync, notifications, paid APIs, collaboration, recurring tasks, and server databases are out of scope. Browser storage is device-specific and backups are user-managed. Dates use the browser local timezone.

## Deadline and open questions
[redacted: submission timing at user’s request]. The user subsequently reported an extension; the exact current cutoff must be supplied privately during publication. Outstanding personal questions include preferred app, subject defaults, timer duration, design preference, and whether local-only storage is acceptable; assistant defaults allow progress but do not imply answers.
