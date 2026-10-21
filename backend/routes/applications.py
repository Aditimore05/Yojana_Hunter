import datetime
from flask import Blueprint, request, jsonify, g
from database import SessionLocal
from models import Application, Scheme, Profile, User
from utils.auth import token_required

applications_bp = Blueprint("applications", __name__)

@applications_bp.route("", methods=["GET"])
@applications_bp.route("/", methods=["GET"])
@token_required
def list_applications():
    db = SessionLocal()
    try:
        apps = db.query(Application).order_by(Application.created_at.desc()).all()
        return jsonify([a.to_dict() for a in apps])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@applications_bp.route("/draft", methods=["GET"])
@token_required
def get_draft():
    db = SessionLocal()
    try:
        draft = db.query(Application).filter(Application.status == "draft").first()
        if not draft:
            # Prefill draft from profile
            profile = db.query(Profile).first()
            scheme = db.query(Scheme).filter(Scheme.slug == "pm-vidyalakshmi").first()
            scheme_id = scheme.id if scheme else 1
            scheme_name = scheme.name if scheme else "PM Vidyalakshmi Scheme"

            draft = Application(
                application_number=f"DRAFT-2026-VL-{int(datetime.datetime.utcnow().timestamp()) % 10000}",
                scheme_id=scheme_id,
                scheme_name=scheme_name,
                status="draft",
                applicant_name=profile.full_name if profile else "Aditi Lagad",
                father_name=profile.father_name if profile else "Santosh Lagad",
                date_of_birth=profile.date_of_birth if profile else "12-05-2005",
                education=profile.education if profile else "B.E. (Final Year)",
                family_income=profile.annual_income if profile else "< 1 Lakh",
                state=profile.state if profile else "Maharashtra",
                district=profile.district if profile else "Nashik",
                description="Pre-filled official draft ready for download & submission."
            )
            db.add(draft)
            db.commit()

        return jsonify(draft.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@applications_bp.route("/draft", methods=["PUT"])
@token_required
def update_draft():
    db = SessionLocal()
    try:
        data = request.get_json() or {}
        draft = db.query(Application).filter(Application.status == "draft").first()

        if not draft:
            draft = Application(
                application_number="DRAFT-2026-VL-8941",
                scheme_id=1,
                scheme_name="PM Vidyalakshmi Scheme"
            )
            db.add(draft)

        if "applicantName" in data:
            draft.applicant_name = data["applicantName"]
        if "fatherName" in data:
            draft.father_name = data["fatherName"]
        if "dateOfBirth" in data:
            draft.date_of_birth = data["dateOfBirth"]
        if "education" in data:
            draft.education = data["education"]
        if "familyIncome" in data:
            draft.family_income = data["familyIncome"]
        if "state" in data:
            draft.state = data["state"]
        if "district" in data:
            draft.district = data["district"]
        if "status" in data:
            draft.status = data["status"]

        draft.updated_at = datetime.datetime.utcnow()
        db.commit()
        return jsonify(draft.to_dict())
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@applications_bp.route("/submit", methods=["POST"])
@token_required
def submit_application():
    db = SessionLocal()
    try:
        data = request.get_json() or {}
        app_id = data.get("id") or data.get("applicationId")

        query = db.query(Application)
        if app_id:
            query = query.filter((Application.application_number == app_id) | (Application.id == (int(app_id) if str(app_id).isdigit() else -1)))
        draft = query.first()

        if not draft:
            return jsonify({"error": "Application draft not found"}), 404

        draft.status = "submitted"
        draft.updated_at = datetime.datetime.utcnow()
        db.commit()
        return jsonify({
            "message": "Application submitted successfully",
            "application": draft.to_dict()
        })
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
