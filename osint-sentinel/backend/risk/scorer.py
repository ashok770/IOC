import logging
import re
from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Set

from app.models.target import Target
from app.models.asset import Asset
from app.models.technology import Technology
from app.models.relationship import Relationship
from app.models.exposure_signal import ExposureSignal
from app.models.evidence import EvidenceItem

logger = logging.getLogger(__name__)


@dataclass
class AssetPriorityResult:
    asset_id: str
    asset_value: str
    asset_type: str
    priority_score: float
    priority_level: str
    contributing_factors: List[Dict[str, Any]]


@dataclass
class TargetRiskResult:
    target_id: str
    overall_score: float
    risk_level: str
    factors_breakdown: Dict[str, float]
    recommendations: List[Dict[str, Any]]
    asset_priorities: List[AssetPriorityResult]


def _normalize_tech_family(name: str) -> str:
    """
    Normalizes technology name to vendor/product family to prevent duplicate penalties
    (e.g., 'Cloudflare' and 'Cloudflare Server' map to 'cloudflare').
    """
    clean = name.strip().lower()
    clean = re.sub(r"\s+server$", "", clean)
    clean = re.sub(r"\s+http server$", "", clean)
    clean = re.sub(r"\s+framework$", "", clean)
    clean = re.sub(r"\s+cdn$", "", clean)
    return clean.strip() or name.lower().strip()


