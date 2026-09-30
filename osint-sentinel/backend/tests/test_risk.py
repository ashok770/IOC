import uuid
from datetime import datetime, timezone
import pytest
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from app.models.target import Target
from app.models.asset import Asset
from app.models.evidence import EvidenceItem
from app.models.technology import Technology
from app.models.relationship import Relationship
from app.models.exposure_signal import ExposureSignal
from app.models.risk_assessment import RiskAssessment, AssetRiskScore
from risk.scorer import DeterministicRiskScorer, _normalize_tech_family
from app.services.risk_service import RiskService


# ==============================================================================
# 1. Deterministic Engine Unit Tests
# ==============================================================================

def test_risk_scorer_deterministic_and_repeatable(db_session: Session):
    """Verify that scoring is strictly deterministic, explainable, and produces identical results."""
    target = Target(
        id=str(uuid.uuid4()),
        primary_domain="secure-corp.org",
        assessment_status="completed",
    )
    db_session.add(target)
    db_session.commit()

    asset_main = Asset(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_type="domain",
        value="secure-corp.org",
        source="target_registration",
    )
    db_session.add(asset_main)
    db_session.commit()

    # Evidence with strict SPF and strict DMARC
    dns_evidence = EvidenceItem(
        id=str(uuid.uuid4()),
        target_id=target.id,
        evidence_type="dns_record",
        source="DNS",
        collected_at=datetime.now(timezone.utc),
        data={
            "TXT": [
                "v=spf1 include:_spf.google.com -all",
                "v=DMARC1; p=reject; rua=mailto:dmarc@secure-corp.org",
            ]
        },
        confidence=1.0,
    )
    db_session.add(dns_evidence)
    db_session.commit()

    # Run 1
    result_1 = DeterministicRiskScorer.evaluate(
        target=target,
        assets=[asset_main],
        evidence_items=[dns_evidence],
        technologies=[],
        relationships=[],
        exposure_signals=[],
    )

    # Run 2
    result_2 = DeterministicRiskScorer.evaluate(
        target=target,
        assets=[asset_main],
        evidence_items=[dns_evidence],
        technologies=[],
        relationships=[],
        exposure_signals=[],
    )

    # Determinism assertion
    assert result_1.overall_score == result_2.overall_score
    assert result_1.risk_level == result_2.risk_level
    assert result_1.factors_breakdown == result_2.factors_breakdown

    # With strict SPF & DMARC and no exposures, score should be low (0.0 email penalty)
    assert result_1.factors_breakdown["email_defense_posture"] == 0.0
    assert result_1.overall_score == 0.0
    assert result_1.risk_level == "low"


def test_email_defense_verified_absence_penalties(db_session: Session):
    """
    Verify missing SPF and missing DMARC penalties when authoritative DNS queries
    were executed and confirmed absence.
    """
    target = Target(
        id=str(uuid.uuid4()),
        primary_domain="insecure-mail.org",
    )
    db_session.add(target)
    db_session.commit()

    asset = Asset(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_type="domain",
        value="insecure-mail.org",
        source="target_registration",
    )
    db_session.add(asset)
    db_session.commit()

    # Evidence: Apex TXT queried with no SPF, and _dmarc queried with no_record
    spf_evidence = EvidenceItem(
        id=str(uuid.uuid4()),
        target_id=target.id,
        evidence_type="dns_record",
        source="DNS",
        collected_at=datetime.now(timezone.utc),
        data={"domain": "insecure-mail.org", "record_type": "TXT", "value": "random-token=abc123xyz"},
        confidence=1.0,
    )
    dmarc_evidence = EvidenceItem(
        id=str(uuid.uuid4()),
        target_id=target.id,
        evidence_type="dns_record",
        source="DNS",
        collected_at=datetime.now(timezone.utc),
        data={"domain": "_dmarc.insecure-mail.org", "record_type": "TXT", "status": "no_record", "query_performed": True},
        confidence=1.0,
    )
    db_session.add_all([spf_evidence, dmarc_evidence])
    db_session.commit()

    result = DeterministicRiskScorer.evaluate(
        target=target,
        assets=[asset],
        evidence_items=[spf_evidence, dmarc_evidence],
        technologies=[],
        relationships=[],
        exposure_signals=[],
    )

    # Missing SPF (15.0) + Missing DMARC (15.0) = 30.0 pts in email_defense_posture
    assert result.factors_breakdown["email_defense_posture"] == 30.0
    assert result.overall_score >= 30.0
    assert result.risk_level == "medium"

    recs = {r["title"] for r in result.recommendations}
    assert "Missing SPF Record" in recs
    assert "Missing DMARC Policy" in recs


