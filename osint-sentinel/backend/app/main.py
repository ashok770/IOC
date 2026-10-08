import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.router import api_router
from database.session import check_db_connection, init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("osint_sentinel")

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifecycle manager.
    Validates components at startup without blocking if external dependencies (e.g. DB) are offline.
    """
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")
    logger.info("Operational Mode: Authorized External Security Exposure Assessment Only")
    
    # Check DB status non-blockingly
    connected, message = check_db_connection()
    if connected:
        logger.info(f"Database status: {message}")
        init_db()
    else:
        logger.warning(
            f"Database not available at startup ({message}). Server starting in offline-database mode."
        )

    yield

    logger.info("Shutting down OSINT Sentinel backend gracefully.")


def create_application() -> FastAPI:
    """FastAPI application factory."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=(
            "OSINT Sentinel — Authorized External Security Exposure Assessment Platform.\n\n"
            "**Notice:** This platform is strictly designed for authorized, passive intelligence collection "
            "and defensive security posture evaluation. Exploitation, active penetration testing, "
            "and credential abuse are strictly prohibited."
        ),
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    from starlette.middleware.sessions import SessionMiddleware

    # Session Middleware for OIDC flow state & nonce management
    app.add_middleware(SessionMiddleware, secret_key=settings.SESSION_SECRET)

    # CORS configuration
    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # Register API routers under /api prefix
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    # Security Headers Middleware
    @app.middleware("http")
    async def add_security_headers(request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    return app


app = create_application()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
