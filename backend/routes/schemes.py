from flask import Blueprint, request, jsonify, g
from sqlalchemy.orm import joinedload
from database import SessionLocal
from models import Scheme, SchemeRule, Profile
from services.eligibility_service import SchemeEligibilityService
from utils.auth import optional_auth

schemes_bp = Blueprint("schemes", __name__)

def get_current_profile_dict(db) -> dict:
    """Helper to fetch stored citizen profile or standard baseline."""
    current_user = getattr(g, "current_user", None)
    if current_user:
        user_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
        if user_profile:
            return user_profile.to_dict()

    user_profile = db.query(Profile).first()
    if user_profile:
        return user_profile.to_dict()
    return {
        "age": 21,
        "gender": "Female",
        "annual_income": "< 1 Lakh",
        "income_numeric": 95000,
        "occupation": "Student",
        "education": "B.E. (Final Year)",
        "state": "Maharashtra",
        "district": "Nashik",
        "category": "General",
        "is_student": True,
        "is_farmer": False,
        "has_business": False,
        "is_disabled": False,
    }

@schemes_bp.route("", methods=["GET"])
@schemes_bp.route("/", methods=["GET"])
@optional_auth
def list_schemes():
    """
    GET /api/schemes
    Returns verified, published schemes evaluated against the citizen profile,
    ranked with transparent eligibility explanations.
    """
    db = SessionLocal()
    try:
        category_filter = request.args.get("category")
        state_filter = request.args.get("state")
        query_filter = request.args.get("q")
        status_filter = request.args.get("filter")  # eligible | possibly_eligible | not_eligible | applications_closed | all

        profile_dict = get_current_profile_dict(db)

        schemes = SchemeEligibilityService.get_ranked_schemes_for_profile(
            profile_data=profile_dict,
            category_filter=category_filter,
            state_filter=state_filter,
            status_filter=status_filter,
            search_query=query_filter
        )

        return jsonify(schemes)
    except Exception as e:
        return jsonify({"error": str(e), "schemes": []}), 500
    finally:
        db.close()

@schemes_bp.route("/<string:scheme_id>", methods=["GET"])
@optional_auth
def get_scheme(scheme_id):
    """
    GET /api/schemes/<scheme_id>
    Fetches full scheme details with transparent eligibility reasons and requirements breakdown.
    Draft and archived schemes return 404 for citizens.
    """
    db = SessionLocal()
    try:
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

        profile_dict = get_current_profile_dict(db)
        eval_result = SchemeEligibilityService.evaluate_scheme_for_profile(scheme, profile_dict)

        data = scheme.to_dict(include_rules=False)
        data["eligibilityStatus"] = eval_result["eligibility_status"]
        data["legacyEligibilityStatus"] = eval_result["legacy_status"]
        data["applicationStatus"] = eval_result["application_status"]
        data["matchScore"] = eval_result["match_score"]
        data["whyMatched"] = eval_result["why_matched"]
        data["requirementsSatisfied"] = eval_result["requirements_satisfied"]
        data["requirementsNotSatisfied"] = eval_result["requirements_not_satisfied"]
        data["missingInformation"] = eval_result["missing_information"]
        data["criteria"] = eval_result["criteria"]
        data["requiredDocuments"] = eval_result["required_documents"]
        data["applicationProcess"] = eval_result["application_procedure"]
        data["sourceReference"] = eval_result["source_reference"]

        if eval_result["requirements_not_satisfied"]:
            data["ineligibleReason"] = eval_result["requirements_not_satisfied"][0]
        else:
            data["ineligibleReason"] = None

        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@schemes_bp.route("/match", methods=["POST"])