def test_dns_lookup_failure_does_not_penalize_spf_or_dmarc(db_session: Session):
    """
    CRITICAL AUDIT REQUIREMENT:
    DNS lookup failed != SPF missing
    Collection incomplete != DMARC missing
    If DNS queries were not executed or failed, DO NOT apply negative penalties!
    """
    target = Target(
        id=str(uuid.uuid4()),
        primary_domain="offline-query.org",
    )
    db_session.add(target)
    db_session.commit()

    asset = Asset(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_type="domain",
        value="offline-query.org",
        source="target_registration",
    )
    db_session.add(asset)
    db_session.commit()

    # NO DNS evidence (collector failed or timed out)
    result = DeterministicRiskScorer.evaluate(
        target=target,
        assets=[asset],
        evidence_items=[],
        technologies=[],
        relationships=[],
        exposure_signals=[],
    )

    # CRITICAL: Since DNS collection failed/was absent, email defense posture penalty MUST be 0.0!
    assert result.factors_breakdown["email_defense_posture"] == 0.0
    assert result.overall_score == 0.0
    assert result.risk_level == "low"
    recs = {r["title"] for r in result.recommendations}
    assert "Missing SPF Record" not in recs
    assert "Missing DMARC Policy" not in recs


def test_technology_vendor_deduplication_and_bounded_aggregation(db_session: Session):
    """
    AUDIT REQUIREMENT:
    Verify that multiple technology detections from the same vendor (e.g. Cloudflare + Cloudflare Server)
    are deduplicated, and that an asset with many technologies cannot artificially accumulate
    unlimited penalties to reach P1_urgent.
    """
    target = Target(
        id=str(uuid.uuid4()),
        primary_domain="tech-heavy.org",
    )
    db_session.add(target)
    db_session.commit()

    asset = Asset(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_type="domain",
        value="tech-heavy.org",
        source="target_registration",
    )
    db_session.add(asset)
    db_session.commit()

    # Same vendor family: "Cloudflare" and "Cloudflare Server"
    t1 = Technology(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_id=asset.id,
        name="Cloudflare",
        category="cdn",
        detection_method="response_header",
        confidence=0.95,
    )
    t2 = Technology(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_id=asset.id,
        name="Cloudflare Server",
        category="cdn",
        detection_method="response_header",
        confidence=0.95,
    )
    # Distinct technologies
    t3 = Technology(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_id=asset.id,
        name="Nginx",
        version="1.24.0",
        category="web_server",
        detection_method="response_header",
        confidence=0.95,
    )
    t4 = Technology(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_id=asset.id,
        name="PHP",
        version="8.2.10",
        category="framework",
        detection_method="response_header",
        confidence=0.95,
    )
    t5 = Technology(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_id=asset.id,
        name="WordPress",
        category="cms",
        detection_method="response_header",
        confidence=0.9,
    )
    db_session.add_all([t1, t2, t3, t4, t5])
    db_session.commit()

    result = DeterministicRiskScorer.evaluate(
        target=target,
        assets=[asset],
        evidence_items=[],
        technologies=[t1, t2, t3, t4, t5],
        relationships=[],
        exposure_signals=[],
    )

    # 1. Target level technology exposure is capped at max 20.0
    assert result.factors_breakdown["technology_disclosure"] <= 20.0

    # 2. Asset level technology contribution is capped at max 20.0
    asset_p = result.asset_priorities[0]
    tech_contributions = [f for f in asset_p.contributing_factors if f["factor"] == "disclosed_software_stack"]
    total_tech_impact = sum(f["score_impact"] for f in tech_contributions)
    assert total_tech_impact <= 20.0

    # 3. Base domain (10) + tech capped (20) = 30.0 -> Priority must be P3_medium, NOT P1_urgent!
    assert asset_p.priority_score <= 35.0
    assert asset_p.priority_level == "p3_medium"
    assert asset_p.priority_level != "p1_urgent"


