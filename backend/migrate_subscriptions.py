import sys
import os
import logging
from sqlalchemy import text

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from database import engine, SessionLocal, Base
import models

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def run_migrations():
    """
    Safely creates subscription_requests table and relevant indexes in PostgreSQL.
    100% non-destructive: does not delete or alter existing data.
    """
    logger.info("Starting database migration for Subscriptions & Citizen Access Tiers...")

    # 1. Create table via SQLAlchemy metadata
    Base.metadata.create_all(bind=engine)
    logger.info("Table verification/creation completed via SQLAlchemy metadata.")

    # 2. For PostgreSQL, ensure indexes and table exist safely
    dialect_name = engine.dialect.name
    if dialect_name == "postgresql":
        statements = [
            """
            CREATE TABLE IF NOT EXISTS subscription_requests (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                plan_id VARCHAR(50) NOT NULL,
                plan_name VARCHAR(100) NOT NULL,
                amount DOUBLE PRECISION NOT NULL,
                currency VARCHAR(10) DEFAULT 'INR',
                duration_days INTEGER NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                rejection_reason TEXT,
                admin_notes TEXT,
                requested_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
                reviewed_at TIMESTAMP WITHOUT TIME ZONE,
                reviewed_by_admin_id INTEGER REFERENCES users(id),
                starts_at TIMESTAMP WITHOUT TIME ZONE,
                expires_at TIMESTAMP WITHOUT TIME ZONE,
                is_active BOOLEAN DEFAULT FALSE
            );
            """,
            "CREATE INDEX IF NOT EXISTS idx_sub_req_user_id ON subscription_requests(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_sub_req_status ON subscription_requests(status);",
            "CREATE INDEX IF NOT EXISTS idx_sub_req_expires_at ON subscription_requests(expires_at);",
            "CREATE INDEX IF NOT EXISTS idx_sub_req_is_active ON subscription_requests(is_active);",
            "CREATE INDEX IF NOT EXISTS idx_sub_req_requested_at ON subscription_requests(requested_at);"
        ]

        with engine.begin() as conn:
            for stmt in statements:
                try:
                    conn.execute(text(stmt))
                except Exception as e:
                    logger.warning(f"Notice executing statement: {e}")

        logger.info("[SUCCESS] PostgreSQL subscription_requests table and indexes verified.")

    db = SessionLocal()
    try:
        count = db.query(models.SubscriptionRequest).count()
        logger.info(f"Database verification passed: {count} subscription requests found.")
    finally:
        db.close()

if __name__ == "__main__":
    run_migrations()
