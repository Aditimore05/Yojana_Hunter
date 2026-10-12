import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Yojana Hunter")
    FLASK_ENV: str = os.getenv("FLASK_ENV", "development")
    DEBUG: bool = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "yes")
    PORT: int = int(os.getenv("PORT", "5000"))
    HOST: str = os.getenv("HOST", "127.0.0.1")

    # PostgreSQL Database URL
    # Supports postgresql+psycopg:// or postgresql+psycopg2://
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5432/yojana_hunter"
    )

    SECRET_KEY: str = os.getenv("SECRET_KEY", "yojana-hunter-secret-key-change-in-production")
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000"
    ]

    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
    MAX_CONTENT_LENGTH: int = 16 * 1024 * 1024  # 16 MB max file upload

config = Config()
