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
        user = g.current_user
        apps = db.query(Application).filter(Application.user_id == user.id).order_by(Application.created_at.desc()).all()
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
        user = g.current_user
        profile = db.query(Profile).filter(Profile.user_id == user.id).first()
        draft = db.query(Application).filter(
            Application.user_id == user.id,
            Application.status == "draft"
        ).first()

        if not draft:
            # Prefill draft dynamically from the current authenticated user's profile
            scheme = db.query(Scheme).filter(Scheme.is_active == True, Scheme.status == "published").first()
            scheme_id = scheme.id if scheme else 1
            scheme_name = scheme.name if scheme else "PM Vidyalakshmi Scheme"

            user_name = profile.full_name if profile and profile.full_name else (user.email.split("@")[0].capitalize() if user.email else "Citizen Applicant")

            draft = Application(
                user_id=user.id,
                application_number=f"DRAFT-2026-VL-{int(datetime.datetime.utcnow().timestamp()) % 100000}",
                scheme_id=scheme_id,
                scheme_name=scheme_name,
                status="draft",
                applicant_name=user_name,
                father_name=profile.father_name if profile and profile.father_name else "",
                date_of_birth=profile.date_of_birth if profile and profile.date_of_birth else "",
                education=profile.education if profile and profile.education else "",
                family_income=profile.annual_income if profile and profile.annual_income else "",
                state=profile.state if profile and profile.state else "",
                district=profile.district if profile and profile.district else "",
                description="Pre-filled official draft ready for download & submission."
            )
            db.add(draft)
            db.commit()
            db.refresh(draft)
        else:
            # If draft already exists, ensure it stays in sync with current user profile
            if profile:
                changed = False
                if profile.full_name and (not draft.applicant_name or draft.applicant_name == "Citizen Applicant"):
                    draft.applicant_name = profile.full_name
                    changed = True
                if profile.father_name and not draft.father_name:
                    draft.father_name = profile.father_name
                    changed = True
                if profile.date_of_birth and not draft.date_of_birth:
                    draft.date_of_birth = profile.date_of_birth
                    changed = True
                if profile.education and not draft.education:
                    draft.education = profile.education
                    changed = True
                if profile.annual_income and not draft.family_income:
                    draft.family_income = profile.annual_income
                    changed = True
                if profile.state and not draft.state:
                    draft.state = profile.state
                    changed = True
                if profile.district and not draft.district:
                    draft.district = profile.district
                    changed = True
                if changed:
                    db.commit()
                    db.refresh(draft)

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
        user = g.current_user
        data = request.get_json() or {}
        draft = db.query(Application).filter(
            Application.user_id == user.id,
            Application.status == "draft"
        ).first()

        if not draft:
            draft = Application(
                user_id=user.id,
                application_number=f"DRAFT-2026-VL-{int(datetime.datetime.utcnow().timestamp()) % 100000}",
                scheme_id=1,
                scheme_name="PM Vidyalakshmi Scheme",
                status="draft"
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
        db.refresh(draft)
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
        user = g.current_user
        data = request.get_json() or {}
        app_id = data.get("id") or data.get("applicationId")

        query = db.query(Application).filter(Application.user_id == user.id)
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
