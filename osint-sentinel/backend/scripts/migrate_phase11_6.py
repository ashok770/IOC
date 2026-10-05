import sys
import os
import uuid
import logging
from sqlalchemy import text

# Ensure backend directory is in path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from database.session import engine, init_db
from app.models.user import User
from app.models.target import Target

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    # 1. Initialize tables (this creates the 'users' table and adds the 'owner_id' column
    # to 'targets' if it doesn't exist, though create_all doesn't add columns to existing tables.
    # We will use raw SQL to add the column safely.)
    logger.info("Initializing new models...")
    init_db()

    with engine.connect() as conn:
        with conn.begin():
            # Check if owner_id exists
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='targets' AND column_name='owner_id'"))
            if result.rowcount == 0:
                logger.info("Adding owner_id column to targets table...")
                conn.execute(text("ALTER TABLE targets ADD COLUMN owner_id VARCHAR(36)"))
                conn.execute(text("ALTER TABLE targets ADD CONSTRAINT fk_targets_owner_id FOREIGN KEY (owner_id) REFERENCES users(id)"))
            else:
                logger.info("owner_id column already exists on targets.")

            # 2. Ensure System User exists
            result = conn.execute(text("SELECT id FROM users WHERE provider_issuer='system' AND provider_subject='development_user'"))
            row = result.fetchone()
            if not row:
                logger.info("Creating System Development User...")
                system_user_id = str(uuid.uuid4())
                conn.execute(text("""
                    INSERT INTO users (id, provider_issuer, provider_subject, email, is_active, created_at, updated_at)
                    VALUES (:id, 'system', 'development_user', 'dev@system.local', true, now(), now())
                """), {"id": system_user_id})
            else:
                system_user_id = row[0]
                logger.info("System Development User already exists.")

            # 3. Backfill targets
            logger.info(f"Backfilling targets with owner_id={system_user_id}...")
            conn.execute(text("UPDATE targets SET owner_id = :uid WHERE owner_id IS NULL"), {"uid": system_user_id})

            # 4. Enforce NOT NULL
            logger.info("Enforcing NOT NULL constraint on targets.owner_id...")
            conn.execute(text("ALTER TABLE targets ALTER COLUMN owner_id SET NOT NULL"))

    logger.info("Migration to Phase 11.6 complete.")

if __name__ == "__main__":
    migrate()
