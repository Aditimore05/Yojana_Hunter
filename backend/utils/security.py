"""
Security compatibility module re-exporting from utils.auth.
"""
from .auth import hash_password as get_password_hash, verify_password, create_admin_token

def create_access_token(data: dict, expires_delta=None) -> str:
    user_id = data.get("userId") or data.get("sub", 0)
    email = data.get("email", "")
    role = data.get("role", "admin")
    return create_admin_token(user_id=int(user_id), email=email, role=role)

__all__ = ["verify_password", "get_password_hash", "create_access_token"]
