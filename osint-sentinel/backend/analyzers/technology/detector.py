import logging
from typing import List, Dict, Any, Optional, Set
from pydantic import BaseModel, Field

from app.models.evidence import EvidenceItem
from app.models.asset import Asset
from analyzers.technology.rules import TECHNOLOGY_RULES, TechnologyRule

logger = logging.getLogger(__name__)


class DetectedTechnology(BaseModel):
    """Normalized technology observation emitted by the detector."""
    name: str
    category: str
    version: Optional[str] = None
    detection_method: str
    confidence: float
    evidence_id: Optional[str] = None
    asset_id: Optional[str] = None
    extra_data: Dict[str, Any] = Field(default_factory=dict)


class TechnologyDetector:
    """
    Evaluates verified Evidence records against deterministic technology signatures.
    Operates strictly on normalized evidence without active network interactions.
    Does NOT infer or guess technologies without unambiguous observable markers.
    """

    def __init__(self, rules: Optional[List[TechnologyRule]] = None):
        self.rules = rules or TECHNOLOGY_RULES

    def detect(
        self,
        evidence_items: List[EvidenceItem],
        assets: List[Asset],
    ) -> List[DetectedTechnology]:
        """
        Inspects evidence items and links detected technologies to the appropriate asset.
        """
        detected: List[DetectedTechnology] = []
        seen_keys: Set[str] = set()

        # Build lookup table of assets by (domain / value)
        domain_asset_map: Dict[str, str] = {}
        for a in assets:
            if a.asset_type in ("domain", "subdomain", "certificate_associated_hostname"):
                domain_asset_map[a.value.lower()] = a.id

        # Also identify the primary root domain asset ID if available
        primary_asset_id = next((a.id for a in assets if a.asset_type == "domain"), None)

        for evidence in evidence_items:
            data = evidence.data or {}

            # Case A: HTTP Response Headers & HTML Generator Meta Tags
            if evidence.evidence_type == "http_headers":
                headers = data.get("headers", {})
                meta_generators = data.get("meta_generators", [])
                probed_domain = data.get("domain", "").lower().strip()
                matched_asset_id = domain_asset_map.get(probed_domain) or primary_asset_id

                # 1. Header-based technology evaluation
                for rule in self.rules:
                    if rule.source_type == "http_headers" and rule.header_key:
                        header_val = headers.get(rule.header_key.lower())
                        if header_val and rule.pattern:
                            match = rule.pattern.search(header_val)
                            if match:
                                version: Optional[str] = None
                                if rule.version_regex:
                                    v_match = rule.version_regex.search(header_val)
                                    if v_match and v_match.groups():
                                        version = v_match.group(1).strip()

                                dedup_key = f"{rule.name}:{rule.category}:{matched_asset_id}"
                                if dedup_key not in seen_keys:
                                    seen_keys.add(dedup_key)
                                    detected.append(
                                        DetectedTechnology(
                                            name=rule.name,
                                            category=rule.category,
                                            version=version,
                                            detection_method=rule.detection_method,
                                            confidence=rule.confidence,
                                            evidence_id=evidence.id,
                                            asset_id=matched_asset_id,
                                            extra_data={
                                                "matched_header": rule.header_key,
                                                "raw_value": header_val,
                                                "probed_url": data.get("probed_url"),
                                            },
                                        )
                                    )

                    # 2. Meta tag generator evaluation
                    elif rule.source_type == "meta_tag":
                        for generator_str in meta_generators:
                            if rule.pattern:
                                match = rule.pattern.search(generator_str)
                                if match:
                                    version = None
                                    if rule.version_regex:
                                        v_match = rule.version_regex.search(generator_str)
                                        if v_match and v_match.groups():
                                            version = v_match.group(1).strip()

                                    dedup_key = f"{rule.name}:{rule.category}:{matched_asset_id}"
                                    if dedup_key not in seen_keys:
                                        seen_keys.add(dedup_key)
                                        detected.append(
                                            DetectedTechnology(
                                                name=rule.name,
                                                category=rule.category,
                                                version=version,
                                                detection_method=rule.detection_method,
                                                confidence=rule.confidence,
                                                evidence_id=evidence.id,
                                                asset_id=matched_asset_id,
                                                extra_data={
                                                    "meta_generator": generator_str,
                                                    "probed_url": data.get("probed_url"),
                                                },
                                            )
                                        )

            # Case B: DNS Record Analysis (e.g. MX records for Email providers)
            elif evidence.evidence_type == "dns_record":
                record_type = data.get("record_type")
                if record_type == "MX":
                    exchange = data.get("exchange", "")
                    for rule in self.rules:
                        if rule.source_type == "dns_record" and rule.header_key == "MX":
                            if rule.pattern and rule.pattern.search(exchange):
                                dedup_key = f"{rule.name}:{rule.category}:{primary_asset_id}"
                                if dedup_key not in seen_keys:
                                    seen_keys.add(dedup_key)
                                    detected.append(
                                        DetectedTechnology(
                                            name=rule.name,
                                            category=rule.category,
                                            version=None,
                                            detection_method=rule.detection_method,
                                            confidence=rule.confidence,
                                            evidence_id=evidence.id,
                                            asset_id=primary_asset_id,
                                            extra_data={
                                                "record_type": "MX",
                                                "exchange": exchange,
                                            },
                                        )
                                    )

        logger.info(f"Technology detection complete. Identified {len(detected)} technology indicators.")
        return detected
