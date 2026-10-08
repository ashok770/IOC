import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import datetime
import uuid

from app.main import app
from app.models.user import User
from app.models.target import Target
from app.models.assessment_run import (
    AssessmentRun,
    AssessmentRunAsset,
    AssessmentRunTechnology,
    AssessmentRunExposureSignal,
)
from app.models.session import UserSession
from database.session import get_db

client = TestClient(app)


@pytest.fixture(scope="function")
def test_user(db_session: Session):
    user = User(
        id=str(uuid.uuid4()),
        provider_issuer="test",
        provider_subject=f"test_user_phase12_3_{uuid.uuid4().hex[:6]}",
        email="p12_3@test.local",
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
        provider_subject=f"test_user_2_phase12_3_{uuid.uuid4().hex[:6]}",
        email="p12_3_user2@test.local",
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
        primary_domain="comp-api-test.local",
        owner_id=test_user.id
    )
    db_session.add(target)
    db_session.commit()
    db_session.refresh(target)
    return target


@pytest.fixture
def test_target_2(db_session, test_user_2):
    target = Target(
        id=str(uuid.uuid4()),
        primary_domain="user2-comp-test.local",
        owner_id=test_user_2.id
    )
    db_session.add(target)
    db_session.commit()
    db_session.refresh(target)
    return target


@pytest.fixture
def seeded_runs(db_session, test_target):
    now = datetime.datetime.now(datetime.timezone.utc)

    # Base Run (Run 1)
    run1 = AssessmentRun(
        id=str(uuid.uuid4()),
        target_id=test_target.id,
        status="completed",
        started_at=now - datetime.timedelta(hours=2),
        completed_at=now - datetime.timedelta(hours=2, minutes=-10),
        overall_score=15.0,
        risk_level="low",
        total_assets=2,
        total_technologies=2,
        total_exposure_signals=1,
        factors_breakdown={"perimeter": 10.0, "defenses": 5.0},
    )
    db_session.add(run1)
    db_session.commit()

    snap_asset1_1 = AssessmentRunAsset(
        assessment_run_id=run1.id,
        target_id=test_target.id,
        asset_type="domain",
        value="comp-api-test.local",
        source="target_registration",
    )
    snap_asset1_2 = AssessmentRunAsset(
        assessment_run_id=run1.id,
        target_id=test_target.id,
        asset_type="ip",
        value="1.1.1.1",
        source="DNS",
    )
    db_session.add_all([snap_asset1_1, snap_asset1_2])

    snap_tech1_1 = AssessmentRunTechnology(
        assessment_run_id=run1.id,
        target_id=test_target.id,
        asset_value="comp-api-test.local",
        name="nginx",
        category="web_server",
        version="1.18.0",
        detection_method="http_header",
    )
    snap_tech1_2 = AssessmentRunTechnology(
        assessment_run_id=run1.id,
        target_id=test_target.id,
        asset_value="comp-api-test.local",
        name="PHP",
        category="programming_language",
        version="7.4.3",
        detection_method="http_header",
    )
    db_session.add_all([snap_tech1_1, snap_tech1_2])

    snap_sig1_1 = AssessmentRunExposureSignal(
        assessment_run_id=run1.id,
        target_id=test_target.id,
        asset_value="comp-api-test.local",
        signal_type="old_signal",
        category="perimeter",
        title="Legacy Signal",
        severity="info",
    )
    db_session.add(snap_sig1_1)

    # Target Run (Run 2) - Assets added/removed, tech version changed, signal resolved/new, risk increased
    run2 = AssessmentRun(
        id=str(uuid.uuid4()),
        target_id=test_target.id,
        status="completed",
        started_at=now - datetime.timedelta(hours=1),
        completed_at=now - datetime.timedelta(hours=1, minutes=-10),
        overall_score=35.0,
        risk_level="medium",
        total_assets=2,
        total_technologies=2,
        total_exposure_signals=1,
        factors_breakdown={"perimeter": 20.0, "defenses": 15.0},
    )
    db_session.add(run2)
    db_session.commit()

    # Asset 1.1.1.1 removed, 2.2.2.2 added
    snap_asset2_1 = AssessmentRunAsset(
        assessment_run_id=run2.id,
        target_id=test_target.id,
        asset_type="domain",
        value="comp-api-test.local",
        source="target_registration",
    )
    snap_asset2_2 = AssessmentRunAsset(
        assessment_run_id=run2.id,
        target_id=test_target.id,
        asset_type="ip",
        value="2.2.2.2",
        source="DNS",
    )
    db_session.add_all([snap_asset2_1, snap_asset2_2])

    # PHP removed, nginx version updated to 1.22.1, Python added
    snap_tech2_1 = AssessmentRunTechnology(
        assessment_run_id=run2.id,
        target_id=test_target.id,
        asset_value="comp-api-test.local",
        name="nginx",
        category="web_server",
        version="1.22.1",
        detection_method="http_header",
    )
    snap_tech2_2 = AssessmentRunTechnology(
        assessment_run_id=run2.id,
        target_id=test_target.id,
        asset_value="comp-api-test.local",
        name="Python",
        category="programming_language",
        version="3.11.0",
        detection_method="http_header",
    )
    db_session.add_all([snap_tech2_1, snap_tech2_2])

    # Legacy signal resolved, New Signal added
    snap_sig2_1 = AssessmentRunExposureSignal(
        assessment_run_id=run2.id,
        target_id=test_target.id,
        asset_value="comp-api-test.local",
        signal_type="new_signal",
        category="perimeter",
        title="Modern Signal",
        severity="info",
    )
    db_session.add(snap_sig2_1)

    db_session.commit()
    return run1, run2


