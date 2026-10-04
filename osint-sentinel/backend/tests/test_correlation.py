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
from app.models.finding import Finding
from app.services.correlation_service import CorrelationService
from correlation.correlator import CorrelationEngine, is_in_target_namespace
from correlation.exposure_analyzer import ExposureAnalyzer


# ==============================================================================
# 1. Deterministic Namespace Matching & Negative Correlation Tests
# ==============================================================================

def test_namespace_matching_rules():
    """Verify strict deterministic target namespace matching rules."""
    target_domain = "example.org"

    # Positive exact match
    assert is_in_target_namespace("example.org", target_domain) is True
    assert is_in_target_namespace("EXAMPLE.ORG", target_domain) is True

    # Positive subdomain match
    assert is_in_target_namespace("sub.example.org", target_domain) is True
    assert is_in_target_namespace("deep.sub.example.org", target_domain) is True

    # Positive wildcard normalization match
    assert is_in_target_namespace("*.example.org", target_domain) is True
    assert is_in_target_namespace("*.api.example.org", target_domain) is True

    # Negative matches - MUST NOT match
    assert is_in_target_namespace("example-other.org", target_domain) is False
    assert is_in_target_namespace("notexample.org", target_domain) is False
    assert is_in_target_namespace("anotherexample.org", target_domain) is False
    assert is_in_target_namespace("example.org.evil.com", target_domain) is False
    assert is_in_target_namespace("example.com", target_domain) is False
    assert is_in_target_namespace("", target_domain) is False


# ==============================================================================
# 2. Correlation Engine Unit Tests
# ==============================================================================

def test_correlation_engine_dns_and_assets(db_session: Session):
    """
    Test CorrelationEngine:
    - Target contains Asset
    - Asset supported_by Evidence
    - Hostname resolves_to IP
    - Hostname references CNAME
    - MX / NS externally_referenced
    """
    target = Target(
        id=str(uuid.uuid4()),
        primary_domain="example.org",
        assessment_status="in_progress",
    )
    db_session.add(target)
    db_session.commit()

    # Evidence items
    dns_evidence = EvidenceItem(
        id=str(uuid.uuid4()),
        target_id=target.id,
        evidence_type="dns_record",
        source="dnspython",
        collected_at=datetime.now(timezone.utc),
        data={
            "A": ["93.184.216.34"],
            "AAAA": ["2606:2800:220:1:248:1893:25c8:1946"],
            "CNAME": ["edge.cdn-provider.net."],
            "MX": ["10 mail.example.org.", "20 alt.mail-extern.com."],
            "NS": ["ns1.externaldns.net."],
        },
        confidence=1.0,
    )
    db_session.add(dns_evidence)
    db_session.commit()

    # Discovered assets
    domain_asset = Asset(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_type="domain",
        value="example.org",
        source="DNS",
        first_evidence_id=dns_evidence.id,
    )
    ip_asset = Asset(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_type="ip",
        value="93.184.216.34",
        source="DNS",
        first_evidence_id=dns_evidence.id,
    )
    db_session.add_all([domain_asset, ip_asset])
    db_session.commit()

    engine = CorrelationEngine()
    edges = engine.correlate(
        target=target,
        assets=[domain_asset, ip_asset],
        evidence_items=[dns_evidence],
        technologies=[],
    )

    edge_types = {(e.source_id, e.relationship_type, e.target_id_reference) for e in edges}

    # Target -> contains -> Asset
    assert (target.id, "contains", domain_asset.id) in edge_types
    assert (target.id, "contains", ip_asset.id) in edge_types

    # Asset -> supported_by -> Evidence
    assert (domain_asset.id, "supported_by", dns_evidence.id) in edge_types
    assert (ip_asset.id, "supported_by", dns_evidence.id) in edge_types

    # Hostname -> resolves_to -> IP
    assert (domain_asset.id, "resolves_to", ip_asset.id) in edge_types

    # CNAME -> references -> target
    cname_edges = [
        e for e in edges
        if e.relationship_type == "references" and e.target_id_reference == "edge.cdn-provider.net"
    ]
    assert len(cname_edges) == 1
    assert cname_edges[0].confidence == 0.95

    # External NS and MX -> externally_referenced (NOT claimed as target-owned)
    ext_edges = [e for e in edges if e.relationship_type == "externally_referenced"]
    ext_targets = {e.target_id_reference for e in ext_edges}
    assert "alt.mail-extern.com" in ext_targets
    assert "ns1.externaldns.net" in ext_edges[0].target_id_reference or "ns1.externaldns.net" in ext_targets

    # Mail within namespace should NOT be flagged as external
    assert "mail.example.org" not in ext_targets


