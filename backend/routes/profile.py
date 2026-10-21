from flask import Blueprint, request, jsonify, g
from database import SessionLocal
from models import Profile, User
from utils.auth import token_required, optional_auth
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

@profile_bp.route("", methods=["GET"])
@profile_bp.route("/", methods=["GET"])
@profile_bp.route("/me", methods=["GET"])
@optional_auth
def get_profile():
    """
    GET /api/profile
    Returns the authenticated user's scheme eligibility profile.
    If unauthenticated, returns the fallback citizen profile.
    """
    db = SessionLocal()
    try:
        if getattr(g, "current_user", None):
            user = g.current_user
            profile = db.query(Profile).filter(Profile.user_id == user.id).first()
            if not profile:
                profile = Profile(
                    user_id=user.id,
                    full_name=user.email.split("@")[0].capitalize(),
                    completeness_percent=0,
                    preferred_language="en"
                )
                db.add(profile)
                db.commit()
            p_dict = profile.to_dict()
            res_dict = dict(p_dict)
            res_dict["profile"] = p_dict
            return jsonify(res_dict)

        # Unauthenticated default profile template
        guest_profile = {
            "id": 0,
            "userId": 0,
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
            "category": "General",
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

@profile_bp.route("", methods=["PUT"])
@profile_bp.route("/", methods=["PUT"])
@profile_bp.route("/me", methods=["PUT"])
@optional_auth
def update_profile():
    """
    PUT /api/profile
    Updates the authenticated user's profile, or the demo/guest profile if unauthenticated.
    User A cannot view or edit User B's profile.
    """
    db = SessionLocal()
    try:
        user = getattr(g, "current_user", None)
        data = request.get_json() or {}

        if not user:
            # For unauthenticated guest requests, return the updated profile representation
            # without corrupting any registered user's profile in the database.
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
                # Custom occupation or non-student/non-farmer
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
            guest["profile"] = dict(guest)
            return jsonify(guest), 200

        profile = db.query(Profile).filter(Profile.user_id == user.id).first()
        if not profile:
            profile = Profile(user_id=user.id)
            db.add(profile)

        # Map frontend camelCase / snake_case fields
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
            # Only allow is_farmer if positive agricultural landholding is explicitly recorded
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

        db.commit()
        p_dict = profile.to_dict()
        res_dict = dict(p_dict)
        res_dict["profile"] = p_dict
        return jsonify(res_dict), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
