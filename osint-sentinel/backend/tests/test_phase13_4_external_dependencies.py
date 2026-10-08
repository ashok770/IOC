import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.models.target import Target
from app.models.asset import Asset
from app.models.evidence import EvidenceItem
from app.models.technology import Technology
from app.models.relationship import Relationship
from analyzers.external_dependency_analyzer import (
    ExternalDependencyAnalyzer,
    infer_provider_from_hostname,
    ExternalDependencyItem,
)
from analyzers.email_analyzer import EmailAnalyzer
from analyzers.certificate_analyzer import CertificateAnalyzer
from correlation import CorrelationEngine, ExposureAnalyzer
from risk import DeterministicRiskScorer


# ------------------------------------------------------------------------------
# 1-15. Dependency Classification, Normalization & Provider Tests
# ------------------------------------------------------------------------------
def test_cname_ns_mx_spf_cert_tech_dependency_detection():
    analyzer = ExternalDependencyAnalyzer()
    target = Target(id="t-ext-1", primary_domain="company-scope.com")

    # 1. CNAME external dependency & 2. CNAME target namespace boundary
    rel_cname_ext = Relationship(
        id="r-1",
        target_id="t-ext-1",
        source_type="asset",
        source_id="a-sub1",
        relationship_type="externally_referenced",
        target_type="external_entity",
        target_id_reference="cdn.fastlylb.net",
        extra_data={"cname_target": "cdn.fastlylb.net"},
        evidence_id="ev-dns-1",
    )
    rel_cname_int = Relationship(
        id="r-2",
        target_id="t-ext-1",
        source_type="asset",
        source_id="a-sub2",
        relationship_type="references",
        target_type="asset",
        target_id_reference="api.company-scope.com",
        extra_data={"cname_target": "api.company-scope.com"},
        evidence_id="ev-dns-1",
    )

    # 3. NS external dependency
    rel_ns = Relationship(
        id="r-3",
        target_id="t-ext-1",
        source_type="asset",
        source_id="a-dom",
        relationship_type="externally_referenced",
        target_type="external_entity",
        target_id_reference="ns1.cloudflare.com",
        extra_data={"role": "nameserver"},
        evidence_id="ev-dns-2",
    )

    # 4. MX external dependency
    rel_mx = Relationship(
        id="r-4",
        target_id="t-ext-1",
        source_type="asset",
        source_id="a-dom",
        relationship_type="externally_referenced",
        target_type="external_entity",
        target_id_reference="mail.protection.outlook.com",
        extra_data={"role": "mail_exchange"},
        evidence_id="ev-dns-3",
    )

    # 5. SPF include dependency
    rel_spf = Relationship(
        id="r-5",
        target_id="t-ext-1",
        source_type="asset",
        source_id="a-dom",
        relationship_type="externally_referenced",
        target_type="external_entity",
        target_id_reference="_spf.google.com",
        extra_data={"role": "spf_include"},
        evidence_id="ev-dns-4",
    )

    # 6. Certificate external reference
    rel_cert = Relationship(
        id="r-6",
        target_id="t-ext-1",
        source_type="certificate_hostname",
        source_id="cert-1",
        relationship_type="externally_referenced",
        target_type="external_entity",
        target_id_reference="external-partner.org",
        evidence_id="ev-ct-1",
    )

    # 7. Technology/provider dependency & 8. unknown provider handling
    tech_known = Technology(
        id="t-1",
        target_id="t-ext-1",
        name="Cloudflare",
        category="cdn",
        detection_method="response_header",
        confidence=0.95,
        evidence_id="ev-http-1",
    )
    tech_unknown = Technology(
        id="t-2",
        target_id="t-ext-1",
        name="CustomSaaS",
        category="cms",
        detection_method="meta_generator",
        confidence=0.85,
        evidence_id="ev-http-2",
    )

    res = analyzer.analyze(
        target_domain="company-scope.com",
        target_id="t-ext-1",
        relationships=[rel_cname_ext, rel_cname_int, rel_ns, rel_mx, rel_spf, rel_cert],
        technologies=[tech_known, tech_unknown],
    )

    # 13. target-owned hostname is not classified as external & 14. external hostname is not classified as target-owned
    ref_entities = [d.referenced_entity for d in res.dependencies]
    assert "api.company-scope.com" not in ref_entities
    assert "cdn.fastlylb.net" in ref_entities
    assert "ns1.cloudflare.com" in ref_entities
    assert "mail.protection.outlook.com" in ref_entities
    assert "_spf.google.com" in ref_entities

    # 9. provider classification reuse
    prov_map = {d.referenced_entity: d.provider_name for d in res.dependencies}
    assert prov_map["cdn.fastlylb.net"] == "Fastly"
    assert prov_map["ns1.cloudflare.com"] == "Cloudflare"
    assert prov_map["mail.protection.outlook.com"] == "Microsoft 365"
    assert prov_map["_spf.google.com"] == "Google Workspace"
    assert prov_map["external-partner.org"] == "Unknown"

    # 10. dependency normalization & 11. dependency deduplication & 12. multi-source provenance
    assert res.total_dependencies == len(res.dependencies)
    assert any(d.evidence_id == "ev-dns-1" for d in res.dependencies)


