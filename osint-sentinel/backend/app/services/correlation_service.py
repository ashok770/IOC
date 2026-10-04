import logging
from typing import List, Tuple, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from fastapi import HTTPException, status

from app.models.target import Target
from app.models.asset import Asset
from app.models.technology import Technology
from app.models.evidence import EvidenceItem
from app.models.relationship import Relationship
from app.models.exposure_signal import ExposureSignal
from app.models.risk_assessment import RiskAssessment
from app.models.finding import Finding
from app.schemas.analysis import AnalysisSummaryResponse
from correlation import CorrelationEngine, ExposureAnalyzer

logger = logging.getLogger(__name__)


class CorrelationService:
    """
    Manages semantic relationship building, exposure signal evaluation,
    and analyst-oriented summary reporting.
    """

    @staticmethod
    def build_and_sync_relationships(
        db: Session,
        target: Target,
        assets: List[Asset],
        evidence_items: List[EvidenceItem],
        technologies: List[Technology],
    ) -> List[Relationship]:
        """
        Executes the CorrelationEngine and commits deduplicated relationship edges.
        """
        engine = CorrelationEngine()
        correlated_edges = engine.correlate(
            target=target,
            assets=assets,
            evidence_items=evidence_items,
            technologies=technologies,
        )

        saved_relationships: List[Relationship] = []

        for edge in correlated_edges:
            existing = (
                db.query(Relationship)
                .filter(
                    Relationship.target_id == target.id,
                    Relationship.source_type == edge.source_type,
                    Relationship.source_id == edge.source_id,
                    Relationship.relationship_type == edge.relationship_type,
                    Relationship.target_type == edge.target_type,
                    Relationship.target_id_reference == edge.target_id_reference,
                )
                .first()
            )

            if existing:
                existing.confidence = edge.confidence
                existing.evidence_id = edge.evidence_id
                if edge.extra_data:
                    current_extra = existing.extra_data or {}
                    current_extra.update(edge.extra_data)
                    existing.extra_data = current_extra
                saved_relationships.append(existing)
            else:
                rel_record = Relationship(
                    target_id=target.id,
                    source_type=edge.source_type,
                    source_id=edge.source_id,
                    relationship_type=edge.relationship_type,
                    target_type=edge.target_type,
                    target_id_reference=edge.target_id_reference,
                    evidence_id=edge.evidence_id,
                    confidence=edge.confidence,
                    extra_data=edge.extra_data,
                )
                db.add(rel_record)
                saved_relationships.append(rel_record)

        db.commit()
        return saved_relationships

    @staticmethod
    def evaluate_and_sync_exposure_signals(
        db: Session,
        target: Target,
        assets: List[Asset],
        technologies: List[Technology],
        relationships: List[Relationship],
    ) -> List[ExposureSignal]:
        """
        Executes ExposureAnalyzer, persists signals, and links them to findings.
        """
        analyzer = ExposureAnalyzer()
        raw_signals = analyzer.analyze(
            target=target,
            assets=assets,
            technologies=technologies,
            relationships=relationships,
        )

        saved_signals: List[ExposureSignal] = []

        for sig in raw_signals:
            existing = (
                db.query(ExposureSignal)
                .filter(
                    ExposureSignal.target_id == target.id,
                    ExposureSignal.asset_id == sig.asset_id,
                    ExposureSignal.signal_type == sig.signal_type,
                    ExposureSignal.title == sig.title,
                )
                .first()
            )

            if existing:
                existing.confidence = sig.confidence
                existing.description = sig.description
                existing.evidence_id = sig.evidence_id
                if sig.extra_data:
                    current_extra = existing.extra_data or {}
                    current_extra.update(sig.extra_data)
                    existing.extra_data = current_extra
                saved_signals.append(existing)
            else:
                signal_record = ExposureSignal(
                    target_id=target.id,
                    asset_id=sig.asset_id,
                    signal_type=sig.signal_type,
                    category=sig.category,
                    title=sig.title,
                    description=sig.description,
                    severity=sig.severity,
                    confidence=sig.confidence,
                    evidence_id=sig.evidence_id,
                    extra_data=sig.extra_data,
                )
                db.add(signal_record)
                saved_signals.append(signal_record)

                # Persist corresponding informational finding
                finding_record = Finding(
                    target_id=target.id,
                    category=sig.category,
                    title=sig.title,
                    description=sig.description,
                    severity="info",
                    confidence=sig.confidence,
                    evidence_id=sig.evidence_id,
                )
                db.add(finding_record)

        db.commit()
        return saved_signals

    @staticmethod
    def list_target_relationships(
        db: Session,
        target_id: str,
        relationship_type: Optional[str] = None,
        source_type: Optional[str] = None,
        target_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Relationship], int]:
        target = db.query(Target).filter(Target.id == target_id).first()
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target with ID '{target_id}' not found.",
            )

        query = db.query(Relationship).filter(Relationship.target_id == target_id)
        if relationship_type:
            query = query.filter(Relationship.relationship_type == relationship_type)
        if source_type:
            query = query.filter(Relationship.source_type == source_type)
        if target_type:
            query = query.filter(Relationship.target_type == target_type)

        total = query.count()
        items = query.order_by(Relationship.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def list_asset_relationships(
        db: Session,
        target_id: str,
        asset_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Relationship], int]:
        asset = db.query(Asset).filter(Asset.id == asset_id, Asset.target_id == target_id).first()
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Asset with ID '{asset_id}' not found.",
            )

        query = db.query(Relationship).filter(
            Relationship.target_id == target_id,
            or_(
                (Relationship.source_type == "asset") & (Relationship.source_id == asset_id),
                (Relationship.target_type == "asset") & (Relationship.target_id_reference == asset_id),
            )
        )
        total = query.count()
        items = query.order_by(Relationship.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def list_target_exposure_signals(
        db: Session,
        target_id: str,
        category: Optional[str] = None,
        min_confidence: Optional[float] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[ExposureSignal], int]:
        target = db.query(Target).filter(Target.id == target_id).first()
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target with ID '{target_id}' not found.",
            )

        query = db.query(ExposureSignal).filter(ExposureSignal.target_id == target_id)
        if category:
            query = query.filter(ExposureSignal.category == category)
        if min_confidence is not None:
            query = query.filter(ExposureSignal.confidence >= min_confidence)

        total = query.count()
        items = query.order_by(ExposureSignal.confidence.desc(), ExposureSignal.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_analysis_summary(db: Session, target_id: str) -> AnalysisSummaryResponse:
        target = db.query(Target).filter(Target.id == target_id).first()
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target with ID '{target_id}' not found.",
            )

        asset_count = db.query(func.count(Asset.id)).filter(Asset.target_id == target_id).scalar() or 0
        tech_count = db.query(func.count(Technology.id)).filter(Technology.target_id == target_id).scalar() or 0
        evidence_count = db.query(func.count(EvidenceItem.id)).filter(EvidenceItem.target_id == target_id).scalar() or 0
        rel_count = db.query(func.count(Relationship.id)).filter(Relationship.target_id == target_id).scalar() or 0
        signals_count = db.query(func.count(ExposureSignal.id)).filter(ExposureSignal.target_id == target_id).scalar() or 0
        findings_count = db.query(func.count(Finding.id)).filter(Finding.target_id == target_id).scalar() or 0

        assessment = db.query(RiskAssessment).filter(RiskAssessment.target_id == target_id).first()
        risk_score = assessment.overall_score if assessment else None
        risk_level = assessment.risk_level if assessment else None

        return AnalysisSummaryResponse(
            target_id=target.id,
            domain=target.primary_domain,
            assets=asset_count,
            technologies=tech_count,
            evidence_items=evidence_count,
            relationships=rel_count,
            exposure_signals=signals_count,
            informational_findings=findings_count,
            overall_risk_score=risk_score,
            risk_level=risk_level,
        )
