import logging
from typing import Dict, List, Any, Tuple, Optional
from sqlalchemy.orm import Session

from app.models.assessment_run import (
    AssessmentRun,
    AssessmentRunAsset,
    AssessmentRunTechnology,
    AssessmentRunExposureSignal,
)
from app.schemas.assessment_run import (
    AssessmentRunResponse,
    AssessmentComparisonResponse,
    ComparisonSummary,
    AssetComparisonResult,
    AssetDeltaItem,
    TechnologyComparisonResult,
    TechDeltaItem,
    TechVersionChangeItem,
    ExposureSignalComparisonResult,
    SignalDeltaItem,
    RiskComparisonResult,
    ScoreComparison,
    LevelComparison,
    FactorDeltaItem,
)

logger = logging.getLogger(__name__)


class AssessmentComparisonService:
    """
    Deterministic comparison engine for OSINT Sentinel Assessment Runs.
    Compares Base Run vs Target Run using lightweight point-in-time snapshot records.
    """

    @staticmethod
    def compare_runs(
        db: Session,
        base_run: AssessmentRun,
        target_run: AssessmentRun,
    ) -> AssessmentComparisonResponse:
        """
        Executes deterministic set and metric comparison between base_run and target_run.
        """
        # Fetch snapshot collections for both runs
        base_assets = db.query(AssessmentRunAsset).filter(AssessmentRunAsset.assessment_run_id == base_run.id).all()
        target_assets = db.query(AssessmentRunAsset).filter(AssessmentRunAsset.assessment_run_id == target_run.id).all()

        base_techs = db.query(AssessmentRunTechnology).filter(AssessmentRunTechnology.assessment_run_id == base_run.id).all()
        target_techs = db.query(AssessmentRunTechnology).filter(AssessmentRunTechnology.assessment_run_id == target_run.id).all()

        base_signals = db.query(AssessmentRunExposureSignal).filter(AssessmentRunExposureSignal.assessment_run_id == base_run.id).all()
        target_signals = db.query(AssessmentRunExposureSignal).filter(AssessmentRunExposureSignal.assessment_run_id == target_run.id).all()

        # 1. Compare Assets (Identity: asset_type + value.lower())
        asset_comp = AssessmentComparisonService._compare_assets(base_assets, target_assets)

        # 2. Compare Technologies (Identity: asset_value.lower() + category.lower() + name.lower())
        tech_comp = AssessmentComparisonService._compare_technologies(base_techs, target_techs)

        # 3. Compare Exposure Signals (Identity: asset_value.lower() + signal_type.lower() + title.lower())
        signal_comp = AssessmentComparisonService._compare_signals(base_signals, target_signals)

        # 4. Compare Risk & Factor Breakdowns
        risk_comp = AssessmentComparisonService._compare_risk(base_run, target_run)

        # 5. Build Summary
        score_delta = round(target_run.overall_score - base_run.overall_score, 2)
        risk_level_changed = base_run.risk_level != target_run.risk_level

        summary = ComparisonSummary(
            asset_delta=len(asset_comp.added) - len(asset_comp.removed),
            technology_delta=len(tech_comp.added) - len(tech_comp.removed),
            new_exposure_signals=len(signal_comp.new),
            resolved_exposure_signals=len(signal_comp.resolved),
            score_delta=score_delta,
            risk_level_changed=risk_level_changed,
        )

        return AssessmentComparisonResponse(
            base_assessment=AssessmentRunResponse.model_validate(base_run),
            target_assessment=AssessmentRunResponse.model_validate(target_run),
            summary=summary,
            assets=asset_comp,
            technologies=tech_comp,
            exposure_signals=signal_comp,
            risk=risk_comp,
        )

    @staticmethod
    def _compare_assets(
        base_assets: List[AssessmentRunAsset],
        target_assets: List[AssessmentRunAsset],
    ) -> AssetComparisonResult:
        base_map = {(a.asset_type.lower(), a.value.lower()): a for a in base_assets}
        target_map = {(a.asset_type.lower(), a.value.lower()): a for a in target_assets}

        base_keys = set(base_map.keys())
        target_keys = set(target_map.keys())

        added_keys = sorted(target_keys - base_keys)
        removed_keys = sorted(base_keys - target_keys)
        unchanged_keys = sorted(base_keys & target_keys)

        def to_asset_item(a: AssessmentRunAsset) -> AssetDeltaItem:
            return AssetDeltaItem(
                asset_type=a.asset_type,
                value=a.value,
                source=a.source,
                priority_score=a.priority_score,
                priority_level=a.priority_level,
            )

        return AssetComparisonResult(
            added=[to_asset_item(target_map[k]) for k in added_keys],
            removed=[to_asset_item(base_map[k]) for k in removed_keys],
            unchanged=[to_asset_item(target_map[k]) for k in unchanged_keys],
        )

    @staticmethod
    def _compare_technologies(
        base_techs: List[AssessmentRunTechnology],
        target_techs: List[AssessmentRunTechnology],
    ) -> TechnologyComparisonResult:
        base_map = {((t.asset_value or "").lower(), t.category.lower(), t.name.lower()): t for t in base_techs}
        target_map = {((t.asset_value or "").lower(), t.category.lower(), t.name.lower()): t for t in target_techs}

        base_keys = set(base_map.keys())
        target_keys = set(target_map.keys())

        added_keys = sorted(target_keys - base_keys)
        removed_keys = sorted(base_keys - target_keys)
        common_keys = sorted(base_keys & target_keys)

        version_changes: List[TechVersionChangeItem] = []
        unchanged_keys: List[Tuple[str, str, str]] = []

        for k in common_keys:
            b_tech = base_map[k]
            t_tech = target_map[k]
            if b_tech.version != t_tech.version:
                version_changes.append(
                    TechVersionChangeItem(
                        technology=t_tech.name,
                        asset_value=t_tech.asset_value,
                        category=t_tech.category,
                        previous_version=b_tech.version,
                        current_version=t_tech.version,
                    )
                )
            else:
                unchanged_keys.append(k)

        def to_tech_item(t: AssessmentRunTechnology) -> TechDeltaItem:
            return TechDeltaItem(
                asset_value=t.asset_value,
                name=t.name,
                category=t.category,
                version=t.version,
                detection_method=t.detection_method,
                confidence=t.confidence,
            )

        return TechnologyComparisonResult(
            added=[to_tech_item(target_map[k]) for k in added_keys],
            removed=[to_tech_item(base_map[k]) for k in removed_keys],
            version_changes=version_changes,
            unchanged=[to_tech_item(target_map[k]) for k in unchanged_keys],
        )

    @staticmethod
    def _compare_signals(
        base_signals: List[AssessmentRunExposureSignal],
        target_signals: List[AssessmentRunExposureSignal],
    ) -> ExposureSignalComparisonResult:
        base_map = {((s.asset_value or "").lower(), s.signal_type.lower(), s.title.lower()): s for s in base_signals}
        target_map = {((s.asset_value or "").lower(), s.signal_type.lower(), s.title.lower()): s for s in target_signals}

        base_keys = set(base_map.keys())
        target_keys = set(target_map.keys())

        new_keys = sorted(target_keys - base_keys)
        resolved_keys = sorted(base_keys - target_keys)
        unchanged_keys = sorted(base_keys & target_keys)

        def to_signal_item(s: AssessmentRunExposureSignal) -> SignalDeltaItem:
            return SignalDeltaItem(
                asset_value=s.asset_value,
                signal_type=s.signal_type,
                category=s.category,
                title=s.title,
                severity=s.severity,
                confidence=s.confidence,
            )

        return ExposureSignalComparisonResult(
            new=[to_signal_item(target_map[k]) for k in new_keys],
            resolved=[to_signal_item(base_map[k]) for k in resolved_keys],
            unchanged=[to_signal_item(target_map[k]) for k in unchanged_keys],
        )

    @staticmethod
    def _compare_risk(
        base_run: AssessmentRun,
        target_run: AssessmentRun,
    ) -> RiskComparisonResult:
        score_comp = ScoreComparison(
            previous=base_run.overall_score,
            current=target_run.overall_score,
            delta=round(target_run.overall_score - base_run.overall_score, 2),
        )
        level_comp = LevelComparison(
            previous=base_run.risk_level,
            current=target_run.risk_level,
            changed=base_run.risk_level != target_run.risk_level,
        )

        base_factors = base_run.factors_breakdown or {}
        target_factors = target_run.factors_breakdown or {}

        all_categories = sorted(set(base_factors.keys()) | set(target_factors.keys()))
        factor_deltas: List[FactorDeltaItem] = []

        for cat in all_categories:
            prev_val = float(base_factors.get(cat, 0.0))
            curr_val = float(target_factors.get(cat, 0.0))
            factor_deltas.append(
                FactorDeltaItem(
                    category=cat,
                    previous_score=prev_val,
                    current_score=curr_val,
                    delta=round(curr_val - prev_val, 2),
                )
            )

        return RiskComparisonResult(
            overall_score=score_comp,
            risk_level=level_comp,
            factor_deltas=factor_deltas,
        )
