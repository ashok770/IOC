from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    timestamp: datetime
    user_id: Optional[str]
    action: str
    result: str
    target_id: Optional[str]
    asset_id: Optional[str]
    source_ip: Optional[str]
    user_agent: Optional[str]
    metadata_json: Optional[Dict[str, Any]] = None

class AuditLogListResponse(BaseModel):
    items: List[AuditLogResponse]
    total: int
    limit: int
    offset: int
