from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    target_id: str
    evidence_type: str
    source: str
    source_url: Optional[str] = None
    collected_at: datetime
    data: Dict[str, Any]
    confidence: float
    notes: Optional[str] = None


class EvidenceListResponse(BaseModel):
    items: List[EvidenceResponse]
    total: int
    target_id: str
    evidence_type_filter: Optional[str] = None
    limit: int
    offset: int
