from flask import Blueprint, request, jsonify, g
from database import SessionLocal
from models import Profile, User
from utils.auth import token_required, optional_auth
import datetime

profile_bp = Blueprint("profile", __name__)

def calculate_completeness(p: Profile) -> int:
    """Calculate percentage of profile fields completed."""
    fields = [
        p.full_name, p.age, p.occupation, p.annual_income,
        p.state, p.district, p.education, p.category, p.father_name, p.date_of_birth
    ]
    completed = sum(1 for f in fields if f is not None and str(f).strip() != "")
    return int((completed / len(fields)) * 100)

@profile_bp.route("", methods=["GET"])
@profile_bp.route("/", methods=["GET"])
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
                    age=21,
                    gender="Female",
                    occupation="Student",
                    annual_income="< 1 Lakh",
                    income_numeric=95000,
                    education="B.E. (Final Year)",
                    state="Maharashtra",
                    district="Nashik",
                    category="General",
                    completeness_percent=90,
                    preferred_language="en"
                )
                db.add(profile)
                db.commit()
            return jsonify(profile.to_dict())

        # Unauthenticated fallback
        profile = db.query(Profile).first()
        if not profile:
            user = db.query(User).first()
            if not user:
                user = User(email="citizen@yojanahunter.in", password_hash="hash123", role="citizen")
                db.add(user)
                db.flush()

            profile = Profile(
                user_id=user.id,
                full_name="Aditi Lagad",
                age=21,
                gender="Female",
                occupation="Student",
                annual_income="< 1 Lakh",
                income_numeric=95000,
                education="B.E. (Final Year)",
                state="Maharashtra",
                district="Nashik",
                category="General",
                father_name="Santosh Lagad",
                date_of_birth="12-05-2005",
                completeness_percent=90,
                preferred_language="en"
            )
            db.add(profile)
            db.commit()

        return jsonify(profile.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@profile_bp.route("", methods=["PUT"])
@profile_bp.route("/", methods=["PUT"])
@token_required
def update_profile():
    """
    PUT /api/profile
    Updates the authenticated user's profile.
    User A cannot view or edit User B's profile.
    """
    db = SessionLocal()
    try:
        user = g.current_user
        data = request.get_json() or {}
        profile = db.query(Profile).filter(Profile.user_id == user.id).first()

        if not profile:
            profile = Profile(user_id=user.id)
            db.add(profile)

        # Map frontend camelCase / snake_case fields
        if "name" in data:
            profile.full_name = data["name"]
        elif "full_name" in data:
            profile.full_name = data["full_name"]

        if "age" in data and data["age"] is not None:
            try:
                profile.age = int(data["age"])
            except (ValueError, TypeError):
                pass

        if "gender" in data:
            profile.gender = data["gender"]
        if "occupation" in data:
            profile.occupation = data["occupation"]
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

        if "isFarmer" in data or "is_farmer" in data:
            profile.is_farmer = bool(data.get("isFarmer") if "isFarmer" in data else data.get("is_farmer"))
        if "isStudent" in data or "is_student" in data:
            profile.is_student = bool(data.get("isStudent") if "isStudent" in data else data.get("is_student"))
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
        if "landHoldingAcres" in data or "land_holding_acres" in data:
            val = data.get("landHoldingAcres") or data.get("land_holding_acres")
            if val is not None and str(val).strip() != "":
                try:
                    profile.land_holding_acres = float(val)
                except (ValueError, TypeError):
                    pass
        if "isTaxPayer" in data or "is_tax_payer" in data:
            profile.is_tax_payer = bool(data.get("isTaxPayer") if "isTaxPayer" in data else data.get("is_tax_payer"))
        if "isGovtEmployee" in data or "is_govt_employee" in data:
            profile.is_govt_employee = bool(data.get("isGovtEmployee") if "isGovtEmployee" in data else data.get("is_govt_employee"))

        profile.completeness_percent = calculate_completeness(profile)
        profile.updated_at = datetime.datetime.utcnow()

        db.commit()
        return jsonify(profile.to_dict()), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
