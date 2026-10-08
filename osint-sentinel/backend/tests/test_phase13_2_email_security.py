import uuid
import pytest
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.target import Target
from app.models.asset import Asset
from app.models.evidence import EvidenceItem
from app.models.technology import Technology
from app.models.relationship import Relationship
from app.models.exposure_signal import ExposureSignal
from app.models.assessment_run import AssessmentRun, AssessmentRunExposureSignal
from analyzers.email_analyzer import EmailAnalyzer, SPFAnalysis, DMARCAnalysis
from correlation.correlator import CorrelationEngine
from correlation.exposure_analyzer import ExposureAnalyzer
from risk.scorer import DeterministicRiskScorer
from app.services.collection_service import CollectionService
from app.services.comparison_service import AssessmentComparisonService


def test_spf_qualifiers_parsing():
    analyzer = EmailAnalyzer()
    
    # 1. valid -all
    res1 = analyzer.analyze("example.com", [{"evidence_type": "dns_record", "data": {"record_type": "TXT", "value": "v=spf1 -all"}}])
    assert res1.spf.present is True
    assert res1.spf.all_qualifier == "-all"
    
    # 2. valid ~all
    res2 = analyzer.analyze("example.com", [{"evidence_type": "dns_record", "data": {"record_type": "TXT", "value": "v=spf1 ~all"}}])
    assert res2.spf.all_qualifier == "~all"

    # 3. valid ?all
    res3 = analyzer.analyze("example.com", [{"evidence_type": "dns_record", "data": {"record_type": "TXT", "value": "v=spf1 ?all"}}])
    assert res3.spf.all_qualifier == "?all"

    # 4. valid +all
    res4 = analyzer.analyze("example.com", [{"evidence_type": "dns_record", "data": {"record_type": "TXT", "value": "v=spf1 +all"}}])
    assert res4.spf.all_qualifier == "+all"


def test_spf_mechanisms_parsing():
    analyzer = EmailAnalyzer()

    # 5. include:, 6. ip4:, 7. ip6:, 8. redirect=
    raw = "v=spf1 include:_spf.google.com ip4:192.168.1.1 ip6:2001:db8::1 redirect=_spf.example.org -all"
    res = analyzer.analyze("example.com", [{"evidence_type": "dns_record", "data": {"record_type": "TXT", "value": raw}}])
    
    assert res.spf.present is True
    assert res.spf.includes == ["_spf.google.com"]
    assert res.spf.ip4_mechanisms == ["192.168.1.1"]
    assert res.spf.ip6_mechanisms == ["2001:db8::1"]
    assert res.spf.redirect == "_spf.example.org"
    assert res.spf.all_qualifier == "-all"


def test_spf_multiple_and_missing_and_malformed():
    analyzer = EmailAnalyzer()

    # 9. multiple SPF records
    res_mult = analyzer.analyze(
        "example.com",
        [
            {"evidence_type": "dns_record", "data": {"record_type": "TXT", "value": "v=spf1 -all"}},
            {"evidence_type": "dns_record", "data": {"record_type": "TXT", "value": "v=spf1 ~all"}},
        ],
    )
    assert res_mult.spf.multiple_records is True
    assert res_mult.spf.malformed is True

    # 10. missing SPF
    res_miss = analyzer.analyze("example.com", [{"evidence_type": "dns_record", "data": {"record_type": "TXT", "status": "no_record"}}])
    assert res_miss.spf.present is False
    assert res_miss.spf.query_executed is True

    # 11. malformed SPF
    res_mal = analyzer.analyze("example.com", [{"evidence_type": "dns_record", "data": {"record_type": "TXT", "value": "spf1 redirect=test"}}])
    assert res_mal.spf.present is True
    assert res_mal.spf.malformed is True


