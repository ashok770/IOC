import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from database.session import Base


class Target(Base):
    __tablename__ = "targets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String(255), nullable=True)
    primary_domain = Column(String(255), nullable=False, unique=True, index=True)
    assessment_status = Column(String(50), nullable=False, default="pending", index=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    evidence_items = relationship(
        "EvidenceItem",
        back_populates="target",
        cascade="all, delete-orphan",
        order_by="EvidenceItem.collected_at.desc()",
    )
    findings = relationship(
        "Finding",
        back_populates="target",
        cascade="all, delete-orphan",
        order_by="Finding.created_at.desc()",
    )

    def __repr__(self) -> str:
        return f"<Target(id={self.id}, domain={self.primary_domain}, status={self.assessment_status})>"
