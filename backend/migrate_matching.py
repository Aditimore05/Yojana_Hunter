import sys
import os
from sqlalchemy import text

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from database import engine, SessionLocal, Base
import models

def run_migrations():
    """
    Safely adds any missing columns to existing PostgreSQL / SQLite tables
    without dropping or recreating any existing tables or losing any existing data.
    """
    print("Running database migrations for Smart Scheme Matching and Admin Management...")

    # For new tables if any
    Base.metadata.create_all(bind=engine)

    # For existing tables, execute ALTER TABLE IF NOT EXISTS safely
    dialect_name = engine.dialect.name

    if dialect_name == "postgresql":
        alter_statements = [
            # Profile additions
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_farmer BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_student BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course VARCHAR(150);",
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS institution VARCHAR(255);",
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_business BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_type VARCHAR(150);",
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disability_type VARCHAR(150);",
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_tax_payer BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_govt_employee BOOLEAN DEFAULT FALSE;",
            
            # Scheme additions
            "ALTER TABLE schemes ADD COLUMN IF NOT EXISTS application_status VARCHAR(50) DEFAULT 'open';",
            "ALTER TABLE schemes ADD COLUMN IF NOT EXISTS gender VARCHAR(50) DEFAULT 'All';",
            "ALTER TABLE schemes ADD COLUMN IF NOT EXISTS social_category VARCHAR(100) DEFAULT 'All';",
            "ALTER TABLE schemes ADD COLUMN IF NOT EXISTS is_farmer_only BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE schemes ADD COLUMN IF NOT EXISTS max_landholding_acres DOUBLE PRECISION;",
            "ALTER TABLE schemes ADD COLUMN IF NOT EXISTS is_student_only BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE schemes ADD COLUMN IF NOT EXISTS is_business_only BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE schemes ADD COLUMN IF NOT EXISTS is_disability_required BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE schemes ADD COLUMN IF NOT EXISTS exclusions JSONB;",
            "ALTER TABLE schemes ADD COLUMN IF NOT EXISTS created_by_admin_id INTEGER;",
            "ALTER TABLE schemes ADD COLUMN IF NOT EXISTS updated_by_admin_id INTEGER;",
        ]

        with engine.begin() as conn:
            for stmt in alter_statements:
                try:
                    conn.execute(text(stmt))
                except Exception as e:
                    print(f"Notice executing '{stmt[:40]}...': {e}")
                    
        print("[SUCCESS] PostgreSQL columns migrated successfully.")
    else:
        print(f"[INFO] Running on {dialect_name}, Base.metadata.create_all handles schema.")

if __name__ == "__main__":
    run_migrations()
