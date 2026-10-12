#!/usr/bin/env python3
"""Publish genuine prepared work. Requires the user's authenticated gh CLI."""
import argparse
import datetime as dt
import json
import os
import getpass
from pathlib import Path
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
STATE_PATH = ROOT / '.github-handoff-state.json'
RUN_ROOT = ROOT
MARKER = '<!-- studysprint-assignment-v1:draft-{} -->'


def run(*args, check=True):
    result = subprocess.run(args, cwd=RUN_ROOT, text=True, capture_output=True)
    if check and result.returncode:
        raise RuntimeError(f"Command failed: {' '.join(args)}\n{result.stdout}\n{result.stderr}")
    return result


def read_json(path, default):
    return json.loads(path.read_text()) if path.exists() else default


def save(path, value):
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, indent=2) + '\n')
    temporary.replace(path)


def deadline_guard(deadline, allow_late=False):
    if dt.datetime.now(dt.timezone.utc) >= deadline:
        if not allow_late:
            raise RuntimeError('Deadline passed. No further remote changes allowed. Use --allow-late only if you knowingly accept late submission; timestamps stay real.')
        print('WARNING: This remote action is after the deadline; GitHub timestamps will be genuine.', file=sys.stderr)


def normalized_criterion(value):
    return ' '.join(value.split()).rstrip('.').casefold()


def required_criteria(issue):
    return {normalized_criterion(c) for c in re.findall(r'^- \[ \] (.+)$', issue['body'], re.MULTILINE)}


def verified_record(record, issue=None):
    checks = record.get('acceptance', [])
    provided = [normalized_criterion(c.get('criterion', '')) for c in checks]
    required = required_criteria(issue) if issue else set(provided)
    return (record.get('status') == 'PASS' and bool(checks) and bool(required)
            and len(provided) == len(set(provided)) and set(provided) == required
            and all(c.get('verdict') == 'PASS' and c.get('criterion') and c.get('evidence') for c in checks))


def recognizable_repository(repo, marker_exists):
    if repo.get('size', 0) > 0 and not marker_exists:
        raise RuntimeError('Existing repository is not recognizably this project. Choose a new empty repository.')


REDACTION = '[redacted: submission timing at user request]'


def sanitize_public_text(value, deadline=None):
    # Submission-specific absolute times, never application task dates.
    value = re.sub(r'\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})',
                   lambda m: REDACTION if (deadline and m.group(0) in {
                       deadline.isoformat(), deadline.astimezone(dt.timezone.utc).isoformat().replace('+00:00', 'Z')}) else m.group(0), value)
    # Historical submission references may contain a previous private cutoff.
    lines = []
    for line in value.splitlines(keepends=True):
        if re.search(r'deadline|submission|дедлайн|(?:before|after).*\b\d{1,2}:\d{2}\b|Almaty time|времени Алматы', line, re.I):
            line = re.sub(r'\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})', REDACTION, line)
            if re.search(r'через\s+час|(?:\b[A-Za-z]+|\b\d+)[ -](?:hour|minute|day)s?|\b\d{1,2}:\d{2}\b|\b\d{1,2}\s+[A-Z][a-z]+\s+\d{4}\b', line, re.I):
                line = REDACTION + ('\n' if line.endswith('\n') else '')
        lines.append(line)
    value = ''.join(lines)
    # Original local commit hashes do not identify the new public snapshot.
    return re.sub(r'\b[0-9a-f]{40}\b', '[private local development commit]', value)


def prepare_public_snapshot(target, deadline):
    target.mkdir(parents=True, exist_ok=True)
    excluded = {'.git', '_private', 'node_modules', 'dist', '__pycache__', '.github-handoff-state.json', 'git-history.bundle'}
    for source in ROOT.rglob('*'):
        relative = source.relative_to(ROOT)
        if any(part in excluded for part in relative.parts) or source.name == '.DS_Store' or source.suffix in {'.tsbuildinfo', '.pyc', '.pyo'}:
            continue
        if source.is_file():
            destination = target / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            try:
                content = source.read_text()
            except UnicodeDecodeError:
                shutil.copy2(source, destination)
            else:
                # Prose/data receive timing redaction; executable code has neutral fixtures and must remain runnable.
                destination.write_text(sanitize_public_text(content, deadline) if source.suffix.lower() in {'.md', '.txt', '.json'} else content)
    (target / '.studysprint-project').write_text('StudySprint assignment v1\n')
    (target / '.publication-privacy-v2').write_text('Public sanitized snapshot. Original local development history is retained privately and not pushed.\n')
    (target / 'PUBLICATION_HISTORY.md').write_text('# Publication history\n\nPublic commits are genuine new publication commits of prepared work. They are not the original development timeline. The original local Git history is retained privately. Submission timing is transparently redacted at the user request; GitHub event timestamps remain genuine.\n')
    ignore = target / '.gitignore'
    existing = ignore.read_text() if ignore.exists() else ''
    ignore.write_text(existing + '\n_private/\n.github-handoff-state.json\ngit-history.bundle\n')


