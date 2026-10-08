import re
import logging
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field

from collectors.base import CollectorResult
from app.models.evidence import EvidenceItem
from analyzers.domain_analyzer import AnalysisFinding

logger = logging.getLogger(__name__)


class SPFAnalysis(BaseModel):
    """Structured SPF intelligence representation."""
    present: bool = False
    record_raw: Optional[str] = None
    version: Optional[str] = None
    all_qualifier: Optional[str] = None  # "-all", "~all", "?all", "+all"
    includes: List[str] = Field(default_factory=list)
    ip4_mechanisms: List[str] = Field(default_factory=list)
    ip6_mechanisms: List[str] = Field(default_factory=list)
    redirect: Optional[str] = None
    multiple_records: bool = False
    malformed: bool = False
    error_message: Optional[str] = None
    evidence_id: Optional[str] = None
    query_executed: bool = False


class DMARCAnalysis(BaseModel):
    """Structured DMARC intelligence representation."""
    present: bool = False
    record_raw: Optional[str] = None
    version: Optional[str] = None
    policy: Optional[str] = None  # "none", "quarantine", "reject"
    subdomain_policy: Optional[str] = None  # "sp=..."
    percentage: Optional[int] = None
    rua: List[str] = Field(default_factory=list)
    ruf: List[str] = Field(default_factory=list)
    malformed: bool = False
    error_message: Optional[str] = None
    evidence_id: Optional[str] = None
    query_executed: bool = False


class EmailIntelligenceResult(BaseModel):
    """Aggregated email security intelligence."""
    domain: str
    spf: SPFAnalysis
    dmarc: DMARCAnalysis
    findings: List[AnalysisFinding] = Field(default_factory=list)


