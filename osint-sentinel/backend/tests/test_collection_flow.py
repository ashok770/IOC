from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from collectors.base import CollectorResult, CollectorExecutionReport
from collectors.domain_collector import DomainCollectionResult


def test_full_collection_and_evidence_flow(client: TestClient):
    # 1. Register an authorized target
    reg_res = client.post(
        "/api/v1/targets",
        json={"primary_domain": "defensive-assessment.org", "organization_name": "Defensive Labs"},
    )
    assert reg_res.status_code == 201
    target = reg_res.json()
    target_id = target["id"]
    assert target["assessment_status"] == "pending"

    # 2. Prepare mock collection results
    mock_results = [
        CollectorResult(
            evidence_type="dns_record",
            source="DNS",
            data={"domain": "defensive-assessment.org", "record_type": "A", "address": "1.2.3.4"},
            confidence=1.0,
        ),
        CollectorResult(
            evidence_type="dns_record",
            source="DNS",
            data={
                "domain": "defensive-assessment.org",
                "record_type": "MX",
                "preference": 10,
                "exchange": "aspmx.l.google.com",
            },
            confidence=1.0,
        ),
        CollectorResult(
            evidence_type="dns_record",
            source="DNS",
            data={
                "domain": "defensive-assessment.org",
                "record_type": "NS",
                "target": "ns1.cloudflare.com",
            },
            confidence=1.0,
        ),
        CollectorResult(
            evidence_type="rdap_registration",
            source="RDAP",
            source_url="https://rdap.org/domain/defensive-assessment.org",
            data={
                "domain": "defensive-assessment.org",
                "registrar": "MarkMonitor Inc.",
                "created_date": "2015-05-01T00:00:00Z",
                "expiration_date": "2028-05-01T00:00:00Z",
            },
            confidence=1.0,
        ),
        CollectorResult(
            evidence_type="certificate_hostnames",
            source="crt.sh",
            source_url="https://crt.sh/?q=%.defensive-assessment.org",
            data={
                "domain": "defensive-assessment.org",
                "discovered_hostnames": ["defensive-assessment.org", "api.defensive-assessment.org"],
                "total_discovered": 2,
            },
            confidence=1.0,
        ),
    ]

    mock_collection_result = DomainCollectionResult(
        domain="defensive-assessment.org",
        sources_status={
            "dns": "success",
            "rdap": "success",
            "certificate_transparency": "success",
        },
        evidence_results=mock_results,
        reports={
            "dns": CollectorExecutionReport(source_name="dns", status="success", results=mock_results[:3]),
            "rdap": CollectorExecutionReport(source_name="rdap", status="success", results=[mock_results[3]]),
            "certificate_transparency": CollectorExecutionReport(
                source_name="certificate_transparency",
                status="success",
                results=[mock_results[4]],
            ),
        },
    )

    with patch(
        "collectors.domain_collector.DomainIntelligenceCollector.collect",
        new=AsyncMock(return_value=mock_collection_result),
    ):
        # 3. Trigger collection endpoint
        collect_res = client.post(f"/api/v1/targets/{target_id}/collect/domain")
        assert collect_res.status_code == 200
        summary = collect_res.json()
        assert summary["target_id"] == target_id
        assert summary["status"] == "completed"
        assert summary["evidence_items_created"] == 5
        assert summary["findings_created"] >= 4
        assert summary["sources"]["dns"] == "success"

    # 4. Verify target status updated
    target_res = client.get(f"/api/v1/targets/{target_id}")
    assert target_res.json()["assessment_status"] == "completed"

    # 5. Query all evidence items
    ev_res = client.get(f"/api/v1/targets/{target_id}/evidence")
    assert ev_res.status_code == 200
    ev_data = ev_res.json()
    assert ev_data["total"] == 5
    assert len(ev_data["items"]) == 5

    # 6. Query filtered evidence by evidence_type
    dns_filter_res = client.get(f"/api/v1/targets/{target_id}/evidence?evidence_type=dns_record")
    assert dns_filter_res.status_code == 200
    dns_data = dns_filter_res.json()
    assert dns_data["total"] == 3
    for item in dns_data["items"]:
        assert item["evidence_type"] == "dns_record"

    rdap_filter_res = client.get(f"/api/v1/targets/{target_id}/evidence?evidence_type=rdap_registration")
    assert rdap_filter_res.status_code == 200
    assert rdap_filter_res.json()["total"] == 1

    # 7. Query generated factual findings
    findings_res = client.get(f"/api/v1/targets/{target_id}/findings")
    assert findings_res.status_code == 200
    findings_data = findings_res.json()
    assert findings_data["total"] >= 4

    categories = [f["category"] for f in findings_data["items"]]
    assert "dns" in categories
    assert "mail" in categories
    assert "infrastructure" in categories

    # All findings must be factual 'info' observations
    for f in findings_data["items"]:
        assert f["severity"] == "info"
        assert f["confidence"] == 1.0


def test_collection_target_not_found(client: TestClient):
    res = client.post("/api/v1/targets/non-existent-uuid/collect/domain")
    assert res.status_code == 404


def test_collection_partial_failure_handling(client: TestClient):
    # Register target
    reg_res = client.post(
        "/api/v1/targets",
        json={"primary_domain": "partial-target.org"},
    )
    target_id = reg_res.json()["id"]

    mock_collection_result = DomainCollectionResult(
        domain="partial-target.org",
        sources_status={
            "dns": "success",
            "rdap": "failed",
            "certificate_transparency": "success",
        },
        evidence_results=[
            CollectorResult(
                evidence_type="dns_record",
                source="DNS",
                data={"domain": "partial-target.org", "record_type": "A", "address": "1.1.1.1"},
                confidence=1.0,
            )
        ],
        reports={},
    )

    with patch(
        "collectors.domain_collector.DomainIntelligenceCollector.collect",
        new=AsyncMock(return_value=mock_collection_result),
    ):
        res = client.post(f"/api/v1/targets/{target_id}/collect/domain")
        assert res.status_code == 200
        summary = res.json()
        assert summary["status"] == "partial"
        assert summary["sources"]["rdap"] == "failed"
        assert summary["sources"]["dns"] == "success"
        assert summary["evidence_items_created"] == 1
