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
        from app.utils.resource_controls import AssessmentContext, GlobalResourceController
        controller = GlobalResourceController.get_instance()
        target_lock = await controller.get_target_lock(target_id)
        
        if target_lock.locked():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Target '{target_id}' is already being assessed.",
            )
            
        async with target_lock:
            target = db.query(Target).filter(Target.id == target_id).first()
            if not target:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Target with ID '{target_id}' not found.",
                )

            # Create AssessmentRun record
            from app.models.assessment_run import (
                AssessmentRun,
                AssessmentRunAsset,
                AssessmentRunTechnology,
                AssessmentRunExposureSignal,
            )
            from app.models.risk_assessment import RiskAssessment, AssetRiskScore

            run_record = AssessmentRun(
                target_id=target.id,
                status="in_progress",
                started_at=datetime.now(timezone.utc),
            )
            db.add(run_record)
            target.assessment_status = "in_progress"
            db.commit()
            db.refresh(run_record)

            try:
                context = AssessmentContext(target_id=target.id)
                # 1. Execute collectors
                collector_result = await self.domain_collector.collect(target.primary_domain, context=context)

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

                # 5. Execute Factual Observations Analysis & Email Intelligence Analysis
                findings = self.domain_analyzer.analyze(
                    target.primary_domain,
                    collector_result.evidence_results,
                )
                from analyzers.email_analyzer import EmailAnalyzer
                email_intel = EmailAnalyzer().analyze(
                    target.primary_domain,
                    evidence_entities,
                )
                findings.extend(email_intel.findings)

                from analyzers.certificate_analyzer import CertificateAnalyzer
                cert_intel = CertificateAnalyzer().analyze(
                    target.primary_domain,
                    evidence_entities,
                )
                findings.extend(cert_intel.findings)

                # 6. Persist Findings
                for f in findings:
                    evidence_id = getattr(f, "evidence_id", None) or (
                        evidence_type_map.get(f.evidence_type) if getattr(f, "evidence_type", None) else None
                    )
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

                # Execute External Dependency Intelligence Analysis
                from analyzers.external_dependency_analyzer import ExternalDependencyAnalyzer
                ext_intel = ExternalDependencyAnalyzer().analyze(
                    target_domain=target.primary_domain,
                    target_id=target.id,
                    evidence=evidence_entities,
                    relationships=created_relationships,
                    technologies=cataloged_technologies,
                    email_intel=email_intel,
                    cert_intel=cert_intel,
                )
                for f in ext_intel.findings:
                    evidence_id = getattr(f, "evidence_id", None) or (
                        evidence_type_map.get(f.evidence_type) if getattr(f, "evidence_type", None) else None
                    )
                    db.add(
                        Finding(
                            target_id=target.id,
                            category=f.category,
                            title=f.title,
                            description=f.description,
                            severity=f.severity,
                            confidence=f.confidence,
                            evidence_id=evidence_id,
                        )
                    )
                db.commit()

                # 8. Evaluate Exposure Signals (persists signals and corresponding informational findings)
                created_signals = CorrelationService.evaluate_and_sync_exposure_signals(
                    db=db,
                    target=target,
                    assets=cataloged_assets,
                    technologies=cataloged_technologies,
                    relationships=created_relationships,
                    evidence_items=evidence_entities,
                )


                # 9. Compute Deterministic Risk Assessment & Asset Prioritization
                from app.services.risk_service import RiskService
                risk_assessment = RiskService.compute_and_save_target_risk(db=db, target_id=target.id)

                # Determine overall assessment status
                has_failures = any(s == "failed" for s in collector_result.sources_status.values())
                all_failed = all(s == "failed" for s in collector_result.sources_status.values())

                if all_failed:
                    target.assessment_status = "failed"
                    run_status = "failed"
                elif has_failures:
                    target.assessment_status = "partial"
                    run_status = "partial"
                else:
                    target.assessment_status = "completed"
                    run_status = "completed"

                # 10. Build Point-in-Time Assessment Run Snapshots
                asset_scores = {
                    ars.asset_id: ars 
                    for ars in db.query(AssetRiskScore).filter(AssetRiskScore.target_id == target.id).all()
                }

                for asset in cataloged_assets:
                    ars = asset_scores.get(asset.id)
                    snap_asset = AssessmentRunAsset(
                        assessment_run_id=run_record.id,
                        target_id=target.id,
                        asset_id=asset.id,
                        asset_type=asset.asset_type,
                        value=asset.value,
                        source=asset.source,
                        priority_score=ars.priority_score if ars else None,
                        priority_level=ars.priority_level if ars else None,
                    )
                    db.add(snap_asset)

                asset_val_map = {a.id: a.value for a in cataloged_assets}

                for tech in cataloged_technologies:
                    snap_tech = AssessmentRunTechnology(
                        assessment_run_id=run_record.id,
                        target_id=target.id,
                        asset_value=asset_val_map.get(tech.asset_id) or target.primary_domain,
                        name=tech.name,
                        category=tech.category,
                        version=tech.version,
                        detection_method=tech.detection_method,
                        confidence=tech.confidence,
                    )
                    db.add(snap_tech)

                for sig in created_signals:
                    snap_sig = AssessmentRunExposureSignal(
                        assessment_run_id=run_record.id,
                        target_id=target.id,
                        asset_value=asset_val_map.get(sig.asset_id) or target.primary_domain,
                        signal_type=sig.signal_type,
                        category=sig.category,
                        title=sig.title,
                        severity=sig.severity,
                        confidence=sig.confidence,
                    )
                    db.add(snap_sig)

                total_findings = db.query(func.count(Finding.id)).filter(Finding.target_id == target.id).scalar() or 0

                # Finalize AssessmentRun state
                run_record.status = run_status
                run_record.completed_at = datetime.now(timezone.utc)
                run_record.overall_score = risk_assessment.overall_score if risk_assessment else 0.0
                run_record.risk_level = risk_assessment.risk_level if risk_assessment else "low"
                run_record.factors_breakdown = risk_assessment.factors_breakdown if risk_assessment else {}
                run_record.sources_status = collector_result.sources_status
                run_record.total_assets = len(cataloged_assets)
                run_record.total_technologies = len(cataloged_technologies)
                run_record.total_exposure_signals = len(created_signals)
                run_record.total_findings = total_findings
                run_record.total_evidence_items = len(evidence_entities)

                db.commit()
                db.refresh(target)
                db.refresh(run_record)

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
                if 'run_record' in locals() and run_record:
                    run_record.status = "failed"
                    run_record.completed_at = datetime.now(timezone.utc)
                    run_record.error_message = str(exc)
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
