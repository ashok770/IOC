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
    ) -> List[DetectedExposureSignal]:
        signals: List[DetectedExposureSignal] = []
        seen_keys: Set[str] = set()

        def add_signal(sig: DetectedExposureSignal):
            key = f"{sig.target_id}:{sig.asset_id}:{sig.signal_type}:{sig.title}"
            if key not in seen_keys:
                seen_keys.add(key)
                signals.append(sig)

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

        logger.info(f"Exposure analysis complete. Generated {len(signals)} factual exposure signals.")
        return signals
