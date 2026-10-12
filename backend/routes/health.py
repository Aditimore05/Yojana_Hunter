from flask import Blueprint, jsonify
from sqlalchemy import text
from database import SessionLocal
from models import Scheme

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
def health_check():
    db = SessionLocal()
    db_status = "disconnected"
    scheme_count = 0
    error_message = None

    try:
        # Ping PostgreSQL
        db.execute(text("SELECT 1"))
        db_status = "connected"
        scheme_count = db.query(Scheme).count()
    except Exception as e:
        error_message = str(e)
    finally:
        db.close()

    status_code = 200 if db_status == "connected" else 503
    return jsonify({
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "Yojana Hunter Flask API Gateway",
        "database": {
            "status": db_status,
            "engine": "PostgreSQL 18 via SQLAlchemy",
            "schemes_indexed": scheme_count,
            "error": error_message
        }
    }), status_code
