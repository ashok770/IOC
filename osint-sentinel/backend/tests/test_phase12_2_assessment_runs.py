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
        provider_subject=f"test_user_phase12_{uuid.uuid4().hex[:6]}",
        email="p12@test.local",
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
def test_target(db_session, test_user):
    target = Target(
        id=str(uuid.uuid4()),
        primary_domain="run-test.local",
        owner_id=test_user.id
    )
    db_session.add(target)
    db_session.commit()
    db_session.refresh(target)
    return target


def test_assessment_run_creation_and_completion(auth_client, test_target, db_session, monkeypatch):
    from collectors.domain_collector import DomainIntelligenceCollector, DomainCollectionResult
    from collectors.base import CollectorResult

    async def mock_collect(*args, **kwargs):
        return DomainCollectionResult(
            domain=test_target.primary_domain,
            sources_status={"dns": "success", "rdap": "success", "crt.sh": "success", "http": "success"},
            evidence_results=[
                CollectorResult(
                    evidence_type="dns_record",
                    source="DNS",
                    data={"record_type": "A", "address": "1.2.3.4", "ttl": 300},
                    confidence=1.0,
                ),
                CollectorResult(
                    evidence_type="http_headers",
                    source="HTTP",
                    data={"headers": {"server": "nginx/1.22.1"}, "status_code": 200},
                    confidence=1.0,
                )
            ],
            reports={}
        )

    monkeypatch.setattr(DomainIntelligenceCollector, "collect", mock_collect)

    resp = auth_client.post(f"/api/v1/targets/{test_target.id}/collect/domain")
    assert resp.status_code == 200

    # Verify AssessmentRun created and status completed
    runs = db_session.query(AssessmentRun).filter(AssessmentRun.target_id == test_target.id).all()
    assert len(runs) == 1
    run = runs[0]

    assert run.status == "completed"
    assert run.started_at is not None
    assert run.completed_at is not None
    assert run.completed_at >= run.started_at
    assert run.overall_score >= 0.0
    assert run.risk_level in ("low", "medium", "high", "critical")
    assert isinstance(run.factors_breakdown, dict)
    assert run.sources_status == {"dns": "success", "rdap": "success", "crt.sh": "success", "http": "success"}

    # Verify snapshot models populated
    snap_assets = db_session.query(AssessmentRunAsset).filter(AssessmentRunAsset.assessment_run_id == run.id).all()
    assert len(snap_assets) >= 1
    assert run.total_assets == len(snap_assets)

    snap_techs = db_session.query(AssessmentRunTechnology).filter(AssessmentRunTechnology.assessment_run_id == run.id).all()
    assert len(snap_techs) >= 1
    assert run.total_technologies == len(snap_techs)

    nginx_tech = next((t for t in snap_techs if t.name == "nginx"), None)
    if nginx_tech:
        assert nginx_tech.version == "1.22.1"

    snap_signals = db_session.query(AssessmentRunExposureSignal).filter(AssessmentRunExposureSignal.assessment_run_id == run.id).all()
    assert run.total_exposure_signals == len(snap_signals)

    assert run.total_evidence_items == 2


def test_failed_assessment_run(auth_client, test_target, db_session, monkeypatch):
    from collectors.domain_collector import DomainIntelligenceCollector

    async def mock_failed_collect(*args, **kwargs):
        raise RuntimeError("Simulated connection timeout to upstream collector")

    monkeypatch.setattr(DomainIntelligenceCollector, "collect", mock_failed_collect)

    resp = auth_client.post(f"/api/v1/targets/{test_target.id}/collect/domain")
    assert resp.status_code == 500

    runs = db_session.query(AssessmentRun).filter(AssessmentRun.target_id == test_target.id).all()
    assert len(runs) == 1
    run = runs[0]

    assert run.status == "failed"
    assert run.completed_at is not None
    assert "Simulated connection timeout" in run.error_message


def test_multiple_assessment_runs_history_immutability(auth_client, test_target, db_session, monkeypatch):
    from collectors.domain_collector import DomainIntelligenceCollector, DomainCollectionResult
    from collectors.base import CollectorResult

    # First run
    async def mock_collect_1(*args, **kwargs):
        return DomainCollectionResult(
            domain=test_target.primary_domain,
            sources_status={"dns": "success"},
            evidence_results=[
                CollectorResult(
                    evidence_type="dns_record",
                    source="DNS",
                    data={"record_type": "A", "address": "10.0.0.1"},
                    confidence=1.0,
                )
            ],
            reports={}
        )

    monkeypatch.setattr(DomainIntelligenceCollector, "collect", mock_collect_1)
    auth_client.post(f"/api/v1/targets/{test_target.id}/collect/domain")

    runs1 = db_session.query(AssessmentRun).filter(AssessmentRun.target_id == test_target.id).order_by(AssessmentRun.started_at.asc()).all()
    assert len(runs1) == 1
    run1 = runs1[0]
    assets1 = db_session.query(AssessmentRunAsset).filter(AssessmentRunAsset.assessment_run_id == run1.id).all()
    asset_vals1 = [a.value for a in assets1]

    # Second run with extra domain asset
    async def mock_collect_2(*args, **kwargs):
        return DomainCollectionResult(
            domain=test_target.primary_domain,
            sources_status={"dns": "success"},
            evidence_results=[
                CollectorResult(
                    evidence_type="dns_record",
                    source="DNS",
                    data={"record_type": "A", "address": "10.0.0.1"},
                    confidence=1.0,
                ),
                CollectorResult(
                    evidence_type="dns_record",
                    source="DNS",
                    data={"record_type": "A", "address": "10.0.0.2"},
                    confidence=1.0,
                )
            ],
            reports={}
        )

    monkeypatch.setattr(DomainIntelligenceCollector, "collect", mock_collect_2)
    auth_client.post(f"/api/v1/targets/{test_target.id}/collect/domain")

    runs2 = db_session.query(AssessmentRun).filter(AssessmentRun.target_id == test_target.id).order_by(AssessmentRun.started_at.asc()).all()
    assert len(runs2) == 2

    # Verify first run snapshot is unchanged
    assets1_after = db_session.query(AssessmentRunAsset).filter(AssessmentRunAsset.assessment_run_id == run1.id).all()
    assert [a.value for a in assets1_after] == asset_vals1

    # Verify second run snapshot contains both IPs
    run2 = runs2[1]
    assets2 = db_session.query(AssessmentRunAsset).filter(AssessmentRunAsset.assessment_run_id == run2.id).all()
    asset_vals2 = [a.value for a in assets2]
    assert "10.0.0.2" in asset_vals2
    assert len(assets2) > len(assets1)


def test_existing_current_state_apis_unaffected(auth_client, test_target):
    # Current state endpoints must continue to return 200
    assert auth_client.get(f"/api/v1/targets/{test_target.id}").status_code == 200
    assert auth_client.get(f"/api/v1/targets/{test_target.id}/assets").status_code == 200
    assert auth_client.get(f"/api/v1/targets/{test_target.id}/technologies").status_code == 200
    assert auth_client.get(f"/api/v1/targets/{test_target.id}/evidence").status_code == 200
    assert auth_client.get(f"/api/v1/targets/{test_target.id}/findings").status_code == 200
    assert auth_client.get(f"/api/v1/targets/{test_target.id}/exposure-signals").status_code == 200
    assert auth_client.get(f"/api/v1/targets/{test_target.id}/risk").status_code == 200
