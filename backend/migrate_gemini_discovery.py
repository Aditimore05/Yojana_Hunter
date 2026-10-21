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
    Safely creates new tables and adds missing columns to existing PostgreSQL tables
    for Gemini Scheme Discovery, Citation Tracking, and Scheme Review History.
    100% non-destructive: does not drop tables or overwrite existing data.
    """
    logger.info("Starting database migration for Gemini Scheme Discovery & Verification...")

    # 1. Create any brand new tables declared in models
    Base.metadata.create_all(bind=engine)
    logger.info("Table verification/creation completed via SQLAlchemy metadata.")

    # 2. For PostgreSQL, execute ALTER TABLE IF NOT EXISTS safely
    dialect_name = engine.dialect.name

    if dialect_name == "postgresql":
        alter_statements = [
            "ALTER TABLE schemes ADD COLUMN IF NOT EXISTS verification_notes TEXT;",
            "ALTER TABLE schemes ADD COLUMN IF NOT EXISTS grounding_metadata JSONB;",
            "ALTER TABLE schemes ADD COLUMN IF NOT EXISTS discovery_job_id INTEGER;",
            "ALTER TABLE schemes ADD COLUMN IF NOT EXISTS admin_review_status VARCHAR(50) DEFAULT 'published';",
            "ALTER TABLE schemes ADD COLUMN IF NOT EXISTS rejection_reason TEXT;",
            "CREATE INDEX IF NOT EXISTS idx_schemes_admin_review_status ON schemes(admin_review_status);",
            "CREATE INDEX IF NOT EXISTS idx_schemes_discovery_job_id ON schemes(discovery_job_id);"
        ]

        with engine.begin() as conn:
            for stmt in alter_statements:
                try:
                    conn.execute(text(stmt))
                except Exception as e:
                    logger.warning(f"Notice executing '{stmt[:50]}...': {e}")

        logger.info("[SUCCESS] PostgreSQL columns and indexes for Gemini Discovery migrated successfully.")
    else:
        logger.info(f"[INFO] Engine dialect is {dialect_name}; tables created via Base.metadata.create_all.")

    # 3. Verify connection with simple test read
    db = SessionLocal()
    try:
        scheme_count = db.query(models.Scheme).count()
        job_count = db.query(models.DiscoveryJob).count()
        logger.info(f"Database verification passed: {scheme_count} schemes, {job_count} discovery jobs in database.")
    finally:
        db.close()

def rollback_migrations():
    """
    Reversible migration helper: removes added columns from schemes table if needed.
    """
    logger.warning("Rolling back Gemini Discovery migrations...")
    dialect_name = engine.dialect.name
    if dialect_name == "postgresql":
        rollback_statements = [
            "ALTER TABLE schemes DROP COLUMN IF EXISTS rejection_reason;",
            "ALTER TABLE schemes DROP COLUMN IF EXISTS admin_review_status;",
            "ALTER TABLE schemes DROP COLUMN IF EXISTS discovery_job_id;",
            "ALTER TABLE schemes DROP COLUMN IF EXISTS grounding_metadata;",
            "ALTER TABLE schemes DROP COLUMN IF EXISTS verification_notes;"
        ]
        with engine.begin() as conn:
            for stmt in rollback_statements:
                conn.execute(text(stmt))
        logger.info("Rollback complete.")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "rollback":
        rollback_migrations()
    else:
        run_migrations()
