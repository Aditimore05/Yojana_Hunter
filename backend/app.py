import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from config import config
from database import SessionLocal, init_db
from routes import api_bp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    app.config.from_object(config)

    # Enable Cross-Origin Resource Sharing for Next.js frontend
    CORS(
        app,
        resources={r"/api/*": {"origins": config.CORS_ORIGINS}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "Accept"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    # Register API blueprints:
    # 1. Primary path: /api/... (e.g. /api/health, /api/schemes, /api/profile)
    app.register_blueprint(api_bp, url_prefix="/api")

    # 2. Compatibility alias: /api/v1/... (for legacy callers)
    app.register_blueprint(api_bp, url_prefix="/api/v1", name="api_v1")

    @app.route("/", methods=["GET"])
    def index():
        return jsonify({
            "project": config.PROJECT_NAME,
            "status": "online",
            "framework": "Flask 3.x",
            "database": "PostgreSQL 18 via SQLAlchemy",
            "health_check": "/api/health",
            "tagline": "Beyond Searching Schemes, Getting Citizens the Benefits They Deserve"
        })

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        SessionLocal.remove()

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found", "status_code": 404}), 404

    @app.errorhandler(500)
    def server_error(e):
        logger.error(f"Internal server error: {e}")
        return jsonify({"error": "Internal server error", "status_code": 500}), 500

    return app

app = create_app()

if __name__ == "__main__":
    logger.info(f"Starting {config.PROJECT_NAME} Flask Backend on {config.HOST}:{config.PORT}")
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
