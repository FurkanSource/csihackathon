import unittest
from unittest.mock import patch

from backend import server


class ChatSecurityTests(unittest.TestCase):
    def setUp(self):
        self.client = server.app.test_client()
        server.rate_limit_store.clear()

    def post_chat(self):
        return self.client.post(
            "/api/chat",
            json={"message": "How do SmartLead lead scores work?", "history": []},
        )

    @patch.object(server, "_log_chat")
    def test_chat_returns_503_without_server_key(self, _log_chat):
        with patch.object(server, "AI_AVAILABLE", False):
            response = self.post_chat()

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.get_json()["reason"], "ai_unavailable")

    @patch.object(server, "_log_chat")
    @patch.object(server, "check_rate_limit", return_value={"allowed": True})
    @patch.object(server, "call_groq", return_value="Lead scores prioritize buying intent.")
    def test_chat_uses_server_side_groq(
        self, call_groq, _check_rate_limit, _log_chat
    ):
        with patch.object(server, "AI_AVAILABLE", True):
            response = self.post_chat()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json()["reply"], "Lead scores prioritize buying intent."
        )
        call_groq.assert_called_once()


if __name__ == "__main__":
    unittest.main()
