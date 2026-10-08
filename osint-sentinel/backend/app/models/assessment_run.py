import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, Integer, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from database.session import Base


class AssessmentRun(Base):
    """
    Immutable historical record of a complete domain assessment run execution.
    Captures run status, execution timestamps, overall exposure score, risk level,
    factors breakdown, collector statuses, and snapshot counts.
    """
    __tablename__ = "assessment_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    target_id = Column(
        String(36),
        ForeignKey("targets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(String(50), nullable=False, default="in_progress", index=True)
    started_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)

    overall_score = Column(Float, nullable=False, default=0.0)
    risk_level = Column(String(32), nullable=False, default="low")

    total_assets = Column(Integer, nullable=False, default=0)
    total_technologies = Column(Integer, nullable=False, default=0)
    total_exposure_signals = Column(Integer, nullable=False, default=0)
    total_findings = Column(Integer, nullable=False, default=0)
    total_evidence_items = Column(Integer, nullable=False, default=0)

    factors_breakdown = Column(JSON, nullable=True)
    sources_status = Column(JSON, nullable=True)
    error_message = Column(String(1024), nullable=True)

    __table_args__ = (
        Index("idx_assessment_run_target_started", "target_id", "started_at"),
    )

    # Relationships
    target = relationship("Target", back_populates="assessment_runs")
    asset_snapshots = relationship(
        "AssessmentRunAsset",
        back_populates="assessment_run",
        cascade="all, delete-orphan",
    )
    technology_snapshots = relationship(
        "AssessmentRunTechnology",
        back_populates="assessment_run",
        cascade="all, delete-orphan",
    )
    exposure_signal_snapshots = relationship(
        "AssessmentRunExposureSignal",
        back_populates="assessment_run",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<AssessmentRun(id={self.id}, target_id={self.target_id}, status={self.status})>"


class AssessmentRunAsset(Base):
    """
    Immutable point-in-time snapshot of an Asset present during an AssessmentRun.
    Preserves asset_type and value even if the live Asset record is later modified or removed.
    """
    __tablename__ = "assessment_run_assets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    assessment_run_id = Column(
        String(36),
        ForeignKey("assessment_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    target_id = Column(
        String(36),
        ForeignKey("targets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_id = Column(
        String(36),
        ForeignKey("assets.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    asset_type = Column(String(64), nullable=False)
    value = Column(String(255), nullable=False)
    source = Column(String(64), nullable=False)
    priority_score = Column(Float, nullable=True)
    priority_level = Column(String(32), nullable=True)

    __table_args__ = (
        Index("idx_run_asset_run_target", "assessment_run_id", "target_id"),
    )

    # Relationships
    assessment_run = relationship("AssessmentRun", back_populates="asset_snapshots")
    target = relationship("Target")
    asset = relationship("Asset")

    def __repr__(self) -> str:
        return f"<AssessmentRunAsset(run_id={self.assessment_run_id}, value='{self.value}')>"


class AssessmentRunTechnology(Base):
    """
    Immutable point-in-time snapshot of a Technology observed during an AssessmentRun.
    Preserves version and detection details at the moment of the run.
    """
    __tablename__ = "assessment_run_technologies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    assessment_run_id = Column(
        String(36),
        ForeignKey("assessment_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    target_id = Column(
        String(36),
        ForeignKey("targets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_value = Column(String(255), nullable=True)
    name = Column(String(100), nullable=False)
    category = Column(String(64), nullable=False)
    version = Column(String(64), nullable=True)
    detection_method = Column(String(64), nullable=False)
    confidence = Column(Float, nullable=False, default=1.0)

    __table_args__ = (
        Index("idx_run_tech_run_target", "assessment_run_id", "target_id"),
    )

    # Relationships
    assessment_run = relationship("AssessmentRun", back_populates="technology_snapshots")
    target = relationship("Target")

    def __repr__(self) -> str:
        return f"<AssessmentRunTechnology(run_id={self.assessment_run_id}, name='{self.name}')>"


class AssessmentRunExposureSignal(Base):
    """
    Immutable point-in-time snapshot of an ExposureSignal evaluated during an AssessmentRun.
    """
    __tablename__ = "assessment_run_exposure_signals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    assessment_run_id = Column(
        String(36),
        ForeignKey("assessment_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    target_id = Column(
        String(36),
        ForeignKey("targets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_value = Column(String(255), nullable=True)
    signal_type = Column(String(64), nullable=False)
    category = Column(String(64), nullable=False)
    title = Column(String(255), nullable=False)
    severity = Column(String(32), nullable=False, default="info")
    confidence = Column(Float, nullable=False, default=1.0)

    __table_args__ = (
        Index("idx_run_signal_run_target", "assessment_run_id", "target_id"),
    )

    # Relationships
    assessment_run = relationship("AssessmentRun", back_populates="exposure_signal_snapshots")
    target = relationship("Target")

    def __repr__(self) -> str:
        return f"<AssessmentRunExposureSignal(run_id={self.assessment_run_id}, title='{self.title}')>"
