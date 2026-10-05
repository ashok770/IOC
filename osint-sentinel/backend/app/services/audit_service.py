from typing import Optional, Any, Dict, List, Tuple
from sqlalchemy.orm import Session
from fastapi import Request
import logging
from app.models.audit import AuditLog, AuditAction, AuditResult

logger = logging.getLogger(__name__)

class AuditService:
    """
    Centralized service for generating security audit events.
    Failure behavior: FAIL-OPEN for logging exceptions.
    Security logging should not completely break application functionality if the DB write fails,
    but it will emit an ERROR log.
    """

    @staticmethod
    def extract_request_context(request: Request) -> Dict[str, Optional[str]]:
        """Safely extract source IP and User-Agent."""
        if not request:
            return {"source_ip": None, "user_agent": None}
            
        return {
            # We don't blindly trust X-Forwarded-For; using client host
            "source_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent")
        }

    @staticmethod
    def log(
        db: Session,
        action: AuditAction,
        result: AuditResult,
        user_id: Optional[str] = None,
        target_id: Optional[str] = None,
        asset_id: Optional[str] = None,
        request: Optional[Request] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Record a security-relevant event into the append-oriented application audit trail.
        """
        req_context = AuditService.extract_request_context(request) if request else {}
        
        # Strip potentially sensitive fields from metadata if any were passed by accident
        safe_metadata = None
        if metadata:
            safe_metadata = {
                k: v for k, v in metadata.items()
                if k.lower() not in ["password", "token", "secret", "cookie", "session_id", "authorization_code"]
            }

        try:
            audit_record = AuditLog(
                user_id=user_id,
                action=action.value,
                result=result.value,
                target_id=target_id,
                asset_id=asset_id,
                source_ip=req_context.get("source_ip"),
                user_agent=req_context.get("user_agent"),
                metadata_json=safe_metadata,
            )
            db.add(audit_record)
            db.commit()
        except Exception as e:
            db.rollback()
            # FAIL-OPEN behavior: Log to stderr but do not crash the request
            logger.error(f"AUDIT LOGGING FAILURE: Failed to write audit log '{action.value}'. Error: {e}")

    @staticmethod
    def list_logs_for_user(
        db: Session, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 100,
        action: Optional[str] = None,
        target_id: Optional[str] = None,
    ) -> Tuple[List[AuditLog], int]:
        """
        Retrieve audit logs accessible to the given user.
        A user can only see logs where user_id matches their own ID, 
        or where target_id matches a target they own.
        """
        from app.models.target import Target
        
        query = db.query(AuditLog).outerjoin(Target, AuditLog.target_id == Target.id)
        
        # Ownership filter: User's own actions, OR actions on targets they own
        query = query.filter(
            (AuditLog.user_id == user_id) | 
            (Target.owner_id == user_id)
        )
        
        if action:
            query = query.filter(AuditLog.action == action)
        if target_id:
            query = query.filter(AuditLog.target_id == target_id)
            
        total = query.count()
        items = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
        
        return items, total
