from flask import Blueprint, request, jsonify
from sqlalchemy.orm import joinedload
from database import SessionLocal
from models import Scheme, SchemeRule, Profile
from services.rule_engine import RuleEngine

schemes_bp = Blueprint("schemes", __name__)

@schemes_bp.route("", methods=["GET"])
@schemes_bp.route("/", methods=["GET"])
def list_schemes():
    db = SessionLocal()
    try:
        category_filter = request.args.get("category")
        query_filter = request.args.get("q")
        status_filter = request.args.get("filter")  # eligible | almost | ineligible | all

        # Fetch current profile to dynamically evaluate eligibility
        user_profile = db.query(Profile).first()
        profile_dict = user_profile.to_dict() if user_profile else {
            "age": 21,
            "annual_income": "< 1 Lakh",
            "income_numeric": 95000,
            "occupation": "Student",
            "education": "B.E. (Final Year)",
            "state": "Maharashtra",
            "category": "General",
        }

        # Query only published, active schemes with their rules and document requirements
        query = db.query(Scheme).options(
            joinedload(Scheme.rules),
            joinedload(Scheme.document_requirements)
        ).filter(
            Scheme.is_active == True,
            (Scheme.status == "published") | (Scheme.status == None)
        )

        if category_filter and category_filter != "all":
            query = query.filter(Scheme.category.ilike(f"%{category_filter}%"))

        schemes = query.all()
        results = []

        for s in schemes:
            s_dict = s.to_dict(include_rules=False)
            
            # Evaluate against profile using deterministic rule engine
            eval_result = RuleEngine.evaluate_scheme(s.rules, profile_dict)
            s_dict["eligibilityStatus"] = eval_result["status"]
            s_dict["matchScore"] = eval_result["match_score"]
            s_dict["criteria"] = eval_result["criteria"]
            s_dict["ineligibleReason"] = eval_result["ineligible_reason"]

            # Filter by search query if provided
            if query_filter:
                q_lower = query_filter.lower()
                matches = (
                    q_lower in s.name.lower() or
                    q_lower in (s.short_description or "").lower() or
                    q_lower in (s.category or "").lower()
                )
                if not matches:
                    continue

            # Filter by status if requested
            if status_filter and status_filter != "all":
                if s_dict["eligibilityStatus"] != status_filter:
                    continue

            results.append(s_dict)

        # Sort: eligible first (high match score), then almost, then ineligible
        status_order = {"eligible": 0, "almost": 1, "ineligible": 2}
        results.sort(key=lambda x: (status_order.get(x["eligibilityStatus"], 3), -x["matchScore"]))

        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e), "schemes": []}), 500
    finally:
        db.close()

@schemes_bp.route("/<string:scheme_id>", methods=["GET"])
def get_scheme(scheme_id):
    db = SessionLocal()
    try:
        # Check by slug first, then by numeric id
        scheme = None
        if scheme_id.isdigit():
            scheme = db.query(Scheme).options(
                joinedload(Scheme.rules),
                joinedload(Scheme.document_requirements)
            ).filter(Scheme.id == int(scheme_id)).first()

        if not scheme:
            scheme = db.query(Scheme).options(
                joinedload(Scheme.rules),
                joinedload(Scheme.document_requirements)
            ).filter(Scheme.slug == scheme_id).first()

        # Reject if scheme is not found or not published
        if not scheme or not scheme.is_active or (scheme.status and scheme.status != "published"):
            return jsonify({"error": f"Scheme '{scheme_id}' not found"}), 404

        # Evaluate against user profile
        user_profile = db.query(Profile).first()
        profile_dict = user_profile.to_dict() if user_profile else {
            "age": 21,
            "annual_income": "< 1 Lakh",
            "income_numeric": 95000,
            "occupation": "Student",
            "education": "B.E. (Final Year)",
            "state": "Maharashtra",
            "category": "General",
        }

        eval_result = RuleEngine.evaluate_scheme(scheme.rules, profile_dict)
        data = scheme.to_dict(include_rules=False)
        data["eligibilityStatus"] = eval_result["status"]
        data["matchScore"] = eval_result["match_score"]
        data["criteria"] = eval_result["criteria"]
        data["ineligibleReason"] = eval_result["ineligible_reason"]

        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@schemes_bp.route("/match", methods=["POST"])
def match_schemes():
    """Dynamically evaluate all schemes against a custom profile payload."""
    db = SessionLocal()
    try:
        payload = request.get_json() or {}
        schemes = db.query(Scheme).options(joinedload(Scheme.rules)).filter(
            Scheme.is_active == True,
            (Scheme.status == "published") | (Scheme.status == None)
        ).all()

        matched = []
        for s in schemes:
            s_dict = s.to_dict(include_rules=False)
            eval_result = RuleEngine.evaluate_scheme(s.rules, payload)
            s_dict["eligibilityStatus"] = eval_result["status"]
            s_dict["matchScore"] = eval_result["match_score"]
            s_dict["criteria"] = eval_result["criteria"]
            s_dict["ineligibleReason"] = eval_result["ineligible_reason"]
            matched.append(s_dict)

        status_order = {"eligible": 0, "almost": 1, "ineligible": 2}
        matched.sort(key=lambda x: (status_order.get(x["eligibilityStatus"], 3), -x["matchScore"]))

        return jsonify({
            "total_evaluated": len(matched),
            "eligible_count": len([x for x in matched if x["eligibilityStatus"] == "eligible"]),
            "schemes": matched
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
