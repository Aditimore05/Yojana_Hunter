import logging
from typing import Dict, Any, Optional
from services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

class AIService:
    """
    Central AI invocation gateway.
    Handles user consent verification, prompt injection safeguards,
    fallbacks, and integration with the official GeminiService.
    """

    @staticmethod
    def verify_consent(consent_granted: bool) -> bool:
        if not consent_granted:
            logger.warning("AI execution halted: User has not granted AI processing consent.")
            return False
        return True

    @classmethod
    def generate_explanation(
        cls, 
        scheme_data: Dict[str, Any], 
        profile_data: Dict[str, Any], 
        rule_results: Dict[str, Any],
        consent_granted: bool = True
    ) -> Dict[str, Any]:
        """
        Generates a transparent, grounded explanation of scheme eligibility.
        Upholds deterministic decision and avoids hallucinating rules.
        """
        if not cls.verify_consent(consent_granted):
            return {
                "explanation": "AI explanation unavailable. Consent not granted. Eligibility was calculated strictly by the deterministic rule engine.",
                "source": "consent_required",
                "citations": []
            }

        return GeminiService.generate_grounded_explanation(
            scheme_data=scheme_data,
            profile_data=profile_data,
            eval_result=rule_results
        )