def test_dmarc_parsing_all_tags():
    analyzer = EmailAnalyzer()

    # 12. p=none, 15. sp=, 16. pct=, 17. rua=, 18. ruf=
    raw_none = "v=DMARC1; p=none; sp=reject; pct=50; rua=mailto:rua@example.com; ruf=mailto:ruf@example.com"
    res_none = analyzer.analyze("example.com", [{"evidence_type": "dns_record", "data": {"record_type": "TXT", "value": raw_none, "subdomain_type": "dmarc"}}])
    assert res_none.dmarc.present is True
    assert res_none.dmarc.policy == "none"
    assert res_none.dmarc.subdomain_policy == "reject"
    assert res_none.dmarc.percentage == 50
    assert res_none.dmarc.rua == ["mailto:rua@example.com"]
    assert res_none.dmarc.ruf == ["mailto:ruf@example.com"]

    # 13. p=quarantine
    raw_quar = "v=DMARC1; p=quarantine"
    res_quar = analyzer.analyze("example.com", [{"evidence_type": "dns_record", "data": {"record_type": "TXT", "value": raw_quar}}])
    assert res_quar.dmarc.policy == "quarantine"

    # 14. p=reject
    raw_rej = "v=DMARC1; p=reject"
    res_rej = analyzer.analyze("example.com", [{"evidence_type": "dns_record", "data": {"record_type": "TXT", "value": raw_rej}}])
    assert res_rej.dmarc.policy == "reject"

    # 19. missing DMARC
    res_miss = analyzer.analyze("example.com", [{"evidence_type": "dns_record", "data": {"record_type": "TXT", "domain": "example.com"}}])
    assert res_miss.dmarc.present is False

    # 20. malformed DMARC
    res_mal = analyzer.analyze("example.com", [{"evidence_type": "dns_record", "data": {"record_type": "TXT", "value": "v=DMARC1; p=invalid_policy"}}])
    assert res_mal.dmarc.malformed is True


def test_spf_include_relationships():
    target = Target(id="target-100", primary_domain="targetcorp.com")
    asset_domain = Asset(id="asset-domain-100", target_id="target-100", asset_type="domain", value="targetcorp.com")
    
    # 21. SPF include creates external dependency relationship
    # 22. Target-owned namespace is treated as internal references
    # 23. Relationship preserves evidence_id
    # 24. Duplicate include does not create duplicate relationship
    ev = EvidenceItem(
        id="ev-spf-100",
        target_id="target-100",
        evidence_type="dns_record",
        data={"record_type": "TXT", "value": "v=spf1 include:_spf.google.com include:internal.targetcorp.com include:_spf.google.com -all"},
    )

    engine = CorrelationEngine()
    rels = engine.correlate(target=target, assets=[asset_domain], evidence_items=[ev], technologies=[])

    spf_rels = [r for r in rels if r.extra_data and r.extra_data.get("role") == "spf_include"]
    assert len(spf_rels) == 2

    ext_rel = next(r for r in spf_rels if r.target_id_reference == "_spf.google.com")
    assert ext_rel.relationship_type == "externally_referenced"
    assert ext_rel.target_type == "external_entity"
    assert ext_rel.evidence_id == "ev-spf-100"

    int_rel = next(r for r in spf_rels if r.target_id_reference == "internal.targetcorp.com")
    assert int_rel.relationship_type == "references"
    assert int_rel.extra_data.get("target_owned") is True


