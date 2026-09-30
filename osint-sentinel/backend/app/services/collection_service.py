import logging
from typing import List, Tuple, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.target import Target
from app.models.evidence import EvidenceItem
from app.models.finding import Finding
from app.schemas.collection import CollectionSummaryResponse
from collectors.domain_collector import DomainIntelligenceCollector
from analyzers.domain_analyzer import DomainAnalyzer

logger = logging.getLogger(__name__)


class CollectionService:
    def __init__(
        self,
        domain_collector: Optional[DomainIntelligenceCollector] = None,
        domain_analyzer: Optional[DomainAnalyzer] = None,
    ):
        self.domain_collector = domain_collector or DomainIntelligenceCollector()
        self.domain_analyzer = domain_analyzer or DomainAnalyzer()

    async def run_domain_collection(
        self,
        db: Session,
        target_id: str,
    ) -> CollectionSummaryResponse:
        """
        Executes passive intelligence collection for a target domain,
        persists raw evidence, runs basic factual analysis, and returns a summary.
        """
        target = db.query(Target).filter(Target.id == target_id).first()
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target with ID '{target_id}' not found.",
            )

        # Update target status to in_progress
        target.assessment_status = "in_progress"
        db.commit()

        try:
            # 1. Execute collectors
            collector_result = await self.domain_collector.collect(target.primary_domain)

            # 2. Persist Evidence Items
            evidence_entities: List[EvidenceItem] = []
            for item in collector_result.evidence_results:
                evidence_record = EvidenceItem(
                    target_id=target.id,
                    evidence_type=item.evidence_type,
                    source=item.source,
                    source_url=item.source_url,
                    collected_at=item.collected_at,
                    data=item.data,
                    confidence=item.confidence,
                    notes=item.notes,
                )
                db.add(evidence_record)
                evidence_entities.append(evidence_record)

            db.commit()

            # Refresh evidence to get generated IDs
            for record in evidence_entities:
                db.refresh(record)

            # Map evidence type to first evidence ID for provenance linking
            evidence_type_map = {e.evidence_type: e.id for e in evidence_entities}

            # 3. Extract, classify, and sync Assets under Target
            from app.services.asset_service import AssetService
            cataloged_assets = AssetService.extract_and_sync_assets(
                db=db,
                target=target,
                evidence_items=evidence_entities,
            )

            # 4. Extract, classify, and sync Technologies under Target & Assets
            from app.services.technology_service import TechnologyService
            cataloged_technologies = TechnologyService.extract_and_sync_technologies(
                db=db,
                target=target,
                evidence_items=evidence_entities,
                assets=cataloged_assets,
            )

            # 5. Execute Factual Observations Analysis
            findings = self.domain_analyzer.analyze(
                target.primary_domain,
                collector_result.evidence_results,
            )

            # 6. Persist Findings
            for f in findings:
                evidence_id = evidence_type_map.get(f.evidence_type) if f.evidence_type else None
                finding_record = Finding(
                    target_id=target.id,
                    category=f.category,
                    title=f.title,
                    description=f.description,
                    severity=f.severity,
                    confidence=f.confidence,
                    evidence_id=evidence_id,
                )
                db.add(finding_record)

            db.commit()

            # 7. Build Semantic Relationships
            from app.services.correlation_service import CorrelationService
            created_relationships = CorrelationService.build_and_sync_relationships(
                db=db,
                target=target,
                assets=cataloged_assets,
                evidence_items=evidence_entities,
                technologies=cataloged_technologies,
            )

            # 8. Evaluate Exposure Signals (persists signals and corresponding informational findings)
            created_signals = CorrelationService.evaluate_and_sync_exposure_signals(
                db=db,
                target=target,
                assets=cataloged_assets,
                technologies=cataloged_technologies,
                relationships=created_relationships,
            )

            # 9. Compute Deterministic Risk Assessment & Asset Prioritization
            from app.services.risk_service import RiskService
            RiskService.compute_and_save_target_risk(db=db, target_id=target.id)

            # Determine overall assessment status
            has_failures = any(s == "failed" for s in collector_result.sources_status.values())
            all_failed = all(s == "failed" for s in collector_result.sources_status.values())

            if all_failed:
                target.assessment_status = "failed"
            elif has_failures:
                target.assessment_status = "partial"
            else:
                target.assessment_status = "completed"

            db.commit()
            db.refresh(target)

            total_findings = db.query(func.count(Finding.id)).filter(Finding.target_id == target.id).scalar() or 0

            return CollectionSummaryResponse(
                target_id=target.id,
                domain=target.primary_domain,
                status=target.assessment_status,
                sources=collector_result.sources_status,
                evidence_items_created=len(evidence_entities),
                assets_discovered=len(cataloged_assets),
                technologies_discovered=len(cataloged_technologies),
                relationships_mapped=len(created_relationships),
                exposure_signals_identified=len(created_signals),
                findings_created=total_findings,
                timestamp=datetime.now(timezone.utc),
            )

        except Exception as exc:
            db.rollback()
            target.assessment_status = "failed"
            db.commit()
            logger.error(f"Error during collection pipeline for target {target_id}: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Collection pipeline failed: {str(exc)}",
            )

    @staticmethod
    def get_evidence(
        db: Session,
        target_id: str,
        evidence_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[EvidenceItem], int]:
        """Fetch paginated evidence items for a target, optionally filtered by evidence_type."""
        target = db.query(Target).filter(Target.id == target_id).first()
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target with ID '{target_id}' not found.",
            )

        query = db.query(EvidenceItem).filter(EvidenceItem.target_id == target_id)
        if evidence_type:
            query = query.filter(EvidenceItem.evidence_type == evidence_type)

        total = query.count()
        items = query.order_by(EvidenceItem.collected_at.desc()).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_findings(
        db: Session,
        target_id: str,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Finding], int]:
        """Fetch paginated findings for a target, optionally filtered by category."""
        target = db.query(Target).filter(Target.id == target_id).first()
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target with ID '{target_id}' not found.",
            )

        query = db.query(Finding).filter(Finding.target_id == target_id)
        if category:
            query = query.filter(Finding.category == category)

        total = query.count()
        items = query.order_by(Finding.created_at.desc()).offset(skip).limit(limit).all()
        return items, total