class DeterministicRiskScorer:
    """
    Computes explainable, deterministic external exposure assessment scores and asset prioritization.
    Adheres strictly to factual observations; contains zero CVE guesswork or speculative CVSS inflation.
    
    Terminology:
    - Overall Score (0.0 to 100.0): External exposure and investigation priority metric.
    - Risk Level: OSINT Sentinel heuristic assessment tier (low, medium, high, critical).
    """

    @classmethod
    def evaluate(
        cls,
        target: Target,
        assets: List[Asset],
        evidence_items: List[EvidenceItem],
        technologies: List[Technology],
        relationships: List[Relationship],
        exposure_signals: List[ExposureSignal],
    ) -> TargetRiskResult:
        factors_breakdown = {
            "perimeter_exposure": 0.0,
            "email_defense_posture": 0.0,
            "technology_disclosure": 0.0,
            "external_dependencies": 0.0,
        }
        recommendations: List[Dict[str, Any]] = []

        # ---------------------------------------------------------------------
        # 1. Perimeter Exposure Scoring (Max: 35.0)
        # ---------------------------------------------------------------------
        remote_signals = [s for s in exposure_signals if s.signal_type == "remote_access_indicator"]
        dev_signals = [s for s in exposure_signals if s.signal_type == "development_test_indicator"]

        if remote_signals:
            factors_breakdown["perimeter_exposure"] += 20.0
            first_sig = remote_signals[0]
            recommendations.append({
                "priority": "P1_urgent",
                "category": "perimeter_exposure",
                "title": "Publicly Identifiable Remote-Access Gateway",
                "evidence_id": first_sig.evidence_id,
                "action": "Audit external access portals; verify enforcement of strong multi-factor authentication (MFA) and consider restricting access via IP allowlisting or zero-trust network access (ZTNA).",
                "rationale": "Public DNS reveals remote access infrastructure (e.g. VPN/Gateway), exposing authentication entrypoints to external observation.",
                "recommended_investigation": "Verify whether the identified gateway is intentionally internet-facing and ensure access policies are strictly enforced.",
            })

        if dev_signals:
            factors_breakdown["perimeter_exposure"] += 15.0
            first_sig = dev_signals[0]
            recommendations.append({
                "priority": "P2_high",
                "category": "non_production_exposure",
                "title": "Public Exposure of Pre-Production Hostnames",
                "evidence_id": first_sig.evidence_id,
                "action": "Relocate development, staging, or test environments to private split-horizon DNS zones or restrict ingress behind an authenticated access proxy.",
                "rationale": "Development and testing hostnames disclosed in public DNS may host unhardened application code, debugging interfaces, or non-production data.",
                "recommended_investigation": "Verify if pre-production environments are accessible from the public internet without perimeter authentication.",
            })

        factors_breakdown["perimeter_exposure"] = min(35.0, factors_breakdown["perimeter_exposure"])

        # ---------------------------------------------------------------------
        # 2. Email Defense Posture Scoring (Max: 30.0)
        # Audit Requirement: DNS query failed != SPF/DMARC missing
        # Uses structured EmailAnalyzer results; no inline regex parsing
        # ---------------------------------------------------------------------
        from analyzers.email_analyzer import EmailAnalyzer
        email_intel = EmailAnalyzer().analyze(target.primary_domain, evidence_items)
        spf_info = email_intel.spf
        dmarc_info = email_intel.dmarc

        if spf_info.query_executed:
            if not spf_info.present:
                factors_breakdown["email_defense_posture"] += 15.0
                recommendations.append({
                    "priority": "P2_high",
                    "category": "email_defense",
                    "title": "Missing SPF Record",
                    "evidence_id": spf_info.evidence_id,
                    "action": "Publish a valid SPF (Sender Policy Framework) TXT record specifying authorized sending mail servers with a strict '-all' qualifier.",
                    "rationale": "The authoritative nameserver returned no SPF record for the apex domain, permitting unauthorized senders to forge mail from this domain.",
                    "recommended_investigation": "Review mail routing architecture and implement an authorized SPF record to protect domain reputation.",
                })
            elif spf_info.all_qualifier in ("+all", "?all"):
                factors_breakdown["email_defense_posture"] += 10.0
                recommendations.append({
                    "priority": "P3_medium",
                    "category": "email_defense",
                    "title": "Permissive SPF Policy (+all or ?all)",
                    "evidence_id": spf_info.evidence_id,
                    "action": "Update SPF policy from permissive qualifiers (+all or ?all) to hard fail ('-all') or soft fail ('~all').",
                    "rationale": "Lax SPF qualifiers instruct receivers to treat unverified senders permissively, significantly weakening spoofing protection.",
                    "recommended_investigation": "Audit SPF sending IP mechanisms and restrict policy to designated relays.",
                })
            elif spf_info.all_qualifier == "~all":
                factors_breakdown["email_defense_posture"] += 3.0
            # "-all" receives 0.0 penalty (optimal posture)
        else:
            logger.info(f"Target {target.id}: Apex TXT DNS query was not executed or failed; skipping SPF penalty.")

        if dmarc_info.query_executed or (spf_info.query_executed and dmarc_info.present):
            if not dmarc_info.present:
                factors_breakdown["email_defense_posture"] += 15.0
                recommendations.append({
                    "priority": "P2_high",
                    "category": "email_defense",
                    "title": "Missing DMARC Policy",
                    "evidence_id": dmarc_info.evidence_id,
                    "action": "Configure a _dmarc TXT record with at least 'p=none' for aggregate reporting, progressing toward 'p=quarantine' or 'p=reject'.",
                    "rationale": "Authoritative nameservers confirmed no DMARC record at _dmarc; receiving mail servers lack instructions on handling unauthenticated messages.",
                    "recommended_investigation": "Publish a DMARC policy with a valid rua/ruf mailbox to monitor email spoofing telemetry.",
                })
            elif dmarc_info.policy == "none":
                factors_breakdown["email_defense_posture"] += 8.0
                recommendations.append({
                    "priority": "P3_medium",
                    "category": "email_defense",
                    "title": "Non-Enforcing DMARC Policy (p=none)",
                    "evidence_id": dmarc_info.evidence_id,
                    "action": "Graduate DMARC policy from 'p=none' (reporting mode) to 'p=quarantine' or 'p=reject' once legitimate sending sources are validated.",
                    "rationale": "A DMARC policy with 'p=none' collects telemetry but does not instruct receivers to reject or quarantine fraudulent messages.",
                    "recommended_investigation": "Analyze DMARC aggregate reports to confirm all legitimate senders are aligned before enforcing p=reject.",
                })
            # "p=quarantine" or "p=reject" receives 0.0 penalty (optimal posture)
        else:
            logger.info(f"Target {target.id}: DMARC DNS query was not executed or failed; skipping DMARC penalty.")

        factors_breakdown["email_defense_posture"] = min(30.0, factors_breakdown["email_defense_posture"])


        # ---------------------------------------------------------------------
        # 3. Technology Disclosure Scoring (Max: 20.0)
        # Audit Requirement: Prevent score inflation from multiple technology detections
        # Deduplicate technologies by normalized vendor/family across target
        # ---------------------------------------------------------------------
        tech_families: Dict[str, Dict[str, Any]] = {}
        for t in technologies:
            fam = _normalize_tech_family(t.name)
            if fam not in tech_families:
                tech_families[fam] = {
                    "name": t.name,
                    "version": t.version,
                    "evidence_id": t.evidence_id,
                }
            elif t.version and not tech_families[fam]["version"]:
                tech_families[fam]["version"] = t.version
                tech_families[fam]["evidence_id"] = t.evidence_id

        versioned_families = [fam for fam, data in tech_families.items() if data["version"]]
        unversioned_families = [fam for fam, data in tech_families.items() if not data["version"]]

        if versioned_families:
            factors_breakdown["technology_disclosure"] += min(15.0, len(versioned_families) * 7.5)
            first_v = tech_families[versioned_families[0]]
            recommendations.append({
                "priority": "P3_medium",
                "category": "technology_exposure",
                "title": "Granular Software Version Disclosed in Public Headers",
                "evidence_id": first_v["evidence_id"],
                "action": "Disable server signature banners and technology tokens (e.g., set ServerTokens Prod in Apache, expose_php = Off in PHP).",
                "rationale": f"Public HTTP response headers disclose granular version tokens (e.g. {first_v['name']} {first_v['version']}), facilitating targeted reconnaissance.",
                "recommended_investigation": "Inspect web server and reverse proxy response headers to ensure version banners are suppressed.",
            })

        if unversioned_families:
            factors_breakdown["technology_disclosure"] += min(5.0, len(unversioned_families) * 2.5)

        factors_breakdown["technology_disclosure"] = min(20.0, factors_breakdown["technology_disclosure"])

        # ---------------------------------------------------------------------
        # 4. External Dependencies & Architectural Footprint (Max: 10.0)
        # Audit Requirement: Third-party infrastructure is an architectural dependency, not a vulnerability
        # ---------------------------------------------------------------------
        ext_rel_count = sum(1 for r in relationships if r.relationship_type == "externally_referenced")
        if ext_rel_count >= 3:
            factors_breakdown["external_dependencies"] = 8.0
        elif ext_rel_count >= 1:
            factors_breakdown["external_dependencies"] = 4.0
        else:
            factors_breakdown["external_dependencies"] = 0.0

        # ---------------------------------------------------------------------
        # Composite Target Score Calculation
        # ---------------------------------------------------------------------
        overall_score = round(sum(factors_breakdown.values()), 1)
        overall_score = min(100.0, max(0.0, overall_score))

        # OSINT Sentinel Heuristic Assessment Thresholds
        if overall_score >= 75.0:
            risk_level = "critical"
        elif overall_score >= 50.0:
            risk_level = "high"
        elif overall_score >= 25.0:
            risk_level = "medium"
        else:
            risk_level = "low"

        # ---------------------------------------------------------------------
        # Asset Prioritization Computation
        # ---------------------------------------------------------------------
        asset_priorities = cls._prioritize_assets(
            target=target,
            assets=assets,
            exposure_signals=exposure_signals,
            technologies=technologies,
            relationships=relationships,
        )

        return TargetRiskResult(
            target_id=target.id,
            overall_score=overall_score,
            risk_level=risk_level,
            factors_breakdown=factors_breakdown,
            recommendations=recommendations,
            asset_priorities=asset_priorities,
        )

    @classmethod
    def _prioritize_assets(
        cls,
        target: Target,
        assets: List[Asset],
        exposure_signals: List[ExposureSignal],
        technologies: List[Technology],
        relationships: List[Relationship],
    ) -> List[AssetPriorityResult]:
        """
        Calculates triage priority score and tier (P1-P4) for each asset.
        Priority reflects required analyst attention, NOT confirmed vulnerability.
        Includes bounded technology aggregation to prevent multi-technology score inflation.
        """
        signals_by_asset: Dict[str, List[ExposureSignal]] = {}
        for sig in exposure_signals:
            if sig.asset_id:
                signals_by_asset.setdefault(sig.asset_id, []).append(sig)

        techs_by_asset: Dict[str, List[Technology]] = {}
        for t in technologies:
            if t.asset_id:
                techs_by_asset.setdefault(t.asset_id, []).append(t)

        ext_by_asset: Dict[str, List[Relationship]] = {}
        for r in relationships:
            if r.source_type == "asset" and r.relationship_type == "externally_referenced":
                ext_by_asset.setdefault(r.source_id, []).append(r)

        prioritized_assets: List[AssetPriorityResult] = []

        for asset in assets:
            score = 0.0
            factors: List[Dict[str, Any]] = []

            # 1. Base weight by asset role
            if asset.asset_type == "domain":
                score += 10.0
                factors.append({
                    "factor": "primary_domain_asset",
                    "score_impact": 10.0,
                    "reason": "Root assessment scope boundary",
                    "evidence_id": asset.first_evidence_id,
                    "recommended_investigation": "Validate scope boundary and evaluate public DNS posture.",
                })
            elif asset.asset_type == "subdomain":
                score += 10.0
                factors.append({
                    "factor": "subdomain_asset",
                    "score_impact": 10.0,
                    "reason": "Routable external hostname",
                    "evidence_id": asset.first_evidence_id,
                    "recommended_investigation": "Verify whether this hostname hosts intended public services.",
                })
            elif asset.asset_type == "ip":
                ip_class = (asset.extra_data or {}).get("ip_classification", "public")
                if ip_class == "public":
                    score += 5.0
                    factors.append({
                        "factor": "resolved_ip_asset",
                        "score_impact": 5.0,
                        "reason": "Resolved public IPv4/IPv6 address",
                        "evidence_id": asset.first_evidence_id,
                        "recommended_investigation": "Confirm IP ownership and hosting provider allocation.",
                    })
            else:
                score += 5.0

            # 2. Exposure signals contribution
            asset_sigs = signals_by_asset.get(asset.id, [])
            for sig in asset_sigs:
                if sig.signal_type == "remote_access_indicator":
                    score += 55.0
                    factors.append({
                        "factor": "remote_access_portal",
                        "score_impact": 55.0,
                        "reason": f"Hostname '{asset.value}' indicates potential remote-access infrastructure",
                        "evidence_id": sig.evidence_id,
                        "recommended_investigation": "Verify multi-factor authentication enforcement and assess exposure level.",
                    })
                elif sig.signal_type == "development_test_indicator":
                    score += 35.0
                    factors.append({
                        "factor": "development_test_host",
                        "score_impact": 35.0,
                        "reason": f"Hostname '{asset.value}' indicates potential staging/pre-production environment",
                        "evidence_id": sig.evidence_id,
                        "recommended_investigation": "Verify whether pre-production services should be exposed to public DNS.",
                    })

            # 3. Bounded Technology Exposure Contribution (Max: 20.0 per asset)
            # Group technologies by family to prevent double counting Cloudflare Server + Cloudflare
            asset_techs = techs_by_asset.get(asset.id, [])
            asset_families: Dict[str, Technology] = {}
            for t in asset_techs:
                fam = _normalize_tech_family(t.name)
                if fam not in asset_families or (t.version and not asset_families[fam].version):
                    asset_families[fam] = t

            tech_score = 0.0
            for fam, tech in asset_families.items():
                if tech.version:
                    impact = 15.0
                    reason_msg = f"Disclosed {tech.name} with granular version {tech.version}"
                else:
                    impact = 8.0
                    reason_msg = f"Identified software component {tech.name} ({tech.category})"
                
                # Check remaining capacity up to cap of 20.0
                remaining = max(0.0, 20.0 - tech_score)
                actual_impact = min(impact, remaining)
                if actual_impact > 0:
                    tech_score += actual_impact
                    factors.append({
                        "factor": "disclosed_software_stack",
                        "score_impact": actual_impact,
                        "reason": reason_msg,
                        "evidence_id": tech.evidence_id,
                        "recommended_investigation": "Review server header suppression to minimize reconnaissance visibility.",
                    })
            score += tech_score

            # 4. External Dependencies Contribution (Max: 5.0 per asset)
            asset_ext = ext_by_asset.get(asset.id, [])
            if asset_ext:
                score += 5.0
                factors.append({
                    "factor": "external_infrastructure_delegation",
                    "score_impact": 5.0,
                    "reason": f"Delegates routing to {len(asset_ext)} external provider(s) (target ownership not assumed)",
                    "evidence_id": asset_ext[0].evidence_id,
                    "recommended_investigation": "Verify third-party DNS/mail delegations to prevent dangling resource takeovers.",
                })

            final_score = round(min(100.0, score), 1)

            # OSINT Sentinel Analyst Triage Priority Thresholds
            if final_score >= 70.0:
                priority_level = "p1_urgent"
            elif final_score >= 45.0:
                priority_level = "p2_high"
            elif final_score >= 25.0:
                priority_level = "p3_medium"
            else:
                priority_level = "p4_low"

            prioritized_assets.append(
                AssetPriorityResult(
                    asset_id=asset.id,
                    asset_value=asset.value,
                    asset_type=asset.asset_type,
                    priority_score=final_score,
                    priority_level=priority_level,
                    contributing_factors=factors,
                )
            )

        prioritized_assets.sort(key=lambda a: a.priority_score, reverse=True)
        return prioritized_assets
