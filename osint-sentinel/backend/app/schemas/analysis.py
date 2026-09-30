from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class AnalysisSummaryResponse(BaseModel):
    """
    Analyst-oriented summary providing deterministic exposure and inventory metrics.
    Transparent, explainable scoring based strictly on observed configurations and signals.
    """
    target_id: str = Field(..., description="Target UUID")
    domain: str = Field(..., description="Target domain name")
    assets: int = Field(..., description="Total perimeter assets cataloged")
    technologies: int = Field(..., description="Total observable technologies identified")
    evidence_items: int = Field(..., description="Total verified raw evidence artifacts collected")
    relationships: int = Field(..., description="Total semantic graph relationships mapped")
    exposure_signals: int = Field(..., description="Total security exposure signals identified")
    informational_findings: int = Field(..., description="Total factual observation findings generated")
    overall_risk_score: Optional[float] = Field(None, ge=0.0, le=100.0, description="Deterministic risk score (0-100)")
    risk_level: Optional[str] = Field(None, description="Risk level (low, medium, high, critical)")

