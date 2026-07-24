from pathlib import Path
import re
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[1]
KEY_PATTERN = re.compile(r"gsk_[A-Za-z0-9]{20,}")
CONFLICT_PATTERN = re.compile(r"^(<<<<<<<|=======|>>>>>>>)", re.MULTILINE)


class RepositoryHygieneTests(unittest.TestCase):
    def test_tracked_text_contains_no_groq_key(self):
        tracked = subprocess.check_output(
            ["git", "ls-files"], cwd=ROOT, text=True
        ).splitlines()
        offenders = []
        for relative in tracked:
            path = ROOT / relative
            try:
                text = path.read_text(encoding="utf-8")
            except (UnicodeDecodeError, IsADirectoryError):
                continue
            if KEY_PATTERN.search(text):
                offenders.append(relative)
        self.assertEqual(offenders, [])

    def test_client_has_no_direct_groq_access(self):
        source = (ROOT / "client/src/components/ChatBot.jsx").read_text(encoding="utf-8")
        self.assertNotIn("api.groq.com", source)
        self.assertNotIn("GROQ_KEY", source)
        self.assertNotIn("Authorization", source)
        self.assertIn("fetch('/api/chat'", source)

    def test_readme_has_no_conflict_markers(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIsNone(CONFLICT_PATTERN.search(readme))

    def test_real_env_file_is_ignored(self):
        result = subprocess.run(
            ["git", "check-ignore", "-q", "backend/.env"], cwd=ROOT
        )
        self.assertEqual(result.returncode, 0)

    def test_env_example_contains_only_placeholder_configuration(self):
        template = (ROOT / "backend/.env.example").read_text(encoding="utf-8")
        self.assertIn("GROQ_API_KEY=replace_with_your_groq_api_key", template)
        self.assertIsNone(KEY_PATTERN.search(template))


if __name__ == "__main__":
    unittest.main()
