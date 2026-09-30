from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, ConfigDict
from app.utils.domain import normalize_and_validate_domain


class TargetCreate(BaseModel):
    organization_name: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Optional name of the target organization",
        examples=["Acme Corp"],
    )
    primary_domain: str = Field(
        ...,
        description="Authorized target domain name (e.g., example.org)",
        examples=["example.org"],
    )

    @field_validator("primary_domain")
    @classmethod
    def validate_domain(cls, v: str) -> str:
        return normalize_and_validate_domain(v)


class TargetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: Optional[str] = Field(None, serialization_alias="name")
    primary_domain: str
    assessment_status: str
    created_at: datetime
    updated_at: datetime


class TargetListResponse(BaseModel):
    items: List[TargetResponse]
    total: int
