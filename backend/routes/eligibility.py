from flask import Blueprint, request, jsonify
from database import SessionLocal
from models import Scheme, SchemeRule, EligibilityResult
from services.rule_engine import RuleEngine

eligibility_bp = Blueprint("eligibility", __name__)

@eligibility_bp.route("/evaluate", methods=["POST"])
def evaluate_eligibility():
    db = SessionLocal()
    try:
        payload = request.get_json() or {}
        scheme_id = payload.get("scheme_id") or payload.get("schemeId")
        profile_data = payload.get("profile") or {}

        if not scheme_id:
            return jsonify({"error": "scheme_id is required"}), 400

        # Look up scheme
        scheme = None
        if str(scheme_id).isdigit():
            scheme = db.query(Scheme).filter(Scheme.id == int(scheme_id)).first()
        if not scheme:
            scheme = db.query(Scheme).filter(Scheme.slug == str(scheme_id)).first()

        if (
            not scheme 
            or not scheme.is_active 
            or scheme.status != "published" 
            or not scheme.admin_review_status 
            or scheme.admin_review_status not in ("approved", "published")
        ):
            return jsonify({"error": f"Scheme '{scheme_id}' not found"}), 404

        # Run unified eligibility service (evaluates occupation, criteria, rules, etc.)
        from services.eligibility_service import SchemeEligibilityService
        eval_result = SchemeEligibilityService.evaluate_scheme_for_profile(scheme, profile_data)

        # Record result in PostgreSQL
        record = EligibilityResult(
            scheme_id=scheme.id,
            status=eval_result["eligibility_status"],
            match_score=eval_result["match_score"],
            criteria_breakdown=eval_result["criteria"],
            reasoning_text=(eval_result["requirements_not_satisfied"][0] if eval_result["requirements_not_satisfied"] else "All mandatory conditions satisfied.")
        )
        db.add(record)
        db.commit()

        return jsonify({
            "schemeId": scheme.slug,
            "schemeName": scheme.name,
            "status": eval_result["eligibility_status"],
            "legacyStatus": eval_result["legacy_status"],
            "matchScore": eval_result["match_score"],
            "matchReason": eval_result["match_reason"],
            "whyMatched": eval_result["why_matched"],
            "requirementsSatisfied": eval_result["requirements_satisfied"],
            "requirementsNotSatisfied": eval_result["requirements_not_satisfied"],
            "missingInformation": eval_result["missing_information"],
            "ineligibleReason": (eval_result["requirements_not_satisfied"][0] if eval_result["requirements_not_satisfied"] else None),
            "criteria": eval_result["criteria"]
        })
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
