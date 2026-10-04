from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.target import Target
from app.models.asset import Asset
from app.models.evidence import EvidenceItem
from app.models.technology import Technology
from app.services.technology_service import TechnologyService
from analyzers.technology import TechnologyDetector


def test_technology_detection_web_server_with_version():
    detector = TechnologyDetector()
    ev = EvidenceItem(
        id="ev-apache-1",
        target_id="tgt-1",
        evidence_type="http_headers",
        source="HTTP",
        data={
            "domain": "target.org",
            "headers": {"server": "Apache/2.4.52 (Ubuntu)"},
            "meta_generators": [],
        },
        confidence=1.0,
    )
    asset = Asset(
        id="asset-1",
        target_id="tgt-1",
        asset_type="domain",
        value="target.org",
        source="target_registration",
    )

    detected = detector.detect(evidence_items=[ev], assets=[asset])
    assert len(detected) == 1
    tech = detected[0]
    assert tech.name == "Apache HTTP Server"
    assert tech.category == "web_server"
    assert tech.version == "2.4.52"
    assert tech.confidence == 0.95
    assert tech.evidence_id == "ev-apache-1"
    assert tech.asset_id == "asset-1"


def test_technology_detection_without_version_preserves_none():
    detector = TechnologyDetector()
    ev = EvidenceItem(
        id="ev-nginx-1",
        target_id="tgt-1",
        evidence_type="http_headers",
        source="HTTP",
        data={
            "domain": "target.org",
            "headers": {"server": "nginx"},
            "meta_generators": [],
        },
        confidence=1.0,
    )
    asset = Asset(
        id="asset-1",
        target_id="tgt-1",
        asset_type="domain",
        value="target.org",
        source="target_registration",
    )

    detected = detector.detect(evidence_items=[ev], assets=[asset])
    assert len(detected) == 1
    tech = detected[0]
    assert tech.name == "Nginx"
    assert tech.version is None  # Must never guess version!
    assert tech.confidence == 0.95


def test_technology_detection_framework_and_cdn():
    detector = TechnologyDetector()
    ev = EvidenceItem(
        id="ev-cloud-1",
        target_id="tgt-1",
        evidence_type="http_headers",
        source="HTTP",
        data={
            "domain": "target.org",
            "headers": {
                "server": "cloudflare",
                "cf-ray": "82f8123a123-IAD",
                "x-powered-by": "PHP/8.1.20",
            },
            "meta_generators": [],
        },
        confidence=1.0,
    )
    asset = Asset(
        id="asset-1",
        target_id="tgt-1",
        asset_type="domain",
        value="target.org",
        source="target_registration",
    )

    detected = detector.detect(evidence_items=[ev], assets=[asset])
    names = {t.name: t for t in detected}
    assert "PHP" in names
    assert names["PHP"].version == "8.1.20"
    assert names["PHP"].category == "framework"

    assert "Cloudflare" in names
    assert names["Cloudflare"].category == "cdn"


def test_technology_detection_cms_via_meta_tag():
    detector = TechnologyDetector()
    ev = EvidenceItem(
        id="ev-cms-1",
        target_id="tgt-1",
        evidence_type="http_headers",
        source="HTTP",
        data={
            "domain": "target.org",
            "headers": {},
            "meta_generators": ["WordPress 6.4.2"],
        },
        confidence=1.0,
    )
    asset = Asset(
        id="asset-1",
        target_id="tgt-1",
        asset_type="domain",
        value="target.org",
        source="target_registration",
    )

    detected = detector.detect(evidence_items=[ev], assets=[asset])
    assert len(detected) == 1
    tech = detected[0]
    assert tech.name == "WordPress"
    assert tech.category == "cms"
    assert tech.version == "6.4.2"
    assert tech.confidence == 0.85
    assert tech.detection_method == "meta_generator"


def test_technology_unknown_insufficient_evidence():
    detector = TechnologyDetector()
    ev = EvidenceItem(
        id="ev-empty",
        target_id="tgt-1",
        evidence_type="http_headers",
        source="HTTP",
        data={
            "domain": "target.org",
            "headers": {
                "content-type": "text/html; charset=utf-8",
                "content-length": "1240",
            },
            "meta_generators": [],
        },
        confidence=1.0,
    )
    asset = Asset(
        id="asset-1",
        target_id="tgt-1",
        asset_type="domain",
        value="target.org",
        source="target_registration",
    )

    detected = detector.detect(evidence_items=[ev], assets=[asset])
    # Insufficient evidence -> Returns empty, does not guess!
    assert len(detected) == 0