def test_certificate_transparency_correlation_and_negative_matching(db_session: Session):
    """
    Test Certificate Transparency correlation:
    - certificate_associated_with is created ONLY for assets matching target namespace
    - Negative test: example-other.org must NOT correlate to example.org
    """
    target = Target(
        id=str(uuid.uuid4()),
        primary_domain="example.org",
        assessment_status="in_progress",
    )
    db_session.add(target)
    db_session.commit()

    ct_evidence = EvidenceItem(
        id=str(uuid.uuid4()),
        target_id=target.id,
        evidence_type="certificate_transparency",
        source="crt.sh",
        collected_at=datetime.now(timezone.utc),
        data={
            "certificates": [
                {
                    "common_name": "*.example.org",
                    "dns_names": [
                        "example.org",
                        "*.example.org",
                        "api.example.org",
                        "example-other.org",  # Negative case: external domain sharing a cert
                    ],
                }
            ]
        },
        confidence=0.9,
    )
    db_session.add(ct_evidence)
    db_session.commit()

    asset_main = Asset(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_type="domain",
        value="example.org",
        source="target_registration",
    )
    asset_sub = Asset(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_type="subdomain",
        value="api.example.org",
        source="crt.sh",
    )
    db_session.add_all([asset_main, asset_sub])
    db_session.commit()

    engine = CorrelationEngine()
    edges = engine.correlate(
        target=target,
        assets=[asset_main, asset_sub],
        evidence_items=[ct_evidence],
        technologies=[],
    )

    ct_edges = [e for e in edges if e.relationship_type == "certificate_associated_with"]
    ct_pairs = {(e.source_id, e.target_id_reference) for e in ct_edges}

    # Valid associations
    assert ("api.example.org", asset_sub.id) in ct_pairs
    assert ("example.org", asset_main.id) in ct_pairs
    assert ("*.example.org", asset_main.id) in ct_pairs

    # Negative case assertion: example-other.org must NOT be associated with target asset
    assert ("example-other.org", asset_main.id) not in ct_pairs
    assert not any(e.source_id == "example-other.org" for e in ct_edges)


def test_technology_correlation(db_session: Session):
    """
    Test Technology -> Asset correlation (technology_observed_on) retaining provenance.
    """
    target = Target(
        id=str(uuid.uuid4()),
        primary_domain="example.org",
    )
    db_session.add(target)
    db_session.commit()

    asset = Asset(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_type="domain",
        value="example.org",
        source="target_registration",
    )
    db_session.add(asset)
    db_session.commit()

    evidence = EvidenceItem(
        id=str(uuid.uuid4()),
        target_id=target.id,
        evidence_type="http_headers",
        source="http_header_collector",
        collected_at=datetime.now(timezone.utc),
        data={"server": "cloudflare"},
        confidence=0.95,
    )
    db_session.add(evidence)
    db_session.commit()

    tech = Technology(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_id=asset.id,
        name="Cloudflare",
        category="cdn",
        detection_method="response_header",
        evidence_id=evidence.id,
        confidence=0.95,
    )
    db_session.add(tech)
    db_session.commit()

    engine = CorrelationEngine()
    edges = engine.correlate(
        target=target,
        assets=[asset],
        evidence_items=[evidence],
        technologies=[tech],
    )

    tech_edges = [e for e in edges if e.relationship_type == "technology_observed_on"]
    assert len(tech_edges) == 1
    assert tech_edges[0].source_id == asset.id
    assert tech_edges[0].target_id_reference == tech.id
    assert tech_edges[0].evidence_id == evidence.id


# ==============================================================================
# 3. Exposure Signals & Confidence Methodology Tests
# ==============================================================================

