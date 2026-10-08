import pytest
from datetime import datetime, timedelta, timezone
from app.models.target import Target
from app.models.asset import Asset
from app.models.evidence import EvidenceItem
from app.models.technology import Technology
from app.models.relationship import Relationship
from correlation.exposure_analyzer import ExposureAnalyzer, DetectedExposureSignal


@pytest.fixture
def base_target():
    return Target(id="target_p135", primary_domain="example.com", name="Example Corp")


def test_1_remote_access_indicator_preserved(base_target):
    analyzer = ExposureAnalyzer()
    assets = [
        Asset(id="asset_1", target_id="target_p135", asset_type="subdomain", value="vpn.example.com", source="dns", first_evidence_id="ev_vpn"),
    ]
    signals = analyzer.analyze(base_target, assets, [], [])
    vpn_sig = next((s for s in signals if s.signal_type == "remote_access_indicator"), None)
    assert vpn_sig is not None
    assert vpn_sig.category == "perimeter_surface"
    assert vpn_sig.evidence_id == "ev_vpn"
    assert vpn_sig.confidence == 0.85


def test_2_development_test_indicator_preserved(base_target):
    analyzer = ExposureAnalyzer()
    assets = [
        Asset(id="asset_2", target_id="target_p135", asset_type="subdomain", value="staging.example.com", source="dns", first_evidence_id="ev_stage"),
    ]
    signals = analyzer.analyze(base_target, assets, [], [])
    dev_sig = next((s for s in signals if s.signal_type == "development_test_indicator"), None)
    assert dev_sig is not None
    assert dev_sig.category == "non_production_exposure"
    assert dev_sig.evidence_id == "ev_stage"


def test_3_technology_disclosure_preserved(base_target):
    analyzer = ExposureAnalyzer()
    techs = [
        Technology(
            id="tech_1",
            target_id="target_p135",
            asset_id="asset_dom",
            name="nginx",
            category="web_server",
            version="1.18.0",
            confidence=0.9,
            detection_method="http_header",
            evidence_id="ev_nginx",
        )
    ]
    signals = analyzer.analyze(base_target, [], techs, [])
    tech_sig = next((s for s in signals if s.signal_type == "technology_disclosure"), None)
    assert tech_sig is not None
    assert tech_sig.category == "technology_stack"
    assert tech_sig.evidence_id == "ev_nginx"
    assert tech_sig.severity == "info"


def test_4_external_dependency_reference_preserved(base_target):
    analyzer = ExposureAnalyzer()
    rels = [
        Relationship(
            id="rel_1",
            target_id="target_p135",
            source_type="asset",
            source_id="asset_dom",
            relationship_type="externally_referenced",
            target_id_reference="cloudflare",
            confidence=1.0,
            evidence_id="ev_cname",
            extra_data={"role": "cdn"},
        )
    ]
    signals = analyzer.analyze(base_target, [], [], rels)
    dep_sig = next((s for s in signals if s.signal_type == "external_dependency_reference"), None)
    assert dep_sig is not None
    assert dep_sig.category == "external_dependency"
    assert dep_sig.evidence_id == "ev_cname"


def test_5_to_9_email_security_signals_preserved(base_target):
    analyzer = ExposureAnalyzer()

    # Test missing_spf & missing_dmarc
    ev_dns_no_spf = [
        EvidenceItem(
            id="ev_dns_empty",
            target_id="target_p135",
            source="dns",
            evidence_type="dns_record",
            data={"record_type": "A", "domain": "example.com", "value": "1.2.3.4"},
        )
    ]
    signals_empty = analyzer.analyze(base_target, [], [], [], evidence_items=ev_dns_no_spf)
    sig_types_empty = [s.signal_type for s in signals_empty]
    assert "missing_spf" in sig_types_empty
    assert "missing_dmarc" in sig_types_empty

    # Test permissive_spf (+all) & non_enforcing_dmarc (p=none)
    ev_dns_permissive = [
        EvidenceItem(
            id="ev_spf_perm",
            target_id="target_p135",
            source="dns",
            evidence_type="dns_record",
            data={"record_type": "TXT", "domain": "example.com", "value": "v=spf1 +all"},
        ),
        EvidenceItem(
            id="ev_dmarc_none",
            target_id="target_p135",
            source="dns",
            evidence_type="dns_record",
            data={"record_type": "TXT", "domain": "_dmarc.example.com", "value": "v=DMARC1; p=none;"},
        ),
    ]
    signals_perm = analyzer.analyze(base_target, [], [], [], evidence_items=ev_dns_permissive)
    sig_types_perm = [s.signal_type for s in signals_perm]
    assert "permissive_spf" in sig_types_perm
    assert "non_enforcing_dmarc" in sig_types_perm

    # Test softfail_spf (~all)
    ev_dns_softfail = [
        EvidenceItem(
            id="ev_spf_soft",
            target_id="target_p135",
            source="dns",
            evidence_type="dns_record",
            data={"record_type": "TXT", "domain": "example.com", "value": "v=spf1 ~all"},
        ),
    ]
    signals_soft = analyzer.analyze(base_target, [], [], [], evidence_items=ev_dns_softfail)
    sig_types_soft = [s.signal_type for s in signals_soft]
    assert "softfail_spf" in sig_types_soft


