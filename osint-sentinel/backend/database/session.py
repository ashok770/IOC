import logging
from typing import Generator, Dict, Any, Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.exc import SQLAlchemyError, OperationalError

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Engine creation in SQLAlchemy is lazy: it doesn't establish connections until required.
# Pool pre-ping ensures stale connections are recycled gracefully.
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=settings.DATABASE_POOL_PRE_PING,
    pool_timeout=5,  # Avoid long hangs if database is unavailable
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a database session.
    Ensures sessions are closed properly after request execution.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> Tuple[bool, str]:
    """
    Safe database connectivity probe.
    Does NOT raise an exception or prevent server startup if database is offline.
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True, "Database connected successfully"
    except OperationalError as err:
        logger.warning(f"Database offline or unreachable: {err.orig}")
        return False, "Database offline or unreachable"
    except SQLAlchemyError as err:
        logger.warning(f"Database error during connectivity probe: {err}")
        return False, f"Database error: {str(err)}"
    except Exception as err:
        logger.warning(f"Unexpected error probing database: {err}")
        return False, f"Unexpected error: {str(err)}"


def init_db() -> bool:
    """
    Initializes database tables if connection is available.
    Safe to execute multiple times (idempotent).
    """
    try:
        # Import models to ensure they are registered on Base.metadata
        import app.models  # noqa: F401
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
        return True
    except Exception as err:
        logger.error(f"Failed to initialize database tables: {err}")
        return False