def test_exposure_signals_generation(db_session: Session):
    """
    Verify exposure signals generation:
    - Remote-access hostname (vpn, gateway)
    - Staging/Dev hostname (dev, staging)
    - Technology stack disclosure
    - Third-party infrastructure reference
    - All signals are strictly severity="info" (NOT vulnerabilities!)
    """
    target = Target(
        id=str(uuid.uuid4()),
        primary_domain="example.org",
    )
    db_session.add(target)
    db_session.commit()

    # Remote access asset
    vpn_asset = Asset(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_type="subdomain",
        value="vpn.example.org",
        source="DNS",
    )
    # Dev asset
    dev_asset = Asset(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_type="subdomain",
        value="dev-api.example.org",
        source="DNS",
    )
    # Regular asset
    www_asset = Asset(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_type="subdomain",
        value="www.example.org",
        source="DNS",
    )
    db_session.add_all([vpn_asset, dev_asset, www_asset])
    db_session.commit()

    # Technology on www
    tech = Technology(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_id=www_asset.id,
        name="nginx",
        version="1.24.0",
        category="web_server",
        detection_method="response_header",
        confidence=0.9,
    )
    db_session.add(tech)
    db_session.commit()

    # Relationship showing external dependency
    ext_rel = Relationship(
        id=str(uuid.uuid4()),
        target_id=target.id,
        source_type="asset",
        source_id=www_asset.id,
        relationship_type="externally_referenced",
        target_type="external_entity",
        target_id_reference="external-service.azurewebsites.net",
        confidence=0.9,
    )
    db_session.add(ext_rel)
    db_session.commit()

    analyzer = ExposureAnalyzer()
    signals = analyzer.analyze(
        target=target,
        assets=[vpn_asset, dev_asset, www_asset],
        technologies=[tech],
        relationships=[ext_rel],
    )

    signal_types = {s.signal_type for s in signals}
    assert "remote_access_indicator" in signal_types
    assert "development_test_indicator" in signal_types
    assert "technology_disclosure" in signal_types
    assert "external_dependency_reference" in signal_types

    # Guardrail Check: ALL signals must have severity="info" and moderate-to-high confidence
    for s in signals:
        assert s.severity == "info"
        assert s.confidence >= 0.70
        assert "vulnerable" not in s.title.lower()
        assert "exploit" not in s.title.lower()


def test_exposure_signals_negative_cases(db_session: Session):
    """
    Negative tests:
    - Normal production host (e.g. docs.example.org) must NOT produce remote_access or dev_test signal
    - Unsupported ownership must NOT be inferred
    """
    target = Target(
        id=str(uuid.uuid4()),
        primary_domain="example.org",
    )
    db_session.add(target)
    db_session.commit()

    prod_asset = Asset(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_type="subdomain",
        value="docs.example.org",
        source="DNS",
    )
    db_session.add(prod_asset)
    db_session.commit()

    analyzer = ExposureAnalyzer()
    signals = analyzer.analyze(
        target=target,
        assets=[prod_asset],
        technologies=[],
        relationships=[],
    )

    # Neither remote access nor dev_test should be produced
    assert len(signals) == 0


# ==============================================================================
# 4. Service & Deduplication Tests
# ==============================================================================

def test_relationship_deduplication(db_session: Session):
    """Verify that calling build_and_sync_relationships multiple times does not produce duplicate rows."""
    target = Target(
        id=str(uuid.uuid4()),
        primary_domain="example.org",
    )
    db_session.add(target)
    db_session.commit()

    asset = Asset(
        id=str(uuid.uuid4()),
        target_id=target.id,
        asset_type="domain",
        value="example.org",
        source="target_registration",
    )
    db_session.add(asset)
    db_session.commit()

    # Run 1
    rels_1 = CorrelationService.build_and_sync_relationships(
        db=db_session,
        target=target,
        assets=[asset],
        evidence_items=[],
        technologies=[],
    )
    assert len(rels_1) >= 1
    initial_count = db_session.query(Relationship).filter(Relationship.target_id == target.id).count()

    # Run 2
    rels_2 = CorrelationService.build_and_sync_relationships(
        db=db_session,
        target=target,
        assets=[asset],
        evidence_items=[],
        technologies=[],
    )
    post_count = db_session.query(Relationship).filter(Relationship.target_id == target.id).count()

    assert initial_count == post_count


