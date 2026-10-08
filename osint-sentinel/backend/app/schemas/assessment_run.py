from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class AssessmentRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    target_id: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    overall_score: float
    risk_level: str
    total_assets: int
    total_technologies: int
    total_exposure_signals: int
    total_findings: int
    total_evidence_items: int
    sources_status: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class AssessmentRunListResponse(BaseModel):
    items: List[AssessmentRunResponse]
    total: int
    limit: int
    offset: int


class AssessmentRunAssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    assessment_run_id: str
    target_id: str
    asset_id: Optional[str] = None
    asset_type: str
    value: str
    source: str
    priority_score: Optional[float] = None
    priority_level: Optional[str] = None


class AssessmentRunTechnologyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    assessment_run_id: str
    target_id: str
    asset_value: Optional[str] = None
    name: str
    category: str
    version: Optional[str] = None
    detection_method: str
    confidence: float


class AssessmentRunExposureSignalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    assessment_run_id: str
    target_id: str
    asset_value: Optional[str] = None
    signal_type: str
    category: str
    title: str
    severity: str
    confidence: float


class AssessmentRunDetailResponse(AssessmentRunResponse):
    factors_breakdown: Optional[Dict[str, Any]] = None
    asset_snapshots: List[AssessmentRunAssetResponse] = []
    technology_snapshots: List[AssessmentRunTechnologyResponse] = []
    exposure_signal_snapshots: List[AssessmentRunExposureSignalResponse] = []


# Comparison Schemas
class AssetDeltaItem(BaseModel):
    asset_type: str
    value: str
    source: str
    priority_score: Optional[float] = None
    priority_level: Optional[str] = None


class AssetComparisonResult(BaseModel):
    added: List[AssetDeltaItem]
    removed: List[AssetDeltaItem]
    unchanged: List[AssetDeltaItem]


class TechVersionChangeItem(BaseModel):
    technology: str
    asset_value: Optional[str] = None
    category: str
    previous_version: Optional[str] = None
    current_version: Optional[str] = None


class TechDeltaItem(BaseModel):
    asset_value: Optional[str] = None
    name: str
    category: str
    version: Optional[str] = None
    detection_method: str
    confidence: float


class TechnologyComparisonResult(BaseModel):
    added: List[TechDeltaItem]
    removed: List[TechDeltaItem]
    version_changes: List[TechVersionChangeItem]
    unchanged: List[TechDeltaItem]


class SignalDeltaItem(BaseModel):
    asset_value: Optional[str] = None
    signal_type: str
    category: str
    title: str
    severity: str
    confidence: float


class ExposureSignalComparisonResult(BaseModel):
    new: List[SignalDeltaItem]
    resolved: List[SignalDeltaItem]
    unchanged: List[SignalDeltaItem]


class ScoreComparison(BaseModel):
    previous: float
    current: float
    delta: float


class LevelComparison(BaseModel):
    previous: str
    current: str
    changed: bool


class FactorDeltaItem(BaseModel):
    category: str
    previous_score: float
    current_score: float
    delta: float


class RiskComparisonResult(BaseModel):
    overall_score: ScoreComparison
    risk_level: LevelComparison
    factor_deltas: List[FactorDeltaItem]


class ComparisonSummary(BaseModel):
    asset_delta: int
    technology_delta: int
    new_exposure_signals: int
    resolved_exposure_signals: int
    score_delta: float
    risk_level_changed: bool


class AssessmentComparisonResponse(BaseModel):
    base_assessment: AssessmentRunResponse
    target_assessment: AssessmentRunResponse
    summary: ComparisonSummary
    assets: AssetComparisonResult
    technologies: TechnologyComparisonResult
    exposure_signals: ExposureSignalComparisonResult
    risk: RiskComparisonResult