def test_perimeter_exposure_and_asset_prioritization(db_session: Session):
    """Verify perimeter exposure scoring and asset prioritization (P1 for remote access, P2 for dev)."""
    target = Target(
        id=str(uuid.uuid4()),
        primary_domain="enterprise.org",
    )
    db_session.add(target)
    db_session.commit()

    vpn_asset = Asset(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_type="subdomain",
        value="vpn.enterprise.org",
        source="DNS",
    )
    dev_asset = Asset(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_type="subdomain",
        value="dev.enterprise.org",
        source="DNS",
    )
    static_asset = Asset(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_type="subdomain",
        value="static.enterprise.org",
        source="DNS",
    )
    db_session.add_all([vpn_asset, dev_asset, static_asset])
    db_session.commit()

    vpn_signal = ExposureSignal(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_id=vpn_asset.id,
        signal_type="remote_access_indicator",
        category="perimeter_surface",
        title="Potential remote-access infrastructure identified",
        description="Publicly identifiable remote-access hostname",
        severity="info",
        confidence=0.85,
    )
    dev_signal = ExposureSignal(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_id=dev_asset.id,
        signal_type="development_test_indicator",
        category="non_production_exposure",
        title="Development/testing hostname publicly identifiable",
        description="Publicly identifiable staging hostname",
        severity="info",
        confidence=0.85,
    )
    db_session.add_all([vpn_signal, dev_signal])
    db_session.commit()

    result = DeterministicRiskScorer.evaluate(
        target=target,
        assets=[vpn_asset, dev_asset, static_asset],
        evidence_items=[],
        technologies=[],
        relationships=[],
        exposure_signals=[vpn_signal, dev_signal],
    )

    assert result.factors_breakdown["perimeter_exposure"] == 35.0

    priorities = {p.asset_id: p for p in result.asset_priorities}
    # VPN portal reaches >= 65.0, correctly prioritized as urgent/high
    assert priorities[vpn_asset.id].priority_score >= 65.0
    assert priorities[vpn_asset.id].priority_level in ("p1_urgent", "p2_high")
    assert priorities[dev_asset.id].priority_score >= 45.0
    assert priorities[dev_asset.id].priority_level == "p2_high"
    assert priorities[static_asset.id].priority_level == "p4_low"


def test_cross_target_isolation(db_session: Session):
    """
    AUDIT REQUIREMENT:
    Target A's score must NEVER include Target B's observations or assets.
    """
    target_a = Target(id=str(uuid.uuid4()), primary_domain="target-a.org")
    target_b = Target(id=str(uuid.uuid4()), primary_domain="target-b.org")
    db_session.add_all([target_a, target_b])
    db_session.commit()

    # Target A has a high-exposure VPN asset and signal
    asset_a = Asset(
        id=str(uuid.uuid4()),
        target_id=target_a.id,
        asset_type="subdomain",
        value="vpn.target-a.org",
        source="DNS",
    )
    sig_a = ExposureSignal(
        id=str(uuid.uuid4()),
        target_id=target_a.id,
        asset_id=asset_a.id,
        signal_type="remote_access_indicator",
        category="perimeter_surface",
        title="VPN Gateway",
        description="Observed",
        severity="info",
        confidence=0.9,
    )
    db_session.add_all([asset_a, sig_a])

    # Target B is completely clean (only apex domain)
    asset_b = Asset(
        id=str(uuid.uuid4()),
        target_id=target_b.id,
        asset_type="domain",
        value="target-b.org",
        source="target_registration",
    )
    db_session.add(asset_b)
    db_session.commit()

    # Compute risk for Target A and Target B via RiskService
    assessment_a = RiskService.compute_and_save_target_risk(db=db_session, target_id=target_a.id)
    assessment_b = RiskService.compute_and_save_target_risk(db=db_session, target_id=target_b.id)

    # Assert Target A has perimeter exposure
    assert assessment_a.factors_breakdown["perimeter_exposure"] == 20.0

    # CRITICAL: Target B MUST have 0.0 perimeter exposure (no bleed from Target A)
    assert assessment_b.factors_breakdown["perimeter_exposure"] == 0.0
    assert assessment_b.overall_score == 0.0
    assert assessment_b.risk_level == "low"

    # Verify asset priorities for Target B contain only Target B assets
    priorities_b, total_b = RiskService.list_asset_priorities(db=db_session, target_id=target_b.id)
    assert total_b == 1
    assert priorities_b[0]["asset_id"] == asset_b.id
    assert priorities_b[0]["asset_value"] == "target-b.org"


