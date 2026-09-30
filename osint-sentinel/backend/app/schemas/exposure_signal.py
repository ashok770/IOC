from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class ExposureSignalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    target_id: str
    asset_id: Optional[str] = None
    signal_type: str = Field(
        ...,
        description="Signal identifier: remote_access_indicator, development_test_indicator, technology_disclosure, external_dependency_reference",
    )
    category: str = Field(
        ...,
        description="Category: perimeter_surface, non_production_exposure, technology_stack, external_dependency",
    )
    title: str = Field(..., description="Analyst-oriented observation title")
    description: str = Field(..., description="Detailed factual explanation")
    severity: str = Field("info", description="Severity level, strictly 'info' for exposure signals")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Evidentiary confidence")
    evidence_id: Optional[str] = Field(None, description="Foreign key link to source EvidenceItem")
    extra_data: Optional[Dict[str, Any]] = None
    created_at: datetime


class ExposureSignalListResponse(BaseModel):
    items: List[ExposureSignalResponse]
    total: int
    target_id: str
    category_filter: Optional[str] = None
    min_confidence: Optional[float] = None
    limit: int
    offset: int
