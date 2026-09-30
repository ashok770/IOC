import time
import asyncio
import logging
from typing import List, Dict, Any
import dns.resolver
import dns.exception

from collectors.base import BaseCollector, CollectorResult, CollectorExecutionReport

logger = logging.getLogger(__name__)

RECORD_TYPES = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA"]


class DNSCollector(BaseCollector):
    """
    Passive DNS Intelligence Collector.
    Resolves public DNS records (A, AAAA, MX, NS, TXT, CNAME, SOA)
    using deterministic, non-intrusive DNS queries with strict timeouts.
    """

    name: str = "dns"

    def __init__(self, timeout: float = 3.0, lifetime: float = 5.0):
        self.timeout = timeout
        self.lifetime = lifetime

    def _create_resolver(self) -> dns.resolver.Resolver:
        resolver = dns.resolver.Resolver()
        resolver.timeout = self.timeout
        resolver.lifetime = self.lifetime
        return resolver

    def _query_sync(self, domain: str) -> List[CollectorResult]:
        resolver = self._create_resolver()
        results: List[CollectorResult] = []

        for record_type in RECORD_TYPES:
            try:
                answers = resolver.resolve(domain, record_type)
                for rdata in answers:
                    parsed_data: Dict[str, Any] = {
                        "domain": domain,
                        "record_type": record_type,
                        "ttl": answers.rrset.ttl if answers.rrset else None,
                    }

                    if record_type == "MX":
                        parsed_data["preference"] = rdata.preference
                        parsed_data["exchange"] = str(rdata.exchange).rstrip(".")
                    elif record_type in ("NS", "CNAME"):
                        parsed_data["target"] = str(rdata.target).rstrip(".")
                    elif record_type == "TXT":
                        parsed_data["value"] = rdata.to_text().strip('"')
                    elif record_type == "SOA":
                        parsed_data["mname"] = str(rdata.mname).rstrip(".")
                        parsed_data["rname"] = str(rdata.rname).rstrip(".")
                        parsed_data["serial"] = rdata.serial
                    else:
                        parsed_data["address"] = rdata.to_text()

                    results.append(
                        CollectorResult(
                            evidence_type="dns_record",
                            source="DNS",
                            source_url=None,
                            data=parsed_data,
                            confidence=1.0,
                            notes=f"Resolved public {record_type} record",
                        )
                    )
            except dns.resolver.NXDOMAIN:
                logger.info(f"Domain {domain} does not exist (NXDOMAIN)")
                break  # If domain doesn't exist, no other records will exist
            except (dns.resolver.NoAnswer, dns.resolver.NoNameservers):
                continue
            except dns.exception.Timeout:
                logger.warning(f"DNS query timed out for {domain} [{record_type}]")
                continue
            except Exception as e:
                logger.warning(f"Error querying {record_type} for {domain}: {e}")
                continue

        return results

    async def collect(self, domain: str) -> CollectorExecutionReport:
        start_time = time.time()
        try:
            # Execute DNS query in worker thread to prevent event loop blocking
            results = await asyncio.to_thread(self._query_sync, domain)
            duration = round(time.time() - start_time, 3)

            status = "success" if results else "no_data"
            return CollectorExecutionReport(
                source_name=self.name,
                status=status,
                results=results,
                duration_seconds=duration,
            )
        except Exception as exc:
            duration = round(time.time() - start_time, 3)
            logger.error(f"DNS collection failed for {domain}: {exc}")
            return CollectorExecutionReport(
                source_name=self.name,
                status="failed",
                results=[],
                error_message=str(exc),
                duration_seconds=duration,
            )
