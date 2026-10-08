import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import datetime
import uuid

from app.main import app
from app.models.user import User
from app.models.target import Target
from app.models.asset import Asset
from app.models.session import UserSession
from app.config import get_settings

client = TestClient(app)
settings = get_settings()


@pytest.fixture(scope="function")
def test_user(db_session: Session):
    user = User(
        id=str(uuid.uuid4()),
        provider_issuer="test",
        provider_subject=f"test_user_1_{uuid.uuid4().hex[:6]}",
        email="test1@test.local",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_user_2(db_session: Session):
    user = User(
        id=str(uuid.uuid4()),
        provider_issuer="test",
        provider_subject=f"test_user_2_{uuid.uuid4().hex[:6]}",
        email="test2@test.local",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_client(test_user, db_session):
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


# 1. Unauthenticated protected endpoint -> rejected
def test_unauthenticated_request_rejected():
    response = client.get("/api/v1/targets")
    assert response.status_code == 401


# 2. Authenticated user -> allowed
def test_valid_session_accepted(auth_client):
    response = auth_client.get("/api/v1/auth/me")
    assert response.status_code == 200
    assert "email" in response.json()


# 3. User A accessing User B target -> rejected (404)
def test_cannot_access_other_users_target(auth_client, auth_client_2, db_session, test_user_2):
    auth_client_2.post("/api/v1/targets", json={
        "primary_domain": "user2-private-target.local"
    }, headers={"Origin": "http://localhost:3000"})
    target = db_session.query(Target).filter(Target.owner_id == test_user_2.id).first()

    # User 1 attempts to access User 2 target
    resp = auth_client.get(f"/api/v1/targets/{target.id}")
    assert resp.status_code == 404

    # User 2 accesses own target
    resp2 = auth_client_2.get(f"/api/v1/targets/{target.id}")
    assert resp2.status_code == 200


# 4. Direct asset object from another target -> rejected (404)
def test_direct_asset_object_from_another_target_rejected(auth_client, auth_client_2, db_session, test_user_2):
    # User 2 creates target and asset
    target2 = Target(
        primary_domain="target2-asset-test.local",
        owner_id=test_user_2.id
    )
    db_session.add(target2)
    db_session.commit()
    db_session.refresh(target2)

    asset2 = Asset(
        target_id=target2.id,
        asset_type="domain",
        value="target2-asset-test.local",
        source="test"
    )
    db_session.add(asset2)
    db_session.commit()

    # User 1 attempts to query User 2's asset via target-scoped endpoint
    resp1 = auth_client.get(f"/api/v1/targets/{target2.id}/assets/{asset2.id}")
    assert resp1.status_code == 404

    # User 1 attempts to query User 2's asset via global asset route with target_id
    resp2 = auth_client.get(f"/api/v1/assets/{asset2.id}?target_id={target2.id}")
    assert resp2.status_code == 404


# 5. Expired session -> rejected
def test_expired_session_rejected(auth_client, db_session):
    session_id = auth_client.cookies.get("session_id")
    session = db_session.query(UserSession).filter_by(id=session_id).first()
    session.expires_at = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
    db_session.commit()

    resp = auth_client.get("/api/v1/auth/me")
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Session expired"


# 6. Invalid session -> rejected
def test_invalid_session_rejected():
    fake_client = TestClient(app)
    fake_client.cookies.set("session_id", "invalid-nonexistent-session-id")
    resp = fake_client.get("/api/v1/auth/me")
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid session"


# 7. Logout invalidates session
def test_logout_invalidates_session(auth_client, db_session):
    resp = auth_client.post("/api/v1/auth/logout", headers={"Origin": "http://localhost:3000"})
    assert resp.status_code == 200
    assert resp.json()["message"] == "Logged out successfully"

    session_id = auth_client.cookies.get("session_id")
    if session_id:
        session = db_session.query(UserSession).filter_by(id=session_id).first()
        assert session is not None
        assert session.is_active is False


# 8. Reused logged-out session -> rejected
def test_reused_logged_out_session_rejected(auth_client):
    auth_client.post("/api/v1/auth/logout", headers={"Origin": "http://localhost:3000"})
    resp = auth_client.get("/api/v1/auth/me")
    assert resp.status_code == 401


# 9. Development dev-login -> allowed in development
def test_dev_login_allowed_in_development():
    settings.ENVIRONMENT = "development"
    test_client = TestClient(app)
    resp = test_client.get("/api/v1/auth/dev-login", follow_redirects=False)
    assert resp.status_code in (302, 307)
    assert "session_id" in resp.cookies


# 10. Production dev-login -> unavailable (404)
def test_production_dev_login_unavailable():
    settings.ENVIRONMENT = "production"
    test_client = TestClient(app)
    resp = test_client.get("/api/v1/auth/dev-login", follow_redirects=False)
    assert resp.status_code == 404
    settings.ENVIRONMENT = "development"  # restore


# 11. Invalid OIDC state -> rejected
def test_invalid_oidc_state_rejected():
    test_client = TestClient(app)
    resp = test_client.get("/api/v1/auth/callback?code=fake_code&state=invalid_state")
    assert resp.status_code == 401


# 12. Invalid / missing OIDC nonce -> rejected
def test_invalid_oidc_callback_rejected():
    test_client = TestClient(app)
    resp = test_client.get("/api/v1/auth/callback")
    assert resp.status_code == 401


# 13. Unsafe cross-origin state-changing request -> rejected
def test_unsafe_cross_origin_state_changing_request_rejected(auth_client):
    # Untrusted external origin
    resp1 = auth_client.post("/api/v1/targets", json={"primary_domain": "csrf.local"}, headers={"Origin": "http://evil.com"})
    assert resp1.status_code == 403

    # Subdomain bypass attempt (e.g. http://localhost:3000.evil.com)
    resp2 = auth_client.post("/api/v1/targets", json={"primary_domain": "csrf.local"}, headers={"Origin": "http://localhost:3000.evil.com"})
    assert resp2.status_code == 403


# 14. Trusted same-origin state-changing request -> allowed
def test_trusted_same_origin_state_changing_request_allowed(auth_client):
    resp = auth_client.post("/api/v1/targets", json={"primary_domain": "trusted-origin.local"}, headers={"Origin": "http://localhost:3000"})
    assert resp.status_code == 201


# 15. Arbitrary redirect URI cannot be injected in callback
def test_arbitrary_redirect_uri_cannot_be_injected():
    test_client = TestClient(app)
    resp = test_client.get("/api/v1/auth/callback?redirect_uri=https://attacker.com", follow_redirects=False)
    # Callback always fails auth or redirects strictly to '/'
    if resp.status_code in (302, 307):
        assert resp.headers["location"] == "/"
    else:
        assert resp.status_code == 401


# 16. Authentication errors do not expose secrets or tracebacks
def test_auth_errors_do_not_expose_secrets():
    test_client = TestClient(app)
    resp = test_client.get("/api/v1/auth/callback?code=bad_code")
    assert resp.status_code == 401
    body_text = resp.text.lower()
    assert "secret" not in body_text
    assert "traceback" not in body_text
    assert "token" not in body_text
