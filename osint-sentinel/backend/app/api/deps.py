import logging
from typing import Optional
from fastapi import Request, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from database.session import get_db
from app.models.user import User
from app.models.session import UserSession
from app.models.target import Target
from app.services.audit_service import AuditService, AuditAction, AuditResult

logger = logging.getLogger(__name__)


def get_session_token(request: Request) -> Optional[str]:
    return request.cookies.get("session_id")


def get_current_user(
    request: Request,
    session_id: Optional[str] = Depends(get_session_token),
    db: Session = Depends(get_db)
) -> User:
    """
    Validates the session cookie and returns the current authenticated User.
    Also validates Origin/Referer for state-changing requests (CSRF protection).
    Raises 401/403 if unauthorized or CSRF fails.
    """
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    session_record = db.query(UserSession).filter(UserSession.id == session_id).first()
    if not session_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session",
        )

    expires_at = session_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if not session_record.is_active or expires_at < datetime.now(timezone.utc):
        AuditService.log(
            db=db,
            action=AuditAction.AUTH_SESSION_EXPIRED,
            result=AuditResult.FAILURE,
            user_id=session_record.user_id,
            request=request,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired",
        )

    user = db.query(User).filter(User.id == session_record.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    from app.config import get_settings
    settings = get_settings()

    # CSRF Protection for state-changing requests
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        origin = request.headers.get("origin") or request.headers.get("referer")
        if not origin:
            AuditService.log(
                db=db,
                action=AuditAction.CSRF_BLOCKED,
                result=AuditResult.BLOCKED,
                user_id=user.id if user else None,
                request=request,
                metadata={"reason": "Missing Origin/Referer header"}
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF validation failed: Missing Origin/Referer header",
            )
        
        # Strip trailing slash and path from referer if present
        if origin.endswith("/"):
            origin = origin[:-1]
            
        allowed_origins = [o.rstrip("/") for o in settings.cors_origins]
        
        # Check if the origin starts with any allowed origin (to handle referer paths)
        if not any(origin.startswith(allowed) for allowed in allowed_origins):
            AuditService.log(
                db=db,
                action=AuditAction.CSRF_BLOCKED,
                result=AuditResult.BLOCKED,
                user_id=user.id if user else None,
                request=request,
                metadata={"reason": "Untrusted Origin/Referer", "origin": origin}
            )
            # In a real environment, we might want to strictly parse URL components
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"CSRF validation failed: Untrusted Origin/Referer '{origin}'",
            )

    return user


def get_authorized_target(
    target_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Target:
    """
    Fetches the target and ensures the current user is the owner.
    Returns 404 to avoid enumerating targets for unauthorized users.
    """
    target = db.query(Target).filter(Target.id == target_id).first()
    
    if not target or target.owner_id != current_user.id:
        if target and target.owner_id != current_user.id:
            # It exists but user doesn't own it
            AuditService.log(
                db=db,
                action=AuditAction.UNAUTHORIZED_ACCESS,
                result=AuditResult.DENIED,
                user_id=current_user.id,
                target_id=target_id,
                request=request,
            )
            
        # Return 404 instead of 403 to prevent enumeration
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target with ID '{target_id}' not found.",
        )
        
    return target
