import datetime
import secrets
import re
from flask import Blueprint, request, jsonify, g
from database import SessionLocal
from models import User, Profile, PasswordResetToken
from utils.auth import (
    hash_password,
    verify_password,
    validate_password_strength,
    create_access_token,
    token_required,
    rate_limit
)
from utils.email import send_password_reset_email, is_email_service_configured

auth_bp = Blueprint("auth", __name__)

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def validate_email_format(email: str) -> bool:
    """Validate email syntax."""
    return bool(email and EMAIL_REGEX.match(email.strip()))

def calculate_completeness(p: Profile) -> int:
    """Calculate completeness percentage for citizen profile."""
    fields = [
        p.full_name, p.age, p.occupation, p.annual_income,
        p.state, p.district, p.education, p.category, p.father_name, p.date_of_birth
    ]
    completed = sum(1 for f in fields if f is not None and str(f).strip() != "")
    return int((completed / len(fields)) * 100)

# ==========================================
# 1. USER REGISTRATION
# ==========================================

@auth_bp.route("/register", methods=["POST"])
@rate_limit(max_requests=50, window_seconds=900, key_prefix="register")
def register_user():
    """
    POST /api/auth/register
    Creates a new citizen account with secure password hashing.
    Optionally preserves anonymous eligibility profile answers.
    """
    data = request.get_json() or {}
    name = (data.get("name") or data.get("fullName") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    profile_data = data.get("profileData") or data.get("profile") or {}

    # 1. Validation
    if not name:
        return jsonify({
            "error": "Validation error",
            "message": "Full name is required.",
            "field": "name",
            "status_code": 400
        }), 400

    if not email:
        return jsonify({
            "error": "Validation error",
            "message": "Email address is required.",
            "field": "email",
            "status_code": 400
        }), 400

    if not validate_email_format(email):
        return jsonify({
            "error": "Validation error",
            "message": "Please enter a valid email address.",
            "field": "email",
            "status_code": 400
        }), 400

    is_valid_pw, pw_err = validate_password_strength(password)
    if not is_valid_pw:
        return jsonify({
            "error": "Validation error",
            "message": pw_err,
            "field": "password",
            "status_code": 400
        }), 400

    db = SessionLocal()
    try:
        # 2. Check for duplicate email
        existing_user = db.query(User).filter(User.email.ilike(email)).first()
        if existing_user:
            return jsonify({
                "error": "Account exists",
                "message": "An account with this email address already exists. Please sign in instead.",
                "field": "email",
                "status_code": 409
            }), 409

        # 3. Hash password securely using bcrypt
        password_hash = hash_password(password)

        # 4. Create user
        new_user = User(
            email=email,
            password_hash=password_hash,
            role="citizen",
            is_active=True,
            created_at=datetime.datetime.utcnow()
        )
        db.add(new_user)
        db.flush()

        # 5. Create associated profile (with optional preserved profile answers)
        occ = (profile_data.get("occupation") or "").strip() or None
        occ_l = (str(occ) or "").lower()
        is_farmer_in_occ = bool("farmer" in occ_l or "kisan" in occ_l or "agri" in occ_l or "cultivat" in occ_l)
        is_student_in_occ = bool("student" in occ_l)
        is_biz_in_occ = bool(any(b in occ_l for b in ["business", "entrepreneur", "self-employed", "artisan", "shopkeeper", "trader"]))

        if is_student_in_occ and not is_farmer_in_occ:
            is_student = True
            is_farmer = False
            has_business = False
        elif is_farmer_in_occ and not is_student_in_occ:
            is_farmer = True
            is_student = False
            has_business = False
        elif is_biz_in_occ and not is_farmer_in_occ and not is_student_in_occ:
            has_business = True
            is_farmer = False
            is_student = False
        else:
            is_farmer = bool(profile_data.get("isFarmer") or profile_data.get("is_farmer") or is_farmer_in_occ)
            is_student = bool(profile_data.get("isStudent") or profile_data.get("is_student") or is_student_in_occ)
            has_business = bool(profile_data.get("hasBusiness") or profile_data.get("has_business") or is_biz_in_occ)

        new_profile = Profile(
            user_id=new_user.id,
            full_name=name,
            preferred_language=profile_data.get("language") or "en",
            occupation=occ,
            annual_income=profile_data.get("annualIncome") or profile_data.get("annual_income") or None,
            income_numeric=float(profile_data["incomeNumeric"]) if profile_data.get("incomeNumeric") is not None else None,
            age=int(profile_data["age"]) if profile_data.get("age") else None,
            gender=profile_data.get("gender") or None,
            state=profile_data.get("state") or None,
            district=profile_data.get("district") or None,
            education=profile_data.get("education") or None,
            category=profile_data.get("category") or "General",
            father_name=profile_data.get("fatherName") or profile_data.get("father_name") or None,
            date_of_birth=profile_data.get("dateOfBirth") or profile_data.get("date_of_birth") or None,
            land_holding_acres=float(profile_data.get("landHoldingAcres") or profile_data.get("land_holding_acres") or 0.0),
            is_farmer=is_farmer,
            is_student=is_student,
            has_business=has_business,
            is_disabled=bool(profile_data.get("isDisabled") or profile_data.get("is_disabled") or False),
            updated_at=datetime.datetime.utcnow()
        )
        new_profile.completeness_percent = calculate_completeness(new_profile)

        db.add(new_profile)
        db.commit()

        # 6. Generate access token
        token = create_access_token(new_user.id, new_user.email, new_user.role)

        return jsonify({
            "token": token,
            "tokenType": "Bearer",
            "user": new_user.to_dict(),
            "profile": new_profile.to_dict(),
            "message": "Account created successfully."
        }), 201

    except Exception as e:
        db.rollback()
        return jsonify({
            "error": "Internal server error",
            "message": "Failed to create account. Please try again later.",
            "status_code": 500
        }), 500
    finally:
        db.close()

# ==========================================
# 2. USER LOGIN
# ==========================================

@auth_bp.route("/login", methods=["POST"])
@rate_limit(max_requests=50, window_seconds=900, key_prefix="login")
def login_user():
    """
    POST /api/auth/login
    Authenticates citizen credentials, supports Remember Me, and returns JWT.
    """
    data = request.get_json() or {}
    identifier = (data.get("email") or data.get("identifier") or data.get("username") or "").strip()
    password = data.get("password") or ""
    remember_me = bool(data.get("rememberMe") or data.get("remember_me") or False)

    if not identifier:
        return jsonify({
            "error": "Validation error",
            "message": "Email address is required.",
            "status_code": 400
        }), 400

    if not password:
        return jsonify({
            "error": "Validation error",
            "message": "Password is required.",
            "status_code": 400
        }), 400

    db = SessionLocal()
    try:
        user = db.query(User).filter(
            (User.email.ilike(identifier)) | (User.mobile == identifier)
        ).first()

        if not user:
            return jsonify({
                "error": "Invalid credentials",
                "message": "Invalid email address or password.",
                "status_code": 401
            }), 401

        if not user.is_active:
            return jsonify({
                "error": "Account disabled",
                "message": "This account is currently deactivated. Please contact support.",
                "status_code": 403
            }), 403

        if not verify_password(password, user.password_hash):
            return jsonify({
                "error": "Invalid credentials",
                "message": "Invalid email address or password.",
                "status_code": 401
            }), 401

        # Fetch or initialize profile
        profile = db.query(Profile).filter(Profile.user_id == user.id).first()
        if not profile:
            profile = Profile(
                user_id=user.id,
                full_name=user.email.split("@")[0].capitalize(),
                completeness_percent=50
            )
            db.add(profile)
            db.commit()

        token = create_access_token(user.id, user.email, user.role, remember_me=remember_me)

        return jsonify({
            "token": token,
            "tokenType": "Bearer",
            "user": user.to_dict(),
            "profile": profile.to_dict(),
            "message": "Login successful."
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "message": "An error occurred while logging in. Please try again.",
            "status_code": 500
        }), 500
    finally:
        db.close()

# ==========================================
# 3. CURRENT USER & SESSION VERIFICATION
# ==========================================

@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user():
    """
    GET /api/auth/me
    Restores user session state on page refresh.
    """
    user = g.current_user
    db = SessionLocal()
    try:
        profile = db.query(Profile).filter(Profile.user_id == user.id).first()
        return jsonify({
            "user": user.to_dict(),
            "profile": profile.to_dict() if profile else None
        }), 200
    finally:
        db.close()

@auth_bp.route("/logout", methods=["POST"])
def logout_user():
    """
    POST /api/auth/logout
    Signals successful client-side session termination.
    """
    return jsonify({
        "message": "Logged out successfully.",
        "status_code": 200
    }), 200

# ==========================================
# 4. FORGOT PASSWORD & RESET PASSWORD FLOW
# ==========================================

@auth_bp.route("/forgot-password", methods=["POST"])
@rate_limit(max_requests=50, window_seconds=900, key_prefix="forgot")
def forgot_password():
    """
    POST /api/auth/forgot-password
    Generates secure expiring single-use reset token.
    Dispatches email if SMTP is configured, or logs securely in development.
    Avoids revealing whether an account exists.
    """
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()

    if not email or not validate_email_format(email):
        return jsonify({
            "error": "Validation error",
            "message": "Please enter a valid email address.",
            "status_code": 400
        }), 400

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email.ilike(email)).first()
        token_str = secrets.token_urlsafe(32)

        if user:
            # Expire any previous unused tokens for this user
            db.query(PasswordResetToken).filter(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.used == False
            ).update({"used": True})

            # Create new single-use token expiring in 1 hour
            reset_record = PasswordResetToken(
                user_id=user.id,
                token_hash=token_str,
                expires_at=datetime.datetime.utcnow() + datetime.timedelta(hours=1),
                used=False
            )
            db.add(reset_record)
            db.commit()

            recipient_name = user.profile.full_name if (user.profile and user.profile.full_name) else "Citizen"
            email_res = send_password_reset_email(user.email, token_str, recipient_name)
        else:
            email_res = {"configured": is_email_service_configured(), "sent": False}

        response_payload = {
            "message": "If this email is registered in Yojana Hunter, password reset instructions have been generated.",
            "status_code": 200
        }

        # In development mode, if SMTP is not configured, supply the dev link to allow testing without real SMTP
        if not is_email_service_configured() and user:
            response_payload["dev_notice"] = "SMTP is not configured in environment. The reset token is provided below for local development and testing."
            response_payload["dev_reset_token"] = token_str
            response_payload["dev_reset_link"] = f"http://localhost:3000/reset-password?token={token_str}"

        return jsonify(response_payload), 200

    except Exception as e:
        db.rollback()
        return jsonify({
            "error": "Internal server error",
            "message": "Unable to process password reset request.",
            "status_code": 500
        }), 500
    finally:
        db.close()

