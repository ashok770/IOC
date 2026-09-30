import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from database.session import Base


class Relationship(Base):
    """
    Represents factual, directed semantic relationships between Targets, Assets,
    Evidence, Technologies, and External entities.
    """
    __tablename__ = "relationships"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    target_id = Column(
        String(36),
        ForeignKey("targets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_type = Column(String(64), nullable=False, index=True)  # target, asset, technology, evidence
    source_id = Column(String(36), nullable=False, index=True)
    relationship_type = Column(
        String(64),
        nullable=False,
        index=True,
    )  # contains, supported_by, resolves_to, references, certificate_associated_with, technology_observed_on, externally_referenced
    target_type = Column(String(64), nullable=False, index=True)  # target, asset, technology, evidence, external_entity
    target_id_reference = Column(String(255), nullable=False, index=True)
    evidence_id = Column(
        String(36),
        ForeignKey("evidence_items.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    confidence = Column(Float, nullable=False, default=1.0)
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
            "source_type",
            "source_id",
            "relationship_type",
            "target_type",
            "target_id_reference",
            name="uq_target_rel_edge",
        ),
    )

    # Relationships
    target = relationship("Target", back_populates="relationships")
    evidence = relationship("EvidenceItem", foreign_keys=[evidence_id])

    def __repr__(self) -> str:
        return (
            f"<Relationship({self.source_type}:{self.source_id} "
            f"--[{self.relationship_type}]--> {self.target_type}:{self.target_id_reference})>"
        )