def test_technology_service_persistence_and_findings(db_session: Session):
    target = Target(primary_domain="tech-corp.org", name="TechCorp")
    db_session.add(target)
    db_session.commit()
    db_session.refresh(target)

    asset = Asset(
        target_id=target.id,
        asset_type="domain",
        value="tech-corp.org",
        source="target_registration",
    )
    db_session.add(asset)
    db_session.commit()
    db_session.refresh(asset)

    ev = EvidenceItem(
        target_id=target.id,
        evidence_type="http_headers",
        source="HTTP",
        data={
            "domain": "tech-corp.org",
            "headers": {"server": "nginx/1.24.0", "x-powered-by": "Express"},
            "meta_generators": [],
        },
        confidence=1.0,
    )
    db_session.add(ev)
    db_session.commit()
    db_session.refresh(ev)

    # 1. Sync technologies
    technologies = TechnologyService.extract_and_sync_technologies(
        db=db_session,
        target=target,
        evidence_items=[ev],
        assets=[asset],
    )
    assert len(technologies) == 2

    # Check evidence linkage
    for t in technologies:
        assert t.evidence_id == ev.id
        assert t.asset_id == asset.id

    # 2. Check deduplication / idempotency
    technologies_pass_2 = TechnologyService.extract_and_sync_technologies(
        db=db_session,
        target=target,
        evidence_items=[ev],
        assets=[asset],
    )
    items, total = TechnologyService.list_target_technologies(db=db_session, target_id=target.id)
    assert total == 2


def test_technology_api_endpoints(client: TestClient):
    # 1. Register target
    res = client.post(
        "/api/v1/targets",
        json={"primary_domain": "api-tech-test.org", "organization_name": "API Tech Test"},
    )
    target_id = res.json()["id"]

    # 2. Mock collection results with HTTP headers
    from collectors.base import CollectorResult
    from collectors.domain_collector import DomainCollectionResult

    mock_evidence = [
        CollectorResult(
            evidence_type="dns_record",
            source="DNS",
            data={"domain": "api-tech-test.org", "record_type": "A", "address": "1.2.3.4"},
            confidence=1.0,
        ),
        CollectorResult(
            evidence_type="http_headers",
            source="HTTP",
            source_url="https://api-tech-test.org",
            data={
                "domain": "api-tech-test.org",
                "headers": {
                    "server": "Apache/2.4.51",
                    "x-powered-by": "PHP/8.0.12",
                    "cf-ray": "9999999",
                },
                "meta_generators": ["WordPress 6.2"],
            },
            confidence=1.0,
        ),
    ]

    mock_collection_result = DomainCollectionResult(
        domain="api-tech-test.org",
        sources_status={
            "dns": "success",
            "rdap": "success",
            "certificate_transparency": "success",
            "http_headers": "success",
        },
        evidence_results=mock_evidence,
        reports={},
    )

    with patch(
        "collectors.domain_collector.DomainIntelligenceCollector.collect",
        new=AsyncMock(return_value=mock_collection_result),
    ):
        collect_res = client.post(f"/api/v1/targets/{target_id}/collect/domain")
        assert collect_res.status_code == 200
        summary = collect_res.json()
        assert summary["technologies_discovered"] >= 3

    # 3. Query all technologies for target
    tech_res = client.get(f"/api/v1/targets/{target_id}/technologies")
    assert tech_res.status_code == 200
    tech_data = tech_res.json()
    assert tech_data["total"] >= 3
    names = [t["name"] for t in tech_data["items"]]
    assert "Apache HTTP Server" in names
    assert "PHP" in names
    assert "Cloudflare" in names

    # 4. Filter technologies by category: web_server
    web_res = client.get(f"/api/v1/targets/{target_id}/technologies?category=web_server")
    assert web_res.status_code == 200
    web_data = web_res.json()
    assert web_data["total"] == 1
    assert web_data["items"][0]["name"] == "Apache HTTP Server"
    assert web_data["items"][0]["version"] == "2.4.51"

    # 5. Query technologies by asset endpoint
    # First get the domain asset ID
    assets_res = client.get(f"/api/v1/targets/{target_id}/assets?asset_type=domain")
    asset_id = assets_res.json()["items"][0]["id"]

    asset_tech_res = client.get(f"/api/v1/assets/{asset_id}/technologies?target_id={target_id}")
    assert asset_tech_res.status_code == 200
    asset_tech_data = asset_tech_res.json()
    assert asset_tech_data["total"] >= 3
    assert asset_tech_data["asset_id"] == asset_id
    for item in asset_tech_data["items"]:
        assert item["evidence_id"] is not None  # Evidence linkage preserved!


