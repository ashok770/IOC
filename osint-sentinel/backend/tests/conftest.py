import sys
from pathlib import Path
from typing import Generator
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from database.session import Base, get_db
import app.models  # noqa: F401
from app.main import app

# Isolated SQLite in-memory database for fast, self-contained tests
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """Provides a clean in-memory database session for each test function."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """Test client overriding get_db dependency with test in-memory session and valid auth cookie."""
    from app.models.user import User
    from app.models.session import UserSession
    import datetime
    import uuid

    # Create default test user
    test_user = User(
        id=str(uuid.uuid4()),
        provider_issuer="test",
        provider_subject="test_user",
        email="test@test.local",
    )
    db_session.add(test_user)
    
    # Create valid session for the test user
    session_record = UserSession(
        id=str(uuid.uuid4()),
        user_id=test_user.id,
        expires_at=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)
    )
    db_session.add(session_record)
    db_session.commit()

    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        test_client.cookies.set("session_id", session_record.id)
        # Add default Origin header to satisfy CSRF for normal tests
        test_client.headers.update({"Origin": "http://localhost:3000"})
        yield test_client
    app.dependency_overrides.clear()
