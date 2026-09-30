from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class FindingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    target_id: str
    category: str
    title: str
    description: str
    severity: str
    confidence: float
    evidence_id: Optional[str] = None
    created_at: datetime


class FindingListResponse(BaseModel):
    items: List[FindingResponse]
    total: int
    target_id: str
