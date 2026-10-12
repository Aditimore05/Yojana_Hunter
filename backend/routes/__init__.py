from flask import Blueprint

api_bp = Blueprint("api", __name__)

from .health import health_bp
from .schemes import schemes_bp
from .profile import profile_bp
from .documents import documents_bp
from .applications import applications_bp
from .interview import interview_bp
from .eligibility import eligibility_bp

# Register all child blueprints under the main api blueprint
api_bp.register_blueprint(health_bp, url_prefix="")
api_bp.register_blueprint(schemes_bp, url_prefix="/schemes")
api_bp.register_blueprint(profile_bp, url_prefix="/profile")
api_bp.register_blueprint(documents_bp, url_prefix="/documents")
api_bp.register_blueprint(applications_bp, url_prefix="/applications")
api_bp.register_blueprint(interview_bp, url_prefix="")
api_bp.register_blueprint(eligibility_bp, url_prefix="/eligibility")