def main():
    global RUN_ROOT
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', required=True, help='GitHub owner/repository')
    parser.add_argument('--deadline', help='Optional private cutoff; preferably omit to enter without terminal echo')
    parser.add_argument('--allow-late', action='store_true')
    parser.add_argument('--close-verified', action='store_true', help='Close only issues with complete independent QA PASS evidence')
    parser.add_argument('--dry-run', action='store_true', help='Validate files and run local checks without GitHub changes')
    args = parser.parse_args()
    if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', args.repo):
        raise RuntimeError('Expected --repo OWNER/NAME')
    private_input = args.deadline or getpass.getpass('Private submission cutoff (ISO 8601 with timezone; hidden): ')
    deadline = dt.datetime.fromisoformat(private_input)
    if deadline.tzinfo is None:
        raise RuntimeError('Private cutoff must include a timezone')
    issues = read_json(ROOT / '_docs/issues.json', [])
    if not issues or len({i['number'] for i in issues}) != len(issues):
        raise RuntimeError('Expected nonempty distinct prepared issue drafts')
    for issue in issues:
        for section in ('# Goal', '# Acceptance criteria', '# Out of scope', '# Constraints'):
            if not re.search(r'^#{1,2} ' + re.escape(section[2:]) + r'$', issue['body'], re.MULTILINE):
                raise RuntimeError(f"Draft {issue['number']} missing {section}")
    for binary in ('npm', 'git'):
        if not shutil.which(binary):
            raise RuntimeError(f'Install {binary} first')
    print('Installing reproducible dependencies and running real checks…', flush=True)
    run('npm', 'ci')
    package = read_json(ROOT / 'package.json', {})
    checks = ['test', 'build'] + (['typecheck'] if 'typecheck' in package.get('scripts', {}) else [])
    for check in checks:
        result = run('npm', 'run', check)
        print(result.stdout)
    qa = read_json(ROOT / '_docs/qa-results.json', {'issues': []})
    records = {i['number']: i for i in qa.get('issues', [])}
    if args.dry_run:
        print('Dry run complete. No GitHub actions performed.')
        for issue in issues:
            print(f"Draft {issue['number']}: QA closure eligible={verified_record(records.get(issue['number'], {}), issue)}")
        return
    deadline_guard(deadline, args.allow_late)
    if not shutil.which('gh'):
        raise RuntimeError('Install GitHub CLI and run gh auth login first')
    run('gh', 'auth', 'status')
    state = read_json(STATE_PATH, {'repo': args.repo, 'issues': {}})
    if state['repo'] != args.repo:
        raise RuntimeError('State belongs to another repository; use the original repo or review/remove state yourself')
    def mutate(*command):
        deadline_guard(deadline, args.allow_late)
        return run(*command)
    repo_result = run('gh', 'api', f'repos/{args.repo}', check=False)
    if repo_result.returncode:
        if '404' not in repo_result.stderr:
            raise RuntimeError(repo_result.stderr)
        mutate('gh', 'repo', 'create', args.repo, '--public', '--description', 'StudySprint university AI-native development assignment')
    repo = json.loads(run('gh', 'api', f'repos/{args.repo}').stdout)
    if repo.get('private'):
        raise RuntimeError('Repository must be public; this script will not change existing repository visibility')
    # Protect populated repositories: recognize only our committed project marker.
    if repo.get('size', 0) > 0:
        marker = run('gh', 'api', f'repos/{args.repo}/contents/.studysprint-project', check=False)
        recognizable_repository(repo, marker.returncode == 0)
    # Never push original history: previously deleted private timing may survive in its blobs.
    staging = ROOT / '_private/publication-repo'
    if repo.get('size', 0) > 0:
        privacy = run('gh', 'api', f'repos/{args.repo}/contents/.publication-privacy-v2', check=False)
        if privacy.returncode:
            raise RuntimeError('Existing repository predates private-timing publication. Choose a new repository. Prior public history cannot be erased safely here.')
    if not (staging / '.git').exists():
        if repo.get('size', 0) > 0:
            run('git', 'clone', f'https://github.com/{args.repo}.git', str(staging))
        else:
            staging.mkdir(parents=True, exist_ok=True)
            previous_root = RUN_ROOT
            RUN_ROOT = staging
            run('git', 'init', '-b', 'main')
            RUN_ROOT = previous_root
    prepare_public_snapshot(staging, deadline)
    RUN_ROOT = staging
    def publication_commit(message):
        if run('git', 'diff', '--cached', '--quiet', check=False).returncode:
            run('git', '-c', 'user.name=StudySprint publication automation', '-c', 'user.email=studysprint-automation@users.noreply.github.com', 'commit', '-m', message)
    if run('git', 'rev-parse', '--verify', 'HEAD', check=False).returncode:
        documents = [str(p.relative_to(staging)) for p in staging.glob('*.md')] + ['_docs', '.studysprint-project', '.publication-privacy-v2', '.gitignore']
        run('git', 'add', '--', *documents)
        publication_commit('Publish reviewed product and process documentation')
        run('git', 'add', '-A', '--', '.', ':!scripts')
        publication_commit('Publish verified StudySprint application and tests')
        run('git', 'add', '-A')
        publication_commit('Publish user-run GitHub automation and remaining assets')
    elif run('git', 'status', '--porcelain').stdout.strip():
        run('git', 'add', '-A')
        publication_commit('Update sanitized prepared StudySprint source and evidence')
    url = f'https://github.com/{args.repo}.git'
    remotes = run('git', 'remote').stdout.splitlines()
    if 'submission' in remotes:
        if run('git', 'remote', 'get-url', 'submission').stdout.strip() != url:
            raise RuntimeError('Existing staging remote differs; refusing to replace it')
    else:
        run('git', 'remote', 'add', 'submission', url)
    run('gh', 'auth', 'setup-git')
    mutate('git', 'push', 'submission', 'HEAD:main')
    commit = run('git', 'rev-parse', 'HEAD').stdout.strip()
    # Search all states by deterministic marker to resume interrupted runs safely.
    remote_issues = json.loads(run('gh', 'api', '--paginate', '--slurp', f'repos/{args.repo}/issues?state=all&per_page=100').stdout)
    flat = [item for page in remote_issues for item in page if 'pull_request' not in item]
    for issue in issues:
        number = issue['number']
        marker = MARKER.format(number)
        found = [i for i in flat if marker in (i.get('body') or '')]
        if len(found) > 1:
            raise RuntimeError(f'Duplicate remote markers for draft {number}; review manually')
        if found:
            actual = found[0]
        else:
            body = sanitize_public_text(issue['body'], deadline) + '\n\nLocal preparation disclosure: This issue imports a prepared local draft after local implementation because GitHub access was unavailable. It does not establish the source workflow chronology.\n\n' + marker
            result = mutate('gh', 'api', f'repos/{args.repo}/issues', '-X', 'POST', '-f', f"title={issue['title']}", '-f', f'body={body}')
            actual = json.loads(result.stdout)
        entry = state['issues'].setdefault(str(number), {})
        entry.update({'number': actual['number'], 'url': actual['html_url']})
        save(STATE_PATH, state)
        record = records.get(number, {})
        eligible = verified_record(record, issue)
        if eligible:
            implementation_commit = commit
            if not entry.get('engineer_posted'):
                body = f'## Engineer evidence\nPrepared implementation commit: https://github.com/{args.repo}/commit/{implementation_commit}\nPublication-time actual checks succeeded: npm ci; ' + '; '.join('npm run ' + c for c in checks) + '\nImplementation preceded remote issue import because account access was unavailable.'
                mutate('gh', 'api', f"repos/{args.repo}/issues/{actual['number']}/comments", '-X', 'POST', '-f', f'body={body}')
                entry['engineer_posted'] = True
                save(STATE_PATH, state)
            if not entry.get('qa_posted'):
                evidence = '\n'.join(f"- PASS: {sanitize_public_text(c['criterion'], deadline)} — {sanitize_public_text(c['evidence'], deadline)}" for c in record['acceptance'])
                body = '## QA PASS\nIndependent local QA record: `_docs/qa-results.json`. Every issue checkbox has matching PASS evidence.\n' + evidence + '\n\nLocal QA preceded remote import; publication-time check suite also succeeded.'
                mutate('gh', 'api', f"repos/{args.repo}/issues/{actual['number']}/comments", '-X', 'POST', '-f', f'body={body}')
                entry['qa_posted'] = True
                save(STATE_PATH, state)
        if args.close_verified and eligible and actual['state'] != 'closed':
            mutate('gh', 'api', f"repos/{args.repo}/issues/{actual['number']}", '-X', 'PATCH', '-f', 'state=closed')
        elif args.close_verified and not eligible:
            print(f'Draft {number} remains open: no complete independent QA PASS evidence.')
    # Replace ambiguous draft dependencies with verified real issue links.
    for issue in issues:
        entry = state['issues'][str(issue['number'])]
        dependencies = [f"draft {n} → actual #{state['issues'][str(n)]['number']}: {state['issues'][str(n)]['url']}" for n in issue.get('dependencies', [])]
        if dependencies and not entry.get('dependencies_posted'):
            mutate('gh', 'api', f"repos/{args.repo}/issues/{entry['number']}/comments", '-X', 'POST', '-f', 'body=Verified dependency mapping (local draft → real issue):\n' + '\n'.join(dependencies))
            entry['dependencies_posted'] = True
            save(STATE_PATH, state)
    remote_head = json.loads(run('gh', 'api', f'repos/{args.repo}/commits/main').stdout)['sha']
    if remote_head != commit:
        raise RuntimeError('Remote main does not match local prepared commit')
    # Publication QA uses actual remote readback rather than local PASS fiction.
    publication = state['issues'].get('7')
    local_remote = [json.loads(run('gh', 'api', f"repos/{args.repo}/issues/{entry['number']}").stdout)
                    for draft, entry in state['issues'].items() if draft != '7']
    if args.close_verified and publication and all(i['state'] == 'closed' for i in local_remote):
        deadline_guard(deadline, args.allow_late)
        if not publication.get('remote_verified'):
            mutate('gh', 'api', f"repos/{args.repo}/issues/{publication['number']}/comments", '-X', 'POST', '-f',
                   f'body=Publication verification executed: repository public; remote main matches {commit}; all local implementation issues read back closed with independent QA comments; actual issue links and dependency mappings recorded. Source/video/interview/browser limitations remain documented. Private submission comparisons are kept outside the public repository. No timestamps altered.')
            publication['remote_verified'] = True
            save(STATE_PATH, state)
        actual = json.loads(run('gh', 'api', f"repos/{args.repo}/issues/{publication['number']}").stdout)
        if actual['state'] != 'closed':
            mutate('gh', 'api', f"repos/{args.repo}/issues/{publication['number']}", '-X', 'PATCH', '-f', 'state=closed')
    verification = {'repository': repo['html_url'], 'public': not repo['private'], 'verified_application_commit': commit, 'checks_executed': checks, 'issues': []}
    private_verification = {'private_cutoff': deadline.isoformat(), 'issues': []}
    for draft, entry in state['issues'].items():
        actual = json.loads(run('gh', 'api', f"repos/{args.repo}/issues/{entry['number']}").stdout)
        def on_time(timestamp):
            return bool(timestamp) and dt.datetime.fromisoformat(timestamp.replace('Z', '+00:00')) < deadline
        verification['issues'].append({'draft': int(draft), 'url': actual['html_url'], 'state': actual['state'], 'created_at': actual['created_at'], 'closed_at': actual['closed_at']})
        private_verification['issues'].append({'draft': int(draft), 'created_before_cutoff': on_time(actual['created_at']), 'closed_before_cutoff': on_time(actual['closed_at'])})
    private_dir = ROOT / '_private'
    private_dir.mkdir(exist_ok=True)
    save(private_dir / 'submission-verification.json', private_verification)
    outdated = RUN_ROOT / '_docs/outdated'
    outdated.mkdir(exist_ok=True)
    initial_tasks = RUN_ROOT / '_docs/tasks.md'
    if initial_tasks.exists():
        initial_tasks.replace(outdated / 'tasks.md')
    save(RUN_ROOT / '_docs/github-verification.json', verification)
    save(ROOT / '_docs/github-verification.json', verification)
    run('git', 'add', '-A', '_docs')
    if run('git', 'diff', '--cached', '--quiet', check=False).returncode:
        run('git', '-c', 'user.name=StudySprint publication automation', '-c', 'user.email=studysprint-automation@users.noreply.github.com', 'commit', '-m', 'Record verified GitHub submission status and timestamps')
        mutate('git', 'push', 'submission', 'HEAD:main')
    final_local = run('git', 'rev-parse', 'HEAD').stdout.strip()
    final_remote = json.loads(run('gh', 'api', f'repos/{args.repo}/commits/main').stdout)['sha']
    if final_remote != final_local:
        raise RuntimeError('Final remote head does not match final local commit')
    print('Final remote/local head verified:', final_remote)
    print(json.dumps(verification, indent=2))
    print('Public repository:', repo['html_url'])


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, ValueError, KeyError, OSError) as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(1)