def test_list_target_assessments(auth_client, test_target, seeded_runs):
    run1, run2 = seeded_runs
    resp = auth_client.get(f"/api/v1/targets/{test_target.id}/assessments")
    assert resp.status_code == 200
    data = resp.json()

    assert data["total"] == 2
    # Newest first ordering check
    assert data["items"][0]["id"] == run2.id
    assert data["items"][1]["id"] == run1.id


def test_list_assessments_pagination(auth_client, test_target, seeded_runs):
    resp = auth_client.get(f"/api/v1/targets/{test_target.id}/assessments?skip=0&limit=1")
    assert resp.status_code == 200
    data = resp.json()

    assert len(data["items"]) == 1
    assert data["total"] == 2
    assert data["items"][0]["id"] == seeded_runs[1].id


def test_get_assessment_detail(auth_client, test_target, seeded_runs):
    run1, _ = seeded_runs
    resp = auth_client.get(f"/api/v1/targets/{test_target.id}/assessments/{run1.id}")
    assert resp.status_code == 200
    data = resp.json()

    assert data["id"] == run1.id
    assert data["overall_score"] == 15.0
    assert len(data["asset_snapshots"]) == 2
    assert len(data["technology_snapshots"]) == 2
    assert len(data["exposure_signal_snapshots"]) == 1


def test_unauthorized_target_assessments_rejected(auth_client_2, test_target):
    # User 2 attempts to list User 1's target assessments -> 404
    resp = auth_client_2.get(f"/api/v1/targets/{test_target.id}/assessments")
    assert resp.status_code == 404


def test_assessment_detail_another_target_rejected(auth_client, test_target_2, seeded_runs):
    run1, _ = seeded_runs
    # User 1 attempts to query User 2's target with User 1's assessment_id -> 404
    resp = auth_client.get(f"/api/v1/targets/{test_target_2.id}/assessments/{run1.id}")
    assert resp.status_code == 404


def test_compare_two_valid_runs(auth_client, test_target, seeded_runs):
    run1, run2 = seeded_runs
    resp = auth_client.get(f"/api/v1/targets/{test_target.id}/assessments/compare?base_run_id={run1.id}&target_run_id={run2.id}")
    assert resp.status_code == 200
    data = resp.json()

    # Summary checks
    assert data["summary"]["score_delta"] == 20.0
    assert data["summary"]["risk_level_changed"] is True

    # Asset comparison
    added_asset_vals = [a["value"] for a in data["assets"]["added"]]
    removed_asset_vals = [a["value"] for a in data["assets"]["removed"]]
    unchanged_asset_vals = [a["value"] for a in data["assets"]["unchanged"]]

    assert "2.2.2.2" in added_asset_vals
    assert "1.1.1.1" in removed_asset_vals
    assert "comp-api-test.local" in unchanged_asset_vals

    # Technology comparison & version change
    added_tech_names = [t["name"] for t in data["technologies"]["added"]]
    removed_tech_names = [t["name"] for t in data["technologies"]["removed"]]
    v_changes = data["technologies"]["version_changes"]

    assert "Python" in added_tech_names
    assert "PHP" in removed_tech_names
    assert len(v_changes) == 1
    assert v_changes[0]["technology"] == "nginx"
    assert v_changes[0]["previous_version"] == "1.18.0"
    assert v_changes[0]["current_version"] == "1.22.1"

    # Exposure signals comparison
    new_sig_titles = [s["title"] for s in data["exposure_signals"]["new"]]
    res_sig_titles = [s["title"] for s in data["exposure_signals"]["resolved"]]

    assert "Modern Signal" in new_sig_titles
    assert "Legacy Signal" in res_sig_titles

    # Risk comparison
    assert data["risk"]["overall_score"]["previous"] == 15.0
    assert data["risk"]["overall_score"]["current"] == 35.0
    assert data["risk"]["overall_score"]["delta"] == 20.0
    assert data["risk"]["risk_level"]["previous"] == "low"
    assert data["risk"]["risk_level"]["current"] == "medium"
    assert data["risk"]["risk_level"]["changed"] is True


def test_same_run_comparison_rejected(auth_client, test_target, seeded_runs):
    run1, _ = seeded_runs
    resp = auth_client.get(f"/api/v1/targets/{test_target.id}/assessments/compare?base_run_id={run1.id}&target_run_id={run1.id}")
    assert resp.status_code == 400
    assert "must be different" in resp.json()["detail"].lower()


def test_cross_target_comparison_rejected(auth_client, test_target, test_target_2, seeded_runs, db_session, test_user_2):
    run1, _ = seeded_runs
    # User 2 run
    run_other = AssessmentRun(
        id=str(uuid.uuid4()),
        target_id=test_target_2.id,
        status="completed",
        started_at=datetime.datetime.now(datetime.timezone.utc),
    )
    db_session.add(run_other)
    db_session.commit()

    # Attempting to compare run from Target 1 and Target 2 under Target 1
    resp = auth_client.get(f"/api/v1/targets/{test_target.id}/assessments/compare?base_run_id={run1.id}&target_run_id={run_other.id}")
    assert resp.status_code == 404


def test_non_existent_assessment_id_handled_safely(auth_client, test_target):
    fake_id = str(uuid.uuid4())
    resp = auth_client.get(f"/api/v1/targets/{test_target.id}/assessments/{fake_id}")
    assert resp.status_code == 404