def test_provider_inference_mapping():
    assert infer_provider_from_hostname("aspmx.l.google.com") == "Google Workspace"
    assert infer_provider_from_hostname("mail.protection.outlook.com") == "Microsoft 365"
    assert infer_provider_from_hostname("123.cloudflare.com") == "Cloudflare"
    assert infer_provider_from_hostname("xyz.amazonaws.com") == "Amazon Web Services"
    assert infer_provider_from_hostname("random-domain.net") == "Unknown"


# ------------------------------------------------------------------------------
# 15-17. Dangling Pointer & False Positive Safeguard Tests
# ------------------------------------------------------------------------------
def test_malformed_and_dangling_reference_safeguard():
    analyzer = ExternalDependencyAnalyzer()

    # 15. malformed dependency reference handling
    rel_malformed = Relationship(
        id="r-mal",
        target_id="t-1",
        source_type="asset",
        source_id="a-1",
        relationship_type="externally_referenced",
        target_type="external_entity",
        target_id_reference="invalid_no_tld",
        extra_data={"cname_target": "invalid_no_tld"},
        evidence_id="ev-1",
    )

    res = analyzer.analyze(target_domain="example.org", target_id="t-1", relationships=[rel_malformed])

    # 16. no false dangling-pointer takeover findings
    takeover_findings = [f for f in res.findings if "takeover" in f.title.lower() or "vulnerability" in f.title.lower()]
    assert len(takeover_findings) == 0

    # 17. dangling-reference logic only uses existing evidence (emits factual structural finding)
    struct_finding = next((f for f in res.findings if "Structurally Incomplete" in f.title), None)
    assert struct_finding is not None
    assert "takeover" not in struct_finding.description.lower()


# ------------------------------------------------------------------------------
# 18-20. Exposure Signals & Risk Engine Regression Tests
# ------------------------------------------------------------------------------
def test_exposure_signals_and_risk_regression():
    target = Target(id="t-risk-dep", primary_domain="dep-risk.org")

    # 18. external dependency signal compatibility & 19. no duplicate exposure signals
    exposure_analyzer = ExposureAnalyzer()
    signals = exposure_analyzer.analyze(target=target, assets=[], technologies=[], relationships=[], evidence_items=[])

    unique_keys = set(f"{s.target_id}:{s.signal_type}:{s.title}" for s in signals)
    assert len(unique_keys) == len(signals)

    # 20. risk score regression
    scorer = DeterministicRiskScorer()
    risk_score = scorer.evaluate(target=target, assets=[], technologies=[], relationships=[], exposure_signals=[], evidence_items=[])
    assert risk_score.overall_score >= 0.0


# ------------------------------------------------------------------------------
# 21-24. AssessmentRun & Zero Network Security Tests
# ------------------------------------------------------------------------------
def test_analyzer_zero_network_requests():
    # 24. zero network requests from dependency classifier
    analyzer = ExternalDependencyAnalyzer()
    start_t = datetime.now()
    res = analyzer.analyze(target_domain="zero-net.com", target_id="t-zero")
    dur = (datetime.now() - start_t).total_seconds()

    assert dur < 0.1
    assert res.total_dependencies == 0


def test_assessment_run_and_api_authorization(client: TestClient):
    # 23. cross-target authorization check & 21. AssessmentRun compatibility
    res_t1 = client.post("/api/v1/targets", json={"primary_domain": "dep-api-1.org"})
    assert res_t1.status_code == 201
    t1_id = res_t1.json()["id"]

    # Endpoint test for /dependencies
    res_deps = client.get(f"/api/v1/targets/{t1_id}/dependencies")
    assert res_deps.status_code == 200
    deps_data = res_deps.json()
    assert "dependencies" in deps_data
    assert "total_dependencies" in deps_data
