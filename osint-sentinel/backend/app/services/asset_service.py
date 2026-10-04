import logging
import ipaddress
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.asset import Asset
from app.models.target import Target
from app.models.evidence import EvidenceItem

logger = logging.getLogger(__name__)


class AssetService:
    """
    Manages the Target Asset Inventory.
    Extracts, classifies, and catalogs discovered assets (Domain, Subdomain/Hostname,
    IP, and Certificate-associated hostname) from collected evidence.
    """

    @staticmethod
    def extract_and_sync_assets(
        db: Session,
        target: Target,
        evidence_items: List[EvidenceItem],
    ) -> List[Asset]:
        """
        Extracts assets from raw evidence items, deduplicates, and commits them to the asset inventory.
        """
        cataloged_assets: List[Asset] = []

        # 1. Primary domain asset
        AssetService._upsert_asset(
            db=db,
            target_id=target.id,
            asset_type="domain",
            value=target.primary_domain.lower(),
            source="target_registration",
            evidence_id=None,
            extra_data={"role": "primary_domain"},
            cataloged_list=cataloged_assets,
        )

        domain_lower = target.primary_domain.lower()

        # 2. Extract from Evidence Items
        for evidence in evidence_items:
            data = evidence.data or {}

            # DNS Records: IP addresses & Hostnames
            if evidence.evidence_type == "dns_record":
                record_type = data.get("record_type")

                # IP addresses from A and AAAA records
                if record_type in ("A", "AAAA"):
                    address = data.get("address")
                    if address:
                        clean_ip = address.strip()
                        classification = AssetService._classify_ip(clean_ip)
                        AssetService._upsert_asset(
                            db=db,
                            target_id=target.id,
                            asset_type="ip",
                            value=clean_ip,
                            source="DNS",
                            evidence_id=evidence.id,
                            extra_data={"record_type": record_type, "ttl": data.get("ttl"), "ip_classification": classification},
                            cataloged_list=cataloged_assets,
                        )

                # Subdomains from MX and NS records if within primary domain scope
                elif record_type == "MX":
                    exchange = data.get("exchange", "").lower().rstrip(".")
                    if exchange and (exchange.endswith(f".{domain_lower}") or exchange == domain_lower):
                        AssetService._upsert_asset(
                            db=db,
                            target_id=target.id,
                            asset_type="subdomain",
                            value=exchange,
                            source="DNS",
                            evidence_id=evidence.id,
                            extra_data={"record_type": "MX", "preference": data.get("preference")},
                            cataloged_list=cataloged_assets,
                        )

                elif record_type in ("NS", "CNAME"):
                    host = data.get("target", "").lower().rstrip(".")
                    if host and host.endswith(f".{domain_lower}"):
                        AssetService._upsert_asset(
                            db=db,
                            target_id=target.id,
                            asset_type="subdomain",
                            value=host,
                            source="DNS",
                            evidence_id=evidence.id,
                            extra_data={"record_type": record_type},
                            cataloged_list=cataloged_assets,
                        )

            # Certificate Transparency: Certificate-associated hostnames
            elif evidence.evidence_type == "certificate_hostnames":
                hostnames = data.get("discovered_hostnames", [])
                for host in hostnames:
                    clean_host = host.lower().strip().lstrip("*.")
                    if not clean_host:
                        continue

                    # If it's the root domain, ensure domain asset is tracked
                    if clean_host == domain_lower:
                        continue

                    # If it's a subdomain of the target domain
                    if clean_host.endswith(f".{domain_lower}"):
                        AssetService._upsert_asset(
                            db=db,
                            target_id=target.id,
                            asset_type="certificate_associated_hostname",
                            value=clean_host,
                            source="crt.sh",
                            evidence_id=evidence.id,
                            extra_data={"scope": "certificate_transparency_log"},
                            cataloged_list=cataloged_assets,
                        )

        db.commit()
        return cataloged_assets

    @staticmethod
    def _classify_ip(ip_str: str) -> str:
        """Classifies an IP address using standard ipaddress library."""
        try:
            ip = ipaddress.ip_address(ip_str)
            if ip.is_loopback:
                return "loopback"
            elif ip.is_link_local:
                return "link_local"
            elif ip.is_multicast:
                return "multicast"
            elif ip.is_unspecified:
                return "unspecified"
            elif ip.is_reserved:
                return "special_reserved"
            elif ip.is_private:
                return "private_internal"
            else:
                return "public"
        except ValueError:
            return "unknown"

    @staticmethod
    def _upsert_asset(
        db: Session,
        target_id: str,
        asset_type: str,
        value: str,
        source: str,
        evidence_id: Optional[str],
        extra_data: Optional[Dict[str, Any]],
        cataloged_list: List[Asset],
    ) -> Asset:
        """Helper to insert a new asset or update last_seen_at if already present."""
        existing = (
            db.query(Asset)
            .filter(
                Asset.target_id == target_id,
                Asset.asset_type == asset_type,
                Asset.value == value,
            )
            .first()
        )

        now = datetime.now(timezone.utc)
        if existing:
            existing.last_seen_at = now
            if extra_data:
                current_extra = existing.extra_data or {}
                current_extra.update(extra_data)
                existing.extra_data = current_extra
            cataloged_list.append(existing)
            return existing
        else:
            new_asset = Asset(
                target_id=target_id,
                asset_type=asset_type,
                value=value,
                source=source,
                first_evidence_id=evidence_id,
                discovered_at=now,
                last_seen_at=now,
                extra_data=extra_data,
            )
            db.add(new_asset)
            cataloged_list.append(new_asset)
            return new_asset

    @staticmethod
    def list_assets(
        db: Session,
        target_id: str,
        asset_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Asset], int]:
        """Fetch paginated assets belonging to a target, with optional asset_type filter."""
        query = db.query(Asset).filter(Asset.target_id == target_id)
        if asset_type:
            query = query.filter(Asset.asset_type == asset_type)

        total = query.count()
        items = query.order_by(Asset.discovered_at.desc()).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_asset_by_id(db: Session, target_id: str, asset_id: str) -> Optional[Asset]:
        """Fetch single asset by ID."""
        return (
            db.query(Asset)
            .filter(Asset.target_id == target_id, Asset.id == asset_id)
            .first()
        )
