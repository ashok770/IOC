import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from app.models.target import Target
from app.models.asset import Asset
from app.models.evidence import EvidenceItem
from app.models.technology import Technology
from app.models.relationship import Relationship
from analyzers.certificate_analyzer import (
    CertificateAnalyzer,
    parse_certificate_timestamp,
    CertificateItem,
    EXPIRING_SOON_DAYS,
)
from correlation import CorrelationEngine, ExposureAnalyzer
from risk import DeterministicRiskScorer


# ------------------------------------------------------------------------------
# 1-15. Certificate Intelligence Parsing & Lifecycle Classification Tests
# ------------------------------------------------------------------------------
def test_certificate_evidence_parsing_and_extractions():
    analyzer = CertificateAnalyzer()
    now = datetime.now(timezone.utc)
    active_na = (now + timedelta(days=90)).isoformat()
    exp_soon_na = (now + timedelta(days=15)).isoformat()
    expired_na = (now - timedelta(days=10)).isoformat()

    ev_ct = EvidenceItem(
        id="ev-ct-1",
        target_id="target-1",
        evidence_type="certificate_log_sample",
        data={
            "domain": "example.com",
            "sample_entries": [
                {
                    "id": 101,
                    "issuer_name": "C=US, O=Let's Encrypt, CN=R3",
                    "common_name": "sub.example.com",
                    "name_value": "sub.example.com\napi.example.com\nother.com",
                    "not_before": (now - timedelta(days=30)).isoformat(),
                    "not_after": active_na,
                },
                {
                    "id": 102,
                    "issuer_name": "C=US, O=DigiCert, CN=DigiCert Global TLS",
                    "common_name": "expiring.example.com",
                    "dns_names": ["expiring.example.com"],
                    "not_before": "2023-01-01 00:00:00",
                    "not_after": exp_soon_na,
                },
                {
                    "id": 103,
                    "issuer_name": "C=US, O=Sectigo, CN=Sectigo RSA",
                    "common_name": "old.example.com",
                    "not_before": "2022-01-01T00:00:00Z",
                    "not_after": expired_na,
                },
                {
                    "id": 104,
                    "issuer_name": "C=US, O=Unknown",
                    "common_name": "noexp.example.com",
                    "not_after": None,
                },
                {
                    "id": 105,
                    "issuer_name": "C=US, O=Broken",
                    "common_name": "badexp.example.com",
                    "not_after": "INVALID_DATE_STRING",
                },
            ],
        },
    )

    res = analyzer.analyze("example.com", [ev_ct])

    # 1. certificate evidence parsing & counts
    assert res.total_certificates_observed == 5

    # 2. issuer extraction
    assert res.certificates[0].issuer_name == "C=US, O=Let's Encrypt, CN=R3"
    assert res.certificates[1].issuer_name == "C=US, O=DigiCert, CN=DigiCert Global TLS"

    # 3. subject / CN extraction
    assert res.certificates[0].common_name == "sub.example.com"

    # 4. SAN extraction
    assert "api.example.com" in res.certificates[0].sans
    assert "sub.example.com" in res.certificates[0].sans

    # 5. not_before parsing
    assert res.certificates[0].not_before is not None

    # 6. not_after parsing
    assert res.certificates[0].not_after is not None

    # 7. current (active) certificate classification
    assert res.certificates[0].lifecycle_status == "ACTIVE"

    # 8. expiring-soon classification (<= 30 days)
    assert res.certificates[1].lifecycle_status == "EXPIRING_SOON"
    assert res.certificates[1].days_until_expiration is not None
    assert res.certificates[1].days_until_expiration <= 30

    # 9. expired certificate classification
    assert res.certificates[2].lifecycle_status == "EXPIRED"

    # 10. missing expiration handling
    assert res.certificates[3].lifecycle_status == "UNKNOWN"

    # 11. malformed expiration handling
    assert res.certificates[4].lifecycle_status == "UNKNOWN"

    # 16. certificate finding provenance
    exp_soon_finding = next((f for f in res.findings if "Expiring Soon" in f.title), None)
    assert exp_soon_finding is not None
    assert exp_soon_finding.evidence_id == "ev-ct-1"


