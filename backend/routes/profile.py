from flask import Blueprint, request, jsonify, g
from sqlalchemy import case
from database import SessionLocal
from models import Profile, User, Application, AuditLog, SavedScheme
from utils.auth import token_required, optional_auth
from utils.activity import record_activity, compute_user_level
import datetime

profile_bp = Blueprint("profile", __name__)

def calculate_completeness(p: Profile) -> int:
    """Calculate percentage of profile fields completed."""
    fields = [
        p.full_name, p.age, p.gender, p.occupation, p.annual_income,
        p.state, p.district, p.education, p.category, p.father_name, p.date_of_birth
    ]
    completed = sum(1 for f in fields if f is not None and str(f).strip() != "")
    return int((completed / len(fields)) * 100)

def normalize_gender(val: any) -> str:
    """Validates and normalizes gender values to standard titles."""
    if not val:
        return ""
    g = str(val).strip().lower()
    if any(m in g for m in ["male", "man", "men", "boy", "पुरुष", "लड़का", "माणूस", "purush"]) and not any(f in g for f in ["female", "woman", "महिला"]):
        return "Male"
    if any(f in g for f in ["female", "woman", "women", "girl", "महिला", "स्त्री", "लड़की", "औरत", "mahila"]):
        return "Female"
    if any(t in g for t in ["trans", "transgender", "third gender", "ट्रांसजेंडर", "तृतीयपंथी"]):
        return "Transgender"
    if any(o in g for o in ["other", "non-binary", "इतर", "अन्य"]):
        return "Other"
    return str(val).strip().capitalize()

def normalize_relationship(val: any) -> str:
    """Normalizes relationship value to standard family categories."""
    if not val:
        return "Self"
    r = str(val).strip().lower()
    if "self" in r or "myself" in r or "account" in r or "me" == r:
        return "Self"
    if "father" in r or "dad" in r or "पिता" in r or "बाबा" in r or "वडिल" in r:
        return "Father"
    if "mother" in r or "mom" in r or "माता" in r or "आई" in r or "मां" in r:
        return "Mother"
    if "child" in r or "son" in r or "daughter" in r or "kid" in r or "बच्चा" in r or "मुलगा" in r or "मुलगी" in r:
        return "Child"
    if "spouse" in r or "wife" in r or "husband" in r or "पत्नी" in r or "पती" in r:
        return "Spouse"
    return str(val).strip().capitalize() or "Other"

