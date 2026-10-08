import re
import logging
from typing import List, Dict, Any, Optional, Set, Union
from pydantic import BaseModel, Field

from analyzers.domain_analyzer import AnalysisFinding
from correlation.correlator import is_in_target_namespace

logger = logging.getLogger(__name__)

# Factual provider attribution patterns
PROVIDER_PATTERNS = [
    (re.compile(r"(?:google\.com|googlemail\.com|aspmx\.l\.google\.com|_spf\.google\.com|gstatic\.com)", re.I), "Google Workspace"),
    (re.compile(r"(?:outlook\.com|mail\.protection\.outlook\.com|office365\.com|azure\.com|microsoft\.com|msecnd\.net)", re.I), "Microsoft 365"),
    (re.compile(r"(?:cloudflare\.com|cloudflare\.net)", re.I), "Cloudflare"),
    (re.compile(r"(?:amazonaws\.com|cloudfront\.net|awsdns)", re.I), "Amazon Web Services"),
    (re.compile(r"(?:fastly\.net|fastlylb\.net)", re.I), "Fastly"),
    (re.compile(r"(?:akamai\.net|akamaiedge\.net|edgekey\.net)", re.I), "Akamai"),
    (re.compile(r"(?:pphosted\.com|proofpoint\.com)", re.I), "Proofpoint"),
    (re.compile(r"(?:protonmail\.ch|proton\.me)", re.I), "Proton"),
    (re.compile(r"(?:myshopify\.com|shopify\.com)", re.I), "Shopify"),
]


def infer_provider_from_hostname(hostname: str) -> str:
    """
    Deterministically attributes known external providers based on observed domain patterns.
    Returns 'Unknown' if no explicit pattern matches. Never invents attribution.
    """
    if not hostname:
        return "Unknown"
    host_clean = hostname.strip().lower()
    for pattern, provider_name in PROVIDER_PATTERNS:
        if pattern.search(host_clean):
            return provider_name
    return "Unknown"


class ExternalDependencyItem(BaseModel):
    """Normalized, factual external dependency item."""
    target_id: str
    referenced_entity: str
    provider_name: str = "Unknown"
    dependency_type: str  # DNS_CNAME, DNS_NAMESERVER, EMAIL_MX, EMAIL_SPF_INCLUDE, CERTIFICATE_EXTERNAL_REFERENCE, CDN, CLOUD, SAAS, OTHER_EXTERNAL_REFERENCE
    source: str           # DNS, SPF, CT, HTTP, TECHNOLOGY
    relationship_type: str = "externally_referenced"
    evidence_id: Optional[str] = None
    confidence: float = 1.0
    is_external: bool = True
    source_asset_value: Optional[str] = None
    extra_data: Dict[str, Any] = Field(default_factory=dict)


class ExternalDependencyResult(BaseModel):
    """Unified external dependency analysis result."""
    target_domain: str
    dependencies: List[ExternalDependencyItem] = Field(default_factory=list)
    total_dependencies: int = 0
    external_count: int = 0
    provider_summary: Dict[str, int] = Field(default_factory=dict)
    findings: List[AnalysisFinding] = Field(default_factory=list)


