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

    asset_tech_res = client.get(f"/api/v1/assets/{asset_id}/technologies")
    assert asset_tech_res.status_code == 200
    asset_tech_data = asset_tech_res.json()
    assert asset_tech_data["total"] >= 3
    assert asset_tech_data["asset_id"] == asset_id
    for item in asset_tech_data["items"]:
        assert item["evidence_id"] is not None  # Evidence linkage preserved!
