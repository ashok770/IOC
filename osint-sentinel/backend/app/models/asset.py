import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from database.session import Base


class Asset(Base):
    """
    Normalized asset belonging to an authorized Target.
    Categorized into domain, subdomain/hostname, IP, or certificate-associated hostname.
    """
    __tablename__ = "assets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    target_id = Column(
        String(36),
        ForeignKey("targets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_type = Column(String(64), nullable=False, index=True)  # domain, subdomain, ip, certificate_hostname
    value = Column(String(255), nullable=False, index=True)
    discovered_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    last_seen_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    source = Column(String(64), nullable=False, index=True)  # DNS, crt.sh, RDAP, target_registration
    first_evidence_id = Column(
        String(36),
        ForeignKey("evidence_items.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    extra_data = Column(JSON, nullable=True)

    # Composite uniqueness constraint: an asset value of a specific type is unique per target
    __table_args__ = (
        UniqueConstraint("target_id", "asset_type", "value", name="uq_target_asset_type_value"),
    )

    # Relationships
    target = relationship("Target", back_populates="assets")
    first_evidence = relationship("EvidenceItem", foreign_keys=[first_evidence_id])
    technologies = relationship(
        "Technology",
        back_populates="asset",
        cascade="all, delete-orphan",
        order_by="Technology.created_at.desc()",
    )
    exposure_signals = relationship(
        "ExposureSignal",
        back_populates="asset",
        cascade="all, delete-orphan",
        order_by="ExposureSignal.created_at.desc()",
    )
    risk_score = relationship(
        "AssetRiskScore",
        back_populates="asset",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Asset(id={self.id}, type={self.asset_type}, value='{self.value}')>"
