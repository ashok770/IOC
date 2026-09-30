import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from database.session import Base


class Technology(Base):
    """
    Observable technology indicator cataloged under an authorized Target and Asset.
    Deterministic, explainable, and linked directly to evidentiary provenance.
    """
    __tablename__ = "technologies"

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
    name = Column(String(100), nullable=False, index=True)
    category = Column(
        String(64),
        nullable=False,
        index=True,
    )  # web_server, framework, cms, javascript_library, frontend_framework, cdn, cloud, hosting, email, other
    version = Column(String(64), nullable=True)
    detection_method = Column(
        String(64),
        nullable=False,
    )  # response_header, meta_tag, dns_record, rdap_metadata
    confidence = Column(Float, nullable=False, default=1.0)
    first_seen = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    last_seen = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
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
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Composite uniqueness constraint: a technology with same name and category is unique per target and asset
    __table_args__ = (
        UniqueConstraint("target_id", "asset_id", "name", "category", name="uq_target_asset_tech_name_cat"),
    )

    # Relationships
    target = relationship("Target", back_populates="technologies")
    asset = relationship("Asset", back_populates="technologies")
    evidence = relationship("EvidenceItem", foreign_keys=[evidence_id])

    def __repr__(self) -> str:
        version_str = f" v{self.version}" if self.version else ""
        return f"<Technology(id={self.id}, name='{self.name}{version_str}', category='{self.category}')>"
