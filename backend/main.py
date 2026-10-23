"""
Entry point for Yojana Hunter Flask Backend.
Dispatches directly to app.create_app().
"""
from app import app, config, logger

if __name__ == "__main__":
    logger.info(f"Starting {config.PROJECT_NAME} Flask Backend on {config.HOST}:{config.PORT}")
    app.run(host=config.HOST, port=config.PORT, debug=False)
