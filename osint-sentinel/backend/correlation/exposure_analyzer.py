import re
import logging
from typing import List, Dict, Any, Optional, Set
from pydantic import BaseModel, Field

from app.models.target import Target
from app.models.asset import Asset
from app.models.evidence import EvidenceItem
from app.models.technology import Technology
from app.models.relationship import Relationship

logger = logging.getLogger(__name__)

# Conservative keyword matchers for hostnames
REMOTE_ACCESS_PATTERN = re.compile(
    r"(?:^|[.-])(vpn|remote|gateway|access|citrix|pulse|portal|bastion)(?:[.-]|$)",
    re.IGNORECASE,
)
DEV_TEST_PATTERN = re.compile(
    r"(?:^|[.-])(dev|test|staging|stage|qa|sandbox|preprod|demo|uat)(?:[.-]|$)",
    re.IGNORECASE,
)
SENSITIVE_HOSTNAME_PATTERN = re.compile(
    r"(?:^|[.-])(admin|administrator|management|monitor|internal|intranet)(?:[.-]|$)",
    re.IGNORECASE,
)


class DetectedExposureSignal(BaseModel):
    """
    Normalized exposure signal emitted by the ExposureAnalyzer.
    Strictly informational; does not assert vulnerabilities or defects.
    """
    target_id: str
    asset_id: Optional[str] = None
    signal_type: str
    category: str
    title: str
    description: str
    severity: str = "info"
    confidence: float
    evidence_id: Optional[str] = None
    extra_data: Dict[str, Any] = Field(default_factory=dict)