def populate_profile_from_data(profile: Profile, data: dict):
    """Updates Profile model attributes from dict payload."""
    if "relationship" in data and data["relationship"]:
        profile.relationship = normalize_relationship(data["relationship"])
    elif not profile.relationship:
        profile.relationship = "Self"

    if "name" in data:
        profile.full_name = data["name"]
    elif "fullName" in data:
        profile.full_name = data["fullName"]
    elif "full_name" in data:
        profile.full_name = data["full_name"]

    if "age" in data and data["age"] is not None:
        try:
            profile.age = int(data["age"])
        except (ValueError, TypeError):
            pass

    if "gender" in data:
        profile.gender = normalize_gender(data["gender"])

    if "occupation" in data:
        profile.occupation = data["occupation"]
        occ_l = (str(data["occupation"]) or "").lower()
        if "student" in occ_l and not any(k in occ_l for k in ["farmer", "kisan", "agri"]):
            profile.is_student = True
            profile.is_farmer = False
            profile.has_business = False
        elif any(k in occ_l for k in ["farmer", "kisan", "agri", "cultivat"]) and "student" not in occ_l:
            profile.is_farmer = True
            profile.is_student = False
            profile.has_business = False
        elif any(b in occ_l for b in ["business", "entrepreneur", "self-employed"]) and not any(k in occ_l for k in ["farmer", "student"]):
            profile.has_business = True
            profile.is_farmer = False
            profile.is_student = False
        elif any(s in occ_l for s in ["salaried", "unemployed", "homemaker", "artisan"]):
            profile.is_farmer = False
            profile.is_student = False

    if "employmentStatus" in data or "employment_status" in data:
        profile.employment_status = data.get("employmentStatus") or data.get("employment_status")

    if "annualIncome" in data:
        profile.annual_income = data["annualIncome"]
    elif "annual_income" in data:
        profile.annual_income = data["annual_income"]

    if "incomeNumeric" in data and data["incomeNumeric"] is not None:
        try:
            profile.income_numeric = float(data["incomeNumeric"])
        except (ValueError, TypeError):
            pass

    if "education" in data:
        profile.education = data["education"]
    if "state" in data:
        profile.state = data["state"]
    if "district" in data:
        profile.district = data["district"]
    if "category" in data:
        profile.category = data["category"]
    if "fatherName" in data:
        profile.father_name = data["fatherName"]
    elif "father_name" in data:
        profile.father_name = data["father_name"]
    if "dateOfBirth" in data:
        profile.date_of_birth = data["dateOfBirth"]
    elif "date_of_birth" in data:
        profile.date_of_birth = data["date_of_birth"]
    if "language" in data:
        profile.preferred_language = data["language"]

    if "landHoldingAcres" in data or "land_holding_acres" in data:
        val = data.get("landHoldingAcres") or data.get("land_holding_acres")
        if val is not None and str(val).strip() != "":
            try:
                profile.land_holding_acres = float(val)
            except (ValueError, TypeError):
                pass

    # Disambiguate farmer and student flags
    occ_low = (profile.occupation or "").lower()
    is_farmer_in_occ = any(k in occ_low for k in ["farmer", "kisan", "agri", "cultivat"])
    is_student_in_occ = "student" in occ_low
    user_land = profile.land_holding_acres or 0.0

    if is_student_in_occ and not is_farmer_in_occ:
        profile.is_student = True
        if user_land > 0 and ("isFarmer" in data or "is_farmer" in data):
            profile.is_farmer = bool(data.get("isFarmer") if "isFarmer" in data else data.get("is_farmer"))
        else:
            profile.is_farmer = False
    elif is_farmer_in_occ and not is_student_in_occ:
        profile.is_farmer = True
        profile.is_student = False
    else:
        profile.is_student = False
        if user_land > 0 and ("isFarmer" in data or "is_farmer" in data):
            profile.is_farmer = bool(data.get("isFarmer") if "isFarmer" in data else data.get("is_farmer"))
        else:
            profile.is_farmer = False

    if "course" in data:
        profile.course = data["course"]
    if "institution" in data:
        profile.institution = data["institution"]
    if "hasBusiness" in data or "has_business" in data:
        profile.has_business = bool(data.get("hasBusiness") if "hasBusiness" in data else data.get("has_business"))
    if "businessType" in data or "business_type" in data:
        profile.business_type = data.get("businessType") or data.get("business_type")
    if "isDisabled" in data or "is_disabled" in data:
        profile.is_disabled = bool(data.get("isDisabled") if "isDisabled" in data else data.get("is_disabled"))
    if "disabilityType" in data or "disability_type" in data:
        profile.disability_type = data.get("disabilityType") or data.get("disability_type")
    if "isTaxPayer" in data or "is_tax_payer" in data:
        profile.is_tax_payer = bool(data.get("isTaxPayer") if "isTaxPayer" in data else data.get("is_tax_payer"))
    if "isGovtEmployee" in data or "is_govt_employee" in data:
        profile.is_govt_employee = bool(data.get("isGovtEmployee") if "isGovtEmployee" in data else data.get("is_govt_employee"))

    profile.completeness_percent = calculate_completeness(profile)
    profile.updated_at = datetime.datetime.utcnow()


