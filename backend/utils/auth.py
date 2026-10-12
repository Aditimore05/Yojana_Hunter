import functools
import datetime
import jwt
from flask import request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
import bcrypt
from config import config
from database import SessionLocal
from models import User

JWT_SECRET = getattr(config, "SECRET_KEY", "yojana-hunter-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    """Hash password securely using werkzeug scrypt/pbkdf2."""
    return generate_password_hash(password, method="scrypt")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    if not hashed_password or not plain_password:
        return False
    # Check werkzeug hashes (scrypt / pbkdf2 / sha256)
    try:
        if check_password_hash(hashed_password, plain_password):
            return True
    except Exception:
        pass

    # Fallback to bcrypt check if stored with $2b$ or $2a$
    try:
        if hashed_password.startswith(("$2b$", "$2a$", "$2y$")):
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        pass

    return False

def create_admin_token(user_id: int, email: str, role: str = "admin", expires_hours: int = 24) -> str:
    """Generate a signed JWT token for admin session."""
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": str(user_id),
        "userId": user_id,
        "email": email,
        "role": role,
        "iat": now,
        "exp": now + datetime.timedelta(hours=expires_hours)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_admin_token(token: str) -> dict:
    """Validate and decode a JWT token."""
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

def admin_required(f):
    """
    Decorator to protect admin routes.
    Enforces that the request has a valid Bearer token for an active admin user.
    """
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header:
            return jsonify({
                "error": "Authentication required",
                "message": "Missing Authorization header",
                "status_code": 401
            }), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({
                "error": "Invalid authorization format",
                "message": "Authorization header must be 'Bearer <token>'",
                "status_code": 401
            }), 401

        token = parts[1]
        try:
            payload = decode_admin_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({
                "error": "Session expired",
                "message": "Your admin session has expired. Please log in again.",
                "status_code": 401
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                "error": "Invalid token",
                "message": "Invalid authentication token provided.",
                "status_code": 401
            }), 401

        user_id = payload.get("userId")
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return jsonify({
                    "error": "User not found",
                    "status_code": 401
                }), 401

            if not user.is_active:
                return jsonify({
                    "error": "Account disabled",
                    "message": "This admin account is currently deactivated.",
                    "status_code": 403
                }), 403

            if user.role != "admin":
                return jsonify({
                    "error": "Forbidden",
                    "message": "Administrative privileges required.",
                    "status_code": 403
                }), 403

            # Store current admin in Flask g context
            g.current_user = user
        finally:
            db.close()

        return f(*args, **kwargs)

    return decorated_function
