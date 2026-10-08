import logging
from typing import List, Dict, Any, Optional, Set
from pydantic import BaseModel, Field

from app.models.target import Target
from app.models.asset import Asset
from app.models.evidence import EvidenceItem
from app.models.technology import Technology

logger = logging.getLogger(__name__)


class CorrelatedRelationship(BaseModel):
    """Normalized relationship edge to be persisted into the semantic graph."""
    source_type: str
    source_id: str
    relationship_type: str
    target_type: str
    target_id_reference: str
    evidence_id: Optional[str] = None
    confidence: float = 1.0
    extra_data: Dict[str, Any] = Field(default_factory=dict)


def is_in_target_namespace(hostname: str, target_domain: str) -> bool:
    """
    Deterministic namespace matcher.
    Ensures that only exact domain matches or subdomains are correlated.
    Handles wildcards correctly (*.example.org -> example.org).
    Explicitly rejects lookalike or unrelated domains (e.g. example-other.org or notexample.org).
    """
    clean_host = hostname.lower().strip().lstrip("*.")
    clean_target = target_domain.lower().strip().lstrip("*.")

    if not clean_host or not clean_target:
        return False

    if clean_host == clean_target:
        return True

    # Must be a strict dot-delimited subdomain
    if clean_host.endswith(f".{clean_target}"):
        return True

    return False