def test_10_11_certificate_signals_preserved(base_target):
    analyzer = ExposureAnalyzer()
    now = datetime.now(timezone.utc)

    # Certificate expiring soon (15 days)
    expiring_date = (now + timedelta(days=15)).strftime("%Y-%m-%dT%H:%M:%SZ")
    ev_cert_expiring = [
        EvidenceItem(
            id="ev_cert_soon",
            target_id="target_p135",
            source="ct_logs",
            evidence_type="certificate_log_sample",
            data={
                "domain": "example.com",
                "sample_entries": [
                    {
                        "id": 101,
                        "common_name": "example.com",
                        "issuer_name": "Let's Encrypt",
                        "not_after": expiring_date,
                    }
                ],
            },
        )
    ]
    signals_soon = analyzer.analyze(base_target, [], [], [], evidence_items=ev_cert_expiring)
    assert any(s.signal_type == "certificate_expiring_soon" for s in signals_soon)

    # Certificate expired (-5 days)
    expired_date = (now - timedelta(days=5)).strftime("%Y-%m-%dT%H:%M:%SZ")
    ev_cert_expired = [
        EvidenceItem(
            id="ev_cert_exp",
            target_id="target_p135",
            source="ct_logs",
            evidence_type="certificate_log_sample",
            data={
                "domain": "example.com",
                "sample_entries": [
                    {
                        "id": 102,
                        "common_name": "example.com",
                        "issuer_name": "Let's Encrypt",
                        "not_after": expired_date,
                    }
                ],
            },
        )
    ]
    signals_exp = analyzer.analyze(base_target, [], [], [], evidence_items=ev_cert_expired)
    assert any(s.signal_type == "certificate_expired" for s in signals_exp)


def test_12_sensitive_hostname_indicator(base_target):
    analyzer = ExposureAnalyzer()
    assets = [
        Asset(id="asset_admin", target_id="target_p135", asset_type="subdomain", value="admin.example.com", source="dns", first_evidence_id="ev_admin"),
        Asset(id="asset_internal", target_id="target_p135", asset_type="subdomain", value="intranet.example.com", source="dns", first_evidence_id="ev_infra"),
    ]
    signals = analyzer.analyze(base_target, assets, [], [])
    sensitive_sigs = [s for s in signals if s.signal_type == "sensitive_hostname_indicator"]
    assert len(sensitive_sigs) == 2
    assert sensitive_sigs[0].category == "perimeter_surface"
    assert sensitive_sigs[0].severity == "info"
    assert sensitive_sigs[0].confidence == 0.80


def test_13_domain_expiration_indicator(base_target):
    analyzer = ExposureAnalyzer()
    now = datetime.now(timezone.utc)

    # Domain expiring soon (10 days)
    expiring_dt = (now + timedelta(days=10)).isoformat()
    ev_rdap_soon = [
        EvidenceItem(
            id="ev_rdap_1",
            target_id="target_p135",
            source="rdap",
            evidence_type="rdap_registration",
            data={"expiration_date": expiring_dt},
        )
    ]
    signals_soon = analyzer.analyze(base_target, [], [], [], evidence_items=ev_rdap_soon)
    assert any(s.signal_type == "domain_expiring_soon" for s in signals_soon)

    # Domain expired (-2 days)
    expired_dt = (now - timedelta(days=2)).isoformat()
    ev_rdap_expired = [
        EvidenceItem(
            id="ev_rdap_2",
            target_id="target_p135",
            source="rdap",
            evidence_type="rdap_registration",
            data={"expiration_date": expired_dt},
        )
    ]
    signals_expired = analyzer.analyze(base_target, [], [], [], evidence_items=ev_rdap_expired)
    assert any(s.signal_type == "domain_expired" for s in signals_expired)