def test_google_web_server_detection():
    detector = TechnologyDetector()
    asset = Asset(
        id="asset-g1",
        target_id="tgt-g1",
        asset_type="domain",
        value="google.com",
        source="target_registration",
    )

    # 1. Exact lowercase 'gws'
    ev_lower = EvidenceItem(
        id="ev-gws-1",
        target_id="tgt-g1",
        evidence_type="http_headers",
        source="HTTP",
        data={
            "domain": "google.com",
            "probed_url": "https://google.com",
            "headers": {"server": "gws"},
            "meta_generators": [],
        },
        confidence=1.0,
    )
    detected = detector.detect(evidence_items=[ev_lower], assets=[asset])
    assert len(detected) == 1
    assert detected[0].name == "Google Web Server"
    assert detected[0].category == "web_server"
    assert detected[0].version is None
    assert detected[0].detection_method == "response_header"
    assert detected[0].confidence == 0.95
    assert detected[0].extra_data["matched_header"] == "server"
    assert detected[0].extra_data["raw_value"] == "gws"

    # 2. Case-insensitivity: 'GWS'
    ev_upper = EvidenceItem(
        id="ev-gws-2",
        target_id="tgt-g1",
        evidence_type="http_headers",
        source="HTTP",
        data={
            "domain": "google.com",
            "headers": {"server": "GWS"},
            "meta_generators": [],
        },
        confidence=1.0,
    )
    detected_upper = detector.detect(evidence_items=[ev_upper], assets=[asset])
    assert len(detected_upper) == 1
    assert detected_upper[0].name == "Google Web Server"


def test_google_workspace_mx_detection():
    detector = TechnologyDetector()
    asset = Asset(
        id="asset-g1",
        target_id="tgt-g1",
        asset_type="domain",
        value="google.com",
        source="target_registration",
    )

    # 1. smtp.google.com
    ev_smtp = EvidenceItem(
        id="ev-mx-1",
        target_id="tgt-g1",
        evidence_type="dns_record",
        source="DNS",
        data={"domain": "google.com", "record_type": "MX", "exchange": "smtp.google.com"},
        confidence=1.0,
    )
    detected_smtp = detector.detect(evidence_items=[ev_smtp], assets=[asset])
    assert len(detected_smtp) == 1
    assert detected_smtp[0].name == "Google Workspace"
    assert detected_smtp[0].category == "email"
    assert detected_smtp[0].detection_method == "dns_mx"
    assert detected_smtp[0].confidence == 0.95

    # 2. Existing signatures: aspmx.l.google.com
    ev_aspmx = EvidenceItem(
        id="ev-mx-2",
        target_id="tgt-g1",
        evidence_type="dns_record",
        source="DNS",
        data={"domain": "google.com", "record_type": "MX", "exchange": "aspmx.l.google.com"},
        confidence=1.0,
    )
    detected_aspmx = detector.detect(evidence_items=[ev_aspmx], assets=[asset])
    assert len(detected_aspmx) == 1
    assert detected_aspmx[0].name == "Google Workspace"

    # 3. Existing signatures: googlemail.com
    ev_gmail = EvidenceItem(
        id="ev-mx-3",
        target_id="tgt-g1",
        evidence_type="dns_record",
        source="DNS",
        data={"domain": "google.com", "record_type": "MX", "exchange": "googlemail.com"},
        confidence=1.0,
    )
    detected_gmail = detector.detect(evidence_items=[ev_gmail], assets=[asset])
    assert len(detected_gmail) == 1
    assert detected_gmail[0].name == "Google Workspace"

    # 4. Case-insensitivity: SMTP.GOOGLE.COM
    ev_case = EvidenceItem(
        id="ev-mx-4",
        target_id="tgt-g1",
        evidence_type="dns_record",
        source="DNS",
        data={"domain": "google.com", "record_type": "MX", "exchange": "SMTP.GOOGLE.COM"},
        confidence=1.0,
    )
    detected_case = detector.detect(evidence_items=[ev_case], assets=[asset])
    assert len(detected_case) == 1
    assert detected_case[0].name == "Google Workspace"


def test_unrelated_values_do_not_match_google_signatures():
    detector = TechnologyDetector()
    asset = Asset(
        id="asset-g1",
        target_id="tgt-g1",
        asset_type="domain",
        value="google.com",
        source="target_registration",
    )

    # 1. Unrelated server headers (must not match Google Web Server)
    for server_val in ["nginx", "apache", "example-gws.attacker.test", "my-gws-fake"]:
        ev = EvidenceItem(
            id=f"ev-fake-{server_val}",
            target_id="tgt-g1",
            evidence_type="http_headers",
            source="HTTP",
            data={"domain": "google.com", "headers": {"server": server_val}},
            confidence=1.0,
        )
        detected = detector.detect(evidence_items=[ev], assets=[asset])
        for d in detected:
            assert d.name != "Google Web Server"

    # 2. Unrelated MX exchange (must not match Google Workspace)
    ev_fake_mx = EvidenceItem(
        id="ev-fake-mx",
        target_id="tgt-g1",
        evidence_type="dns_record",
        source="DNS",
        data={"domain": "google.com", "record_type": "MX", "exchange": "smtp.example.com"},
        confidence=1.0,
    )
    detected_mx = detector.detect(evidence_items=[ev_fake_mx], assets=[asset])
    for d in detected_mx:
        assert d.name != "Google Workspace"
