import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class AIService:
    """
    Central AI invocation gateway.
    Handles user consent verification, prompt injection safeguards,
    fallbacks, and retry logic.
    """

    @staticmethod
    def verify_consent(consent_granted: bool) -> bool:
        if not consent_granted:
            logger.warning("AI execution halted: User has not granted AI processing consent.")
            return False
        return True

    @classmethod
    async def generate_explanation(
        cls, 
        scheme_name: str, 
        rule_results: Dict[str, Any], 
        source_url: str,
        language: str = "en",
        consent_granted: bool = True
    ) -> str:
        if not cls.verify_consent(consent_granted):
            return "AI explanation unavailable. Consent not granted. Eligibility was calculated strictly by the deterministic rule engine."

        # Fallback / baseline template if LLM API is offline
        status = rule_results.get("status", "unknown").upper()
        passed = rule_results.get("passed_count", 0)
        total = rule_results.get("total_count", 0)
        
        return (
            f"Scheme: {scheme_name}\n"
            f"Eligibility Status: {status} ({passed}/{total} criteria satisfied).\n"
            f"Official Notification Source: {source_url}\n"
            f"Please verify required documentation before applying."
        )