class CorrelationEngine:
    """
    Constructs deterministic, factual semantic relationships between
    Targets, Assets, Evidence, Technologies, and External References.
    Does NOT assert target ownership over external infrastructure.
    """

    def correlate(
        self,
        target: Target,
        assets: List[Asset],
        evidence_items: List[EvidenceItem],
        technologies: List[Technology],
    ) -> List[CorrelatedRelationship]:
        relationships: List[CorrelatedRelationship] = []
        seen_edges: Set[str] = set()

        def add_relationship(rel: CorrelatedRelationship):
            key = f"{rel.source_type}:{rel.source_id}:{rel.relationship_type}:{rel.target_type}:{rel.target_id_reference}"
            if key not in seen_edges:
                seen_edges.add(key)
                relationships.append(rel)

        target_domain_lower = target.primary_domain.lower()

        # Map asset lookups
        asset_by_value: Dict[str, Asset] = {a.value.lower(): a for a in assets}
        domain_asset = next((a for a in assets if a.asset_type == "domain"), None)
        domain_asset_id = domain_asset.id if domain_asset else target.id

        # ---------------------------------------------------------------------
        # 1. Target -> Asset (contains)
        # ---------------------------------------------------------------------
        for asset in assets:
            add_relationship(
                CorrelatedRelationship(
                    source_type="target",
                    source_id=target.id,
                    relationship_type="contains",
                    target_type="asset",
                    target_id_reference=asset.id,
                    evidence_id=asset.first_evidence_id,
                    confidence=1.0,
                    extra_data={"asset_type": asset.asset_type, "asset_value": asset.value},
                )
            )

            # -----------------------------------------------------------------
            # 2. Asset -> Evidence (supported_by)
            # -----------------------------------------------------------------
            if asset.first_evidence_id:
                add_relationship(
                    CorrelatedRelationship(
                        source_type="asset",
                        source_id=asset.id,
                        relationship_type="supported_by",
                        target_type="evidence",
                        target_id_reference=asset.first_evidence_id,
                        evidence_id=asset.first_evidence_id,
                        confidence=1.0,
                    )
                )

        # ---------------------------------------------------------------------
        # 3. DNS Correlations (resolves_to, references, externally_referenced)
        # ---------------------------------------------------------------------
        for evidence in evidence_items:
            if evidence.evidence_type != "dns_record":
                continue

            raw_data = evidence.data or {}
            dns_records = []
            if "record_type" in raw_data:
                dns_records.append(raw_data)
            else:
                domain_val = raw_data.get("domain", target_domain_lower)
                for ip in raw_data.get("A", []) if isinstance(raw_data.get("A"), list) else ([raw_data.get("A")] if raw_data.get("A") else []):
                    dns_records.append({"record_type": "A", "domain": domain_val, "address": str(ip)})
                for ip in raw_data.get("AAAA", []) if isinstance(raw_data.get("AAAA"), list) else ([raw_data.get("AAAA")] if raw_data.get("AAAA") else []):
                    dns_records.append({"record_type": "AAAA", "domain": domain_val, "address": str(ip)})
                for cname in raw_data.get("CNAME", []) if isinstance(raw_data.get("CNAME"), list) else ([raw_data.get("CNAME")] if raw_data.get("CNAME") else []):
                    dns_records.append({"record_type": "CNAME", "domain": domain_val, "target": str(cname)})
                for mx in raw_data.get("MX", []) if isinstance(raw_data.get("MX"), list) else ([raw_data.get("MX")] if raw_data.get("MX") else []):
                    if isinstance(mx, str):
                        parts = mx.strip().split()
                        exchange = parts[1] if len(parts) > 1 else parts[0]
                        dns_records.append({"record_type": "MX", "domain": domain_val, "exchange": exchange})
                    elif isinstance(mx, dict):
                        dns_records.append({"record_type": "MX", "domain": domain_val, "exchange": mx.get("exchange", "")})
                for ns in raw_data.get("NS", []) if isinstance(raw_data.get("NS"), list) else ([raw_data.get("NS")] if raw_data.get("NS") else []):
                    dns_records.append({"record_type": "NS", "domain": domain_val, "target": str(ns)})

            for data in dns_records:
                record_type = data.get("record_type")
                probed_domain = data.get("domain", "").lower().strip()
                source_asset = asset_by_value.get(probed_domain) or domain_asset
                source_id = source_asset.id if source_asset else target.id

                # A and AAAA records: Hostname -> resolves_to -> IP
                if record_type in ("A", "AAAA"):
                    ip_address = data.get("address", "").strip()
                    if ip_address:
                        ip_asset = asset_by_value.get(ip_address)
                        target_id_ref = ip_asset.id if ip_asset else ip_address
                        target_type = "asset" if ip_asset else "external_entity"

                        add_relationship(
                            CorrelatedRelationship(
                                source_type="asset",
                                source_id=source_id,
                                relationship_type="resolves_to",
                                target_type=target_type,
                                target_id_reference=target_id_ref,
                                evidence_id=evidence.id,
                                confidence=1.0,
                                extra_data={"record_type": record_type, "ip": ip_address},
                            )
                        )

                # CNAME record: Hostname -> references -> Canonical Hostname
                elif record_type == "CNAME":
                    cname_target = data.get("target", "").lower().rstrip(".")
                    if cname_target:
                        target_asset = asset_by_value.get(cname_target)
                        is_in_scope = is_in_target_namespace(cname_target, target_domain_lower)
                        target_type = "asset" if target_asset else "external_entity"
                        target_id_ref = target_asset.id if target_asset else cname_target

                        add_relationship(
                            CorrelatedRelationship(
                                source_type="asset",
                                source_id=source_id,
                                relationship_type="references",
                                target_type=target_type,
                                target_id_reference=target_id_ref,
                                evidence_id=evidence.id,
                                confidence=0.95,
                                extra_data={"cname_target": cname_target, "in_scope": is_in_scope},
                            )
                        )

                # MX record: Domain -> externally_referenced -> Mail Provider
                elif record_type == "MX":
                    exchange = data.get("exchange", "").lower().rstrip(".")
                    if exchange:
                        is_internal = is_in_target_namespace(exchange, target_domain_lower)
                        rel_type = "references" if is_internal else "externally_referenced"
                        target_asset = asset_by_value.get(exchange)
                        target_type = "asset" if target_asset else "external_entity"
                        target_id_ref = target_asset.id if target_asset else exchange

                        add_relationship(
                            CorrelatedRelationship(
                                source_type="asset",
                                source_id=source_id,
                                relationship_type=rel_type,
                                target_type=target_type,
                                target_id_reference=target_id_ref,
                                evidence_id=evidence.id,
                                confidence=0.95,
                                extra_data={
                                    "role": "mail_exchange",
                                    "preference": data.get("preference"),
                                    "target_owned": is_internal,
                                },
                            )
                        )

                # NS record: Domain -> externally_referenced -> Nameserver
                elif record_type == "NS":
                    nameserver = data.get("target", "").lower().rstrip(".")
                    if nameserver:
                        is_internal = is_in_target_namespace(nameserver, target_domain_lower)
                        rel_type = "references" if is_internal else "externally_referenced"
                        target_asset = asset_by_value.get(nameserver)
                        target_type = "asset" if target_asset else "external_entity"
                        target_id_ref = target_asset.id if target_asset else nameserver

                        add_relationship(
                            CorrelatedRelationship(
                                source_type="asset",
                                source_id=source_id,
                                relationship_type=rel_type,
                                target_type=target_type,
                                target_id_reference=target_id_ref,
                                evidence_id=evidence.id,
                                confidence=0.95,
                                extra_data={"role": "nameserver", "target_owned": is_internal},
                            )
                        )

                # TXT record: Domain -> SPF include external delegations
                elif record_type == "TXT" or "v=spf1" in str(data.get("value", "")).lower():
                    raw_val = str(data.get("value", ""))
                    if "v=spf1" in raw_val.lower():
                        from analyzers.email_analyzer import EmailAnalyzer
                        intel = EmailAnalyzer().analyze(target_domain_lower, [evidence])
                        for inc in intel.spf.includes:
                            inc_clean = inc.lower().strip().rstrip(".")
                            if inc_clean:
                                is_internal = is_in_target_namespace(inc_clean, target_domain_lower)
                                rel_type = "references" if is_internal else "externally_referenced"
                                target_asset = asset_by_value.get(inc_clean)
                                target_type = "asset" if target_asset else "external_entity"
                                target_id_ref = target_asset.id if target_asset else inc_clean

                                add_relationship(
                                    CorrelatedRelationship(
                                        source_type="asset",
                                        source_id=source_id,
                                        relationship_type=rel_type,
                                        target_type=target_type,
                                        target_id_reference=target_id_ref,
                                        evidence_id=evidence.id,
                                        confidence=0.95,
                                        extra_data={"role": "spf_include", "target_owned": is_internal},
                                    )
                                )


        # ---------------------------------------------------------------------
        # 4. Certificate Transparency Correlations (certificate_associated_with)
        # ---------------------------------------------------------------------
        for evidence in evidence_items:
            if evidence.evidence_type not in ("certificate_transparency", "certificate_log_sample", "certificate_entry", "certificate_hostnames"):
                continue
            data = evidence.data or {}
            cert_list = data.get("sample_entries") or data.get("certificates") or []
            if not cert_list and "discovered_hostnames" in data:
                cert_list = data.get("discovered_hostnames", [])
            for cert in cert_list:
                names = set()
                if isinstance(cert, dict):
                    cn = cert.get("common_name")
                    if cn:
                        names.add(cn)
                    dns_names = cert.get("dns_names", [])
                    if isinstance(dns_names, list):
                        names.update(dns_names)
                    elif isinstance(dns_names, str):
                        names.add(dns_names)
                elif isinstance(cert, str):
                    names.add(cert)

                for host_entry in names:
                    clean_host = host_entry.strip().lower().lstrip("*.")
                    # Only associate if in target namespace
                    if is_in_target_namespace(host_entry, target_domain_lower):
                        target_asset = asset_by_value.get(clean_host) or domain_asset
                        if target_asset:
                            add_relationship(
                                CorrelatedRelationship(
                                    source_type="certificate_hostname",
                                    source_id=host_entry,
                                    relationship_type="certificate_associated_with",
                                    target_type="asset",
                                    target_id_reference=target_asset.id,
                                    evidence_id=evidence.id,
                                    confidence=0.95,
                                    extra_data={"certificate_name": host_entry},
                                )
                            )

        for asset in assets:
            if asset.asset_type in ("certificate_associated_hostname", "certificate_hostname"):
                if is_in_target_namespace(asset.value, target_domain_lower):
                    add_relationship(
                        CorrelatedRelationship(
                            source_type="asset",
                            source_id=asset.id,
                            relationship_type="certificate_associated_with",
                            target_type="asset",
                            target_id_reference=domain_asset_id,
                            evidence_id=asset.first_evidence_id,
                            confidence=0.95,
                            extra_data={"scope": "in_namespace_certificate_hostname"},
                        )
                    )

        # ---------------------------------------------------------------------
        # 5. Asset -> Technology Relationships (technology_observed_on)
        # ---------------------------------------------------------------------
        for tech in technologies:
            source_asset_id = tech.asset_id or domain_asset_id
            add_relationship(
                CorrelatedRelationship(
                    source_type="asset",
                    source_id=source_asset_id,
                    relationship_type="technology_observed_on",
                    target_type="technology",
                    target_id_reference=tech.id,
                    evidence_id=tech.evidence_id,
                    confidence=tech.confidence,
                    extra_data={
                        "technology_name": tech.name,
                        "category": tech.category,
                        "version": tech.version,
                    },
                )
            )

        logger.info(f"Correlation completed. Formed {len(relationships)} semantic relationships.")
        return relationships