def test_14_no_false_positives_normal_hostnames(base_target):
    analyzer = ExposureAnalyzer()
    assets = [
        Asset(id="asset_normal", target_id="target_p135", asset_type="subdomain", value="app.example.com", source="dns", first_evidence_id="ev_app"),
        Asset(id="asset_www", target_id="target_p135", asset_type="subdomain", value="www.example.com", source="dns", first_evidence_id="ev_www"),
    ]
    signals = analyzer.analyze(base_target, assets, [], [])
    hostname_sigs = [s for s in signals if s.signal_type in ("remote_access_indicator", "development_test_indicator", "sensitive_hostname_indicator")]
    assert len(hostname_sigs) == 0


def test_15_target_namespace_boundary(base_target):
    analyzer = ExposureAnalyzer()
    assets = [
        Asset(id="asset_in", target_id="target_p135", asset_type="subdomain", value="admin.example.com", source="dns"),
    ]
    signals = analyzer.analyze(base_target, assets, [], [])
    for sig in signals:
        assert sig.target_id == "target_p135"


def test_16_17_18_provenance_severity_confidence(base_target):
    analyzer = ExposureAnalyzer()
    assets = [
        Asset(id="asset_vpn", target_id="target_p135", asset_type="subdomain", value="vpn.example.com", source="dns", first_evidence_id="ev_vpn_prov"),
    ]
    signals = analyzer.analyze(base_target, assets, [], [])
    vpn_sig = signals[0]
    assert vpn_sig.evidence_id == "ev_vpn_prov"
    assert vpn_sig.severity == "info"
    assert 0.0 <= vpn_sig.confidence <= 1.0


def test_19_20_signal_deduplication(base_target):
    analyzer = ExposureAnalyzer()
    assets = [
        Asset(id="asset_vpn", target_id="target_p135", asset_type="subdomain", value="vpn.example.com", source="dns", first_evidence_id="ev_vpn_1"),
        Asset(id="asset_vpn", target_id="target_p135", asset_type="subdomain", value="vpn.example.com", source="dns", first_evidence_id="ev_vpn_2"),
    ]
    signals = analyzer.analyze(base_target, assets, [], [])
    vpn_sigs = [s for s in signals if s.signal_type == "remote_access_indicator"]
    assert len(vpn_sigs) == 1


def test_23_risk_score_regression(base_target):
    from risk.scorer import DeterministicRiskScorer
    assets = [Asset(id="a1", target_id="target_p135", asset_type="domain", value="example.com", source="dns")]
    result = DeterministicRiskScorer.evaluate(
        target=base_target,
        assets=assets,
        evidence_items=[],
        technologies=[],
        relationships=[],
        exposure_signals=[],
    )
    assert result.overall_score is not None
    assert result.risk_level in ("low", "medium", "high", "critical", "LOW", "MEDIUM", "HIGH", "CRITICAL")


def test_25_zero_network_requests(base_target, monkeypatch):
    import socket
    def fail_socket(*args, **kwargs):
        raise RuntimeError("Network activity strictly prohibited in ExposureAnalyzer")
    monkeypatch.setattr(socket, "socket", fail_socket)

    analyzer = ExposureAnalyzer()
    assets = [Asset(id="a1", target_id="target_p135", asset_type="subdomain", value="admin.example.com", source="dns")]
    signals = analyzer.analyze(base_target, assets, [], [])
    assert len(signals) > 0


def test_26_malformed_evidence_resilience(base_target):
    analyzer = ExposureAnalyzer()
    malformed_ev = [
        EvidenceItem(id="ev_bad1", target_id="target_p135", source="rdap", evidence_type="rdap_registration", data="not a dict"),
        EvidenceItem(id="ev_bad2", target_id="target_p135", source="dns", evidence_type="dns_record", data={"record_type": 12345}),
    ]
    # Should not raise exception
    signals = analyzer.analyze(base_target, [], [], [], evidence_items=malformed_ev)
    assert isinstance(signals, list)
