from flask import Blueprint, request, jsonify, g
from sqlalchemy.orm import joinedload
from database import SessionLocal
from models import Scheme, SavedScheme, Profile
from utils.auth import token_required
from services.eligibility_service import SchemeEligibilityService

saved_schemes_bp = Blueprint("saved_schemes", __name__)

@saved_schemes_bp.route("", methods=["GET"])
@saved_schemes_bp.route("/", methods=["GET"])
@token_required
def list_saved_schemes():
    """
    GET /api/saved-schemes
    Returns all schemes saved/bookmarked by the currently authenticated user,
    evaluated against their own eligibility profile.
    """
    db = SessionLocal()
    try:
        user_id = g.current_user.id
        saved_records = db.query(SavedScheme).filter(
            SavedScheme.user_id == user_id
        ).order_by(SavedScheme.saved_at.desc()).all()

        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        profile_dict = profile.to_dict() if profile else {}

        results = []
        for record in saved_records:
            scheme = db.query(Scheme).options(
                joinedload(Scheme.rules),
                joinedload(Scheme.document_requirements)
            ).filter(Scheme.id == record.scheme_id).first()

            if not scheme or not scheme.is_active:
                continue

            eval_res = SchemeEligibilityService.evaluate_scheme_for_profile(scheme, profile_dict)
            data = scheme.to_dict(include_rules=False)
            data["savedAt"] = record.saved_at.isoformat() if record.saved_at else None
            data["savedRecordId"] = record.id
            data["isSaved"] = True
            data["eligibilityStatus"] = eval_res["eligibility_status"]
            data["legacyEligibilityStatus"] = eval_res["legacy_status"]
            data["applicationStatus"] = eval_res["application_status"]
            data["matchScore"] = eval_res["match_score"]
            data["whyMatched"] = eval_res["why_matched"]
            data["requirementsSatisfied"] = eval_res["requirements_satisfied"]
            data["requirementsNotSatisfied"] = eval_res["requirements_not_satisfied"]
            data["missingInformation"] = eval_res["missing_information"]
            data["requiredDocuments"] = eval_res["required_documents"]
            data["applicationProcess"] = eval_res["application_procedure"]
            data["sourceReference"] = eval_res["source_reference"]

            results.append(data)

        return jsonify({
            "total_saved": len(results),
            "schemes": results
        }), 200

    except Exception as e:
        return jsonify({"error": str(e), "schemes": []}), 500
    finally:
        db.close()

@saved_schemes_bp.route("", methods=["POST"])
@saved_schemes_bp.route("/", methods=["POST"])
@token_required
def save_scheme():
    """
    POST /api/saved-schemes
    Bookmarks a scheme for the currently authenticated user.
    """
    data = request.get_json() or {}
    scheme_id_raw = str(data.get("schemeId") or data.get("scheme_id") or "").strip()

    if not scheme_id_raw:
        return jsonify({
            "error": "Validation error",
            "message": "Scheme identifier is required.",
            "status_code": 400
        }), 400

    db = SessionLocal()
    try:
        user_id = g.current_user.id

        # Find scheme by ID or slug
        scheme = None
        if scheme_id_raw.isdigit():
            scheme = db.query(Scheme).filter(Scheme.id == int(scheme_id_raw)).first()
        if not scheme:
            scheme = db.query(Scheme).filter(Scheme.slug == scheme_id_raw).first()

        if not scheme:
            return jsonify({
                "error": "Not found",
                "message": f"Scheme '{scheme_id_raw}' not found.",
                "status_code": 404
            }), 404

        existing = db.query(SavedScheme).filter(
            SavedScheme.user_id == user_id,
            SavedScheme.scheme_id == scheme.id
        ).first()

        if existing:
            return jsonify({
                "saved": True,
                "schemeId": scheme.slug,
                "message": "Scheme is already in your saved bookmarks."
            }), 200

        new_saved = SavedScheme(
            user_id=user_id,
            scheme_id=scheme.id
        )
        db.add(new_saved)
        db.commit()

        return jsonify({
            "saved": True,
            "schemeId": scheme.slug,
            "message": "Scheme added to your saved bookmarks."
        }), 201

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@saved_schemes_bp.route("/<string:scheme_id>", methods=["DELETE"])
@token_required
def remove_saved_scheme(scheme_id):
    """
    DELETE /api/saved-schemes/<scheme_id>
    Removes a bookmarked scheme for the currently authenticated user.
    """
    db = SessionLocal()
    try:
        user_id = g.current_user.id

        # Find scheme by numeric id or slug
        scheme = None
        if scheme_id.isdigit():
            scheme = db.query(Scheme).filter(Scheme.id == int(scheme_id)).first()
        if not scheme:
            scheme = db.query(Scheme).filter(Scheme.slug == scheme_id).first()

        if not scheme:
            return jsonify({
                "error": "Not found",
                "message": f"Scheme '{scheme_id}' not found.",
                "status_code": 404
            }), 404

        record = db.query(SavedScheme).filter(
            SavedScheme.user_id == user_id,
            SavedScheme.scheme_id == scheme.id
        ).first()

        if record:
            db.delete(record)
            db.commit()

        return jsonify({
            "saved": False,
            "schemeId": scheme.slug,
            "message": "Scheme removed from saved bookmarks."
        }), 200

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@saved_schemes_bp.route("/check/<string:scheme_id>", methods=["GET"])
@token_required
def check_saved_scheme(scheme_id):
    """
    GET /api/saved-schemes/check/<scheme_id>
    Checks if a scheme is currently bookmarked by the authenticated user.
    """
    db = SessionLocal()
    try:
        user_id = g.current_user.id
        scheme = None
        if scheme_id.isdigit():
            scheme = db.query(Scheme).filter(Scheme.id == int(scheme_id)).first()
        if not scheme:
            scheme = db.query(Scheme).filter(Scheme.slug == scheme_id).first()

        if not scheme:
            return jsonify({"isSaved": False}), 200

        record = db.query(SavedScheme).filter(
            SavedScheme.user_id == user_id,
            SavedScheme.scheme_id == scheme.id
        ).first()

        return jsonify({"isSaved": bool(record)}), 200
    finally:
        db.close()
