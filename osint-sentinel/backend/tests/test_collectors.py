import asyncio
from unittest.mock import patch, MagicMock
import httpx
import dns.resolver

from collectors.dns.dns_collector import DNSCollector
from collectors.rdap.rdap_collector import RDAPCollector
from collectors.certificates.ct_collector import CertificateTransparencyCollector


def test_dns_collector_mocked():
    collector = DNSCollector()

    # Mock dns answer objects
    mock_a = MagicMock()
    mock_a.to_text.return_value = "93.184.216.34"

    mock_mx = MagicMock()
    mock_mx.preference = 10
    mock_mx.exchange = MagicMock()
    mock_mx.exchange.__str__.return_value = "mail.example.org."

    mock_ns = MagicMock()
    mock_ns.target = MagicMock()
    mock_ns.target.__str__.return_value = "ns1.example.org."

    mock_txt = MagicMock()
    mock_txt.to_text.return_value = '"v=spf1 -all"'

    mock_rrset = MagicMock()
    mock_rrset.ttl = 300

    def mock_resolve(domain, rtype):
        res = MagicMock()
        res.rrset = mock_rrset
        if rtype == "A":
            res.__iter__.return_value = [mock_a]
            return res
        elif rtype == "MX":
            res.__iter__.return_value = [mock_mx]
            return res
        elif rtype == "NS":
            res.__iter__.return_value = [mock_ns]
            return res
        elif rtype == "TXT":
            res.__iter__.return_value = [mock_txt]
            return res
        else:
            raise dns.resolver.NoAnswer()

    with patch("dns.resolver.Resolver.resolve", side_effect=mock_resolve):
        report = asyncio.run(collector.collect("example.org"))

    assert report.status == "success"
    assert len(report.results) == 4

    types_found = [r.data["record_type"] for r in report.results]
    assert "A" in types_found
    assert "MX" in types_found
    assert "NS" in types_found
    assert "TXT" in types_found

    mx_item = next(r for r in report.results if r.data["record_type"] == "MX")
    assert mx_item.data["exchange"] == "mail.example.org"
    assert mx_item.data["preference"] == 10


def test_dns_collector_nxdomain_handling():
    collector = DNSCollector()

    with patch("dns.resolver.Resolver.resolve", side_effect=dns.resolver.NXDOMAIN()):
        report = asyncio.run(collector.collect("nonexistent-domain-test.xyz"))

    assert report.status == "no_data"
    assert len(report.results) == 0


def test_rdap_collector_mocked():
    collector = RDAPCollector()

    mock_rdap_payload = {
        "handle": "EXAMPLE-COM",
        "status": ["clientTransferProhibited"],
        "events": [
            {"eventAction": "registration", "eventDate": "2000-01-01T00:00:00Z"},
            {"eventAction": "expiration", "eventDate": "2030-01-01T00:00:00Z"},
        ],
        "entities": [
            {
                "roles": ["registrar"],
                "vcardArray": ["vcard", [["fn", {}, "text", "Acme Registrar LLC"]]],
            }
        ],
        "nameservers": [
            {"ldhName": "A.IANA-SERVERS.NET"},
            {"ldhName": "B.IANA-SERVERS.NET"},
        ],
    }

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = mock_rdap_payload

    with patch("httpx.AsyncClient.get", return_value=mock_response):
        report = asyncio.run(collector.collect("example.org"))

    assert report.status == "success"
    assert len(report.results) == 1
    rdap_res = report.results[0]
    assert rdap_res.evidence_type == "rdap_registration"
    assert rdap_res.data["registrar"] == "Acme Registrar LLC"
    assert rdap_res.data["created_date"] == "2000-01-01T00:00:00Z"
    assert rdap_res.data["expiration_date"] == "2030-01-01T00:00:00Z"
    assert "a.iana-servers.net" in rdap_res.data["nameservers"]


def test_rdap_collector_timeout():
    collector = RDAPCollector()

    with patch("httpx.AsyncClient.get", side_effect=httpx.TimeoutException("Timeout")):
        report = asyncio.run(collector.collect("example.org"))

    assert report.status == "partial"
    assert len(report.results) == 0
    assert "timed out" in report.error_message


def test_ct_collector_mocked():
    collector = CertificateTransparencyCollector()

    mock_crt_payload = [
        {
            "id": 12345,
            "issuer_name": "C=US, O=Let's Encrypt",
            "common_name": "example.org",
            "name_value": "example.org\napi.example.org\nmail.example.org",
            "entry_timestamp": "2024-01-01T12:00:00",
            "not_before": "2024-01-01T00:00:00",
            "not_after": "2024-04-01T00:00:00",
        },
        {
            "id": 12346,
            "issuer_name": "C=US, O=DigiCert",
            "common_name": "vpn.example.org",
            "name_value": "vpn.example.org\n*.example.org",
            "entry_timestamp": "2024-02-01T12:00:00",
            "not_before": "2024-02-01T00:00:00",
            "not_after": "2025-02-01T00:00:00",
        },
    ]

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = mock_crt_payload

    with patch("httpx.AsyncClient.get", return_value=mock_response):
        report = asyncio.run(collector.collect("example.org"))

    assert report.status == "success"
    assert len(report.results) == 2

    hostnames_evidence = next(r for r in report.results if r.evidence_type == "certificate_hostnames")
    discovered = hostnames_evidence.data["discovered_hostnames"]
    assert "example.org" in discovered
    assert "api.example.org" in discovered
    assert "mail.example.org" in discovered
    assert "vpn.example.org" in discovered


def test_ct_collector_rate_limit_or_service_unavailable():
    collector = CertificateTransparencyCollector()

    mock_response = MagicMock()
    mock_response.status_code = 503

    with patch("httpx.AsyncClient.get", return_value=mock_response):
        report = asyncio.run(collector.collect("example.org"))

    assert report.status == "partial"
    assert len(report.results) == 0
    assert "HTTP 503" in report.error_message
