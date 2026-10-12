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

        if not scheme:
            return jsonify({"error": f"Scheme '{scheme_id}' not found"}), 404

        # Run rule engine
        result = RuleEngine.evaluate_scheme(scheme.rules, profile_data)

        # Record result in PostgreSQL
        record = EligibilityResult(
            scheme_id=scheme.id,
            status=result["status"],
            match_score=result["match_score"],
            criteria_breakdown=result["criteria"],
            reasoning_text=result["ineligible_reason"] or "All mandatory conditions satisfied."
        )
        db.add(record)
        db.commit()

        return jsonify({
            "schemeId": scheme.slug,
            "schemeName": scheme.name,
            "status": result["status"],
            "matchScore": result["match_score"],
            "passedCount": result["passed_count"],
            "totalCount": result["total_count"],
            "ineligibleReason": result["ineligible_reason"],
            "criteria": result["criteria"]
        })
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