class ExternalDependencyAnalyzer:
    """
    Unified External Dependency Intelligence Analyzer.
    Aggregates external infrastructure references from DNS, SPF, CT, and Technology intelligence
    into a deterministic, evidence-backed inventory without asserting vulnerability or ownership.
    Performs ZERO network requests.
    """

    def analyze(
        self,
        target_domain: str,
        target_id: str = "target-default",
        evidence: Optional[List[Any]] = None,
        relationships: Optional[List[Any]] = None,
        technologies: Optional[List[Any]] = None,
        email_intel: Optional[Any] = None,
        cert_intel: Optional[Any] = None,
    ) -> ExternalDependencyResult:
        domain_clean = target_domain.lower().strip()
        result = ExternalDependencyResult(target_domain=domain_clean)

        raw_deps: List[ExternalDependencyItem] = []
        evidence_items = evidence or []
        rel_items = relationships or []
        tech_items = technologies or []

        # ---------------------------------------------------------------------
        # 1. Inspect Mapped Relationships (CNAME, NS, MX, SPF Includes)
        # ---------------------------------------------------------------------
        for rel in rel_items:
            rel_type = getattr(rel, "relationship_type", None) or (rel.get("relationship_type") if isinstance(rel, dict) else None)
            target_ref = getattr(rel, "target_id_reference", None) or (rel.get("target_id_reference") if isinstance(rel, dict) else None)
            extra = getattr(rel, "extra_data", None) or (rel.get("extra_data") or {} if isinstance(rel, dict) else {})
            ev_id = getattr(rel, "evidence_id", None) or (rel.get("evidence_id") if isinstance(rel, dict) else None)

            if not target_ref or not isinstance(target_ref, str):
                continue

            clean_ref = target_ref.strip().lower().rstrip(".")
            if not clean_ref:
                continue

            # Check if reference is outside target namespace
            is_internal = is_in_target_namespace(clean_ref, domain_clean)
            if is_internal:
                continue  # Target-owned asset, not an external dependency

            role = extra.get("role", "")
            cname_target = extra.get("cname_target")

            dep_type = "OTHER_EXTERNAL_REFERENCE"
            source = "DNS"

            if role == "spf_include":
                dep_type = "EMAIL_SPF_INCLUDE"
                source = "SPF"
            elif role == "mail_exchange":
                dep_type = "EMAIL_MX"
                source = "DNS"
            elif role == "nameserver":
                dep_type = "DNS_NAMESERVER"
                source = "DNS"
            elif cname_target:
                dep_type = "DNS_CNAME"
                source = "DNS"
            elif rel_type == "externally_referenced":
                dep_type = "OTHER_EXTERNAL_REFERENCE"
                source = "DNS"

            provider = infer_provider_from_hostname(clean_ref)

            conf_val = getattr(rel, "confidence", 1.0) if not isinstance(rel, dict) else rel.get("confidence", 1.0)
            if conf_val is None:
                conf_val = 1.0

            raw_deps.append(
                ExternalDependencyItem(
                    target_id=target_id,
                    referenced_entity=clean_ref,
                    provider_name=provider,
                    dependency_type=dep_type,
                    source=source,
                    relationship_type=rel_type or "externally_referenced",
                    evidence_id=ev_id,
                    confidence=float(conf_val),
                    is_external=True,
                    extra_data=extra,
                )
            )

        # ---------------------------------------------------------------------
        # 2. Inspect SPF Intelligence directly if provided
        # ---------------------------------------------------------------------
        if email_intel and hasattr(email_intel, "spf") and email_intel.spf.includes:
            spf_ev_id = email_intel.spf.evidence_id
            for inc in email_intel.spf.includes:
                clean_inc = inc.strip().lower().rstrip(".")
                if clean_inc and not is_in_target_namespace(clean_inc, domain_clean):
                    provider = infer_provider_from_hostname(clean_inc)
                    raw_deps.append(
                        ExternalDependencyItem(
                            target_id=target_id,
                            referenced_entity=clean_inc,
                            provider_name=provider,
                            dependency_type="EMAIL_SPF_INCLUDE",
                            source="SPF",
                            relationship_type="externally_referenced",
                            evidence_id=spf_ev_id,
                            confidence=0.95,
                            is_external=True,
                        )
                    )

        # ---------------------------------------------------------------------
        # 3. Inspect Certificate Intelligence directly if provided
        # ---------------------------------------------------------------------
        if cert_intel and hasattr(cert_intel, "certificates"):
            for cert in cert_intel.certificates:
                for san in cert.sans:
                    clean_san = san.strip().lower().rstrip(".")
                    if clean_san and not is_in_target_namespace(clean_san, domain_clean):
                        provider = infer_provider_from_hostname(clean_san)
                        raw_deps.append(
                            ExternalDependencyItem(
                                target_id=target_id,
                                referenced_entity=clean_san,
                                provider_name=provider,
                                dependency_type="CERTIFICATE_EXTERNAL_REFERENCE",
                                source="CT",
                                relationship_type="externally_referenced",
                                evidence_id=cert.evidence_id,
                                confidence=0.95,
                                is_external=True,
                            )
                        )

        # ---------------------------------------------------------------------
        # 4. Inspect Discovered Technologies (CDN, Cloud, SaaS, Email Providers)
        # ---------------------------------------------------------------------
        for tech in tech_items:
            t_name = getattr(tech, "name", None) or (tech.get("name") if isinstance(tech, dict) else None)
            t_cat = getattr(tech, "category", None) or (tech.get("category") if isinstance(tech, dict) else None)
            ev_id = getattr(tech, "evidence_id", None) or (tech.get("evidence_id") if isinstance(tech, dict) else None)

            if not t_name:
                continue

            if t_cat in ("cdn", "cloud", "cms", "email", "email_provider"):
                dep_type = "CDN" if t_cat == "cdn" else ("CLOUD" if t_cat == "cloud" else ("SAAS" if t_cat == "cms" else "EMAIL_PROVIDER"))
                provider = t_name if t_name != "Cloudflare Server" else "Cloudflare"

                raw_deps.append(
                    ExternalDependencyItem(
                        target_id=target_id,
                        referenced_entity=t_name,
                        provider_name=provider,
                        dependency_type=dep_type,
                        source="TECHNOLOGY",
                        relationship_type="externally_referenced",
                        evidence_id=ev_id,
                        confidence=0.90,
                        is_external=True,
                    )
                )

        # ---------------------------------------------------------------------
        # 5. Deduplicate Dependencies by (referenced_entity, dependency_type)
        # ---------------------------------------------------------------------
        dedup_map: Dict[str, ExternalDependencyItem] = {}
        for dep in raw_deps:
            key = f"{dep.referenced_entity.lower()}:{dep.dependency_type}"
            if key not in dedup_map:
                dedup_map[key] = dep
            else:
                # Merge evidence_id if missing
                if not dedup_map[key].evidence_id and dep.evidence_id:
                    dedup_map[key].evidence_id = dep.evidence_id

        unique_deps = list(dedup_map.values())
        result.dependencies = unique_deps
        result.total_dependencies = len(unique_deps)
        result.external_count = sum(1 for d in unique_deps if d.is_external)

        # Build provider summary
        prov_counts: Dict[str, int] = {}
        for d in unique_deps:
            p_name = d.provider_name or "Unknown"
            prov_counts[p_name] = prov_counts.get(p_name, 0) + 1
        result.provider_summary = prov_counts

        # ---------------------------------------------------------------------
        # 6. Dangling Reference Analysis (Factual & Evidence-Backed)
        # ---------------------------------------------------------------------
        findings: List[AnalysisFinding] = []

        if unique_deps:
            findings.append(
                AnalysisFinding(
                    category="external_dependencies",
                    title="External Infrastructure Dependency Intelligence Summary",
                    description=(
                        f"Identified {len(unique_deps)} external infrastructure dependencies for target '{domain_clean}'. "
                        f"Recognized providers include: {', '.join(list(prov_counts.keys())[:5])}."
                    ),
                    severity="info",
                    confidence=1.0,
                    evidence_type="dns_record",
                )
            )

        # Check for structurally invalid CNAME or NS targets without making takeover claims
        for dep in unique_deps:
            if dep.dependency_type in ("DNS_CNAME", "DNS_NAMESERVER"):
                ref = dep.referenced_entity
                if not ref or len(ref) < 3 or "." not in ref:
                    findings.append(
                        AnalysisFinding(
                            category="external_dependencies",
                            title=f"Structurally Incomplete External {dep.dependency_type} Target",
                            description=(
                                f"External reference target '{ref}' observed via {dep.source} "
                                f"is syntactically incomplete or lacks a valid top-level domain structure."
                            ),
                            severity="info",
                            confidence=0.90,
                            evidence_id=dep.evidence_id,
                            evidence_type="dns_record",
                        )
                    )

        result.findings = findings
        return result
