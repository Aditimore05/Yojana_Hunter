import sys
import os
import pytest
from unittest.mock import MagicMock, patch

# Include backend in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from services.gemini_service import GeminiService


class TestGeminiService:
    def test_service_initialization_without_key(self):
        """Test graceful degradation when GEMINI_API_KEY is not configured."""
        with patch.object(GeminiService, "get_api_key", return_value=""):
            assert GeminiService.is_configured() is False
            status = GeminiService.test_connection()
            assert status["configured"] is False
            assert "not configured" in status["message"].lower()

    def test_secret_sanitization(self):
        """Verify API keys and tokens are never leaked in logs or error messages."""
        secret_sample = "AIzaSyDfakeKeyForTesting123456789012"
        leak_text = f"Error calling Gemini with key {secret_sample}: Failed to authenticate."
        sanitized = GeminiService.sanitize_error_message(leak_text)
        assert secret_sample not in sanitized
        assert "[REDACTED_API_KEY]" in sanitized

    def test_quota_error_detection_in_connection_test(self):
        """Verify 429 and RESOURCE_EXHAUSTED errors are properly classified as quota exhaustion."""
        with patch.object(GeminiService, "is_configured", return_value=True):
            with patch.object(GeminiService, "get_client", side_effect=Exception("HTTP 429 RESOURCE_EXHAUSTED: Rate limit exceeded")):
                res = GeminiService.test_connection()
                assert res["configured"] is True
                assert res["connected"] is False
                assert res["quotaExhausted"] is True

    def test_bounded_retry_logic(self):
        """Verify call_with_retry performs bounded retries on transient errors."""
        mock_fn = MagicMock(side_effect=[Exception("429 RESOURCE_EXHAUSTED"), "Success Result"])
        result = GeminiService.call_with_retry(mock_fn, max_retries=2, initial_delay=0.01)
        assert result == "Success Result"
        assert mock_fn.call_count == 2

    def test_deterministic_explanation_fallback(self):
        """Verify deterministic fallback explanation when Gemini is unconfigured."""
        with patch.object(GeminiService, "is_configured", return_value=False):
            scheme_data = {
                "name": "MahaDBT Post Matric Scholarship",
                "benefits": "100% Tuition fee reimbursement",
                "criteria": [
                    {"name": "Income Limit", "condition": "Family annual income <= 2.5 Lakh"},
                    {"name": "State", "condition": "Maharashtra Resident"}
                ]
            }
            res = GeminiService.generate_grounded_explanation(scheme_data)
            assert "explanation" in res
            assert res["source"] == "deterministic_engine_fallback"
            assert "MahaDBT Post Matric Scholarship" in res["explanation"]
            assert "100% Tuition fee reimbursement" in res["explanation"]

    def test_discover_schemes_unconfigured_error(self):
        """Verify discovery safely reports failure when API key is missing without crashing."""
        with patch.object(GeminiService, "is_configured", return_value=False):
            res = GeminiService.discover_schemes_grounded(search_query="Maharashtra scholarships")
            assert res["success"] is False
            assert res["quota_exhausted"] is False
            assert "not configured" in res["error"].lower()
            assert res["schemes"] == []
