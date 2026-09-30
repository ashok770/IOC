from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class TechnologyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    target_id: str
    asset_id: Optional[str] = None
    name: str = Field(..., description="Observed technology name (e.g. Nginx, Cloudflare, WordPress)")
    category: str = Field(
        ...,
        description="Technology category (web_server, framework, cms, cdn, cloud, email, other)",
    )
    version: Optional[str] = Field(None, description="Directly observable version string or null")
    detection_method: str = Field(..., description="Explainable detection mechanism (e.g. response_header, meta_tag)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Deterministic confidence score")
    first_seen: datetime
    last_seen: datetime
    evidence_id: Optional[str] = Field(None, description="Foreign key link to source EvidenceItem")
    extra_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


class TechnologyListResponse(BaseModel):
    items: List[TechnologyResponse]
    total: int
    target_id: Optional[str] = None
    asset_id: Optional[str] = None
    category_filter: Optional[str] = None
    limit: int
    offset: int
