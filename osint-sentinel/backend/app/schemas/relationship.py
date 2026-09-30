from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class RelationshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    target_id: str
    source_type: str = Field(..., description="Source entity type: target, asset, technology, evidence")
    source_id: str = Field(..., description="UUID or identifier of source entity")
    relationship_type: str = Field(
        ...,
        description="Directed relationship: contains, supported_by, resolves_to, references, certificate_associated_with, technology_observed_on, externally_referenced",
    )
    target_type: str = Field(..., description="Target entity type: asset, technology, evidence, external_entity")
    target_id_reference: str = Field(..., description="UUID or name of target entity")
    evidence_id: Optional[str] = Field(None, description="Supporting EvidenceItem foreign key")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Evidentiary confidence score")
    extra_data: Optional[Dict[str, Any]] = None
    created_at: datetime


class RelationshipListResponse(BaseModel):
    items: List[RelationshipResponse]
    total: int
    target_id: Optional[str] = None
    asset_id: Optional[str] = None
    relationship_type_filter: Optional[str] = None
    source_type_filter: Optional[str] = None
    target_type_filter: Optional[str] = None
    limit: int
    offset: int
