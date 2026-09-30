from datetime import datetime, timezone
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class DatabaseHealth(BaseModel):
    connected: bool = Field(..., description="Whether the database is reachable")
    details: str = Field(..., description="Status description or error detail")


class HealthResponse(BaseModel):
    status: str = Field("ok", description="Overall service status")
    project: str = Field(..., description="Project name")
    version: str = Field(..., description="Application version")
    environment: str = Field(..., description="Runtime environment")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="UTC timestamp of the probe")
    database: DatabaseHealth = Field(..., description="Database connectivity status")
    mode: str = Field("authorized_assessment_only", description="Enforced operational scope")
