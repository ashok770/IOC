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
    assets = relationship(
        "Asset",
        back_populates="target",
        cascade="all, delete-orphan",
        order_by="Asset.discovered_at.desc()",
    )
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
    technologies = relationship(
        "Technology",
        back_populates="target",
        cascade="all, delete-orphan",
        order_by="Technology.created_at.desc()",
    )
    relationships = relationship(
        "Relationship",
        back_populates="target",
        cascade="all, delete-orphan",
        order_by="Relationship.created_at.desc()",
    )
    exposure_signals = relationship(
        "ExposureSignal",
        back_populates="target",
        cascade="all, delete-orphan",
        order_by="ExposureSignal.created_at.desc()",
    )
    risk_assessment = relationship(
        "RiskAssessment",
        back_populates="target",
        uselist=False,
        cascade="all, delete-orphan",
    )
    asset_risk_scores = relationship(
        "AssetRiskScore",
        back_populates="target",
        cascade="all, delete-orphan",
        order_by="AssetRiskScore.priority_score.desc()",
    )

    def __repr__(self) -> str:
        return f"<Target(id={self.id}, domain={self.primary_domain}, status={self.assessment_status})>"
