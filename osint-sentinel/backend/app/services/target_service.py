from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.target import Target
from app.schemas.target import TargetCreate


class TargetService:
    @staticmethod
    def create_target(db: Session, target_in: TargetCreate, owner_id: str) -> Target:
        """Register a new assessment target."""
        existing = (
            db.query(Target)
            .filter(func.lower(Target.primary_domain) == target_in.primary_domain.lower())
            # For this architecture, targets are globally unique by domain (across users)
            # or unique per user. Assuming globally unique based on original unique index.
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Target with domain '{target_in.primary_domain}' is already registered (ID: {existing.id}).",
            )

        target = Target(
            name=target_in.organization_name,
            primary_domain=target_in.primary_domain,
            assessment_status="pending",
            owner_id=owner_id,
        )
        db.add(target)
        db.commit()
        db.refresh(target)
        return target

    @staticmethod
    def get_target_by_id(db: Session, target_id: str) -> Optional[Target]:
        """Retrieve target by ID."""
        return db.query(Target).filter(Target.id == target_id).first()

    @staticmethod
    def list_targets(db: Session, skip: int = 0, limit: int = 100, owner_id: str = None) -> Tuple[List[Target], int]:
        """List registered targets with pagination, filtered by owner."""
        query = db.query(Target)
        if owner_id:
            query = query.filter(Target.owner_id == owner_id)
            
        total = query.count()
        items = (
            query
            .order_by(Target.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return items, total