class EmailAnalyzer:
    """
    Analyzes raw DNS evidence to produce deterministic, structured
    Email Security Intelligence (SPF, DMARC, mail defenses).
    Does NOT execute network requests or guess business risk.
    """

    def analyze(
        self,
        domain: str,
        evidence: List[Union[CollectorResult, EvidenceItem, Dict[str, Any]]],
    ) -> EmailIntelligenceResult:
        domain_clean = domain.lower().strip()
        spf_info = SPFAnalysis()
        dmarc_info = DMARCAnalysis()
        findings: List[AnalysisFinding] = []

        spf_records_found = []
        dmarc_records_found = []

        has_dns_evidence = False
        first_dns_ev_id = None

        # Step 1. Inspect DNS evidence items
        for ev in evidence:
            ev_type = getattr(ev, "evidence_type", None)
            ev_data = getattr(ev, "data", None)
            ev_id = getattr(ev, "id", None)

            if isinstance(ev, dict):
                ev_type = ev.get("evidence_type")
                ev_data = ev.get("data", {})
                ev_id = ev.get("id")

            if ev_type != "dns_record" or not isinstance(ev_data, dict):
                continue

            has_dns_evidence = True
            if first_dns_ev_id is None:
                first_dns_ev_id = ev_id
            record_type = ev_data.get("record_type")
            rec_domain = str(ev_data.get("domain", "")).lower().strip()

            flat_strings = []
            for k, v in ev_data.items():
                if isinstance(v, str):
                    flat_strings.append(v)
                elif isinstance(v, list):
                    flat_strings.extend([str(item) for item in v if isinstance(item, str)])

            is_txt = (
                record_type == "TXT"
                or "TXT" in ev_data
                or any("v=spf1" in s.lower() or "v=dmarc1" in s.lower() or "spf1" in s.lower() for s in flat_strings)
            )

            if is_txt:
                if not rec_domain or rec_domain == domain_clean or not rec_domain.startswith("_dmarc"):
                    spf_info.query_executed = True

                if rec_domain.startswith("_dmarc") or ev_data.get("subdomain_type") == "dmarc" or any("v=dmarc1" in s.lower() for s in flat_strings):
                    dmarc_info.query_executed = True

                txt_values: List[str] = []
                raw_val = ev_data.get("value")
                if isinstance(raw_val, str):
                    txt_values.append(raw_val)
                elif isinstance(raw_val, list):
                    txt_values.extend([str(v) for v in raw_val if v])

                if "TXT" in ev_data:
                    grouped = ev_data["TXT"]
                    if isinstance(grouped, list):
                        txt_values.extend([str(v) for v in grouped if v])
                    elif isinstance(grouped, str):
                        txt_values.append(grouped)

                for txt_str in txt_values:
                    cleaned_txt = txt_str.strip().strip('"')
                    lower_txt = cleaned_txt.lower()

                    if "v=spf1" in lower_txt or lower_txt.startswith("spf1 ") or "redirect=" in lower_txt or "include:" in lower_txt:
                        spf_records_found.append((cleaned_txt, ev_id))
                        spf_info.query_executed = True

                    if "v=dmarc1" in lower_txt:
                        dmarc_records_found.append((cleaned_txt, ev_id))
                        dmarc_info.query_executed = True

        # Fallback: If DNS records exist for target domain, consider queries executed
        if not spf_info.query_executed and has_dns_evidence:
            spf_info.query_executed = True
        if not dmarc_info.query_executed and has_dns_evidence:
            dmarc_info.query_executed = True

        if not spf_records_found and first_dns_ev_id:
            spf_info.evidence_id = first_dns_ev_id
        if not dmarc_records_found and first_dns_ev_id:
            dmarc_info.evidence_id = first_dns_ev_id

        # Step 2. Parse SPF Records
        if len(spf_records_found) > 1:
            spf_info.present = True
            spf_info.multiple_records = True
            spf_info.malformed = True
            spf_info.record_raw = " | ".join(r[0] for r in spf_records_found)
            spf_info.evidence_id = spf_records_found[0][1]
            spf_info.error_message = f"Multiple ({len(spf_records_found)}) SPF records detected on domain."
        elif len(spf_records_found) == 1:
            raw_spf, ev_id = spf_records_found[0]
            spf_info.present = True
            spf_info.record_raw = raw_spf
            spf_info.evidence_id = ev_id
            self._parse_spf_record(raw_spf, spf_info)

        # Step 3. Parse DMARC Records
        if len(dmarc_records_found) >= 1:
            raw_dmarc, ev_id = dmarc_records_found[0]
            dmarc_info.present = True
            dmarc_info.record_raw = raw_dmarc
            dmarc_info.evidence_id = ev_id
            self._parse_dmarc_record(raw_dmarc, dmarc_info)

        # Step 4. Generate Deterministic Findings
        if spf_info.present:
            if spf_info.multiple_records:
                findings.append(
                    AnalysisFinding(
                        category="mail",
                        title="Multiple SPF Records Detected",
                        description=f"Domain {domain_clean} publishes multiple SPF records, violating RFC 7208.",
                        severity="info",
                        confidence=1.0,
                        evidence_type="dns_record",
                    )
                )
            else:
                qual_str = spf_info.all_qualifier or "none"
                findings.append(
                    AnalysisFinding(
                        category="mail",
                        title="SPF Record Configured",
                        description=f"SPF record configured for {domain_clean} (Qualifier: '{qual_str}'). Raw: {spf_info.record_raw}",
                        severity="info",
                        confidence=1.0,
                        evidence_type="dns_record",
                    )
                )
                for inc in spf_info.includes:
                    findings.append(
                        AnalysisFinding(
                            category="mail",
                            title=f"SPF Include Delegation: {inc}",
                            description=f"Domain {domain_clean} delegates authorized email senders to third-party provider '{inc}'.",
                            severity="info",
                            confidence=1.0,
                            evidence_type="dns_record",
                        )
                    )
        elif spf_info.query_executed:
            findings.append(
                AnalysisFinding(
                    category="mail",
                    title="Missing SPF Record",
                    description=f"No SPF record observed for apex domain {domain_clean}.",
                    severity="info",
                    confidence=1.0,
                    evidence_type="dns_record",
                )
            )

        if dmarc_info.present:
            p_val = dmarc_info.policy or "unknown"
            findings.append(
                AnalysisFinding(
                    category="mail",
                    title="DMARC Policy Configured",
                    description=f"DMARC policy record for {domain_clean}: p={p_val}.",
                    severity="info",
                    confidence=1.0,
                    evidence_type="dns_record",
                )
            )
            if dmarc_info.rua or dmarc_info.ruf:
                findings.append(
                    AnalysisFinding(
                        category="mail",
                        title="DMARC Aggregate/Forensic Telemetry Reporting Configured",
                        description=f"DMARC policy specifies reporting mailboxes (rua: {', '.join(dmarc_info.rua)}).",
                        severity="info",
                        confidence=1.0,
                        evidence_type="dns_record",
                    )
                )
        elif dmarc_info.query_executed or spf_info.query_executed:
            findings.append(
                AnalysisFinding(
                    category="mail",
                    title="Missing DMARC Policy",
                    description=f"No DMARC policy record found at _dmarc.{domain_clean}.",
                    severity="info",
                    confidence=1.0,
                    evidence_type="dns_record",
                )
            )

        return EmailIntelligenceResult(
            domain=domain_clean,
            spf=spf_info,
            dmarc=dmarc_info,
            findings=findings,
        )

    def _parse_spf_record(self, raw_spf: str, spf: SPFAnalysis) -> None:
        parts = raw_spf.strip().split()
        if not parts:
            spf.malformed = True
            return

        if parts[0].lower() == "v=spf1":
            spf.version = "v=spf1"
        else:
            spf.version = "v=spf1"
            spf.malformed = True

        for part in parts[1:]:
            p_lower = part.lower()

            if p_lower in ("-all", "~all", "?all", "+all", "all"):
                if p_lower == "all":
                    spf.all_qualifier = "+all"
                else:
                    spf.all_qualifier = p_lower
            elif p_lower.startswith("include:"):
                inc_domain = part[8:].strip().lower().rstrip(".")
                if inc_domain and inc_domain not in spf.includes:
                    spf.includes.append(inc_domain)
            elif p_lower.startswith("ip4:"):
                ip4_val = part[4:].strip()
                if ip4_val and ip4_val not in spf.ip4_mechanisms:
                    spf.ip4_mechanisms.append(ip4_val)
            elif p_lower.startswith("ip6:"):
                ip6_val = part[4:].strip()
                if ip6_val and ip6_val not in spf.ip6_mechanisms:
                    spf.ip6_mechanisms.append(ip6_val)
            elif p_lower.startswith("redirect="):
                spf.redirect = part[9:].strip().lower().rstrip(".")

    def _parse_dmarc_record(self, raw_dmarc: str, dmarc: DMARCAnalysis) -> None:
        tags = raw_dmarc.strip().split(";")
        for tag in tags:
            tag_clean = tag.strip()
            if not tag_clean:
                continue

            if "=" not in tag_clean:
                continue

            key, val = tag_clean.split("=", 1)
            key = key.strip().lower()
            val = val.strip()

            if key == "v":
                dmarc.version = val
            elif key == "p":
                dmarc.policy = val.lower()
                if dmarc.policy not in ("none", "quarantine", "reject"):
                    dmarc.malformed = True
            elif key == "sp":
                dmarc.subdomain_policy = val.lower()
            elif key == "pct":
                try:
                    dmarc.percentage = int(val)
                except ValueError:
                    dmarc.malformed = True
            elif key == "rua":
                addrs = [a.strip() for a in val.split(",") if a.strip()]
                dmarc.rua.extend(addrs)
            elif key == "ruf":
                addrs = [a.strip() for a in val.split(",") if a.strip()]
                dmarc.ruf.extend(addrs)
