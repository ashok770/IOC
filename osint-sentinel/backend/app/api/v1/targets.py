from typing import Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from database.session import get_db
from app.schemas.target import TargetCreate, TargetResponse, TargetListResponse
from app.schemas.evidence import EvidenceListResponse, EvidenceResponse
from app.schemas.finding import FindingListResponse, FindingResponse
from app.schemas.collection import CollectionSummaryResponse
from app.services.target_service import TargetService
from app.services.collection_service import CollectionService

router = APIRouter(prefix="/v1/targets", tags=["Targets & Scoping"])


@router.post(
    "",
    response_model=TargetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register Authorized Assessment Target",
)
def create_target(
    payload: TargetCreate,
    db: Session = Depends(get_db),
) -> TargetResponse:
    """
    Registers a new authorized domain assessment target.
    Domain is normalized and strictly validated.
    Arbitrary URLs, protocols, ports, and IP addresses are rejected.
    """
    target = TargetService.create_target(db=db, target_in=payload)
    return TargetResponse.model_validate(target)


@router.get(
    "",
    response_model=TargetListResponse,
    summary="List Registered Assessment Targets",
)
def list_targets(
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(50, ge=1, le=200, description="Page limit"),
    db: Session = Depends(get_db),
) -> TargetListResponse:
    """List all registered assessment targets."""
    items, total = TargetService.list_targets(db=db, skip=skip, limit=limit)
    return TargetListResponse(
        items=[TargetResponse.model_validate(t) for t in items],
        total=total,
    )


@router.get(
    "/{target_id}",
    response_model=TargetResponse,
    summary="Get Target by ID",
)
def get_target(
    target_id: str,
    db: Session = Depends(get_db),
) -> TargetResponse:
    """Retrieve details of a registered assessment target."""
    target = TargetService.get_target_by_id(db=db, target_id=target_id)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target with ID '{target_id}' not found.",
        )
    return TargetResponse.model_validate(target)


@router.post(
    "/{target_id}/collect/domain",
    response_model=CollectionSummaryResponse,
    summary="Run Passive Domain Intelligence Collection",
)
async def collect_domain_intelligence(
    target_id: str,
    db: Session = Depends(get_db),
) -> CollectionSummaryResponse:
    """
    Runs passive domain intelligence collection (DNS, RDAP, Certificate Transparency),
    stores evidence, executes factual architectural analysis, and returns a summary.
    """
    collection_service = CollectionService()
    return await collection_service.run_domain_collection(db=db, target_id=target_id)


@router.get(
    "/{target_id}/evidence",
    response_model=EvidenceListResponse,
    summary="List Evidence Items for Target",
)
def get_target_evidence(
    target_id: str,
    evidence_type: Optional[str] = Query(None, description="Filter by evidence_type (e.g. dns_record, rdap_registration)"),
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(100, ge=1, le=500, description="Page limit"),
    db: Session = Depends(get_db),
) -> EvidenceListResponse:
    """Query persisted evidence items for a target domain with optional filtering."""
    items, total = CollectionService.get_evidence(
        db=db,
        target_id=target_id,
        evidence_type=evidence_type,
        skip=skip,
        limit=limit,
    )
    return EvidenceListResponse(
        items=[EvidenceResponse.model_validate(e) for e in items],
        total=total,
        target_id=target_id,
        evidence_type_filter=evidence_type,
        limit=limit,
        offset=skip,
    )


@router.get(
    "/{target_id}/findings",
    response_model=FindingListResponse,
    summary="List Factual Observations / Findings for Target",
)
def get_target_findings(
    target_id: str,
    category: Optional[str] = Query(None, description="Filter by category (e.g. dns, mail, infrastructure, certificates)"),
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(100, ge=1, le=500, description="Page limit"),
    db: Session = Depends(get_db),
) -> FindingListResponse:
    """Query factual observation findings produced by analyzers."""
    items, total = CollectionService.get_findings(
        db=db,
        target_id=target_id,
        category=category,
        skip=skip,
        limit=limit,
    )
    return FindingListResponse(
        items=[FindingResponse.model_validate(f) for f in items],
        total=total,
        target_id=target_id,
    )