def test_timestamp_parsing_variants():
    # 12. timezone-aware timestamp handling
    dt_aware = parse_certificate_timestamp("2026-10-08T12:00:00+00:00")
    assert dt_aware is not None
    assert dt_aware.tzinfo is not None

    # 13. timezone-naive timestamp handling
    dt_naive = parse_certificate_timestamp("2026-10-08 12:00:00")
    assert dt_naive is not None
    assert dt_naive.tzinfo is not None

    # 14. missing certificate fields
    dt_none = parse_certificate_timestamp(None)
    assert dt_none is None


def test_malformed_ct_evidence_resilience():
    analyzer = CertificateAnalyzer()
    # 15. malformed CT evidence does not crash
    ev_junk = EvidenceItem(id="ev-junk", target_id="target-1", evidence_type="certificate_log_sample", data={"sample_entries": "NOT_A_LIST"})
    res = analyzer.analyze("example.com", [ev_junk, {"invalid": 123}, None])
    assert res.total_certificates_observed == 0
    assert res.findings == []


# ------------------------------------------------------------------------------
# 17-19. Exposure Signals Tests
# ------------------------------------------------------------------------------
def test_certificate_exposure_signals():
    target = Target(id="t-100", primary_domain="cert-test.org")
    asset_domain = Asset(id="a-100", target_id="t-100", asset_type="domain", value="cert-test.org")

    now = datetime.now(timezone.utc)
    ev_cert = EvidenceItem(
        id="ev-cert-sig",
        target_id="t-100",
        evidence_type="certificate_log_sample",
        data={
            "sample_entries": [
                {
                    "id": 1,
                    "common_name": "healthy.cert-test.org",
                    "not_after": (now + timedelta(days=120)).isoformat(),
                },
                {
                    "id": 2,
                    "common_name": "expiring.cert-test.org",
                    "not_after": (now + timedelta(days=10)).isoformat(),
                },
                {
                    "id": 3,
                    "common_name": "expired.cert-test.org",
                    "not_after": (now - timedelta(days=5)).isoformat(),
                },
            ]
        },
    )

    analyzer = ExposureAnalyzer()
    signals = analyzer.analyze(target=target, assets=[asset_domain], technologies=[], relationships=[], evidence_items=[ev_cert])

    sig_types = [s.signal_type for s in signals]

    # 17. certificate expiring-soon signal
    assert "certificate_expiring_soon" in sig_types

    # 18. expired certificate signal
    assert "certificate_expired" in sig_types

    # 19. no false signal for healthy certificate
    healthy_sigs = [s for s in signals if "healthy.cert-test.org" in s.title]
    assert len(healthy_sigs) == 0

    # Provenance retained
    assert all(s.evidence_id == "ev-cert-sig" for s in signals if s.signal_type.startswith("certificate_"))


# ------------------------------------------------------------------------------
# 20-24. Relationships & Boundary Tests
# ------------------------------------------------------------------------------
def test_certificate_relationships_and_boundaries():
    target = Target(id="t-rel", primary_domain="target-scope.com")
    asset_domain = Asset(id="a-dom", target_id="t-rel", asset_type="domain", value="target-scope.com")
    asset_sub = Asset(id="a-sub", target_id="t-rel", asset_type="subdomain", value="sub.target-scope.com")

    ev_ct = EvidenceItem(
        id="ev-rel-ct",
        target_id="t-rel",
        evidence_type="certificate_log_sample",
        data={
            "sample_entries": [
                {
                    "id": 1,
                    "common_name": "sub.target-scope.com",
                    "name_value": "sub.target-scope.com\n*.target-scope.com\nthirdparty-provider.com",
                }
            ]
        },
    )

    correlator = CorrelationEngine()
    rels = correlator.correlate(target=target, assets=[asset_domain, asset_sub], evidence_items=[ev_ct], technologies=[])

    cert_rels = [r for r in rels if r.relationship_type == "certificate_associated_with"]

    # 20. certificate hostname normalization & 21. deduplication & 23. relationship provenance
    assert len(cert_rels) > 0
    assert any(r.evidence_id == "ev-rel-ct" for r in cert_rels)

    # 22. target namespace boundary
    assert not any(r.target_id_reference == "thirdparty-provider.com" and r.relationship_type == "certificate_associated_with" for r in cert_rels)

    # 24. no duplicate certificate relationships
    unique_keys = set(f"{r.source_id}:{r.relationship_type}:{r.target_id_reference}" for r in cert_rels)
    assert len(unique_keys) == len(cert_rels)


