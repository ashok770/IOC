from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database.session import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.audit import AuditLogListResponse, AuditLogResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/v1/audit-logs", tags=["Audit"])

@router.get(
    "",
    response_model=AuditLogListResponse,
    summary="List Security Audit Logs",
)
def list_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action"),
    target_id: Optional[str] = Query(None, description="Filter by target_id"),
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(100, ge=1, le=500, description="Page limit"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AuditLogListResponse:
    """
    Retrieve security audit logs. 
    Users can only view logs corresponding to their own user_id or targets they own.
    """
    items, total = AuditService.list_logs_for_user(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        action=action,
        target_id=target_id,
    )
    return AuditLogListResponse(
        items=[AuditLogResponse.model_validate(log) for log in items],
        total=total,
        limit=limit,
        offset=skip,
    )
