import datetime as dt
import importlib.util
from pathlib import Path
import unittest
import tempfile
from unittest.mock import patch, Mock

spec = importlib.util.spec_from_file_location('publish', Path(__file__).with_name('publish_github.py'))
publish = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publish)

class PublicationSafetyTests(unittest.TestCase):
    def test_expired_deadline_blocks(self):
        with self.assertRaises(RuntimeError):
            publish.deadline_guard(dt.datetime(2000, 1, 1, tzinfo=dt.timezone.utc))

    def test_future_deadline_allows(self):
        publish.deadline_guard(dt.datetime(2999, 1, 1, tzinfo=dt.timezone.utc))

    def test_incomplete_qa_never_closes(self):
        self.assertFalse(publish.verified_record({'status': 'PASS'}))
        self.assertFalse(publish.verified_record({'status': 'PASS', 'acceptance': [{'criterion': 'a', 'verdict': 'PASS'}]}))
        self.assertFalse(publish.verified_record({'status': 'PASS', 'acceptance': [{'criterion': 'a', 'verdict': 'FAIL', 'evidence': 'x'}]}))

    def test_complete_qa_eligible(self):
        self.assertTrue(publish.verified_record({'status': 'PASS', 'acceptance': [{'criterion': 'a', 'verdict': 'PASS', 'evidence': 'actual check'}]}))

    def test_missing_checkbox_cannot_close(self):
        issue = {'body': '- [ ] First requirement.\n- [ ] Second requirement.'}
        record = {'status': 'PASS', 'acceptance': [{'criterion': 'First requirement.', 'verdict': 'PASS', 'evidence': 'executed'}]}
        self.assertFalse(publish.verified_record(record, issue))

    def test_unrelated_populated_repo_refused(self):
        with self.assertRaises(RuntimeError):
            publish.recognizable_repository({'size': 10}, False)
        publish.recognizable_repository({'size': 0}, False)
        publish.recognizable_repository({'size': 10}, True)

    def test_public_redaction_preserves_app_dates(self):
        cutoff = dt.datetime(2031, 5, 6, 7, 8, 9, tzinfo=dt.timezone.utc)
        text = 'Submission deadline: ' + cutoff.isoformat() + '\nTask due date: 2031-05-10\n'
        public = publish.sanitize_public_text(text, cutoff)
        self.assertNotIn(cutoff.isoformat(), public)
        self.assertIn('2031-05-10', public)
        self.assertIn(publish.REDACTION, public)

    def test_historical_timing_redaction_without_keyword(self):
        text = 'Close all issues before 04:05 Almaty time.\nNinety-minute submission window.\nInterview one question at a time.\n'
        public = publish.sanitize_public_text(text)
        self.assertNotIn('04:05', public)
        self.assertNotIn('Ninety-minute submission window', public)
        self.assertIn('one question at a time', public)

    def test_snapshot_excludes_private_history(self):
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / 'source'
            source.mkdir()
            (source / '.git').mkdir()
            (source / '.git' / 'objects').write_text('original private history')
            (source / '_private').mkdir()
            (source / '_private' / 'secret.json').write_text('private cutoff')
            (source / 'git-history.bundle').write_text('private original bundle')
            (source / 'tsconfig.tsbuildinfo').write_text('generated artifact')
            (source / '.DS_Store').write_text('generated metadata')
            (source / 'README.md').write_text('Prepared application')
            destination = Path(folder) / 'public'
            with patch.object(publish, 'ROOT', source):
                publish.prepare_public_snapshot(destination, dt.datetime(2999, 1, 1, tzinfo=dt.timezone.utc))
            self.assertFalse((destination / '.git').exists())
            self.assertFalse((destination / '_private').exists())
            self.assertFalse((destination / 'git-history.bundle').exists())
            self.assertFalse((destination / 'tsconfig.tsbuildinfo').exists())
            self.assertFalse((destination / '.DS_Store').exists())
            self.assertTrue((destination / '.publication-privacy-v2').exists())

    @patch.object(publish.subprocess, 'run')
    def test_command_uses_argument_array_no_shell(self, mock_run):
        mock_run.return_value = Mock(returncode=0, stdout='', stderr='')
        publish.run('gh', 'api', 'repos/test/repo', '-f', 'body=$(no execution)')
        args, kwargs = mock_run.call_args
        self.assertEqual(args[0], ('gh', 'api', 'repos/test/repo', '-f', 'body=$(no execution)'))
        self.assertNotIn('shell', kwargs)

if __name__ == '__main__':
    unittest.main()
