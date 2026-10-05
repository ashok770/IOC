import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.main import app
from database.session import engine, SessionLocal
from app.models.user import User
from app.models.target import Target
from app.models.session import UserSession
from app.config import get_settings

client = TestClient(app)
settings = get_settings()

# db_session fixture is provided by conftest.py

@pytest.fixture(scope="function")
def test_user(db_session: Session):
    import uuid
    user = User(
        id=str(uuid.uuid4()),
        provider_issuer="test",
        provider_subject="test_user_1",
        email="test1@test.local",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def test_user_2(db_session: Session):
    import uuid
    user = User(
        id=str(uuid.uuid4()),
        provider_issuer="test",
        provider_subject="test_user_2",
        email="test2@test.local",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def auth_client(test_user, db_session):
    import datetime
    from database.session import get_db
    
    session_record = UserSession(
        user_id=test_user.id,
        expires_at=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)
    )
    db_session.add(session_record)
    db_session.commit()
    db_session.refresh(session_record)
    
    def override_get_db():
        yield db_session
        
    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    test_client.cookies.set("session_id", session_record.id)
    yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def auth_client_2(test_user_2, db_session):
    import datetime
    from database.session import get_db
    
    session_record = UserSession(
        user_id=test_user_2.id,
        expires_at=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)
    )
    db_session.add(session_record)
    db_session.commit()
    db_session.refresh(session_record)
    
    def override_get_db():
        yield db_session
        
    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    test_client.cookies.set("session_id", session_record.id)
    yield test_client
    app.dependency_overrides.clear()

def test_unauthenticated_request_rejected():
    response = client.get("/api/v1/targets")
    assert response.status_code == 401

def test_valid_session_accepted(auth_client):
    response = auth_client.get("/api/v1/auth/me")
    assert response.status_code == 200
    assert "email" in response.json()

def test_target_creation_assigns_owner(auth_client, test_user, db_session):
    payload = {
        "primary_domain": "auth-test.local",
        "organization_name": "Auth Test"
    }
    response = auth_client.post("/api/v1/targets", json=payload, headers={"Origin": "http://localhost:3000"})
    assert response.status_code == 201
    
    # Verify owner in DB
    target = db_session.query(Target).filter(Target.primary_domain == "auth-test.local").first()
    assert target is not None
    assert target.owner_id == test_user.id

def test_target_listing_only_shows_owned(auth_client, auth_client_2):
    # User 1 creates target
    auth_client.post("/api/v1/targets", json={
        "primary_domain": "user1-target.local"
    }, headers={"Origin": "http://localhost:3000"})
    
    # User 2 creates target
    auth_client_2.post("/api/v1/targets", json={
        "primary_domain": "user2-target.local"
    }, headers={"Origin": "http://localhost:3000"})
    
    # User 1 listing
    resp1 = auth_client.get("/api/v1/targets")
    assert resp1.status_code == 200
    domains1 = [t["primary_domain"] for t in resp1.json()["items"]]
    assert "user1-target.local" in domains1
    assert "user2-target.local" not in domains1
    
    # User 2 listing
    resp2 = auth_client_2.get("/api/v1/targets")
    assert resp2.status_code == 200
    domains2 = [t["primary_domain"] for t in resp2.json()["items"]]
    assert "user2-target.local" in domains2
    assert "user1-target.local" not in domains2

def test_cannot_access_other_users_target(auth_client, auth_client_2, db_session, test_user_2):
    # auth_client_2 (User 2) creates target
    auth_client_2.post("/api/v1/targets", json={
        "primary_domain": "user2-private-target.local"
    }, headers={"Origin": "http://localhost:3000"})
    target = db_session.query(Target).filter(Target.owner_id == test_user_2.id).first()
    
    # auth_client (User 1) tries to access target owned by User 2
    resp = auth_client.get(f"/api/v1/targets/{target.id}")
    assert resp.status_code == 404
    
    # auth_client_2 (User 2) accessing their own target
    resp = auth_client_2.get(f"/api/v1/targets/{target.id}")
    assert resp.status_code == 200

def test_expired_session_rejected(auth_client, db_session):
    import datetime
    from app.models.session import UserSession
    
    # Expire the session manually
    session_id = auth_client.cookies.get("session_id")
    session = db_session.query(UserSession).filter_by(id=session_id).first()
    session.expires_at = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
    db_session.commit()
    
    resp = auth_client.get("/api/v1/auth/me")
    assert resp.status_code == 401

def test_logout_invalidates_session(auth_client, db_session):
    resp = auth_client.post("/api/v1/auth/logout", headers={"Origin": "http://localhost:3000"})
    assert resp.status_code == 200
    
    # Try using same auth client
    resp2 = auth_client.get("/api/v1/auth/me")
    assert resp2.status_code == 401

def test_cross_origin_state_changing_request_rejected(auth_client):
    # Attempting to POST without valid Origin/Referer
    resp = auth_client.post("/api/v1/targets", json={"primary_domain": "csrf.local"}, headers={"Origin": "http://evil.com"})
    assert resp.status_code == 403

def test_dev_login_allowed_in_dev_only():
    from app.config import get_settings
    settings = get_settings()
    
    # Given we are in test/dev, it should succeed or redirect
    test_client = TestClient(app)
    resp = test_client.get("/api/v1/auth/dev-login", follow_redirects=False)
    assert resp.status_code in (302, 307)
    
    # Simulate production
    settings.ENVIRONMENT = "production"
    resp2 = test_client.get("/api/v1/auth/dev-login", follow_redirects=False)
    assert resp2.status_code == 403
    settings.ENVIRONMENT = "development" # restore
