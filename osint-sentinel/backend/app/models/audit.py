import uuid
from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
from database.session import Base

class AuditAction(str, Enum):
    AUTH_LOGIN = "AUTH_LOGIN"
    AUTH_LOGIN_FAILURE = "AUTH_LOGIN_FAILURE"
    AUTH_LOGOUT = "AUTH_LOGOUT"
    AUTH_SESSION_EXPIRED = "AUTH_SESSION_EXPIRED"
    UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS"
    CSRF_BLOCKED = "CSRF_BLOCKED"
    TARGET_CREATED = "TARGET_CREATED"
    TARGET_VIEWED = "TARGET_VIEWED"
    TARGET_COLLECTION_STARTED = "TARGET_COLLECTION_STARTED"
    TARGET_COLLECTION_COMPLETED = "TARGET_COLLECTION_COMPLETED"
    TARGET_COLLECTION_FAILED = "TARGET_COLLECTION_FAILED"
    REPORT_GENERATED = "REPORT_GENERATED"
    REPORT_EXPORTED = "REPORT_EXPORTED"


class AuditResult(str, Enum):
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"
    DENIED = "DENIED"
    BLOCKED = "BLOCKED"
    STARTED = "STARTED"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True)
    
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    result = Column(String(50), nullable=False, index=True)
    
    target_id = Column(String(36), ForeignKey("targets.id"), nullable=True, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id"), nullable=True)
    
    request_id = Column(String(100), nullable=True)
    source_ip = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    metadata_json = Column("metadata", JSON, nullable=True)
