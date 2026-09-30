from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from collectors.base import CollectorResult


class AnalysisFinding(BaseModel):
    """Factual observation finding generated from verified evidence."""
    category: str = Field(..., description="Observation domain (e.g. infrastructure, dns, certificates, mail)")
    title: str = Field(..., description="Concise summary title")
    description: str = Field(..., description="Detailed factual explanation")
    severity: str = Field("info", description="Severity level, strictly 'info' for Phase 2 observations")
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="Evidentiary confidence")
    evidence_type: Optional[str] = None


class DomainAnalyzer:
    """
    Analyzes raw evidence collected during passive domain assessment
    to generate factual, deterministic architectural observations.
    Explicitly prohibits speculative vulnerability guessing.
    """

    def analyze(self, domain: str, evidence: List[CollectorResult]) -> List[AnalysisFinding]:
        findings: List[AnalysisFinding] = []

        dns_records: List[Dict[str, Any]] = []
        rdap_records: List[Dict[str, Any]] = []
        ct_hostnames_data: List[Dict[str, Any]] = []

        for item in evidence:
            if item.evidence_type == "dns_record":
                dns_records.append(item.data)
            elif item.evidence_type == "rdap_registration":
                rdap_records.append(item.data)
            elif item.evidence_type == "certificate_hostnames":
                ct_hostnames_data.append(item.data)

        # 1. DNS Record Architecture Analysis
        if dns_records:
            record_types = sorted(list(set(r.get("record_type") for r in dns_records if r.get("record_type"))))
            findings.append(
                AnalysisFinding(
                    category="dns",
                    title="DNS Infrastructure & Record Types",
                    description=(
                        f"Resolved {len(dns_records)} DNS records across {len(record_types)} record "
                        f"types ({', '.join(record_types)}) for domain {domain}."
                    ),
                    severity="info",
                    confidence=1.0,
                    evidence_type="dns_record",
                )
            )

        # 2. Mail Infrastructure Analysis
        mx_records = [r for r in dns_records if r.get("record_type") == "MX"]
        if mx_records:
            exchanges = [r.get("exchange", "") for r in mx_records if r.get("exchange")]
            if exchanges:
                provider = self._identify_mail_provider(exchanges)
                desc = (
                    f"Observed {len(exchanges)} mail exchange (MX) server(s): {', '.join(exchanges)}. "
                    f"Recognized provider ecosystem: {provider}."
                )
            else:
                desc = "Null MX record observed (RFC 7505 - domain explicitly does not accept email)."

            findings.append(
                AnalysisFinding(
                    category="mail",
                    title="Mail Routing Infrastructure",
                    description=desc,
                    severity="info",
                    confidence=1.0,
                    evidence_type="dns_record",
                )
            )

        # 3. Nameserver Infrastructure Analysis
        ns_records = [r for r in dns_records if r.get("record_type") == "NS"]
        if ns_records:
            nameservers = sorted(list(set(r.get("target", "") for r in ns_records if r.get("target"))))
            provider = self._identify_dns_provider(nameservers)
            findings.append(
                AnalysisFinding(
                    category="infrastructure",
                    title="Authoritative Nameserver Infrastructure",
                    description=(
                        f"Authoritative DNS for {domain} is delegated to {len(nameservers)} nameserver(s): "
                        f"{', '.join(nameservers)}. DNS Provider: {provider}."
                    ),
                    severity="info",
                    confidence=1.0,
                    evidence_type="dns_record",
                )
            )

        # 4. Certificate Transparency Observed Hostnames
        if ct_hostnames_data:
            discovered_hosts: List[str] = []
            for item in ct_hostnames_data:
                discovered_hosts.extend(item.get("discovered_hostnames", []))
            unique_hosts = sorted(list(set(discovered_hosts)))
            if unique_hosts:
                sample = unique_hosts[:8]
                sample_str = ", ".join(sample) + ("..." if len(unique_hosts) > 8 else "")
                findings.append(
                    AnalysisFinding(
                        category="certificates",
                        title="Certificate Transparency Hostnames",
                        description=(
                            f"Identified {len(unique_hosts)} unique hostnames associated with {domain} "
                            f"in public Certificate Transparency logs. Sample hostnames: {sample_str}"
                        ),
                        severity="info",
                        confidence=1.0,
                        evidence_type="certificate_hostnames",
                    )
                )

        # 5. RDAP Registration Information
        if rdap_records:
            rdap = rdap_records[0]
            registrar = rdap.get("registrar") or "Unknown / Redacted"
            created = rdap.get("created_date") or "Not disclosed"
            expiration = rdap.get("expiration_date") or "Not disclosed"
            findings.append(
                AnalysisFinding(
                    category="infrastructure",
                    title="Domain Registration & Registrar Metadata",
                    description=(
                        f"Domain is registered via '{registrar}'. "
                        f"Registration date: {created}. Expiration date: {expiration}."
                    ),
                    severity="info",
                    confidence=1.0,
                    evidence_type="rdap_registration",
                )
            )

        return findings

    def _identify_mail_provider(self, exchanges: List[str]) -> str:
        joined = " ".join(exchanges).lower()
        if "google" in joined or "aspmx" in joined:
            return "Google Workspace / Gmail"
        if "outlook" in joined or "protection.outlook.com" in joined:
            return "Microsoft 365 / Exchange Online"
        if "pphosted" in joined or "proofpoint" in joined:
            return "Proofpoint"
        if "mimecast" in joined:
            return "Mimecast"
        if "protonmail" in joined:
            return "Proton Mail"
        if "zoho" in joined:
            return "Zoho Mail"
        return "Custom / Self-Managed Mail Infrastructure"

    def _identify_dns_provider(self, nameservers: List[str]) -> str:
        joined = " ".join(nameservers).lower()
        if "cloudflare" in joined:
            return "Cloudflare DNS"
        if "awsdns" in joined:
            return "Amazon Route 53"
        if "azure-dns" in joined:
            return "Microsoft Azure DNS"
        if "googledomains" in joined or "googlecloud" in joined:
            return "Google Cloud DNS"
        if "registrar-servers" in joined:
            return "Namecheap DNS"
        if "domaincontrol" in joined:
            return "GoDaddy DNS"
        return "Standard Authoritative DNS"
