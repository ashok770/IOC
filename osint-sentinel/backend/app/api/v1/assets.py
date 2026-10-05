from typing import Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from database.session import get_db
from app.models.asset import Asset
from app.schemas.asset import AssetResponse
from app.schemas.technology import TechnologyResponse, TechnologyListResponse
from app.schemas.relationship import RelationshipResponse, RelationshipListResponse
from app.schemas.risk import AssetRiskScoreResponse
from app.services.technology_service import TechnologyService
from app.services.correlation_service import CorrelationService
from app.services.risk_service import RiskService
from app.api.deps import get_authorized_target
from app.models.target import Target

router = APIRouter(prefix="/v1/assets", tags=["Assets & Inventory"])


@router.get(
    "/{asset_id}",
    response_model=AssetResponse,
    summary="Get Asset by ID",
)
def get_asset(
    asset_id: str,
    target_id: str = Query(..., description="Target ID to verify isolation"),
    target: Target = Depends(get_authorized_target),
    db: Session = Depends(get_db),
) -> AssetResponse:
    """Retrieve details for a single asset by ID, strictly verifying target scope."""
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.target_id == target.id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset with ID '{asset_id}' not found.",
        )
    return AssetResponse.model_validate(asset)


@router.get(
    "/{asset_id}/technologies",
    response_model=TechnologyListResponse,
    summary="List Technologies Associated with Asset",
)
def get_asset_technologies(
    asset_id: str,
    target_id: str = Query(..., description="Target ID to verify isolation"),
    target: Target = Depends(get_authorized_target),
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(100, ge=1, le=500, description="Page limit"),
    db: Session = Depends(get_db),
) -> TechnologyListResponse:
    """
    Retrieve technologies observed directly on a specific asset along with evidence provenance, strictly verifying target scope.
    """
    items, total = TechnologyService.list_asset_technologies(
        db=db,
        target_id=target.id,
        asset_id=asset_id,
        skip=skip,
        limit=limit,
    )
    return TechnologyListResponse(
        items=[TechnologyResponse.model_validate(t) for t in items],
        total=total,
        asset_id=asset_id,
        limit=limit,
        offset=skip,
    )


@router.get(
    "/{asset_id}/relationships",
    response_model=RelationshipListResponse,
    summary="List Relationships for Specific Asset",
)
def get_asset_relationships(
    asset_id: str,
    target_id: str = Query(..., description="Target ID to verify isolation"),
    target: Target = Depends(get_authorized_target),
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(100, ge=1, le=500, description="Page limit"),
    db: Session = Depends(get_db),
) -> RelationshipListResponse:
    """
    Retrieve all semantic relationships involving a specific asset, strictly verifying target scope.
    """
    items, total = CorrelationService.list_asset_relationships(
        db=db,
        target_id=target.id,
        asset_id=asset_id,
        skip=skip,
        limit=limit,
    )
    return RelationshipListResponse(
        items=[RelationshipResponse.model_validate(r) for r in items],
        total=total,
        asset_id=asset_id,
        limit=limit,
        offset=skip,
    )


@router.get(
    "/{asset_id}/risk",
    response_model=AssetRiskScoreResponse,
    summary="Get Specific Asset Risk & Priority Details",
)
def get_asset_risk(
    asset_id: str,
    target_id: str = Query(..., description="Target ID to verify isolation"),
    target: Target = Depends(get_authorized_target),
    db: Session = Depends(get_db),
) -> AssetRiskScoreResponse:
    """
    Retrieve exposure priority score, tier (P1-P4), and contributing risk factors for a specific asset, strictly verifying target scope.
    """
    item = RiskService.get_asset_risk(db=db, target_id=target.id, asset_id=asset_id)
    return AssetRiskScoreResponse(**item)


