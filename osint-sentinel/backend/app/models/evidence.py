import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database.session import Base


class EvidenceItem(Base):
    __tablename__ = "evidence_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    target_id = Column(
        String(36),
        ForeignKey("targets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    evidence_type = Column(String(64), nullable=False, index=True)
    source = Column(String(64), nullable=False, index=True)
    source_url = Column(String(1024), nullable=True)
    collected_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    data = Column(JSON, nullable=False)
    confidence = Column(Float, nullable=False, default=1.0)
    notes = Column(Text, nullable=True)

    # Relationships
    target = relationship("Target", back_populates="evidence_items")
    findings = relationship("Finding", back_populates="evidence")

    def __repr__(self) -> str:
        return f"<EvidenceItem(id={self.id}, type={self.evidence_type}, source={self.source})>"
