import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from database.session import Base


class RiskAssessment(Base):
    """
    Deterministic, explainable external exposure assessment for an authorized target.
    Quantifies observable attack surface, defensive configuration posture, and third-party dependencies.
    This score represents an investigation priority metric, NOT a probability of compromise,
    vulnerability likelihood, or CVSS score. Contains zero CVE guesswork or speculative CVSS inflation.
    """
    __tablename__ = "risk_assessments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    target_id = Column(
        String(36),
        ForeignKey("targets.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    overall_score = Column(Float, nullable=False, default=0.0)  # 0.0 to 100.0
    risk_level = Column(String(32), nullable=False, default="low", index=True)  # low, medium, high, critical
    factors_breakdown = Column(JSON, nullable=False)  # Breakdown of category scores
    recommendations = Column(JSON, nullable=False)  # Deterministic remediation guidance
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
    target = relationship("Target", back_populates="risk_assessment")

    def __repr__(self) -> str:
        return f"<RiskAssessment(target_id={self.target_id}, score={self.overall_score}, level={self.risk_level})>"


class AssetRiskScore(Base):
    """
    Asset-level prioritization metric to help analysts focus investigation.
    Ranked into deterministic priority levels (P1_urgent, P2_high, P3_medium, P4_low).
    """
    __tablename__ = "asset_risk_scores"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    target_id = Column(
        String(36),
        ForeignKey("targets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_id = Column(
        String(36),
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    priority_score = Column(Float, nullable=False, default=0.0)  # 0.0 to 100.0
    priority_level = Column(String(32), nullable=False, default="p4_low", index=True)  # p1_urgent, p2_high, p3_medium, p4_low
    contributing_factors = Column(JSON, nullable=False)  # Array of factors with weights and evidence links
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

    __table_args__ = (
        UniqueConstraint("target_id", "asset_id", name="uq_target_asset_risk_score"),
    )

    # Relationships
    target = relationship("Target", back_populates="asset_risk_scores")
    asset = relationship("Asset", back_populates="risk_score")

    def __repr__(self) -> str:
        return f"<AssetRiskScore(asset_id={self.asset_id}, score={self.priority_score}, level={self.priority_level})>"
