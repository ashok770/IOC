import logging
from typing import List, Tuple, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.technology import Technology
from app.models.target import Target
from app.models.asset import Asset
from app.models.evidence import EvidenceItem
from app.models.finding import Finding
from analyzers.technology import TechnologyDetector, DetectedTechnology

logger = logging.getLogger(__name__)


class TechnologyService:
    """
    Manages Technology Intelligence persistence, deduplication, and retrieval.
    Connects detected technologies to targets, assets, and source evidence.
    """

    @staticmethod
    def extract_and_sync_technologies(
        db: Session,
        target: Target,
        evidence_items: List[EvidenceItem],
        assets: List[Asset],
    ) -> List[Technology]:
        """
        Runs the deterministic technology detector on verified evidence,
        upserts findings, and generates corresponding informational observation records.
        """
        detector = TechnologyDetector()
        detected_items = detector.detect(evidence_items=evidence_items, assets=assets)

        saved_technologies: List[Technology] = []
        now = datetime.now(timezone.utc)

        for item in detected_items:
            # Query existing technology
            existing = (
                db.query(Technology)
                .filter(
                    Technology.target_id == target.id,
                    Technology.asset_id == item.asset_id,
                    Technology.name == item.name,
                    Technology.category == item.category,
                )
                .first()
            )

            if existing:
                existing.last_seen = now
                if item.version:
                    existing.version = item.version
                existing.confidence = max(existing.confidence, item.confidence)
                existing.evidence_id = item.evidence_id
                if item.extra_data:
                    current_extra = existing.extra_data or {}
                    current_extra.update(item.extra_data)
                    existing.extra_data = current_extra
                saved_technologies.append(existing)
            else:
                tech_record = Technology(
                    target_id=target.id,
                    asset_id=item.asset_id,
                    name=item.name,
                    category=item.category,
                    version=item.version,
                    detection_method=item.detection_method,
                    confidence=item.confidence,
                    first_seen=now,
                    last_seen=now,
                    evidence_id=item.evidence_id,
                    extra_data=item.extra_data,
                )
                db.add(tech_record)
                saved_technologies.append(tech_record)

                # Generate factual informational finding (strictly info severity, no CVE guessing)
                version_str = f" v{item.version}" if item.version else ""
                cat_label = item.category.replace("_", " ").title()
                finding_record = Finding(
                    target_id=target.id,
                    category="technology",
                    title=f"Observed {cat_label}: {item.name}{version_str}",
                    description=(
                        f"Detected {item.name}{version_str} ({cat_label}) "
                        f"via {item.detection_method.replace('_', ' ')}. "
                        f"Deterministic confidence: {item.confidence:.2f}."
                    ),
                    severity="info",
                    confidence=item.confidence,
                    evidence_id=item.evidence_id,
                )
                db.add(finding_record)

        db.commit()
        return saved_technologies

    @staticmethod
    def list_target_technologies(
        db: Session,
        target_id: str,
        asset_id: Optional[str] = None,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Technology], int]:
        """Fetch paginated technologies cataloged under a target."""
        target = db.query(Target).filter(Target.id == target_id).first()
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target with ID '{target_id}' not found.",
            )

        query = db.query(Technology).filter(Technology.target_id == target_id)
        if asset_id:
            query = query.filter(Technology.asset_id == asset_id)
        if category:
            query = query.filter(Technology.category == category)

        total = query.count()
        items = query.order_by(Technology.confidence.desc(), Technology.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def list_asset_technologies(
        db: Session,
        asset_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Technology], int]:
        """Fetch paginated technologies linked directly to a specific asset."""
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Asset with ID '{asset_id}' not found.",
            )

        query = db.query(Technology).filter(Technology.asset_id == asset_id)
        total = query.count()
        items = query.order_by(Technology.confidence.desc(), Technology.created_at.desc()).offset(skip).limit(limit).all()
        return items, total
