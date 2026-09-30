import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, Text, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from database.session import Base


class ExposureSignal(Base):
    """
    Security-relevant exposure observations that help an analyst prioritize investigation.
    Strictly factual and informative (severity='info').
    Does NOT infer vulnerabilities, CVEs, or claim ownership of external infrastructure.
    """
    __tablename__ = "exposure_signals"

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
        nullable=True,
        index=True,
    )
    signal_type = Column(
        String(64),
        nullable=False,
        index=True,
    )  # remote_access_indicator, development_test_indicator, technology_disclosure, external_dependency_reference
    category = Column(
        String(64),
        nullable=False,
        index=True,
    )  # perimeter_surface, non_production_exposure, technology_stack, external_dependency
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(32), nullable=False, default="info", index=True)
    confidence = Column(Float, nullable=False, default=1.0)
    evidence_id = Column(
        String(36),
        ForeignKey("evidence_items.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    extra_data = Column(JSON, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    __table_args__ = (
        UniqueConstraint(
            "target_id",
            "asset_id",
            "signal_type",
            "title",
            name="uq_target_asset_signal",
        ),
    )

    # Relationships
    target = relationship("Target", back_populates="exposure_signals")
    asset = relationship("Asset", back_populates="exposure_signals")
    evidence = relationship("EvidenceItem", foreign_keys=[evidence_id])

    def __repr__(self) -> str:
        return f"<ExposureSignal(id={self.id}, type={self.signal_type}, title='{self.title}')>"
