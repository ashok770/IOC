from typing import Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException, Request
from sqlalchemy.orm import Session

from database.session import get_db
from app.models.user import User
from app.models.target import Target
from app.api.deps import get_current_user, get_authorized_target
from app.services.audit_service import AuditService, AuditAction, AuditResult
from app.schemas.target import TargetCreate, TargetResponse, TargetListResponse
from app.schemas.asset import AssetResponse, AssetListResponse
from app.schemas.technology import TechnologyResponse, TechnologyListResponse
from app.schemas.evidence import EvidenceListResponse, EvidenceResponse
from app.schemas.finding import FindingListResponse, FindingResponse
from app.schemas.collection import CollectionSummaryResponse
from app.schemas.relationship import RelationshipResponse, RelationshipListResponse
from app.schemas.exposure_signal import ExposureSignalResponse, ExposureSignalListResponse
from app.schemas.analysis import AnalysisSummaryResponse
from app.schemas.risk import RiskAssessmentResponse, AssetRiskScoreResponse, AssetRiskScoreListResponse
from app.services.target_service import TargetService
from app.services.collection_service import CollectionService
from app.services.asset_service import AssetService
from app.services.technology_service import TechnologyService
from app.services.correlation_service import CorrelationService
from app.services.risk_service import RiskService

router = APIRouter(prefix="/v1/targets", tags=["Targets & Scoping"])