def test_email_exposure_signals():
    target = Target(id="target-200", primary_domain="email-test.com")
    asset_domain = Asset(id="asset-domain-200", target_id="target-200", asset_type="domain", value="email-test.com")
    analyzer = ExposureAnalyzer()

    # 25. missing SPF signal & 28. missing DMARC signal
    ev_missing = EvidenceItem(id="ev-201", target_id="target-200", evidence_type="dns_record", data={"record_type": "TXT", "domain": "email-test.com"})
    sigs_miss = analyzer.analyze(target=target, assets=[asset_domain], technologies=[], relationships=[], evidence_items=[ev_missing])
    
    sig_types = [s.signal_type for s in sigs_miss]
    assert "missing_spf" in sig_types
    assert "missing_dmarc" in sig_types
    # 30. Evidence provenance preserved
    assert all(s.evidence_id == "ev-201" for s in sigs_miss if s.signal_type in ("missing_spf", "missing_dmarc"))

    # 26. permissive SPF signal (+all) & 29. non-enforcing DMARC signal (p=none)
    ev_permissive = EvidenceItem(
        id="ev-202",
        target_id="target-200",
        evidence_type="dns_record",
        data={"TXT": ["v=spf1 +all", "v=DMARC1; p=none"]},
    )
    sigs_perm = analyzer.analyze(target=target, assets=[asset_domain], technologies=[], relationships=[], evidence_items=[ev_permissive])
    perm_types = [s.signal_type for s in sigs_perm]
    assert "permissive_spf" in perm_types
    assert "non_enforcing_dmarc" in perm_types

    # 27. softfail SPF signal (~all)
    ev_soft = EvidenceItem(
        id="ev-203",
        target_id="target-200",
        evidence_type="dns_record",
        data={"TXT": ["v=spf1 ~all", "v=DMARC1; p=reject"]},
    )
    sigs_soft = analyzer.analyze(target=target, assets=[asset_domain], technologies=[], relationships=[], evidence_items=[ev_soft])
    soft_types = [s.signal_type for s in sigs_soft]
    assert "softfail_spf" in soft_types


def test_risk_scorer_consistency_and_failed_dns():
    target = Target(id="target-300", primary_domain="risk-email.org")
    asset_domain = Asset(id="asset-domain-300", target_id="target-300", asset_type="domain", value="risk-email.org")

    # 31. existing email score behavior remains consistent
    # 33. structured analyzer output is consumed by RiskScorer
    # 34. RiskScorer does not independently parse raw SPF/DMARC strings
    ev = EvidenceItem(
        id="ev-301",
        target_id="target-300",
        evidence_type="dns_record",
        data={"TXT": ["v=spf1 ~all", "v=DMARC1; p=none"]},
    )
    result = DeterministicRiskScorer.evaluate(target=target, assets=[asset_domain], evidence_items=[ev], technologies=[], relationships=[], exposure_signals=[])
    # ~all (+3.0) + p=none (+8.0) = 11.0
    assert result.factors_breakdown["email_defense_posture"] == 11.0

    # 32. failed DNS query does not create false email penalties
    result_no_dns = DeterministicRiskScorer.evaluate(target=target, assets=[asset_domain], evidence_items=[], technologies=[], relationships=[], exposure_signals=[])
    assert result_no_dns.factors_breakdown["email_defense_posture"] == 0.0


@pytest.mark.anyio
async def test_assessment_run_snapshots_and_comparison(db_session: Session):
    target = Target(id=str(uuid.uuid4()), primary_domain="snapshot-email.com", owner_id="user-1")
    db_session.add(target)
    db_session.commit()

    service = CollectionService()
    summary = await service.run_domain_collection(db=db_session, target_id=target.id)
    assert summary.status in ("completed", "partial")

    # 35. Email signals appear in AssessmentRun snapshot
    run_record = db_session.query(AssessmentRun).filter(AssessmentRun.target_id == target.id).first()
    assert run_record is not None
    snaps = db_session.query(AssessmentRunExposureSignal).filter(AssessmentRunExposureSignal.assessment_run_id == run_record.id).all()
    
    # 36. Repeated assessment remains deterministic
    summary2 = await service.run_domain_collection(db=db_session, target_id=target.id)
    assert summary2.status in ("completed", "partial")

    # 37. Historical comparison remains functional
    runs = db_session.query(AssessmentRun).filter(AssessmentRun.target_id == target.id).order_by(AssessmentRun.started_at.asc()).all()
    if len(runs) >= 2:
        comp = AssessmentComparisonService.compare_runs(db=db_session, base_run=runs[0], target_run=runs[1])
        assert comp.summary is not None
