from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class RiskFactor(BaseModel):
    category: str = Field(..., description="Exposure category: perimeter_exposure, email_defense, technology_disclosure, external_dependencies")
    factor_name: str = Field(..., description="Identifier of the contributing factor")
    score_impact: float = Field(..., description="Point impact towards exposure assessment score")
    description: str = Field(..., description="Explanation of why this factor contributes to exposure")
    evidence_id: Optional[str] = Field(None, description="Foreign key to supporting evidence record")
    asset_id: Optional[str] = Field(None, description="Foreign key to affected asset")
    recommended_investigation: Optional[str] = Field(None, description="Actionable verification guidance for human analyst")


class Recommendation(BaseModel):
    priority: str = Field(..., description="Analyst triage priority: P1_urgent, P2_high, P3_medium, P4_low")
    category: str = Field(..., description="Area of observation")
    title: str = Field(..., description="Concise observation headline")
    action: str = Field(..., description="Concrete, actionable mitigation/verification step")
    rationale: str = Field(..., description="Technical justification based on observed exposure")
    evidence_id: Optional[str] = Field(None, description="Foreign key link to supporting evidence")
    recommended_investigation: Optional[str] = Field(None, description="Actionable verification guidance for human analyst")


class RiskAssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    target_id: str
    overall_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="External exposure assessment score (0.0 to 100.0) quantifying observable attack surface and defensive configuration posture. Not a probability of compromise, vulnerability likelihood, or CVSS score.",
    )
    risk_level: str = Field(
        ...,
        description="OSINT Sentinel heuristic assessment tier: low (0.0-24.9), medium (25.0-49.9), high (50.0-74.9), critical (75.0-100.0).",
    )
    factors_breakdown: Dict[str, float] = Field(..., description="Category-level exposure score breakdown")
    recommendations: List[Dict[str, Any]] = Field(..., description="Deterministic, actionable remediation and investigation guidance")
    created_at: datetime
    updated_at: datetime


class AssetRiskScoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    target_id: str
    asset_id: str
    asset_value: Optional[str] = None
    asset_type: Optional[str] = None
    priority_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Analyst triage priority score (0.0 to 100.0) indicating required investigation focus. Does not represent confirmed vulnerability.",
    )
    priority_level: str = Field(
        ...,
        description="Analyst triage urgency: p1_urgent (>=70.0), p2_high (>=45.0), p3_medium (>=25.0), p4_low (<25.0).",
    )
    contributing_factors: List[Dict[str, Any]] = Field(..., description="List of factual factors contributing to priority with evidence links")
    created_at: datetime
    updated_at: datetime


class AssetRiskScoreListResponse(BaseModel):
    items: List[AssetRiskScoreResponse]
    total: int
    target_id: str
    priority_level_filter: Optional[str] = None
    limit: int
    offset: int