@router.post(
    "",
    response_model=TargetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register Authorized Assessment Target",
)
def create_target(
    payload: TargetCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TargetResponse:
    """
    Registers a new authorized domain assessment target.
    Domain is normalized and strictly validated.
    Arbitrary URLs, protocols, ports, and IP addresses are rejected.
    """
    target = TargetService.create_target(db=db, target_in=payload, owner_id=current_user.id)
    AuditService.log(
        db=db,
        action=AuditAction.TARGET_CREATED,
        result=AuditResult.SUCCESS,
        user_id=current_user.id,
        target_id=target.id,
        request=request,
        metadata={"primary_domain": target.primary_domain}
    )
    return TargetResponse.model_validate(target)


@router.get(
    "",
    response_model=TargetListResponse,
    summary="List Registered Assessment Targets",
)
def list_targets(
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(50, ge=1, le=200, description="Page limit"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TargetListResponse:
    """List all registered assessment targets."""
    # We must filter list_targets by owner_id in TargetService
    items, total = TargetService.list_targets(db=db, skip=skip, limit=limit, owner_id=current_user.id)
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
    request: Request,
    target: Target = Depends(get_authorized_target),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TargetResponse:
    """Retrieve details of a registered assessment target."""
    AuditService.log(
        db=db,
        action=AuditAction.TARGET_VIEWED,
        result=AuditResult.SUCCESS,
        user_id=current_user.id,
        target_id=target.id,
        request=request,
    )
    return TargetResponse.model_validate(target)


@router.post(
    "/{target_id}/collect/domain",
    response_model=CollectionSummaryResponse,
    summary="Run Passive Domain Intelligence Collection",
)
async def collect_domain_intelligence(
    request: Request,
    target: Target = Depends(get_authorized_target),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CollectionSummaryResponse:
    """
    Runs passive domain intelligence collection (DNS, RDAP, Certificate Transparency),
    stores evidence, executes factual architectural analysis, and returns a summary.
    """
    AuditService.log(
        db=db,
        action=AuditAction.TARGET_COLLECTION_STARTED,
        result=AuditResult.STARTED,
        user_id=current_user.id,
        target_id=target.id,
        request=request,
    )
    
    collection_service = CollectionService()
    try:
        summary = await collection_service.run_domain_collection(db=db, target_id=target.id)
        AuditService.log(
            db=db,
            action=AuditAction.TARGET_COLLECTION_COMPLETED,
            result=AuditResult.SUCCESS,
            user_id=current_user.id,
            target_id=target.id,
            request=request,
            metadata={
                "evidence_count": summary.evidence_items_created,
                "findings_count": summary.findings_created
            }
        )
        return summary
    except Exception as e:
        AuditService.log(
            db=db,
            action=AuditAction.TARGET_COLLECTION_FAILED,
            result=AuditResult.FAILURE,
            user_id=current_user.id,
            target_id=target.id,
            request=request,
            metadata={"error": str(e)}
        )
        raise


@router.get(
    "/{target_id}/evidence",
    response_model=EvidenceListResponse,
    summary="List Evidence Items for Target",
)
def get_target_evidence(
    evidence_type: Optional[str] = Query(None, description="Filter by evidence_type (e.g. dns_record, rdap_registration)"),
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(100, ge=1, le=500, description="Page limit"),
    target: Target = Depends(get_authorized_target),
    db: Session = Depends(get_db),
) -> EvidenceListResponse:
    """Query persisted evidence items for a target domain with optional filtering."""
    items, total = CollectionService.get_evidence(
        db=db,
        target_id=target.id,
        evidence_type=evidence_type,
        skip=skip,
        limit=limit,
    )
    return EvidenceListResponse(
        items=[EvidenceResponse.model_validate(e) for e in items],
        total=total,
        target_id=target.id,
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
    category: Optional[str] = Query(None, description="Filter by category (e.g. dns, mail, infrastructure, certificates)"),
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(100, ge=1, le=500, description="Page limit"),
    target: Target = Depends(get_authorized_target),
    db: Session = Depends(get_db),
) -> FindingListResponse:
    """Query factual observation findings produced by analyzers."""
    items, total = CollectionService.get_findings(
        db=db,
        target_id=target.id,
        category=category,
        skip=skip,
        limit=limit,
    )
    return FindingListResponse(
        items=[FindingResponse.model_validate(f) for f in items],
        total=total,
        target_id=target.id,
    )


@router.get(
    "/{target_id}/assets",
    response_model=AssetListResponse,
    summary="List Discovered Assets for Target",
)
def get_target_assets(
    asset_type: Optional[str] = Query(
        None,
        description="Filter by asset_type (domain, subdomain, ip, certificate_associated_hostname)",
    ),
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(100, ge=1, le=500, description="Page limit"),
    target: Target = Depends(get_authorized_target),
    db: Session = Depends(get_db),
) -> AssetListResponse:
    """
    Query normalized assets (Domain, Subdomain, IP, Certificate-associated hostname)
    cataloged under an authorized assessment target.
    """
    items, total = AssetService.list_assets(
        db=db,
        target_id=target.id,
        asset_type=asset_type,
        skip=skip,
        limit=limit,
    )
    return AssetListResponse(
        items=[AssetResponse.model_validate(a) for a in items],
        total=total,
        target_id=target.id,
        asset_type_filter=asset_type,
        limit=limit,
        offset=skip,
    )


@router.get(
    "/{target_id}/assets/{asset_id}",
    response_model=AssetResponse,
    summary="Get Specific Asset by ID",
)
def get_target_asset_by_id(
    asset_id: str,
    target: Target = Depends(get_authorized_target),
    db: Session = Depends(get_db),
) -> AssetResponse:
    """Retrieve details for a specific asset belonging to a target."""
    asset = AssetService.get_asset_by_id(db=db, target_id=target.id, asset_id=asset_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset with ID '{asset_id}' not found under target '{target.id}'.",
        )
    return AssetResponse.model_validate(asset)


@router.get(
    "/{target_id}/technologies",
    response_model=TechnologyListResponse,
    summary="List Detected Technologies for Target",
)
def get_target_technologies(
    asset_id: Optional[str] = Query(None, description="Filter by associated asset ID"),
    category: Optional[str] = Query(
        None,
        description="Filter by category (web_server, framework, cms, cdn, cloud, email, other)",
    ),
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(100, ge=1, le=500, description="Page limit"),
    target: Target = Depends(get_authorized_target),
    db: Session = Depends(get_db),
) -> TechnologyListResponse:
    """
    Query observable technology indicators cataloged under an authorized target.
    Supports filtering by asset_id, category, and pagination.
    """
    items, total = TechnologyService.list_target_technologies(
        db=db,
        target_id=target.id,
        asset_id=asset_id,
        category=category,
        skip=skip,
        limit=limit,
    )
    return TechnologyListResponse(
        items=[TechnologyResponse.model_validate(t) for t in items],
        total=total,
        target_id=target.id,
        asset_id=asset_id,
        category_filter=category,
        limit=limit,
        offset=skip,
    )


@router.get(
    "/{target_id}/relationships",
    response_model=RelationshipListResponse,
    summary="List Semantic Graph Relationships for Target",
)
def get_target_relationships(
    relationship_type: Optional[str] = Query(None, description="Filter by relationship_type"),
    source_type: Optional[str] = Query(None, description="Filter by source_type (target, asset, technology, evidence)"),
    target_type: Optional[str] = Query(None, description="Filter by target_type (asset, technology, evidence, external_entity)"),
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(100, ge=1, le=500, description="Page limit"),
    target: Target = Depends(get_authorized_target),
    db: Session = Depends(get_db),
) -> RelationshipListResponse:
    """Query semantic graph relationships mapped under an authorized target."""
    items, total = CorrelationService.list_target_relationships(
        db=db,
        target_id=target.id,
        relationship_type=relationship_type,
        source_type=source_type,
        target_type=target_type,
        skip=skip,
        limit=limit,
    )
    return RelationshipListResponse(
        items=[RelationshipResponse.model_validate(r) for r in items],
        total=total,
        target_id=target.id,
        relationship_type_filter=relationship_type,
        source_type_filter=source_type,
        target_type_filter=target_type,
        limit=limit,
        offset=skip,
    )


@router.get(
    "/{target_id}/exposure-signals",
    response_model=ExposureSignalListResponse,
    summary="List Exposure Signals for Target",
)
def get_target_exposure_signals(
    category: Optional[str] = Query(None, description="Filter by category"),
    confidence: Optional[float] = Query(None, ge=0.0, le=1.0, description="Filter by minimum confidence"),
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(100, ge=1, le=500, description="Page limit"),
    target: Target = Depends(get_authorized_target),
    db: Session = Depends(get_db),
) -> ExposureSignalListResponse:
    """Query factual security-relevant exposure signals identified under a target."""
    items, total = CorrelationService.list_target_exposure_signals(
        db=db,
        target_id=target.id,
        category=category,
        min_confidence=confidence,
        skip=skip,
        limit=limit,
    )
    return ExposureSignalListResponse(
        items=[ExposureSignalResponse.model_validate(s) for s in items],
        total=total,
        target_id=target.id,
        category_filter=category,
        min_confidence=confidence,
        limit=limit,
        offset=skip,
    )


@router.get(
    "/{target_id}/analysis/summary",
    response_model=AnalysisSummaryResponse,
    summary="Get Analyst-Oriented Exposure & Inventory Summary",
)
def get_analysis_summary(
    target: Target = Depends(get_authorized_target),
    db: Session = Depends(get_db),
) -> AnalysisSummaryResponse:
    """Retrieve deterministic counts of assets, technologies, evidence, relationships, signals, and findings."""
    return CorrelationService.get_analysis_summary(db=db, target_id=target.id)


@router.get(
    "/{target_id}/risk",
    response_model=RiskAssessmentResponse,
    summary="Get Target External Risk Assessment",
)
def get_target_risk(
    target: Target = Depends(get_authorized_target),
    db: Session = Depends(get_db),
) -> RiskAssessmentResponse:
    """
    Retrieve explainable, deterministic external risk posture assessment for an authorized target.
    Computed from verified configurations, email defenses, technology disclosures, and exposure signals.
    """
    assessment = RiskService.get_target_risk(db=db, target_id=target.id)
    return RiskAssessmentResponse.model_validate(assessment)


@router.get(
    "/{target_id}/risk/assets",
    response_model=AssetRiskScoreListResponse,
    summary="List Prioritized Assets for Target",
)
def list_target_asset_priorities(
    priority_level: Optional[str] = Query(
        None,
        description="Filter by priority level: p1_urgent, p2_high, p3_medium, p4_low",
    ),
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(100, ge=1, le=500, description="Page limit"),
    target: Target = Depends(get_authorized_target),
    db: Session = Depends(get_db),
) -> AssetRiskScoreListResponse:
    """
    Retrieve prioritized list of perimeter assets ranked by exposure impact (P1 urgent to P4 low).
    """
    items, total = RiskService.list_asset_priorities(
        db=db,
        target_id=target.id,
        priority_level=priority_level,
        skip=skip,
        limit=limit,
    )
    return AssetRiskScoreListResponse(
        items=[AssetRiskScoreResponse(**item) for item in items],
        total=total,
        target_id=target.id,
        priority_level_filter=priority_level,
        limit=limit,
        offset=skip,
    )

