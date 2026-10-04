import pytest
import ipaddress
import asyncio
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from app.services.asset_service import AssetService
from app.models.target import Target
from app.models.asset import Asset
from app.models.evidence import EvidenceItem
from app.models.exposure_signal import ExposureSignal
from collectors.http.header_collector import HTTPHeaderCollector
from collectors.rdap.rdap_collector import RDAPCollector
from risk.scorer import DeterministicRiskScorer, AssetPriorityResult

# 1-7: Test Classification Logic Directly
def test_ip_classification():
    # Public
    assert AssetService._classify_ip("8.8.8.8") == "public"
    assert AssetService._classify_ip("2001:4860:4860::8888") == "public"
    
    # Private / Internal
    assert AssetService._classify_ip("10.10.20.15") == "private_internal"
    assert AssetService._classify_ip("192.168.1.10") == "private_internal"
    assert AssetService._classify_ip("172.16.5.5") == "private_internal"
    assert AssetService._classify_ip("fc00::1") == "private_internal" # IPv6 ULA
    
    # Loopback
    assert AssetService._classify_ip("127.0.0.1") == "loopback"
    assert AssetService._classify_ip("::1") == "loopback"
    
    # Link-local
    assert AssetService._classify_ip("169.254.1.1") == "link_local"
    
    # Multicast / Unspecified / Reserved
    assert AssetService._classify_ip("224.0.0.1") == "multicast"
    assert AssetService._classify_ip("0.0.0.0") == "unspecified"
    assert AssetService._classify_ip("240.0.0.1") == "special_reserved"


# 8 & 13: Private IP discovered through DNS is preserved as an asset/evidence and is traceable
def test_private_ip_asset_creation(db_session):
    target = Target(primary_domain="test-private.org")
    db_session.add(target)
    db_session.commit()
    db_session.refresh(target)

    # Mock DNS evidence resolving to a private IP
    evidence = EvidenceItem(
        target_id=target.id,
        evidence_type="dns_record",
        source="DNS",
        data={"record_type": "A", "address": "10.0.0.5"}
    )
    db_session.add(evidence)
    db_session.commit()
    db_session.refresh(evidence)

    cataloged = AssetService.extract_and_sync_assets(db_session, target, [evidence])
    
    # Expect 2 assets: domain and IP
    assert len(cataloged) == 2
    ip_asset = next(a for a in cataloged if a.asset_type == "ip")
    assert ip_asset.value == "10.0.0.5"
    assert ip_asset.extra_data.get("ip_classification") == "private_internal"
    assert ip_asset.first_evidence_id == evidence.id


# 9, 10, 11: Collector checks
def test_active_collection_boundary():
    # HTTP Collector
    http_collector = HTTPHeaderCollector(timeout=1.0)
    
    # 9. Private IP does NOT trigger active HTTP collection
    res = asyncio.run(http_collector.collect("10.0.0.5"))
    assert res.status == "no_data"
    assert "skipped: destination classified as private/internal" in res.error_message
    
    # RDAP Collector
    rdap_collector = RDAPCollector(timeout=1.0)
    res_rdap = asyncio.run(rdap_collector.collect("127.0.0.1"))
    assert res_rdap.status == "no_data"
    assert "skipped: destination classified as private/internal" in res_rdap.error_message

    # 10. Public IP attempts collection
    res_public = asyncio.run(http_collector.collect("8.8.8.8"))
    assert "skipped: destination classified as private/internal" not in str(res_public.error_message)


# 12. Private IP does not incorrectly increase external exposure scoring
def test_private_ip_risk_scoring(db_session):
    target = Target(primary_domain="test-risk.org")
    
    public_ip = Asset(
        target_id="tgt1", 
        asset_type="ip", 
        value="8.8.8.8", 
        extra_data={"ip_classification": "public"}
    )
    
    private_ip = Asset(
        target_id="tgt1", 
        asset_type="ip", 
        value="10.0.0.5", 
        extra_data={"ip_classification": "private_internal"}
    )
    
    # Score public IP
    priorities_public = DeterministicRiskScorer._prioritize_assets(target, [public_ip], [], [], [])
    assert len(priorities_public) == 1
    assert priorities_public[0].priority_score == 5.0 # Public IP gets +5.0

    # Score private IP
    priorities_private = DeterministicRiskScorer._prioritize_assets(target, [private_ip], [], [], [])
    assert len(priorities_private) == 1
    assert priorities_private[0].priority_score == 0.0 # Private IP gets 0.0
