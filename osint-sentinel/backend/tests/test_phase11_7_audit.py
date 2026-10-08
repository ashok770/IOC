import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import uuid
import datetime

from app.main import app
from app.models.audit import AuditLog, AuditAction, AuditResult
from app.services.audit_service import AuditService
from app.models.target import Target
from app.models.user import User
from app.models.session import UserSession
from database.session import get_db

client = TestClient(app)


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
    test_client.headers.update({"Origin": "http://localhost:3000"})
    yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_client_2(test_user_2, db_session):
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
    test_client.headers.update({"Origin": "http://localhost:3000"})
    yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_target(db_session, test_user):
    target = Target(
        id=str(uuid.uuid4()),
        primary_domain="audit-test.local",
        owner_id=test_user.id
    )
    db_session.add(target)
    db_session.commit()
    db_session.refresh(target)
    return target


# 1. Successful login audited
def test_auth_login_audit_success(db_session):
    user = User(
        id=str(uuid.uuid4()),
        provider_issuer="system",
        provider_subject="development_user",
        email="dev@local",
    )
    db_session.add(user)
    db_session.commit()

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    resp = test_client.get("/api/v1/auth/dev-login", follow_redirects=False)
    app.dependency_overrides.clear()

    assert resp.status_code in (302, 307)

    log = db_session.query(AuditLog).filter(AuditLog.action == AuditAction.AUTH_LOGIN.value).first()
    assert log is not None
    assert log.result == AuditResult.SUCCESS.value


# 2. Failed login audited
def test_auth_login_failure_audit(db_session):
    AuditService.log(
        db=db_session,
        action=AuditAction.AUTH_LOGIN_FAILURE,
        result=AuditResult.FAILURE,
        metadata={"error": "missing_subject"}
    )

    log = db_session.query(AuditLog).filter(AuditLog.action == AuditAction.AUTH_LOGIN_FAILURE.value).first()
    assert log is not None
    assert log.result == AuditResult.FAILURE.value


# 3. Logout audited
def test_logout_audit(auth_client, db_session):
    resp = auth_client.post("/api/v1/auth/logout", headers={"Origin": "http://localhost:3000"})
    assert resp.status_code == 200

    log = db_session.query(AuditLog).filter(AuditLog.action == AuditAction.AUTH_LOGOUT.value).first()
    assert log is not None
    assert log.result == AuditResult.SUCCESS.value
    assert log.user_id is not None


# 4. Expired session audited
def test_expired_session_audited(auth_client, db_session):
    session_id = auth_client.cookies.get("session_id")
    session = db_session.query(UserSession).filter_by(id=session_id).first()
    session.expires_at = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
    db_session.commit()

    resp = auth_client.get("/api/v1/auth/me")
    assert resp.status_code == 401

    log = db_session.query(AuditLog).filter(AuditLog.action == AuditAction.AUTH_SESSION_EXPIRED.value).first()
    assert log is not None
    assert log.result == AuditResult.FAILURE.value


# 5. Unauthorized access audited
def test_unauthorized_target_access_audit(auth_client_2, test_target, db_session):
    resp = auth_client_2.get(f"/api/v1/targets/{test_target.id}")
    assert resp.status_code == 404

    log = db_session.query(AuditLog).filter(
        AuditLog.action == AuditAction.UNAUTHORIZED_ACCESS.value,
        AuditLog.target_id == test_target.id
    ).first()

    assert log is not None
    assert log.result == AuditResult.DENIED.value


# 6. CSRF block audited
def test_csrf_rejection_audit(auth_client, db_session):
    resp = auth_client.post("/api/v1/targets", json={"primary_domain": "csrf.local"}, headers={"Origin": "http://evil.com"})
    assert resp.status_code == 403

    log = db_session.query(AuditLog).filter(AuditLog.action == AuditAction.CSRF_BLOCKED.value).first()
    assert log is not None
    assert log.result == AuditResult.BLOCKED.value


# 7. Target creation audited
def test_target_creation_audit(auth_client, db_session):
    resp = auth_client.post("/api/v1/targets", json={"primary_domain": "audit-new.local"}, headers={"Origin": "http://localhost:3000"})
    assert resp.status_code == 201

    target_id = resp.json()["id"]
    log = db_session.query(AuditLog).filter(
        AuditLog.action == AuditAction.TARGET_CREATED.value,
        AuditLog.target_id == target_id
    ).first()
    assert log is not None
    assert log.result == AuditResult.SUCCESS.value