@profile_bp.route("/all", methods=["GET"])
@profile_bp.route("/list", methods=["GET"])
@optional_auth
def get_all_profiles():
    """
    GET /api/profiles/all or /api/profile/all
    Returns all saved profiles (Self + family members) for authenticated user.
    """
    user = getattr(g, "current_user", None)
    if not user:
        return jsonify({"profiles": [], "count": 0}), 200

    db = SessionLocal()
    try:
        # Sort so 'Self' is first, then other family members by id
        profiles = db.query(Profile).filter(Profile.user_id == user.id).order_by(
            case((Profile.relationship == 'Self', 0), else_=1),
            Profile.id.asc()
        ).all()

        if not profiles:
            # Ensure primary Self profile exists
            self_profile = Profile(
                user_id=user.id,
                relationship="Self",
                full_name=user.email.split("@")[0].capitalize() if user.email else "Citizen",
                completeness_percent=0,
                preferred_language="en"
            )
            db.add(self_profile)
            db.commit()
            profiles = [self_profile]

        return jsonify({
            "profiles": [p.to_dict() for p in profiles],
            "count": len(profiles)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@profile_bp.route("/<int:profile_id>", methods=["GET"])
@optional_auth
def get_profile_by_id(profile_id: int):
    """
    GET /api/profiles/<id>
    Fetches a specific family member profile by ID.
    """
    user = getattr(g, "current_user", None)
    if not user:
        return jsonify({"error": "Authentication required"}), 401

    db = SessionLocal()
    try:
        profile = db.query(Profile).filter(Profile.id == profile_id, Profile.user_id == user.id).first()
        if not profile:
            return jsonify({"error": "Profile not found"}), 404
        return jsonify(profile.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@profile_bp.route("", methods=["GET"])
@profile_bp.route("/", methods=["GET"])
@profile_bp.route("/me", methods=["GET"])
@optional_auth
def get_profile():
    """
    GET /api/profile or GET /api/profiles
    If accessed as /api/profiles, returns the list of all family profiles.
    If accessed as /api/profile, returns single active profile (with optional ?profile_id=X) and userLevel.
    """
    # If the request path was /api/profiles or /api/v1/profiles, return the list
    if request.path.rstrip("/").endswith("/profiles"):
        return get_all_profiles()

    db = SessionLocal()
    try:
        if getattr(g, "current_user", None):
            user = g.current_user
            profile_id = request.args.get("profile_id")
            profile = None

            if profile_id:
                try:
                    profile = db.query(Profile).filter(Profile.id == int(profile_id), Profile.user_id == user.id).first()
                except (ValueError, TypeError):
                    profile = None

            if not profile:
                # Prefer Self profile, else first profile
                profile = db.query(Profile).filter(Profile.user_id == user.id, Profile.relationship == "Self").first()
                if not profile:
                    profile = db.query(Profile).filter(Profile.user_id == user.id).order_by(Profile.id.asc()).first()

            if not profile:
                profile = Profile(
                    user_id=user.id,
                    relationship="Self",
                    full_name=user.email.split("@")[0].capitalize() if user.email else "Citizen",
                    completeness_percent=0,
                    preferred_language="en"
                )
                db.add(profile)
                db.commit()

            activity_count = db.query(AuditLog).filter(AuditLog.user_id == user.id).count()
            saved_count = db.query(SavedScheme).filter(SavedScheme.user_id == user.id).count()
            app_count = db.query(Application).filter(Application.user_id == user.id).count()
            level_info = compute_user_level(profile, activity_count, saved_count, app_count)

            p_dict = profile.to_dict()
            p_dict["userLevel"] = level_info
            res_dict = dict(p_dict)
            res_dict["profile"] = p_dict
            res_dict["userLevel"] = level_info
            return jsonify(res_dict)

        # Unauthenticated default profile template
        level_info = compute_user_level(None, 0, 0, 0)
        guest_profile = {
            "id": 0,
            "userId": 0,
            "relationship": "Self",
            "name": "Guest Citizen",
            "avatarUrl": None,
            "age": None,
            "gender": "",
            "occupation": "",
            "employmentStatus": "",
            "annualIncome": "",
            "incomeNumeric": None,
            "education": "",
            "state": "",
            "district": "",
            "category": "",
            "fatherName": "",
            "dateOfBirth": "",
            "landHoldingAcres": 0.0,
            "isDisabled": False,
            "isFarmer": False,
            "isStudent": False,
            "course": "",
            "institution": "",
            "hasBusiness": False,
            "businessType": "",
            "disabilityType": "",
            "isTaxPayer": False,
            "isGovtEmployee": False,
            "language": "en",
            "completenessPercent": 0,
            "updatedAt": None,
        }
        return jsonify(guest_profile)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@profile_bp.route("", methods=["POST"])
@profile_bp.route("/", methods=["POST"])
@optional_auth
def create_profile():
    """
    POST /api/profiles or POST /api/profile
    Creates a new family-member profile under the authenticated user's account.
    """
    user = getattr(g, "current_user", None)
    data = request.get_json() or {}

    if not user:
        # Return guest representation
        guest = dict(data)
        guest["relationship"] = normalize_relationship(guest.get("relationship", "Self"))
        guest["gender"] = normalize_gender(guest.get("gender"))
        guest["profile"] = dict(guest)
        return jsonify(guest), 200

    db = SessionLocal()
    try:
        new_profile = Profile(user_id=user.id)
        populate_profile_from_data(new_profile, data)
        db.add(new_profile)
        db.commit()

        # Record activity
        rel_label = new_profile.relationship or "Family Member"
        name_label = new_profile.full_name or rel_label
        record_activity(
            db,
            user.id,
            "profile_created",
            {
                "title": f"Added profile for {name_label} ({rel_label})",
                "relationship": rel_label,
                "occupation": new_profile.occupation,
                "state": new_profile.state
            }
        )

        p_dict = new_profile.to_dict()
        p_dict["profile"] = dict(p_dict)
        return jsonify(p_dict), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@profile_bp.route("/<int:profile_id>", methods=["PUT"])
@profile_bp.route("", methods=["PUT"])
@profile_bp.route("/", methods=["PUT"])
@profile_bp.route("/me", methods=["PUT"])
@optional_auth
def update_profile(profile_id: int = None):
    """
    PUT /api/profiles/<id> or PUT /api/profile
    Updates an existing profile. If profile_id not in path, inspects query/body or falls back to 'Self'.
    """
    db = SessionLocal()
    try:
        user = getattr(g, "current_user", None)
        data = request.get_json() or {}

        if not user:
            guest = dict(data)
            occ_l = (str(guest.get("occupation") or "")).lower()
            if "student" in occ_l and not any(k in occ_l for k in ["farmer", "kisan", "agri"]):
                guest["isStudent"] = True
                guest["is_student"] = True
                guest["isFarmer"] = False
                guest["is_farmer"] = False
            elif any(k in occ_l for k in ["farmer", "kisan", "agri", "cultivat"]) and "student" not in occ_l:
                guest["isFarmer"] = True
                guest["is_farmer"] = True
                guest["isStudent"] = False
                guest["is_student"] = False
            else:
                guest["isStudent"] = False
                guest["is_student"] = False
                land = guest.get("landHoldingAcres") or guest.get("land_holding_acres") or 0.0
                try:
                    land = float(land)
                except (ValueError, TypeError):
                    land = 0.0
                if land <= 0 and not guest.get("is_dual_category"):
                    guest["isFarmer"] = False
                    guest["is_farmer"] = False
                if any(b in occ_l for b in ["business", "self-employed", "entrepreneur", "shopkeeper", "artisan", "trader"]):
                    guest["hasBusiness"] = True
                    guest["has_business"] = True
            if "gender" in guest and guest["gender"]:
                guest["gender"] = normalize_gender(guest["gender"])
            if "relationship" in guest and guest["relationship"]:
                guest["relationship"] = normalize_relationship(guest["relationship"])
            guest["profile"] = dict(guest)
            return jsonify(guest), 200

        # Determine target profile ID
        target_id = profile_id or request.args.get("profile_id") or data.get("id") or data.get("profile_id")
        profile = None

        if target_id:
            try:
                profile = db.query(Profile).filter(Profile.id == int(target_id), Profile.user_id == user.id).first()
            except (ValueError, TypeError):
                profile = None

        if not profile:
            # Fall back to Self profile, or first profile
            profile = db.query(Profile).filter(Profile.user_id == user.id, Profile.relationship == "Self").first()
            if not profile:
                profile = db.query(Profile).filter(Profile.user_id == user.id).order_by(Profile.id.asc()).first()

        if not profile:
            profile = Profile(user_id=user.id, relationship="Self")
            db.add(profile)

        populate_profile_from_data(profile, data)

        # Synchronize active draft if this is the self/primary profile
        if profile.relationship == "Self":
            draft = db.query(Application).filter(Application.user_id == user.id, Application.status == "draft").first()
            if draft:
                if profile.full_name:
                    draft.applicant_name = profile.full_name
                if profile.father_name:
                    draft.father_name = profile.father_name
                if profile.date_of_birth:
                    draft.date_of_birth = profile.date_of_birth
                if profile.education:
                    draft.education = profile.education
                if profile.annual_income:
                    draft.family_income = profile.annual_income
                if profile.state:
                    draft.state = profile.state
                if profile.district:
                    draft.district = profile.district

        db.commit()

        # Record profile update activity
        rel_label = profile.relationship or "Self"
        record_activity(
            db,
            user.id,
            "profile_updated",
            {
                "title": f"Updated profile for {profile.full_name or rel_label} ({rel_label})",
                "relationship": rel_label,
                "occupation": profile.occupation,
                "state": profile.state,
                "completeness": profile.completeness_percent
            }
        )

        activity_count = db.query(AuditLog).filter(AuditLog.user_id == user.id).count()
        saved_count = db.query(SavedScheme).filter(SavedScheme.user_id == user.id).count()
        app_count = db.query(Application).filter(Application.user_id == user.id).count()
        level_info = compute_user_level(profile, activity_count, saved_count, app_count)

        p_dict = profile.to_dict()
        p_dict["userLevel"] = level_info
        res_dict = dict(p_dict)
        res_dict["profile"] = p_dict
        res_dict["userLevel"] = level_info
        return jsonify(res_dict), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@profile_bp.route("/<int:profile_id>", methods=["DELETE"])
@token_required
def delete_profile(profile_id: int):
    """
    DELETE /api/profiles/<id>
    Removes a relative profile under the user's account.
    """
    user = g.current_user
    db = SessionLocal()
    try:
        profile = db.query(Profile).filter(Profile.id == profile_id, Profile.user_id == user.id).first()
        if not profile:
            return jsonify({"error": "Profile not found"}), 404

        # Disallow deleting if it is the only remaining profile
        total_count = db.query(Profile).filter(Profile.user_id == user.id).count()
        if total_count <= 1:
            return jsonify({"error": "Cannot delete your only primary profile."}), 400

        name = profile.full_name or profile.relationship or "Family member"
        db.delete(profile)
        db.commit()

        record_activity(
            db,
            user.id,
            "profile_deleted",
            {"title": f"Removed family profile: {name}"}
        )

        return jsonify({"success": True, "message": f"Profile for {name} removed successfully."}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@profile_bp.route("/activities", methods=["GET"])
@optional_auth
def get_user_activities():
    """
    GET /api/profile/activities
    Fetches real database activities for the authenticated user from audit_logs.
    """
    user = getattr(g, "current_user", None)
    if not user:
        return jsonify({"activities": [], "count": 0}), 200

    db = SessionLocal()
    try:
        logs = db.query(AuditLog).filter(AuditLog.user_id == user.id).order_by(AuditLog.timestamp.desc()).limit(25).all()
        activities = []
        action_map = {
            "profile_updated": ("Profile details updated", "profile", "Profile"),
            "profile_created": ("Profile registered", "profile", "Profile"),
            "profile_deleted": ("Profile removed", "profile", "Profile"),
            "scheme_search": ("Searched government schemes", "scheme", "Scheme Search"),
            "scheme_saved": ("Saved scheme to bookmarks", "bookmark", "Bookmark"),
            "user_registered": ("Registered citizen account", "auth", "Account"),
            "user_login": ("Signed in to citizen portal", "auth", "Security"),
            "application_saved": ("Application draft updated", "application", "Application"),
            "interview_completed": ("AI Eligibility Chatbot intake completed", "interview", "Intake"),
        }

        now = datetime.datetime.utcnow()
        for log in logs:
            title, act_type, category = action_map.get(
                log.action,
                (log.action.replace("_", " ").title(), "general", "General")
            )
            details = log.details or {}
            custom_title = details.get("title") or title
            if log.action == "scheme_saved" and details.get("scheme_name"):
                custom_title = f"Saved '{details['scheme_name']}'"
            elif log.action == "scheme_search" and details.get("query"):
                custom_title = f"Searched for '{details['query']}'"
            elif log.action in ("profile_updated", "profile_created") and details.get("title"):
                custom_title = details.get("title")

            diff = now - (log.timestamp or now)
            if diff.days > 0:
                time_ago = f"{diff.days}d ago"
            elif diff.seconds >= 3600:
                time_ago = f"{diff.seconds // 3600}h ago"
            elif diff.seconds >= 60:
                time_ago = f"{diff.seconds // 60}m ago"
            else:
                time_ago = "Just now"

            activities.append({
                "id": f"act-{log.id}",
                "action": log.action,
                "title": custom_title,
                "type": act_type,
                "category": category,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                "timeAgo": time_ago,
                "details": details
            })

        return jsonify({"activities": activities, "count": len(activities)}), 200
    except Exception as e:
        return jsonify({"error": str(e), "activities": [], "count": 0}), 500
    finally:
        db.close()


@profile_bp.route("/level", methods=["GET"])
@optional_auth
def get_user_level():
    """
    GET /api/profile/level
    Dynamically computes citizen level based on actual profile completeness,
    scheme searches/activity, saved schemes, and applications.
    """
    user = getattr(g, "current_user", None)
    if not user:
        return jsonify(compute_user_level(None, 0, 0, 0)), 200

    db = SessionLocal()
    try:
        profile_id = request.args.get("profile_id")
        profile = None
        if profile_id:
            try:
                profile = db.query(Profile).filter(Profile.id == int(profile_id), Profile.user_id == user.id).first()
            except (ValueError, TypeError):
                pass
        if not profile:
            profile = db.query(Profile).filter(Profile.user_id == user.id, Profile.relationship == "Self").first()
            if not profile:
                profile = db.query(Profile).filter(Profile.user_id == user.id).order_by(Profile.id.asc()).first()

        activity_count = db.query(AuditLog).filter(AuditLog.user_id == user.id).count()
        saved_count = db.query(SavedScheme).filter(SavedScheme.user_id == user.id).count()
        app_count = db.query(Application).filter(Application.user_id == user.id).count()
        level_info = compute_user_level(profile, activity_count, saved_count, app_count)
        return jsonify(level_info), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
