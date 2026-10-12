# StudySprint agent instructions
Read `_docs/plan.md`, `_docs/architecture.md`, and `_docs/process.md` before changing code. Follow the PM → software engineer → independent QA cycle. Use real GitHub issues as the active backlog once created; `_docs/issues/` contains drafts until then. Never claim a draft is an issue, or a test passed without running it. Preserve user data on validation failures. Keep application logic testable and dependency-free where practical. Record genuine decisions, test output summaries, and blocked source access. Commit verified work with issue references only when actual issue numbers exist. Do not falsify timestamps or user answers.

The article uses `AGENTS.md` (plural); `AGENT.md` in the assignment is not the article filename. `CLAUDE.md` directs readers here. Product choices are provisional assistant defaults, not confirmed user preferences.

## Commands
- `npm ci`: install the committed lockfile dependencies.
- `npm run dev`: start the configured localhost development server (not executable in the managed environment; verify externally).
- `npm test -- --run`: execute automated tests.
- `npm run build`: TypeScript checking followed by Vite production build.

## Project documents
- [Product specification](_docs/plan.md)
- [Process and orchestration](_docs/process.md)
- [Architecture](_docs/architecture.md)
- [Testing guidelines](_docs/testing-guidelines.md)
- [UI design system](_docs/design-system.md)
- [Decision history](_docs/decisions.md)
- [PM role](_docs/team/pm.md), [Engineer role](_docs/team/software-engineer.md), [QA role](_docs/team/qa-engineer.md)

Use the role handoffs rather than treating implementation as QA approval. Preserve actual failures and commands in evidence. Current branch is `main`; do not rewrite genuine commit timestamps.
