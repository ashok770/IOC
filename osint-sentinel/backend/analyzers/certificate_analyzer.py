import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field

from analyzers.domain_analyzer import AnalysisFinding

logger = logging.getLogger(__name__)

EXPIRING_SOON_DAYS = 30


class CertificateItem(BaseModel):
    """Structured certificate metadata parsed from CT evidence."""
    id: Optional[Union[int, str]] = None
    issuer_name: Optional[str] = None
    common_name: Optional[str] = None
    sans: List[str] = Field(default_factory=list)
    not_before: Optional[str] = None
    not_after: Optional[str] = None
    validity_days: Optional[int] = None
    lifecycle_status: str = "UNKNOWN"  # ACTIVE, EXPIRING_SOON, EXPIRED, UNKNOWN
    days_until_expiration: Optional[int] = None
    evidence_id: Optional[str] = None


class CertificateIntelligenceResult(BaseModel):
    """Aggregate result from CertificateAnalyzer."""
    target_domain: str
    certificates: List[CertificateItem] = Field(default_factory=list)
    total_certificates_observed: int = 0
    active_count: int = 0
    expiring_soon_count: int = 0
    expired_count: int = 0
    unknown_count: int = 0
    findings: List[AnalysisFinding] = Field(default_factory=list)


def parse_certificate_timestamp(val: Any) -> Optional[datetime]:
    """
    Safely parses timestamp values into a UTC-aware datetime instance.
    Handles ISO strings, epoch numbers, and common date format patterns.
    Returns None if parsing fails without raising exceptions.
    """
    if val is None:
        return None

    if isinstance(val, (int, float)):
        try:
            return datetime.fromtimestamp(val, tz=timezone.utc)
        except Exception:
            return None

    if isinstance(val, datetime):
        if val.tzinfo is None:
            return val.replace(tzinfo=timezone.utc)
        return val.astimezone(timezone.utc)

    if isinstance(val, str):
        val_str = val.strip()
        if not val_str:
            return None

        # Standard ISO format with Z or timezone offset
        iso_str = val_str.replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(iso_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except Exception:
            pass

        # Common strptime patterns
        patterns = [
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d",
            "%b %d %H:%M:%S %Y GMT",
            "%a, %d %b %Y %H:%M:%S GMT",
            "%Y-%m-%d %H:%M:%S.%f",
            "%Y-%m-%dT%H:%M:%S.%f",
        ]
        for fmt in patterns:
            try:
                dt = datetime.strptime(val_str, fmt)
                return dt.replace(tzinfo=timezone.utc)
            except Exception:
                continue

    return None


class CertificateAnalyzer:
    """
    Passive Certificate Intelligence Analyzer.
    Parses stored Certificate Transparency evidence items to produce deterministic,
    evidence-backed certificate lifecycle intelligence.
    Performs ZERO network requests.
    """

    def analyze(self, domain: str, evidence: List[Any]) -> CertificateIntelligenceResult:
        domain_clean = domain.lower().strip()
        result = CertificateIntelligenceResult(target_domain=domain_clean)

        raw_entries: List[tuple[Dict[str, Any], Optional[str]]] = []

        # Step 1. Extract CT log entries from evidence
        for ev in evidence:
            ev_type = getattr(ev, "evidence_type", None)
            ev_data = getattr(ev, "data", None)
            ev_id = getattr(ev, "id", None)

            if isinstance(ev, dict):
                ev_type = ev.get("evidence_type")
                ev_data = ev.get("data", {})
                ev_id = ev.get("id")

            if not ev_data or not isinstance(ev_data, dict):
                continue

            if ev_type in ("certificate_log_sample", "certificate_transparency", "certificate_entry"):
                sample_entries = ev_data.get("sample_entries") or ev_data.get("certificates") or []
                if isinstance(sample_entries, list):
                    for entry in sample_entries:
                        if isinstance(entry, dict):
                            raw_entries.append((entry, ev_id))
                        elif isinstance(entry, str):
                            raw_entries.append({"common_name": entry}, ev_id)
                elif isinstance(ev_data.get("entry"), dict):
                    raw_entries.append((ev_data["entry"], ev_id))

        now = datetime.now(timezone.utc)
        parsed_certs: List[CertificateItem] = []
        seen_cert_keys = set()

        # Step 2. Parse certificate metadata & compute lifecycle states
        for entry, ev_id in raw_entries:
            cert_id = entry.get("id")
            issuer = entry.get("issuer_name") or entry.get("issuer")
            cn = entry.get("common_name") or entry.get("cn")

            # Extract SANs
            sans: List[str] = []
            name_val = entry.get("name_value") or entry.get("dns_names") or entry.get("sans")
            if isinstance(name_val, str):
                for name in name_val.replace(",", "\n").split("\n"):
                    clean_name = name.strip().lower().lstrip("*.")
                    if clean_name and clean_name not in sans:
                        sans.append(clean_name)
            elif isinstance(name_val, list):
                for name in name_val:
                    if isinstance(name, str):
                        clean_name = name.strip().lower().lstrip("*.")
                        if clean_name and clean_name not in sans:
                            sans.append(clean_name)

            if cn and cn.strip().lower().lstrip("*.") not in sans:
                sans.insert(0, cn.strip().lower().lstrip("*."))

            # Timestamps
            nb_dt = parse_certificate_timestamp(entry.get("not_before"))
            na_dt = parse_certificate_timestamp(entry.get("not_after"))

            nb_str = nb_dt.isoformat() if nb_dt else (str(entry.get("not_before")) if entry.get("not_before") else None)
            na_str = na_dt.isoformat() if na_dt else (str(entry.get("not_after")) if entry.get("not_after") else None)

            # Validity days
            val_days = None
            if nb_dt and na_dt and na_dt >= nb_dt:
                val_days = (na_dt - nb_dt).days

            # Lifecycle classification
            status = "UNKNOWN"
            days_until_exp = None

            if na_dt is not None:
                delta_seconds = (na_dt - now).total_seconds()
                days_until_exp = int(delta_seconds // 86400)

                if na_dt < now:
                    status = "EXPIRED"
                elif na_dt <= now + timedelta(days=EXPIRING_SOON_DAYS):
                    status = "EXPIRING_SOON"
                else:
                    status = "ACTIVE"

            dedup_key = f"{cert_id}:{cn}:{issuer}:{na_str}"
            if dedup_key in seen_cert_keys:
                continue
            seen_cert_keys.add(dedup_key)

            item = CertificateItem(
                id=cert_id,
                issuer_name=str(issuer) if issuer else None,
                common_name=str(cn) if cn else None,
                sans=sans,
                not_before=nb_str,
                not_after=na_str,
                validity_days=val_days,
                lifecycle_status=status,
                days_until_expiration=days_until_exp,
                evidence_id=ev_id,
            )
            parsed_certs.append(item)

        result.certificates = parsed_certs
        result.total_certificates_observed = len(parsed_certs)
        result.active_count = sum(1 for c in parsed_certs if c.lifecycle_status == "ACTIVE")
        result.expiring_soon_count = sum(1 for c in parsed_certs if c.lifecycle_status == "EXPIRING_SOON")
        result.expired_count = sum(1 for c in parsed_certs if c.lifecycle_status == "EXPIRED")
        result.unknown_count = sum(1 for c in parsed_certs if c.lifecycle_status == "UNKNOWN")

        # Step 3. Generate Findings
        findings: List[AnalysisFinding] = []

        if result.total_certificates_observed > 0:
            findings.append(
                AnalysisFinding(
                    category="certificates",
                    title="Certificate Transparency Intelligence Summary",
                    description=(
                        f"Observed {result.total_certificates_observed} total certificates in CT logs for target domain. "
                        f"Active: {result.active_count}, Expiring soon (within 30 days): {result.expiring_soon_count}, Expired: {result.expired_count}."
                    ),
                    severity="info",
                    confidence=1.0,
                    evidence_type="certificate_log_sample",
                )
            )

        for cert in parsed_certs:
            target_name = cert.common_name or domain_clean
            ev_id = cert.evidence_id

            if cert.lifecycle_status == "EXPIRING_SOON":
                exp_days_str = f"in {cert.days_until_expiration} days" if cert.days_until_expiration is not None else "soon"
                findings.append(
                    AnalysisFinding(
                        category="certificates",
                        title=f"Certificate Expiring Soon ({target_name})",
                        description=(
                            f"SSL/TLS certificate for '{target_name}' issued by '{cert.issuer_name or 'Unknown'}' "
                            f"expires {exp_days_str} on {cert.not_after}. "
                            f"Certificate validity window is within the {EXPIRING_SOON_DAYS}-day threshold."
                        ),
                        severity="info",
                        confidence=1.0,
                        evidence_id=ev_id,
                        evidence_type="certificate_log_sample",
                    )
                )
            elif cert.lifecycle_status == "EXPIRED":
                findings.append(
                    AnalysisFinding(
                        category="certificates",
                        title=f"Expired Certificate Observed ({target_name})",
                        description=(
                            f"SSL/TLS certificate for '{target_name}' issued by '{cert.issuer_name or 'Unknown'}' "
                            f"expired on {cert.not_after}."
                        ),
                        severity="info",
                        confidence=1.0,
                        evidence_id=ev_id,
                        evidence_type="certificate_log_sample",
                    )
                )

        result.findings = findings
        return result