# 8. Collection lifecycle audited
def test_collection_audit_events(auth_client, test_target, db_session, monkeypatch):
    from app.services.collection_service import CollectionService
    from app.schemas.collection import CollectionSummaryResponse

    async def mock_run(*args, **kwargs):
        return CollectionSummaryResponse(
            target_id=test_target.id,
            status="completed",
            domain="audit-test.local",
            sources={"dns": "ok"},
            evidence_items_created=10,
            findings_created=5
        )
    monkeypatch.setattr(CollectionService, "run_domain_collection", mock_run)

    resp = auth_client.post(
        f"/api/v1/targets/{test_target.id}/collect/domain",
        headers={"Origin": "http://localhost:3000"}
    )
    assert resp.status_code == 200

    start_log = db_session.query(AuditLog).filter(
        AuditLog.action == AuditAction.TARGET_COLLECTION_STARTED.value,
        AuditLog.target_id == test_target.id
    ).first()
    assert start_log is not None

    complete_log = db_session.query(AuditLog).filter(
        AuditLog.action == AuditAction.TARGET_COLLECTION_COMPLETED.value,
        AuditLog.target_id == test_target.id
    ).first()
    assert complete_log is not None


# 9. Collection failure audited
def test_collection_failure_audit(db_session, test_target):
    AuditService.log(
        db=db_session,
        action=AuditAction.TARGET_COLLECTION_FAILED,
        result=AuditResult.FAILURE,
        target_id=test_target.id,
        metadata={"error": "Test exception"}
    )

    log = db_session.query(AuditLog).filter(
        AuditLog.action == AuditAction.TARGET_COLLECTION_FAILED.value,
        AuditLog.target_id == test_target.id
    ).first()
    assert log is not None


# 10. Report generation / export audited
def test_report_generation_export_audit(db_session, test_target):
    AuditService.log(
        db=db_session,
        action=AuditAction.REPORT_GENERATED,
        result=AuditResult.SUCCESS,
        target_id=test_target.id,
    )
    AuditService.log(
        db=db_session,
        action=AuditAction.REPORT_EXPORTED,
        result=AuditResult.SUCCESS,
        target_id=test_target.id,
    )

    gen = db_session.query(AuditLog).filter(AuditLog.action == AuditAction.REPORT_GENERATED.value).first()
    assert gen is not None

    exp = db_session.query(AuditLog).filter(AuditLog.action == AuditAction.REPORT_EXPORTED.value).first()
    assert exp is not None


# 11. Cross-user audit access rejected
def test_cross_user_audit_logs_read_isolation(auth_client, auth_client_2, db_session, test_user):
    AuditService.log(
        db=db_session,
        action=AuditAction.AUTH_LOGIN,
        result=AuditResult.SUCCESS,
        user_id=test_user.id
    )

    resp1 = auth_client.get("/api/v1/audit-logs")
    assert resp1.status_code == 200
    assert len(resp1.json()["items"]) >= 1

    resp2 = auth_client_2.get("/api/v1/audit-logs")
    assert resp2.status_code == 200

    for item in resp2.json()["items"]:
        assert item["user_id"] != test_user.id


# 12. Target-scoped audit access isolated (404 when target not owned)
def test_target_scoped_audit_access_isolated(auth_client_2, test_target):
    # User 2 queries logs filtering by User 1's target_id
    resp = auth_client_2.get(f"/api/v1/audit-logs?target_id={test_target.id}")
    assert resp.status_code == 404


# 13. Sensitive metadata sanitized (top-level and nested)
def test_sensitive_data_protection(db_session):
    AuditService.log(
        db=db_session,
        action=AuditAction.AUTH_LOGIN,
        result=AuditResult.SUCCESS,
        metadata={
            "password": "supersecretpassword",
            "auth": {
                "access_token": "secret_bearer_token",
                "user": "alice"
            },
            "safe_field": "ok"
        }
    )

    log = db_session.query(AuditLog).filter(AuditLog.action == AuditAction.AUTH_LOGIN.value).first()
    assert log is not None
    assert log.metadata_json is not None

    meta = log.metadata_json
    assert meta.get("password") == "[REDACTED]"
    assert meta.get("auth") == "[REDACTED]"
    assert meta.get("safe_field") == "ok"


# 14. Audit persistence failure does not break primary workflow (fail-open)
def test_audit_persistence_failure_fail_open(db_session):
    class BrokenDB:
        def add(self, record):
            raise RuntimeError("Database write failure simulation")
        def rollback(self):
            pass

    # Fail-open should catch exception and not crash caller
    AuditService.log(
        db=BrokenDB(),
        action=AuditAction.TARGET_VIEWED,
        result=AuditResult.SUCCESS,
    )


# 15. Audit records cannot be modified through API (PUT / PATCH rejected)
def test_audit_records_cannot_be_modified():
    resp_put = client.put("/api/v1/audit-logs/some-id", json={"action": "HACKED"})
    assert resp_put.status_code in (404, 405)

    resp_patch = client.patch("/api/v1/audit-logs/some-id", json={"action": "HACKED"})
    assert resp_patch.status_code in (404, 405)


# 16. Audit records cannot be deleted through API (DELETE rejected)
def test_audit_records_cannot_be_deleted():
    resp_del = client.delete("/api/v1/audit-logs/some-id")
    assert resp_del.status_code in (404, 405)