# ==============================================================================
# 5. REST API Integration Tests
# ==============================================================================

def test_correlation_apis(client: TestClient, db_session: Session):
    """
    Test Phase 5 REST endpoints:
    - GET /api/v1/targets/{id}/relationships
    - GET /api/v1/assets/{id}/relationships
    - GET /api/v1/targets/{id}/exposure-signals
    - GET /api/v1/targets/{id}/analysis/summary
    """
    # 1. Create target
    create_resp = client.post("/api/v1/targets", json={"primary_domain": "corp-assessment.org"})
    assert create_resp.status_code == 201
    target_id = create_resp.json()["id"]

    target = db_session.query(Target).filter(Target.id == target_id).first()

    # 2. Add an asset
    asset = Asset(
        id=str(uuid.uuid4()),
        target_id=target_id,
        asset_type="subdomain",
        value="vpn.corp-assessment.org",
        source="DNS",
    )
    db_session.add(asset)
    db_session.commit()

    # 3. Add a technology
    tech = Technology(
        id=str(uuid.uuid4()),
        target_id=target_id,
        asset_id=asset.id,
        name="OpenVPN Access Server",
        category="vpn",
        detection_method="response_header",
        confidence=0.9,
    )
    db_session.add(tech)
    db_session.commit()

    # 4. Sync relationships & exposure signals
    CorrelationService.build_and_sync_relationships(
        db=db_session,
        target=target,
        assets=[asset],
        evidence_items=[],
        technologies=[tech],
    )
    CorrelationService.evaluate_and_sync_exposure_signals(
        db=db_session,
        target=target,
        assets=[asset],
        technologies=[tech],
        relationships=[],
    )

    # 5. Test GET /api/v1/targets/{target_id}/relationships
    rel_resp = client.get(f"/api/v1/targets/{target_id}/relationships")
    assert rel_resp.status_code == 200
    rel_data = rel_resp.json()
    assert rel_data["total"] >= 1
    assert len(rel_data["items"]) >= 1

    # Filter by relationship_type
    filtered_rel_resp = client.get(
        f"/api/v1/targets/{target_id}/relationships",
        params={"relationship_type": "contains"},
    )
    assert filtered_rel_resp.status_code == 200
    assert all(r["relationship_type"] == "contains" for r in filtered_rel_resp.json()["items"])

    # 6. Test GET /api/v1/assets/{asset_id}/relationships
    asset_rel_resp = client.get(f"/api/v1/assets/{asset.id}/relationships?target_id={target_id}")
    assert asset_rel_resp.status_code == 200
    asset_rel_data = asset_rel_resp.json()
    assert asset_rel_data["total"] >= 1

    # 7. Test GET /api/v1/targets/{target_id}/exposure-signals
    sig_resp = client.get(f"/api/v1/targets/{target_id}/exposure-signals")
    assert sig_resp.status_code == 200
    sig_data = sig_resp.json()
    assert sig_data["total"] >= 1
    # Check that VPN signal is present and severity is info
    vpn_signals = [s for s in sig_data["items"] if s["signal_type"] == "remote_access_indicator"]
    assert len(vpn_signals) == 1
    assert vpn_signals[0]["severity"] == "info"

    # 8. Test GET /api/v1/targets/{target_id}/analysis/summary
    summary_resp = client.get(f"/api/v1/targets/{target_id}/analysis/summary")
    assert summary_resp.status_code == 200
    summary_data = summary_resp.json()
    assert summary_data["target_id"] == target_id
    assert summary_data["domain"] == "corp-assessment.org"
    assert summary_data["assets"] == 1
    assert summary_data["technologies"] == 1
    assert summary_data["relationships"] >= 1
    assert summary_data["exposure_signals"] >= 1
    assert summary_data["informational_findings"] >= 1
    # Verify no risk scores or CVSS in summary
    assert "risk_score" not in summary_data
    assert "vulnerabilities" not in summary_data
