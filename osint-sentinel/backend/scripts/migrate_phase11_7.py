import sys
from pathlib import Path
from sqlalchemy import text

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from database.session import engine

def apply_migration():
    """
    Creates the audit_logs table for Phase 11.7 if it does not exist.
    """
    print("Starting Phase 11.7 Audit Log migration...")
    
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        user_id VARCHAR(36) REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        result VARCHAR(50) NOT NULL,
        target_id VARCHAR(36) REFERENCES targets(id),
        asset_id VARCHAR(36) REFERENCES assets(id),
        request_id VARCHAR(100),
        source_ip VARCHAR(45),
        user_agent VARCHAR(500),
        metadata JSON
    );
    """
    
    create_indexes_sql = [
        "CREATE INDEX IF NOT EXISTS ix_audit_logs_timestamp ON audit_logs(timestamp);",
        "CREATE INDEX IF NOT EXISTS ix_audit_logs_user_id ON audit_logs(user_id);",
        "CREATE INDEX IF NOT EXISTS ix_audit_logs_action ON audit_logs(action);",
        "CREATE INDEX IF NOT EXISTS ix_audit_logs_result ON audit_logs(result);",
        "CREATE INDEX IF NOT EXISTS ix_audit_logs_target_id ON audit_logs(target_id);"
    ]
    
    with engine.begin() as conn:
        conn.execute(text(create_table_sql))
        print("Ensured audit_logs table exists.")
        
        for idx_sql in create_indexes_sql:
            conn.execute(text(idx_sql))
        print("Ensured audit_logs indexes exist.")

    print("Phase 11.7 Audit Log migration complete.")

if __name__ == "__main__":
    apply_migration()
