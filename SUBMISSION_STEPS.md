# Finish the submission on your computer

Submission timing is private at the user request. The script requests the exact current cutoff without terminal echo and checks every remote action. GitHub timestamps remain genuine.

The delivered project is local work. No public GitHub repository or real issues have been created unless `_docs/github-verification.json` exists and confirms them. The script performs actual GitHub actions using your account, never simulated issue numbers.

## Fast path on macOS

1. Download and extract the delivered ZIP. Open Terminal and `cd` into the extracted `studysprint` folder (the folder containing `package.json`).
2. Install Node.js LTS from https://nodejs.org if `node --version` and `npm --version` fail. Install Python 3 if `python3 --version` fails.
3. Install GitHub CLI: `brew install gh` if Homebrew is installed. Otherwise use the installer from https://cli.github.com. Install Git if `git --version` fails (macOS may offer its command line tools).
4. Run `gh auth login`. Choose GitHub.com, HTTPS, and browser sign-in. Authenticate your own account; do not paste tokens into a chat or repository.
5. Obtain your account name: `gh api user --jq .login`.
6. Run this, replacing `YOUR_USERNAME` with that account name:

```bash
python3 scripts/publish_github.py --repo "$(gh api user --jq .login)/studysprint" --close-verified
```

This installs locked dependencies, executes test/build/typecheck commands, creates a public repository, creates genuine new publication commits from a sanitized snapshot, keeping original development history private, pushes code, imports seven detailed real issues, attaches evidence for independently verified issues, and closes only those with complete PASS records. It checks the deadline before each remote mutation. It verifies public visibility and real creation/closure timestamps, writes public `_docs/github-verification.json` without private cutoff/comparisons, and pushes that verification. Exact cutoff and comparison results stay in ignored `_private/submission-verification.json`.

If interrupted, run the same command again: persistent state and unique issue markers make it resumable. Do not delete `.github-handoff-state.json` while publication is incomplete. Existing unrelated repositories are rejected; choose a fresh name such as `YOUR_USERNAME/studysprint-assignment` instead. The script never force-pushes.

7. Open the printed repository URL. Confirm the Issues tab contains actual issues and inspect `_docs/github-verification.json`. Submit that repository URL to your instructor.
8. Demonstrate locally with `npm run dev`, opening the printed localhost URL. Follow README demonstration instructions.

## Before publication (optional offline check)

```bash
python3 scripts/publish_github.py --repo "$(gh api user --jq .login)/studysprint" --dry-run
python3 -m unittest discover -s scripts -p 'test_*.py'
```

Dry run runs real local npm checks but does not modify GitHub. Internet is needed to install npm dependencies initially.

## If the deadline has passed

The automation refuses new remote actions. If you still want an honestly late submission, add `--allow-late` explicitly. This does not satisfy the before-deadline criterion. All timestamps remain genuine. Ask your instructor whether a late submission is accepted.

## What you must complete yourself

- Authenticate your GitHub account and run the publication command. This environment has no authenticated GitHub CLI/session, so account actions cannot be completed here.
- Enter the exact current private cutoff when prompted and submit the link through your university portal.
- Resolve source-review gaps in `_docs/source-review.md`: supply or personally review the unavailable video transcript or spoken video content. The sample issue was subsequently retrieved. Do not claim those were reviewed if they were not.
- Review product decisions recorded as assistant assumptions. A completed personal product interview cannot be invented after the fact. Any additional answers belong in the genuine conversation record with their actual dates.
- Review QA gaps. Issues lacking complete independent acceptance PASS evidence remain open. Fix, test, and document the missing verification before rerunning publication. Do not label gaps PASS merely to close issues.

## Honest chronology and limitations

The source methodology calls for remote issues before implementation. GitHub access was unavailable, so detailed local issue drafts preceded implementation, and the automation imports them later. Every imported issue discloses that limitation. Publishing later cannot retroactively reproduce source ordering. The prepared chat log contains only real visible messages; assumptions are labeled. A successful app alone does not establish full assignment-methodology compliance.

## Automation QA record format

`_docs/qa-results.json` uses:

```json
{"issues":[{"number":1,"status":"PASS","acceptance":[{"criterion":"Exact requirement","verdict":"PASS","evidence":"Actual independently executed check and result"}]}]}
```

`number` refers to the local draft, not a fabricated GitHub number. Include every acceptance criterion; the reviewer must check completeness. Only an independent QA review should provide PASS. Publication additionally executes the application check suite and refuses closure on failures. Remote results are recorded separately after verification.

## Private publication history

The public staging repository is separate from the original local Git repository. Original history and `git-history.bundle` are never pushed. Public commits are honestly labeled publication commits of already prepared work, not a reconstructed development timeline. Submission timing in public prose is transparently redacted; application assignment dates remain intact. Do not upload the delivered private archive or original history bundle as a public attachment. Existing public repositories from an older publication flow are refused; choose a new repository. This automation cannot erase information already publicly exposed.
