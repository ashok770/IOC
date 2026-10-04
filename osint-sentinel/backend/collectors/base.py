from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class CollectorResult(BaseModel):
    """
    Standardized result emitted by a passive OSINT collector.
    Decoupled from persistence layers for maximum testability.
    """
    evidence_type: str = Field(..., description="Canonical category (e.g. dns_record, rdap_registration)")
    source: str = Field(..., description="Intelligence source identifier (e.g. DNS, RDAP, crt.sh)")
    source_url: Optional[str] = Field(None, description="Direct URL to source data or API queried")
    collected_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Collection timestamp in UTC",
    )
    data: Dict[str, Any] = Field(..., description="Structured, verifiable payload")
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="Evidentiary confidence score")
    notes: Optional[str] = Field(None, description="Contextual execution notes or annotations")


class CollectorExecutionReport(BaseModel):
    """Execution status and output summary for a single collector."""
    source_name: str
    status: str  # "success", "failed", "partial", "no_data"
    results: List[CollectorResult] = Field(default_factory=list)
    error_message: Optional[str] = None
    duration_seconds: float = 0.0


class BaseCollector(ABC):
    """Abstract base class for all passive OSINT intelligence collectors."""

    name: str = "base_collector"

    @abstractmethod
    async def collect(self, domain: str, context: Optional["AssessmentContext"] = None) -> CollectorExecutionReport:
        """
        Execute passive intelligence gathering against an authorized domain.
        Must be strictly passive, non-destructive, and resilient to external failures.
        """
        pass
