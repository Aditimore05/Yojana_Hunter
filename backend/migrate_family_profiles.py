import logging
from sqlalchemy import text
from database import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("migrate_family_profiles")

def run_migration():
    logger.info("Starting family profiles database migration...")
    with engine.begin() as conn:
        # 1. Add relationship column to profiles if not exists
        logger.info("Adding 'relationship' column to 'profiles'...")
        conn.execute(text("""
            ALTER TABLE profiles 
            ADD COLUMN IF NOT EXISTS relationship VARCHAR(50) DEFAULT 'Self';
        """))

        # 2. Set default 'Self' for any existing rows where relationship is NULL
        conn.execute(text("""
            UPDATE profiles 
            SET relationship = 'Self' 
            WHERE relationship IS NULL OR relationship = '';
        """))

        # 3. Drop unique constraint on user_id in profiles if it exists
        logger.info("Checking and dropping unique constraint on profiles(user_id)...")
        conn.execute(text("""
            ALTER TABLE profiles 
            DROP CONSTRAINT IF EXISTS profiles_user_id_key;
        """))

        # 4. Also drop any unique index that might have been created separately
        conn.execute(text("""
            DROP INDEX IF EXISTS ix_profiles_user_id;
        """))

        # 5. Create a standard (non-unique) index on user_id and relationship
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_profiles_user_id_rel 
            ON profiles (user_id, relationship);
        """))

    logger.info("Family profiles migration completed successfully!")

if __name__ == "__main__":
    run_migration()