@auth_bp.route("/reset-password", methods=["POST"])
@rate_limit(max_requests=50, window_seconds=900, key_prefix="reset")
def reset_password():
    """
    POST /api/auth/reset-password
    Validates single-use token and updates user password with a new hash.
    """
    data = request.get_json() or {}
    token_str = (data.get("token") or "").strip()
    new_password = data.get("password") or ""
    confirm_password = data.get("confirmPassword") or data.get("confirm_password") or ""

    if not token_str:
        return jsonify({
            "error": "Validation error",
            "message": "Password reset token is required.",
            "status_code": 400
        }), 400

    if not new_password:
        return jsonify({
            "error": "Validation error",
            "message": "New password is required.",
            "status_code": 400
        }), 400

    if confirm_password and new_password != confirm_password:
        return jsonify({
            "error": "Validation error",
            "message": "Passwords do not match.",
            "status_code": 400
        }), 400

    is_valid_pw, pw_err = validate_password_strength(new_password)
    if not is_valid_pw:
        return jsonify({
            "error": "Validation error",
            "message": pw_err,
            "status_code": 400
        }), 400

    db = SessionLocal()
    try:
        reset_record = db.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == token_str
        ).first()

        if not reset_record or not reset_record.is_valid():
            return jsonify({
                "error": "Invalid or expired token",
                "message": "This password reset link is invalid or has expired. Please request a new one.",
                "status_code": 400
            }), 400

        user = db.query(User).filter(User.id == reset_record.user_id).first()
        if not user:
            return jsonify({
                "error": "User not found",
                "message": "User account could not be found.",
                "status_code": 400
            }), 400

        # Update password hash
        user.password_hash = hash_password(new_password)
        reset_record.used = True

        db.commit()

        return jsonify({
            "message": "Password has been reset successfully. You can now log in with your new password.",
            "status_code": 200
        }), 200

    except Exception as e:
        db.rollback()
        return jsonify({
            "error": "Internal server error",
            "message": "Failed to reset password. Please try again.",
            "status_code": 500
        }), 500
    finally:
        db.close()
