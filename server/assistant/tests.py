from unittest.mock import Mock, patch

from django.test import TestCase, override_settings
from django.urls import reverse


@override_settings(DEBUG=True)
class RespondViewTests(TestCase):
    def test_rejects_empty_messages(self):
        response = self.client.post(
            reverse("assistant-respond"),
            data={"message": "   ", "course": "Biology"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    @patch("assistant.views.OpenAI")
    def test_returns_generated_text(self, openai_class):
        generated_response = Mock(output_text="Try breaking the topic into parts.")
        openai_class.return_value.responses.create.return_value = generated_response

        response = self.client.post(
            reverse("assistant-respond"),
            data={"message": "Help me understand this topic.", "course": "Biology"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(), {"response": "Try breaking the topic into parts."}
        )

    @override_settings(DEBUG=False)
    def test_is_unavailable_outside_debug_mode(self):
        response = self.client.post(
            reverse("assistant-respond"),
            data={"message": "Hello", "course": "Biology"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 404)