def test_repeated_collection_score_stability(db_session: Session):
    """
    AUDIT REQUIREMENT:
    Repeated risk computation against unchanged evidence must produce stable scores
    and no duplicate rows.
    """
    target = Target(id=str(uuid.uuid4()), primary_domain="stable-corp.org")
    db_session.add(target)
    db_session.commit()

    asset = Asset(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_type="domain",
        value="stable-corp.org",
        source="target_registration",
    )
    db_session.add(asset)
    db_session.commit()

    assessment_run1 = RiskService.compute_and_save_target_risk(db=db_session, target_id=target.id)
    score1 = assessment_run1.overall_score

    assessment_run2 = RiskService.compute_and_save_target_risk(db=db_session, target_id=target.id)
    score2 = assessment_run2.overall_score

    assert score1 == score2
    assert assessment_run1.id == assessment_run2.id

    # Verify no duplicate AssetRiskScore rows
    score_rows = db_session.query(AssetRiskScore).filter(AssetRiskScore.target_id == target.id).all()
    assert len(score_rows) == 1


# ==============================================================================
# 2. REST API Integration Tests
# ==============================================================================

def test_risk_assessment_apis(client: TestClient, db_session: Session):
    """
    Test Phase 6 REST API endpoints:
    - GET /api/v1/targets/{target_id}/risk
    - GET /api/v1/targets/{target_id}/risk/assets
    - GET /api/v1/assets/{asset_id}/risk
    - GET /api/v1/targets/{target_id}/analysis/summary
    """
    create_resp = client.post("/api/v1/targets", json={"primary_domain": "audit-api-test.org"})
    assert create_resp.status_code == 201
    target_id = create_resp.json()["id"]

    asset = Asset(
        id=str(uuid.uuid4()),
        target_id=target_id,
        asset_type="subdomain",
        value="vpn.audit-api-test.org",
        source="DNS",
    )
    db_session.add(asset)
    db_session.commit()

    signal = ExposureSignal(
        id=str(uuid.uuid4()),
        target_id=target_id,
        asset_id=asset.id,
        signal_type="remote_access_indicator",
        category="perimeter_surface",
        title="Potential remote-access infrastructure identified",
        description="Publicly identifiable remote-access hostname",
        severity="info",
        confidence=0.85,
    )
    db_session.add(signal)
    db_session.commit()

    # 1. GET /api/v1/targets/{target_id}/risk
    risk_resp = client.get(f"/api/v1/targets/{target_id}/risk")
    assert risk_resp.status_code == 200
    risk_data = risk_resp.json()
    assert risk_data["target_id"] == target_id
    assert "overall_score" in risk_data
    assert "risk_level" in risk_data
    assert "factors_breakdown" in risk_data
    assert len(risk_data["recommendations"]) >= 1

    # 2. GET /api/v1/targets/{target_id}/risk/assets
    assets_risk_resp = client.get(f"/api/v1/targets/{target_id}/risk/assets")
    assert assets_risk_resp.status_code == 200
    assets_risk_data = assets_risk_resp.json()
    assert assets_risk_data["total"] >= 1
    assert assets_risk_data["items"][0]["asset_id"] == asset.id
    assert assets_risk_data["items"][0]["asset_value"] == "vpn.audit-api-test.org"
    assert assets_risk_data["items"][0]["priority_score"] >= 50.0

    # 3. GET /api/v1/assets/{asset_id}/risk
    single_asset_risk_resp = client.get(f"/api/v1/assets/{asset.id}/risk")
    assert single_asset_risk_resp.status_code == 200
    single_data = single_asset_risk_resp.json()
    assert single_data["asset_id"] == asset.id
    assert single_data["asset_value"] == "vpn.audit-api-test.org"
    assert len(single_data["contributing_factors"]) >= 1

    # 4. GET /api/v1/targets/{target_id}/analysis/summary
    summary_resp = client.get(f"/api/v1/targets/{target_id}/analysis/summary")
    assert summary_resp.status_code == 200
    summary_data = summary_resp.json()
    assert summary_data["overall_risk_score"] is not None
    assert summary_data["risk_level"] is not None
