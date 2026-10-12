from flask import Blueprint, request, jsonify
from database import SessionLocal
from models import Profile, User
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
def get_profile():
    db = SessionLocal()
    try:
        profile = db.query(Profile).first()
        if not profile:
            # Create default citizen if none exists
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
def update_profile():
    db = SessionLocal()
    try:
        data = request.get_json() or {}
        profile = db.query(Profile).first()

        if not profile:
            user = db.query(User).first()
            if not user:
                user = User(email="citizen@yojanahunter.in", password_hash="hash123")
                db.add(user)
                db.flush()
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
            except ValueError:
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
            except ValueError:
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

        profile.completeness_percent = calculate_completeness(profile)
        profile.updated_at = datetime.datetime.utcnow()

        db.commit()
        return jsonify(profile.to_dict())
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