class ExposureAnalyzer:
    """
    Identifies factual security exposure signals from correlated assets,
    technologies, and relationships to aid analyst prioritization.
    Enforces non-speculative, deterministic logic.
    """

    def analyze(
        self,
        target: Target,
        assets: List[Asset],
        technologies: List[Technology],
        relationships: List[Relationship],
        evidence_items: Optional[List[EvidenceItem]] = None,
        email_intel: Optional[Any] = None,
        cert_intel: Optional[Any] = None,
    ) -> List[DetectedExposureSignal]:
        signals: List[DetectedExposureSignal] = []
        seen_keys: Set[str] = set()

        def add_signal(sig: DetectedExposureSignal):
            key = f"{sig.target_id}:{sig.asset_id}:{sig.signal_type}:{sig.title}"
            if key not in seen_keys:
                seen_keys.add(key)
                signals.append(sig)

        primary_domain_asset = next((a for a in assets if a.asset_type == "domain"), None)
        domain_asset_id = primary_domain_asset.id if primary_domain_asset else None

        # Execute EmailAnalyzer if evidence_items provided and email_intel not passed
        if email_intel is None and evidence_items is not None:
            from analyzers.email_analyzer import EmailAnalyzer
            email_intel = EmailAnalyzer().analyze(target.primary_domain, evidence_items)

        # Execute CertificateAnalyzer if evidence_items provided and cert_intel not passed
        if cert_intel is None and evidence_items is not None:
            from analyzers.certificate_analyzer import CertificateAnalyzer
            cert_intel = CertificateAnalyzer().analyze(target.primary_domain, evidence_items)

        # ---------------------------------------------------------------------
        # 1. Hostname-Based Exposure Signals (Remote Access & Dev/Test Environments)
        # ---------------------------------------------------------------------
        for asset in assets:
            if asset.asset_type not in ("subdomain", "certificate_associated_hostname"):
                continue

            host_value = asset.value.lower()

            # Rule A: Potential Remote-Access Infrastructure
            match_remote = REMOTE_ACCESS_PATTERN.search(host_value)
            if match_remote:
                matched_kw = match_remote.group(1)
                add_signal(
                    DetectedExposureSignal(
                        target_id=target.id,
                        asset_id=asset.id,
                        signal_type="remote_access_indicator",
                        category="perimeter_surface",
                        title="Potential remote-access infrastructure identified by hostname",
                        description=(
                            f"Hostname '{asset.value}' contains keyword indicator '{matched_kw}'. "
                            f"Identified via passive DNS or Certificate Transparency. "
                            f"Factual observation for perimeter prioritization; no vulnerability or "
                            f"authentication weakness is claimed."
                        ),
                        severity="info",
                        confidence=0.85,
                        evidence_id=asset.first_evidence_id,
                        extra_data={"matched_keyword": matched_kw, "hostname": asset.value},
                    )
                )

            # Rule B: Development/Testing Non-Production Hostname
            match_dev = DEV_TEST_PATTERN.search(host_value)
            if match_dev:
                matched_kw = match_dev.group(1)
                add_signal(
                    DetectedExposureSignal(
                        target_id=target.id,
                        asset_id=asset.id,
                        signal_type="development_test_indicator",
                        category="non_production_exposure",
                        title="Development/testing hostname publicly identifiable",
                        description=(
                            f"Hostname '{asset.value}' matches non-production environment pattern ('{matched_kw}'). "
                            f"Public discoverability of non-production assets can reveal staging configurations "
                            f"or pre-release services."
                        ),
                        severity="info",
                        confidence=0.90,
                        evidence_id=asset.first_evidence_id,
                        extra_data={"matched_keyword": matched_kw, "hostname": asset.value},
                    )
                )

            # Rule C: Sensitive Management/Administrative Hostname Pattern
            match_sensitive = SENSITIVE_HOSTNAME_PATTERN.search(host_value)
            if match_sensitive:
                matched_kw = match_sensitive.group(1)
                add_signal(
                    DetectedExposureSignal(
                        target_id=target.id,
                        asset_id=asset.id,
                        signal_type="sensitive_hostname_indicator",
                        category="perimeter_surface",
                        title="Security-sensitive hostname naming pattern observed",
                        description=(
                            f"Hostname '{asset.value}' contains security-sensitive keyword indicator '{matched_kw}'. "
                            f"Observed via passive DNS or CT telemetry. Factual naming pattern observation; "
                            f"no administrative interface vulnerability or access weakness is asserted."
                        ),
                        severity="info",
                        confidence=0.80,
                        evidence_id=asset.first_evidence_id,
                        extra_data={"matched_keyword": matched_kw, "hostname": asset.value},
                    )
                )

        # ---------------------------------------------------------------------
        # 2. Technology Stack Disclosures
        # ---------------------------------------------------------------------
        for tech in technologies:
            version_info = f" (version {tech.version})" if tech.version else ""
            add_signal(
                DetectedExposureSignal(
                    target_id=target.id,
                    asset_id=tech.asset_id,
                    signal_type="technology_disclosure",
                    category="technology_stack",
                    title="Technology stack information publicly observable",
                    description=(
                        f"Technology '{tech.name}'{version_info} ({tech.category}) is observable via public "
                        f"response headers or metadata. Disclosed via {tech.detection_method.replace('_', ' ')}."
                    ),
                    severity="info",
                    confidence=tech.confidence,
                    evidence_id=tech.evidence_id,
                    extra_data={
                        "technology_name": tech.name,
                        "category": tech.category,
                        "version": tech.version,
                    },
                )
            )

        # ---------------------------------------------------------------------
        # 3. Third-Party Infrastructure & External Dependency References
        # ---------------------------------------------------------------------
        for rel in relationships:
            if rel.relationship_type == "externally_referenced":
                add_signal(
                    DetectedExposureSignal(
                        target_id=target.id,
                        asset_id=rel.source_id if rel.source_type == "asset" else None,
                        signal_type="external_dependency_reference",
                        category="external_dependency",
                        title="External service/provider referenced by target DNS",
                        description=(
                            f"Target domain routes to or delegates services to external provider "
                            f"'{rel.target_id_reference}'. Observed via public DNS; target ownership of "
                            f"provider infrastructure is not assumed."
                        ),
                        severity="info",
                        confidence=rel.confidence,
                        evidence_id=rel.evidence_id,
                        extra_data={
                            "referenced_entity": rel.target_id_reference,
                            "role": rel.extra_data.get("role") if rel.extra_data else None,
                        },
                    )
                )

        # ---------------------------------------------------------------------
        # 4. Email Security Posture Exposure Signals
        # ---------------------------------------------------------------------
        if email_intel:
            spf = email_intel.spf
            dmarc = email_intel.dmarc

            if spf.query_executed:
                if not spf.present:
                    add_signal(
                        DetectedExposureSignal(
                            target_id=target.id,
                            asset_id=domain_asset_id,
                            signal_type="missing_spf",
                            category="email_defense",
                            title="Missing Sender Policy Framework (SPF) record",
                            description=(
                                f"No SPF record published for apex domain '{target.primary_domain}'. "
                                f"Receiving mail servers cannot verify authorized senders."
                            ),
                            severity="info",
                            confidence=1.0,
                            evidence_id=spf.evidence_id,
                            extra_data={"domain": target.primary_domain},
                        )
                    )
                elif spf.all_qualifier in ("+all", "?all"):
                    add_signal(
                        DetectedExposureSignal(
                            target_id=target.id,
                            asset_id=domain_asset_id,
                            signal_type="permissive_spf",
                            category="email_defense",
                            title=f"Permissive SPF policy qualifier ({spf.all_qualifier})",
                            description=(
                                f"SPF record for '{target.primary_domain}' specifies permissive qualifier '{spf.all_qualifier}', "
                                f"instructing receivers to allow unlisted mail origins."
                            ),
                            severity="info",
                            confidence=0.90,
                            evidence_id=spf.evidence_id,
                            extra_data={"qualifier": spf.all_qualifier, "record_raw": spf.record_raw},
                        )
                    )
                elif spf.all_qualifier == "~all":
                    add_signal(
                        DetectedExposureSignal(
                            target_id=target.id,
                            asset_id=domain_asset_id,
                            signal_type="softfail_spf",
                            category="email_defense",
                            title="Softfail SPF policy qualifier (~all)",
                            description=(
                                f"SPF record for '{target.primary_domain}' uses softfail qualifier (~all) "
                                f"rather than strict hardfail (-all)."
                            ),
                            severity="info",
                            confidence=0.85,
                            evidence_id=spf.evidence_id,
                            extra_data={"qualifier": "~all", "record_raw": spf.record_raw},
                        )
                    )

            if dmarc.query_executed or (spf.query_executed and dmarc.present):
                if not dmarc.present:
                    add_signal(
                        DetectedExposureSignal(
                            target_id=target.id,
                            asset_id=domain_asset_id,
                            signal_type="missing_dmarc",
                            category="email_defense",
                            title="Missing DMARC policy record",
                            description=(
                                f"No DMARC policy record published at '_dmarc.{target.primary_domain}'. "
                                f"Mail receivers lack enforcement instructions for unauthenticated messages."
                            ),
                            severity="info",
                            confidence=1.0,
                            evidence_id=dmarc.evidence_id,
                            extra_data={"domain": target.primary_domain},
                        )
                    )
                elif dmarc.policy == "none":
                    add_signal(
                        DetectedExposureSignal(
                            target_id=target.id,
                            asset_id=domain_asset_id,
                            signal_type="non_enforcing_dmarc",
                            category="email_defense",
                            title="Non-enforcing DMARC policy (p=none)",
                            description=(
                                f"DMARC policy for '{target.primary_domain}' is set to p=none (telemetry mode only). "
                                f"Unauthenticated emails are not rejected or quarantined."
                            ),
                            severity="info",
                            confidence=0.90,
                            evidence_id=dmarc.evidence_id,
                            extra_data={"policy": "none", "record_raw": dmarc.record_raw},
                        )
                    )

        # ---------------------------------------------------------------------
        # 5. Certificate Exposure Signals (expiring_soon, expired)
        # ---------------------------------------------------------------------
        if cert_intel is not None and hasattr(cert_intel, "certificates"):
            for cert in cert_intel.certificates:
                target_name = cert.common_name or target.primary_domain
                cert_asset = next((a for a in assets if a.value.lower() == target_name.lower()), None)
                cert_asset_id = cert_asset.id if cert_asset else domain_asset_id

                if cert.lifecycle_status == "EXPIRING_SOON":
                    exp_days = cert.days_until_expiration if cert.days_until_expiration is not None else 30
                    add_signal(
                        DetectedExposureSignal(
                            target_id=target.id,
                            asset_id=cert_asset_id,
                            signal_type="certificate_expiring_soon",
                            category="certificate_security",
                            title=f"Certificate expiring soon ({target_name})",
                            description=(
                                f"SSL/TLS certificate for '{target_name}' issued by '{cert.issuer_name or 'Unknown'}' "
                                f"expires in {exp_days} days on {cert.not_after}."
                            ),
                            severity="info",
                            confidence=1.0,
                            evidence_id=cert.evidence_id,
                            extra_data={
                                "common_name": cert.common_name,
                                "issuer": cert.issuer_name,
                                "not_after": cert.not_after,
                                "days_until_expiration": cert.days_until_expiration,
                            },
                        )
                    )
                elif cert.lifecycle_status == "EXPIRED":
                    add_signal(
                        DetectedExposureSignal(
                            target_id=target.id,
                            asset_id=cert_asset_id,
                            signal_type="certificate_expired",
                            category="certificate_security",
                            title=f"Expired certificate observed ({target_name})",
                            description=(
                                f"SSL/TLS certificate for '{target_name}' issued by '{cert.issuer_name or 'Unknown'}' "
                                f"expired on {cert.not_after}."
                            ),
                            severity="info",
                            confidence=1.0,
                            evidence_id=cert.evidence_id,
                            extra_data={
                                "common_name": cert.common_name,
                                "issuer": cert.issuer_name,
                                "not_after": cert.not_after,
                            },
                        )
                    )

        # ---------------------------------------------------------------------
        # 6. Domain Registration Lifecycle Signals (RDAP evidence)
        # ---------------------------------------------------------------------
        if evidence_items:
            from datetime import datetime, timezone
            for item in evidence_items:
                ev_type = getattr(item, "evidence_type", None)
                coll_name = getattr(item, "collector_name", None)
                if ev_type == "rdap_registration" or coll_name == "rdap":
                    data = getattr(item, "data", {})
                    exp_raw = None
                    if isinstance(data, dict):
                        exp_raw = data.get("expiration_date") or data.get("expires")
                    if exp_raw:
                        try:
                            if isinstance(exp_raw, str):
                                exp_str = exp_raw.replace("Z", "+00:00")
                                dt_exp = datetime.fromisoformat(exp_str)
                            elif isinstance(exp_raw, datetime):
                                dt_exp = exp_raw
                            else:
                                continue

                            if dt_exp.tzinfo is None:
                                dt_exp = dt_exp.replace(tzinfo=timezone.utc)

                            now = datetime.now(timezone.utc)
                            days_left = (dt_exp - now).days

                            if days_left <= 0:
                                add_signal(
                                    DetectedExposureSignal(
                                        target_id=target.id,
                                        asset_id=domain_asset_id,
                                        signal_type="domain_expired",
                                        category="domain_registration",
                                        title=f"Domain registration expired ({target.primary_domain})",
                                        description=(
                                            f"RDAP registration record for domain '{target.primary_domain}' "
                                            f"indicates expiration on {dt_exp.strftime('%Y-%m-%d')}."
                                        ),
                                        severity="info",
                                        confidence=1.0,
                                        evidence_id=getattr(item, "id", None),
                                        extra_data={
                                            "domain": target.primary_domain,
                                            "expiration_date": str(exp_raw),
                                            "days_until_expiration": days_left,
                                        },
                                    )
                                )
                            elif days_left <= 30:
                                add_signal(
                                    DetectedExposureSignal(
                                        target_id=target.id,
                                        asset_id=domain_asset_id,
                                        signal_type="domain_expiring_soon",
                                        category="domain_registration",
                                        title=f"Domain registration expiring soon ({target.primary_domain})",
                                        description=(
                                            f"RDAP registration record for domain '{target.primary_domain}' "
                                            f"expires in {days_left} days on {dt_exp.strftime('%Y-%m-%d')}."
                                        ),
                                        severity="info",
                                        confidence=1.0,
                                        evidence_id=getattr(item, "id", None),
                                        extra_data={
                                            "domain": target.primary_domain,
                                            "expiration_date": str(exp_raw),
                                            "days_until_expiration": days_left,
                                        },
                                    )
                                )
                        except Exception as e:
                            logger.debug(f"Could not parse RDAP expiration date '{exp_raw}': {e}")

        logger.info(f"Exposure analysis complete. Generated {len(signals)} factual exposure signals.")
        return signals

