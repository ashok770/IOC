import logging
from typing import List, Tuple, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.target import Target
from app.models.asset import Asset
from app.models.technology import Technology
from app.models.evidence import EvidenceItem
from app.models.relationship import Relationship
from app.models.exposure_signal import ExposureSignal
from app.models.risk_assessment import RiskAssessment, AssetRiskScore
from risk.scorer import DeterministicRiskScorer, TargetRiskResult

logger = logging.getLogger(__name__)


class RiskService:
    """
    Manages deterministic risk assessment lifecycle and asset prioritization queries.
    """

    @classmethod
    def compute_and_save_target_risk(
        cls,
        db: Session,
        target_id: str,
    ) -> RiskAssessment:
        """
        Gathers all target contextual artifacts, evaluates deterministic risk scoring,
        and synchronizes RiskAssessment and AssetRiskScore records in the database.
        """
        target = db.query(Target).filter(Target.id == target_id).first()
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target with ID '{target_id}' not found.",
            )

        assets = db.query(Asset).filter(Asset.target_id == target_id).all()
        evidence_items = db.query(EvidenceItem).filter(EvidenceItem.target_id == target_id).all()
        technologies = db.query(Technology).filter(Technology.target_id == target_id).all()
        relationships = db.query(Relationship).filter(Relationship.target_id == target_id).all()
        exposure_signals = db.query(ExposureSignal).filter(ExposureSignal.target_id == target_id).all()

        # Run scoring engine
        result: TargetRiskResult = DeterministicRiskScorer.evaluate(
            target=target,
            assets=assets,
            evidence_items=evidence_items,
            technologies=technologies,
            relationships=relationships,
            exposure_signals=exposure_signals,
        )

        # 1. Upsert Target RiskAssessment
        assessment = db.query(RiskAssessment).filter(RiskAssessment.target_id == target_id).first()
        if assessment:
            assessment.overall_score = result.overall_score
            assessment.risk_level = result.risk_level
            assessment.factors_breakdown = result.factors_breakdown
            assessment.recommendations = result.recommendations
        else:
            assessment = RiskAssessment(
                target_id=target_id,
                overall_score=result.overall_score,
                risk_level=result.risk_level,
                factors_breakdown=result.factors_breakdown,
                recommendations=result.recommendations,
            )
            db.add(assessment)

        # 2. Upsert AssetRiskScore records
        for asset_priority in result.asset_priorities:
            asset_score = (
                db.query(AssetRiskScore)
                .filter(
                    AssetRiskScore.target_id == target_id,
                    AssetRiskScore.asset_id == asset_priority.asset_id,
                )
                .first()
            )
            if asset_score:
                asset_score.priority_score = asset_priority.priority_score
                asset_score.priority_level = asset_priority.priority_level
                asset_score.contributing_factors = asset_priority.contributing_factors
            else:
                asset_score = AssetRiskScore(
                    target_id=target_id,
                    asset_id=asset_priority.asset_id,
                    priority_score=asset_priority.priority_score,
                    priority_level=asset_priority.priority_level,
                    contributing_factors=asset_priority.contributing_factors,
                )
                db.add(asset_score)

        db.commit()
        db.refresh(assessment)
        return assessment

    @classmethod
    def get_target_risk(cls, db: Session, target_id: str) -> RiskAssessment:
        """
        Retrieves the latest RiskAssessment for a target, computing it on demand if absent.
        """
        target = db.query(Target).filter(Target.id == target_id).first()
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target with ID '{target_id}' not found.",
            )

        assessment = db.query(RiskAssessment).filter(RiskAssessment.target_id == target_id).first()
        if not assessment:
            assessment = cls.compute_and_save_target_risk(db=db, target_id=target_id)

        return assessment

    @classmethod
    def list_asset_priorities(
        cls,
        db: Session,
        target_id: str,
        priority_level: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Lists prioritized assets for a target, enriched with asset value and type.
        """
        target = db.query(Target).filter(Target.id == target_id).first()
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target with ID '{target_id}' not found.",
            )

        # Ensure assessment exists
        assessment = db.query(RiskAssessment).filter(RiskAssessment.target_id == target_id).first()
        if not assessment:
            cls.compute_and_save_target_risk(db=db, target_id=target_id)

        query = (
            db.query(AssetRiskScore, Asset.value, Asset.asset_type)
            .join(Asset, Asset.id == AssetRiskScore.asset_id)
            .filter(AssetRiskScore.target_id == target_id)
        )

        if priority_level:
            query = query.filter(AssetRiskScore.priority_level == priority_level.lower())

        total = query.count()
        rows = (
            query.order_by(AssetRiskScore.priority_score.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        enriched_items = []
        for score_record, asset_val, asset_t in rows:
            enriched_items.append({
                "id": score_record.id,
                "target_id": score_record.target_id,
                "asset_id": score_record.asset_id,
                "asset_value": asset_val,
                "asset_type": asset_t,
                "priority_score": score_record.priority_score,
                "priority_level": score_record.priority_level,
                "contributing_factors": score_record.contributing_factors,
                "created_at": score_record.created_at,
                "updated_at": score_record.updated_at,
            })

        return enriched_items, total

    @classmethod
    def get_asset_risk(cls, db: Session, target_id: str, asset_id: str) -> Dict[str, Any]:
        """
        Retrieves the risk priority details for a specific asset, verifying target ownership.
        """
        asset = db.query(Asset).filter(Asset.id == asset_id, Asset.target_id == target_id).first()
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Asset with ID '{asset_id}' not found.",
            )

        score_record = db.query(AssetRiskScore).filter(AssetRiskScore.asset_id == asset_id, AssetRiskScore.target_id == target_id).first()
        if not score_record:
            # Recompute target risk to guarantee up-to-date score
            cls.compute_and_save_target_risk(db=db, target_id=asset.target_id)
            score_record = db.query(AssetRiskScore).filter(AssetRiskScore.asset_id == asset_id, AssetRiskScore.target_id == target_id).first()

        if not score_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Risk score not yet evaluated for asset '{asset_id}'.",
            )

        return {
            "id": score_record.id,
            "target_id": score_record.target_id,
            "asset_id": score_record.asset_id,
            "asset_value": asset.value,
            "asset_type": asset.asset_type,
            "priority_score": score_record.priority_score,
            "priority_level": score_record.priority_level,
            "contributing_factors": score_record.contributing_factors,
            "created_at": score_record.created_at,
            "updated_at": score_record.updated_at,
        }
