from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class AssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    target_id: str
    asset_type: str = Field(..., description="Asset type: domain, subdomain, ip, or certificate_hostname")
    value: str = Field(..., description="Canonical asset value (e.g. domain name, IP address, hostname)")
    discovered_at: datetime
    last_seen_at: datetime
    source: str = Field(..., description="Originating intelligence source (e.g. DNS, crt.sh, RDAP)")
    first_evidence_id: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None


class AssetListResponse(BaseModel):
    items: List[AssetResponse]
    total: int
    target_id: str
    asset_type_filter: Optional[str] = None
    limit: int
    offset: int
