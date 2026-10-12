# Reference review and limits

Sources: [assignment article](https://aishippingblog.com/p/ai-native-development-specifications), [workshop video](https://www.youtube.com/watch?v=VUJxJGpaDEs), [example issue #17](https://github.com/alexeygrigorev/retroloop/issues/17).

## Article

The coordinating agent read the complete article. Its process starts with genuine product brainstorming, then an approved specification, architecture tradeoffs, a small-task backlog, real GitHub issues, bootstrap, agent context, process instructions, PM grooming, engineering and independent QA. QA failures return to engineering; only verified issues are closed.

Article filenames preserved in this project: `AGENTS.md` (plural), `CLAUDE.md` referring to it, `_docs/plan.md`, `_docs/tasks.md`, `_docs/process.md`, `_docs/task-template.md`, `_docs/team/pm.md`, `_docs/team/software-engineer.md`, and `_docs/team/qa-engineer.md`. Additional assignment documentation must be distinguished from article-required files.

## Example GitHub issue

The full issue body was retrieved from GitHub's public API and reviewed. Title: “17. Decisions and action items”. Its four primary headings are Goal, Acceptance criteria, Out of scope, and Constraints. Acceptance criteria are grouped around data models, creation, editing/completion, display, and verification. They describe user-visible behavior, validation, authorization, lifecycle edge cases, and explicit regression tests. Constraints identify modules, dependency ordering, shared rules, implementation boundaries, and dependency limits. The issue links related issues and numbered architecture decisions.

Project issues should preserve those headings and use measurable checkboxes. Dependencies, test commands, edge cases, implementation boundaries, and evidence of completion belong in the relevant section rather than generic boilerplate. This review does not imply that any StudySprint GitHub issue exists.

## Video: partially reviewed

The public YouTube page was retrieved. The title is “How to Work with AI Coding Agents: Spec-Driven Development, Context and Loop Engineering, Workflows”, and the page reports a duration of approximately 1 hour 54 minutes. The full description and all published chapter titles were reviewed. Its description identifies four concerns: specifications before implementation; preparing agent context; small implementation loops with checks; and separate PM, engineer, and tester roles.

The chapters cover brainstorming, specification, stack tradeoffs, structured backlog, GitHub repository creation, bootstrap, `AGENTS.md`, process guidelines, PM grooming, checkable acceptance criteria, engineering persona, QA, and orchestrator subagents. These corroborate the article workflow; they do not establish any extra mandatory project requirement by themselves.

**Limitation:** video playback and spoken transcript have not been reviewed. The page advertised an English auto-generated caption track, but requests for JSON, VTT, and default timed-text formats returned empty responses. Consequently, no claim is made that every spoken detail or screen demonstration has been verified. A user-supplied transcript or direct viewing is needed for full video compliance. No missing requirement has been invented.

## Assignment-specific distinction

`chat-brainstorm.md` is required by the assignment. It must preserve actual visible conversation and clearly identify agent-selected assumptions. The user authorized maximizing progress with private submission timing, but did not supply detailed product interview answers. A complete interactive interview cannot be truthfully claimed from that delegation.
