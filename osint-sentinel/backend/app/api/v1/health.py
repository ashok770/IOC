from fastapi import APIRouter, Depends
from app.config import Settings, get_settings
from app.schemas.health import HealthResponse, DatabaseHealth
from database.session import check_db_connection

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, summary="Service & Database Health Status")
def get_health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    """
    Health probe reporting API status, environment metadata, and database reachability.
    Non-blocking: returns 200 even if the database is currently unreachable.
    """
    db_connected, db_details = check_db_connection()

    return HealthResponse(
        status="ok" if db_connected else "degraded",
        project=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        database=DatabaseHealth(
            connected=db_connected,
            details=db_details,
        ),
        mode="authorized_assessment_only",
    )