def match_schemes():
    """
    POST /api/schemes/match
    Dynamically evaluate and rank all published schemes against a custom citizen profile payload.
    Used for instant smart questionnaire matching.
    """
    try:
        payload = request.get_json() or {}
        category = request.args.get("category") or payload.get("category_filter")
        state_filter = request.args.get("state") or payload.get("state_filter")
        search_query = request.args.get("q") or payload.get("q")

        matched = SchemeEligibilityService.get_ranked_schemes_for_profile(
            profile_data=payload,
            category_filter=category,
            state_filter=state_filter,
            search_query=search_query
        )

        eligible_count = len([x for x in matched if x["eligibilityStatus"] == "eligible"])
        possibly_eligible_count = len([x for x in matched if x["eligibilityStatus"] == "possibly_eligible"])
        not_eligible_count = len([x for x in matched if x["eligibilityStatus"] == "not_eligible"])
        closed_count = len([x for x in matched if x["eligibilityStatus"] == "applications_closed"])

        return jsonify({
            "total_evaluated": len(matched),
            "eligible_count": eligible_count,
            "possibly_eligible_count": possibly_eligible_count,
            "not_eligible_count": not_eligible_count,
            "applications_closed_count": closed_count,
            "schemes": matched
        })
    except Exception as e:
        return jsonify({"error": str(e), "schemes": []}), 500

@schemes_bp.route("/sync", methods=["POST"])
def sync_schemes():
    """
    POST /api/schemes/sync
    Actively fetches, probes official sources, and updates all 10 verified real schemes in the database.
    Recalculates eligibility recommendations against the user profile.
    """
    try:
        from services.scheme_sync_service import SchemeSyncService
        payload = request.get_json() or {}
        profile_data = payload.get("profile")
        result = SchemeSyncService.sync_all_schemes(profile_override=profile_data)
        status_code = 200 if result.get("success") else 500
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@schemes_bp.route("/sync-status", methods=["GET"])
def get_sync_status():
    """
    GET /api/schemes/sync-status
    Returns the latest synchronization status, total verified schemes count, and last sync timestamp.
    """
    db = SessionLocal()
    try:
        total_schemes = db.query(Scheme).count()
        verified_live = db.query(Scheme).filter(Scheme.source_verification_status.ilike("%verified%")).count()
        latest_scheme = db.query(Scheme).order_by(Scheme.last_fetched_at.desc()).first()

        return jsonify({
            "total_schemes": total_schemes,
            "verified_schemes": verified_live,
            "last_sync_time": latest_scheme.last_fetched_at.isoformat() if latest_scheme and latest_scheme.last_fetched_at else None,
            "last_verified_date": latest_scheme.last_verified_date if latest_scheme else "12 Oct 2026",
            "status": "ready"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@schemes_bp.route("/recommendations", methods=["GET"])
@optional_auth
def get_recommendations():
    """
    GET /api/schemes/recommendations
    Returns up to 10 top recommendations matching the current profile, ranked by relevance and eligibility.
    """
    db = SessionLocal()
    try:
        limit = int(request.args.get("limit", 10))
        profile_dict = get_current_profile_dict(db)

        # Allow overriding state/occupation for interactive testing
        if request.args.get("state"):
            profile_dict["state"] = request.args.get("state")
        if request.args.get("occupation"):
            profile_dict["occupation"] = request.args.get("occupation")
            if request.args.get("occupation").lower() == "farmer":
                profile_dict["is_farmer"] = True
            elif request.args.get("occupation").lower() == "student":
                profile_dict["is_farmer"] = False
                profile_dict["is_student"] = True

        ranked = SchemeEligibilityService.get_ranked_schemes_for_profile(profile_data=profile_dict)

        # Filter to eligible or possibly eligible recommendations first
        eligible = [s for s in ranked if s["eligibilityStatus"] in ("eligible", "possibly_eligible")]
        if len(eligible) < limit:
            remaining = [s for s in ranked if s not in eligible]
            recommendations = (eligible + remaining)[:limit]
        else:
            recommendations = eligible[:limit]

        return jsonify({
            "profile_evaluated": {
                "occupation": profile_dict.get("occupation"),
                "annual_income": profile_dict.get("annual_income") or profile_dict.get("annualIncome"),
                "age": profile_dict.get("age"),
                "state": profile_dict.get("state"),
                "education": profile_dict.get("education"),
                "category": profile_dict.get("category"),
            },
            "total_evaluated": len(ranked),
            "recommendations_count": len(recommendations),
            "recommendations": recommendations
        })
    except Exception as e:
        return jsonify({"error": str(e), "recommendations": []}), 500
    finally:
        db.close()