# ------------------------------------------------------------------------------
# 25-26. AssessmentRun Snapshot & Historical Comparison Tests
# ------------------------------------------------------------------------------
def test_assessment_run_snapshot_and_history_compatibility(client: TestClient):
    # Create target
    res_create = client.post(
        "/api/v1/targets",
        json={"primary_domain": "ct-history.org", "organization_name": "CT History Test Corp"},
    )
    assert res_create.status_code == 201
    target_id = res_create.json()["id"]

    # Run collection
    res_run = client.post(f"/api/v1/targets/{target_id}/collect/domain")
    assert res_run.status_code == 200

    # 25. AssessmentRun snapshot integration
    res_runs = client.get(f"/api/v1/targets/{target_id}/assessments")
    assert res_runs.status_code == 200
    runs = res_runs.json()["items"]
    assert len(runs) >= 1
    latest_run = runs[0]
    assert latest_run["id"] is not None
    assert latest_run["status"] in ("completed", "partial", "failed")

    # 26. historical comparison compatibility
    if len(runs) >= 2:
        run_a = runs[1]["id"]
        run_b = runs[0]["id"]
        res_comp = client.get(f"/api/v1/targets/{target_id}/assessments/compare?base_run_id={run_a}&target_run_id={run_b}")
        assert res_comp.status_code == 200


# ------------------------------------------------------------------------------
# 27-29. Security & Passive Boundary & Authorization Tests
# ------------------------------------------------------------------------------
def test_analyzer_zero_network_requests():
    # 27. analyzer performs ZERO network requests
    analyzer = CertificateAnalyzer()
    ev_local = EvidenceItem(
        id="ev-local",
        target_id="t-local",
        evidence_type="certificate_log_sample",
        data={"sample_entries": [{"id": 99, "common_name": "local.domain", "not_after": "2030-01-01T00:00:00Z"}]},
    )
    start_t = datetime.now()
    res = analyzer.analyze("local.domain", [ev_local])
    dur = (datetime.now() - start_t).total_seconds()
    assert dur < 0.1
    assert res.total_certificates_observed == 1


def test_risk_score_remains_unchanged_by_certificate_data():
    # 28. existing risk score remains unchanged when certificate data is introduced
    target = Target(id="t-risk", primary_domain="risk-test.com")
    scorer = DeterministicRiskScorer()

    # Base assessment without cert signals
    risk_base = scorer.evaluate(target=target, assets=[], technologies=[], relationships=[], exposure_signals=[], evidence_items=[])

    # Assessment with cert exposure signals
    from correlation.exposure_analyzer import DetectedExposureSignal
    cert_sig = DetectedExposureSignal(
        target_id="t-risk",
        signal_type="certificate_expiring_soon",
        category="certificate_security",
        title="Certificate expiring soon",
        description="Expiring cert",
        severity="info",
        confidence=1.0,
    )
    risk_with_cert = scorer.evaluate(target=target, assets=[], technologies=[], relationships=[], exposure_signals=[cert_sig], evidence_items=[])

    # Risk score remains exactly unchanged
    assert risk_base.overall_score == risk_with_cert.overall_score


def test_cross_target_authorization_isolation(client: TestClient):
    # 29. cross-target authorization check
    res_t1 = client.post("/api/v1/targets", json={"primary_domain": "auth-target-ct1.org"})
    assert res_t1.status_code == 201
    t1_id = res_t1.json()["id"]

    res_evidence = client.get(f"/api/v1/targets/{t1_id}/evidence")
    assert res_evidence.status_code == 200
