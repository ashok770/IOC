from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.target import Target
from app.models.evidence import EvidenceItem
from app.services.asset_service import AssetService


def test_asset_inventory_extraction(db_session: Session):
    # 1. Create target
    target = Target(primary_domain="cybercorp.org", name="CyberCorp")
    db_session.add(target)
    db_session.commit()
    db_session.refresh(target)

    # 2. Add mock evidence items
    ev_a = EvidenceItem(
        target_id=target.id,
        evidence_type="dns_record",
        source="DNS",
        data={"domain": "cybercorp.org", "record_type": "A", "address": "198.51.100.1"},
        confidence=1.0,
    )
    ev_mx = EvidenceItem(
        target_id=target.id,
        evidence_type="dns_record",
        source="DNS",
        data={"domain": "cybercorp.org", "record_type": "MX", "exchange": "mail.cybercorp.org"},
        confidence=1.0,
    )
    ev_ct = EvidenceItem(
        target_id=target.id,
        evidence_type="certificate_hostnames",
        source="crt.sh",
        data={
            "domain": "cybercorp.org",
            "discovered_hostnames": ["cybercorp.org", "api.cybercorp.org", "auth.cybercorp.org"],
        },
        confidence=1.0,
    )
    db_session.add_all([ev_a, ev_mx, ev_ct])
    db_session.commit()
    for ev in [ev_a, ev_mx, ev_ct]:
        db_session.refresh(ev)

    # 3. Extract and sync assets
    assets = AssetService.extract_and_sync_assets(
        db=db_session,
        target=target,
        evidence_items=[ev_a, ev_mx, ev_ct],
    )

    # Assets expected:
    # 1. domain: cybercorp.org
    # 2. ip: 198.51.100.1
    # 3. subdomain: mail.cybercorp.org
    # 4. certificate_associated_hostname: api.cybercorp.org
    # 5. certificate_associated_hostname: auth.cybercorp.org
    assert len(assets) == 5

    asset_types = {a.asset_type for a in assets}
    assert "domain" in asset_types
    assert "ip" in asset_types
    assert "subdomain" in asset_types
    assert "certificate_associated_hostname" in asset_types

    # 4. Deduplication / idempotency check
    assets_pass_2 = AssetService.extract_and_sync_assets(
        db=db_session,
        target=target,
        evidence_items=[ev_a, ev_mx, ev_ct],
    )
    # Total count in database should remain 5
    items, total = AssetService.list_assets(db=db_session, target_id=target.id)
    assert total == 5


def test_assets_api_endpoints(client: TestClient):
    # 1. Register target
    res = client.post(
        "/api/v1/targets",
        json={"primary_domain": "asset-test.org", "organization_name": "Asset Test Org"},
    )
    target_id = res.json()["id"]

    # 2. Query assets initially (should contain the primary domain asset)
    res_initial = client.get(f"/api/v1/targets/{target_id}/assets")
    assert res_initial.status_code == 200
    assert res_initial.json()["total"] == 0

    # 3. Run mock collection to populate assets
    from unittest.mock import patch, AsyncMock
    from collectors.base import CollectorResult
    from collectors.domain_collector import DomainCollectionResult

    mock_evidence = [
        CollectorResult(
            evidence_type="dns_record",
            source="DNS",
            data={"domain": "asset-test.org", "record_type": "A", "address": "203.0.113.10"},
            confidence=1.0,
        ),
        CollectorResult(
            evidence_type="certificate_hostnames",
            source="crt.sh",
            data={
                "domain": "asset-test.org",
                "discovered_hostnames": ["portal.asset-test.org"],
            },
            confidence=1.0,
        ),
    ]

    mock_collection_result = DomainCollectionResult(
        domain="asset-test.org",
        sources_status={"dns": "success", "rdap": "success", "certificate_transparency": "success"},
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
        assert summary["assets_discovered"] >= 3

    # 4. List all assets for target
    list_res = client.get(f"/api/v1/targets/{target_id}/assets")
    assert list_res.status_code == 200
    assets_data = list_res.json()
    assert assets_data["total"] >= 3
    values = [a["value"] for a in assets_data["items"]]
    assert "asset-test.org" in values
    assert "203.0.113.10" in values
    assert "portal.asset-test.org" in values

    # 5. Filter assets by type: ip
    ip_res = client.get(f"/api/v1/targets/{target_id}/assets?asset_type=ip")
    assert ip_res.status_code == 200
    ip_data = ip_res.json()
    assert ip_data["total"] == 1
    assert ip_data["items"][0]["value"] == "203.0.113.10"
    assert ip_data["items"][0]["asset_type"] == "ip"

    # 6. Retrieve single asset by ID
    first_asset_id = ip_data["items"][0]["id"]
    single_res = client.get(f"/api/v1/targets/{target_id}/assets/{first_asset_id}")
    assert single_res.status_code == 200
    assert single_res.json()["id"] == first_asset_id
    assert single_res.json()["value"] == "203.0.113.10"
