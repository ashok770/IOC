import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Request, Response, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth, OAuthError

from app.config import get_settings
from database.session import get_db
from app.models.user import User
from app.models.session import UserSession
from app.api.deps import get_current_user
from app.services.audit_service import AuditService, AuditAction, AuditResult
from pydantic import BaseModel

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/v1/auth", tags=["Authentication"])

oauth = OAuth()
oauth.register(
    name="oidc_provider",
    server_metadata_url=f"{settings.OIDC_ISSUER}.well-known/openid-configuration" if not settings.OIDC_ISSUER.endswith("/") else f"{settings.OIDC_ISSUER}.well-known/openid-configuration",
    client_id=settings.OIDC_CLIENT_ID,
    client_secret=settings.OIDC_CLIENT_SECRET,
    client_kwargs={
        "scope": "openid email profile",
        "code_challenge_method": "S256",
    },
)

class UserProfileResponse(BaseModel):
    id: str
    email: str | None
    is_active: bool

def _create_session(db: Session, user: User, response: Response) -> None:
    # 7 days expiration
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_record = UserSession(user_id=user.id, expires_at=expires_at)
    db.add(session_record)
    db.commit()

    response.set_cookie(
        key="session_id",
        value=session_record.id,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        max_age=7 * 24 * 3600,
        path="/",
    )


@router.get("/login", summary="Redirect to Identity Provider")
async def login(request: Request):
    """Initiates the OIDC authentication flow."""
    redirect_uri = settings.OIDC_REDIRECT_URI
    return await oauth.oidc_provider.authorize_redirect(request, redirect_uri)


@router.get("/callback", summary="OIDC Callback")
async def auth_callback(request: Request, db: Session = Depends(get_db)):
    """Handles the OIDC callback, verifies identity, and creates a local session."""
    try:
        token = await oauth.oidc_provider.authorize_access_token(request)
        userinfo = token.get("userinfo")
        if not userinfo:
            # Fallback if userinfo is not in token response
            userinfo = await oauth.oidc_provider.userinfo(token=token)
    except OAuthError as error:
        logger.error(f"OAuth callback error: {error.error}")
        AuditService.log(
            db=db,
            action=AuditAction.AUTH_LOGIN_FAILURE,
            result=AuditResult.FAILURE,
            request=request,
            metadata={"error": "OAuthError", "detail": str(error.error)}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
        )

    issuer = userinfo.get("iss", settings.OIDC_ISSUER)
    subject = userinfo.get("sub")
    email = userinfo.get("email")

    if not subject:
        AuditService.log(
            db=db,
            action=AuditAction.AUTH_LOGIN_FAILURE,
            result=AuditResult.FAILURE,
            request=request,
            metadata={"error": "missing_subject"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid identity provider response: missing subject",
        )

    # Find or create user
    user = db.query(User).filter(User.provider_issuer == issuer, User.provider_subject == subject).first()
    if not user:
        user = User(
            provider_issuer=issuer,
            provider_subject=subject,
            email=email,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.is_active:
        AuditService.log(
            db=db,
            action=AuditAction.AUTH_LOGIN_FAILURE,
            result=AuditResult.DENIED,
            user_id=user.id,
            request=request,
            metadata={"error": "account_deactivated"}
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    redirect = RedirectResponse(url="/")
    _create_session(db, user, redirect)
    
    AuditService.log(
        db=db,
        action=AuditAction.AUTH_LOGIN,
        result=AuditResult.SUCCESS,
        user_id=user.id,
        request=request,
    )
    
    # Redirect back to frontend
    return redirect


@router.get("/dev-login", summary="Development Login Shortcut")
async def dev_login(request: Request, db: Session = Depends(get_db)):
    """
    Bypasses external OIDC for local development by issuing a session 
    for the System Development User. Disabled in production.
    """
    if settings.ENVIRONMENT != "development":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Development login is disabled in this environment.",
        )

    user = db.query(User).filter(User.provider_issuer == "system", User.provider_subject == "development_user").first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Development user not found. Did you run the migration script?",
        )

    redirect = RedirectResponse(url="/")
    _create_session(db, user, redirect)
    
    AuditService.log(
        db=db,
        action=AuditAction.AUTH_LOGIN,
        result=AuditResult.SUCCESS,
        user_id=user.id,
        request=request,
        metadata={"auth_method": "dev-login"}
    )
    
    return redirect


@router.post("/logout", summary="Invalidate Session")
async def logout(
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    """Invalidates the local session cookie."""
    session_id = request.cookies.get("session_id")
    user_id = None
    if session_id:
        session_record = db.query(UserSession).filter(UserSession.id == session_id).first()
        if session_record:
            user_id = session_record.user_id
            session_record.is_active = False
            db.commit()

    AuditService.log(
        db=db,
        action=AuditAction.AUTH_LOGOUT,
        result=AuditResult.SUCCESS,
        user_id=user_id,
        request=request,
    )

    response.delete_cookie(
        key="session_id",
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        path="/"
    )
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserProfileResponse, summary="Get Current Authenticated User")
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns safe identity information for the authenticated user."""
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        is_active=current_user.is_active,
    )
