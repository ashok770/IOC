import asyncio
import logging
from typing import Dict, List, Any
from pydantic import BaseModel, Field

from collectors.base import CollectorResult, CollectorExecutionReport
from collectors.dns import DNSCollector
from collectors.rdap import RDAPCollector
from collectors.certificates import CertificateTransparencyCollector

logger = logging.getLogger(__name__)


class DomainCollectionResult(BaseModel):
    """Aggregated output from all passive domain collectors."""
    domain: str
    sources_status: Dict[str, str]
    evidence_results: List[CollectorResult]
    reports: Dict[str, CollectorExecutionReport]


class DomainIntelligenceCollector:
    """
    Modular orchestrator coordinating all passive domain intelligence collectors.
    Executes DNS, RDAP, and Certificate Transparency gathering concurrently
    without cross-collector blocking or cascading failures.
    """

    def __init__(
        self,
        dns_collector: DNSCollector = None,
        rdap_collector: RDAPCollector = None,
        ct_collector: CertificateTransparencyCollector = None,
    ):
        self.dns_collector = dns_collector or DNSCollector()
        self.rdap_collector = rdap_collector or RDAPCollector()
        self.ct_collector = ct_collector or CertificateTransparencyCollector()

    async def collect(self, domain: str) -> DomainCollectionResult:
        logger.info(f"Starting passive domain collection for: {domain}")

        tasks = [
            self.dns_collector.collect(domain),
            self.rdap_collector.collect(domain),
            self.ct_collector.collect(domain),
        ]

        # Execute all passive collectors concurrently
        raw_reports = await asyncio.gather(*tasks, return_exceptions=True)

        sources_status: Dict[str, str] = {}
        all_evidence: List[CollectorResult] = []
        reports_map: Dict[str, CollectorExecutionReport] = {}

        collector_names = [
            self.dns_collector.name,
            self.rdap_collector.name,
            self.ct_collector.name,
        ]

        for name, item in zip(collector_names, raw_reports):
            if isinstance(item, Exception):
                logger.error(f"Collector {name} encountered uncaught exception: {item}")
                sources_status[name] = "failed"
                reports_map[name] = CollectorExecutionReport(
                    source_name=name,
                    status="failed",
                    error_message=str(item),
                )
            else:
                sources_status[name] = item.status
                reports_map[name] = item
                all_evidence.extend(item.results)

        logger.info(
            f"Completed collection for {domain}. Total evidence items gathered: {len(all_evidence)}"
        )

        return DomainCollectionResult(
            domain=domain,
            sources_status=sources_status,
            evidence_results=all_evidence,
            reports=reports_map,
        )
