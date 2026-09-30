from datetime import datetime, timezone
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class CollectionSummaryResponse(BaseModel):
    target_id: str = Field(..., description="Target UUID")
    domain: str = Field(..., description="Domain assessed")
    status: str = Field(..., description="Collection pipeline status (completed, failed, partial)")
    sources: Dict[str, str] = Field(
        ...,
        description="Per-source execution status (e.g. {'dns': 'success', 'rdap': 'success', 'certificate_transparency': 'success'})",
    )
    evidence_items_created: int = Field(..., description="Number of new evidence items saved")
    assets_discovered: int = Field(0, description="Total unique assets cataloged under the target")
    technologies_discovered: int = Field(0, description="Total unique technologies observed and linked")
    relationships_mapped: int = Field(0, description="Total semantic graph relationships mapped")
    exposure_signals_identified: int = Field(0, description="Total exposure signals identified")
    findings_created: int = Field(0, description="Number of factual observation findings produced")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Completion timestamp in UTC",
    )
