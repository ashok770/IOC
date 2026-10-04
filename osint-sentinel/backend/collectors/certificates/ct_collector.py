import time
import logging
import asyncio
from typing import Dict, Any, List, Set, Optional
import httpx

from collectors.base import BaseCollector, CollectorResult, CollectorExecutionReport

logger = logging.getLogger(__name__)


class CertificateTransparencyCollector(BaseCollector):
    """
    Passive Certificate Transparency (CT) Intelligence Collector.
    Queries public Certificate Transparency logs (crt.sh) to discover valid and expired
    SSL/TLS certificates and associated public hostnames/subdomains without touching target servers.
    """

    name: str = "certificate_transparency"
    DEFAULT_CRTSH_URL = "https://crt.sh/?q=%.{domain}&output=json"

    def __init__(self, timeout: float = 8.0, custom_url: Optional[str] = None):
        self.timeout = timeout
        self.url_template = custom_url or self.DEFAULT_CRTSH_URL

    async def collect(self, domain: str, context=None) -> CollectorExecutionReport:
        start_time = time.time()
        query_url = self.url_template.format(domain=domain)
        
        if context:
            if not context.check_and_increment_budget():
                logger.warning(f"Budget exhausted for target {context.target_id}. Skipping CT for {domain}")
                return CollectorExecutionReport(
                    source_name=self.name,
                    status="no_data",
                    results=[],
                    error_message="Collection skipped: outbound request budget exhausted.",
                    duration_seconds=0.0,
                )
            dest_key = f"{self.name}:{query_url}"
            if not context.mark_destination_requested(dest_key):
                logger.info(f"Collection skipped: duplicate request to {query_url}")
                return CollectorExecutionReport(
                    source_name=self.name,
                    status="no_data",
                    results=[],
                    error_message=f"Collection skipped: duplicate request to {query_url}",
                    duration_seconds=0.0,
                )

        headers = {
            "User-Agent": "OSINT-Sentinel/0.1.0 (Defensive Security Exposure Assessment)",
            "Accept": "application/json",
        }

        from app.utils.resource_controls import GlobalResourceController
        controller = GlobalResourceController.get_instance()
        semaphore = controller.get_semaphore()

        try:
            async with semaphore:
                async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                    response = await client.get(query_url, headers=headers)

                    if response.status_code in (429, 502, 503, 504):
                        duration = round(time.time() - start_time, 3)
                        logger.warning(
                            f"crt.sh returned status {response.status_code} for {domain}. Service busy."
                        )
                        return CollectorExecutionReport(
                            source_name=self.name,
                            status="partial",
                            results=[],
                            error_message=f"Certificate transparency service returned HTTP {response.status_code}",
                            duration_seconds=duration,
                        )

                    response.raise_for_status()

                    try:
                        certificates_raw = response.json()
                    except Exception:
                        duration = round(time.time() - start_time, 3)
                        logger.warning(f"Failed to parse crt.sh JSON response for {domain}")
                        return CollectorExecutionReport(
                            source_name=self.name,
                            status="partial",
                            results=[],
                            error_message="Invalid JSON received from CT log service",
                            duration_seconds=duration,
                        )

                    if not isinstance(certificates_raw, list) or len(certificates_raw) == 0:
                        duration = round(time.time() - start_time, 3)
                        return CollectorExecutionReport(
                            source_name=self.name,
                            status="no_data",
                            results=[],
                            duration_seconds=duration,
                        )

                    # Process certificate entries & deduplicate hostnames
                    discovered_hostnames: Set[str] = set()
                    recent_certificates: List[Dict[str, Any]] = []

                    # Cap sample size to prevent memory bloat on large domains
                    sample_certs = certificates_raw[:50]

                    for entry in sample_certs:
                        name_value = entry.get("name_value", "")
                        for name in name_value.split("\n"):
                            clean_name = name.strip().lower().lstrip("*.")
                            if clean_name and (clean_name == domain or clean_name.endswith(f".{domain}")):
                                discovered_hostnames.add(clean_name)

                        recent_certificates.append({
                            "id": entry.get("id"),
                            "issuer_name": entry.get("issuer_name"),
                            "common_name": entry.get("common_name"),
                            "entry_timestamp": entry.get("entry_timestamp"),
                            "not_before": entry.get("not_before"),
                            "not_after": entry.get("not_after"),
                        })

                    results: List[CollectorResult] = []

                    # Evidence item for discovered hostnames
                    results.append(
                        CollectorResult(
                            evidence_type="certificate_hostnames",
                            source="crt.sh",
                            source_url=query_url,
                            data={
                                "domain": domain,
                                "discovered_hostnames": sorted(list(discovered_hostnames)),
                                "total_discovered": len(discovered_hostnames),
                            },
                            confidence=1.0,
                            notes=(
                                f"Identified {len(discovered_hostnames)} unique hostnames "
                                f"via Certificate Transparency logs"
                            ),
                        )
                    )

                    # Evidence item for certificate log history sample
                    results.append(
                        CollectorResult(
                            evidence_type="certificate_log_sample",
                            source="crt.sh",
                            source_url=query_url,
                            data={
                                "domain": domain,
                                "total_entries_found": len(certificates_raw),
                                "sample_entries": recent_certificates[:10],
                            },
                            confidence=1.0,
                            notes=f"Retrieved {len(certificates_raw)} total CT log entries",
                        )
                    )

                    duration = round(time.time() - start_time, 3)
                    return CollectorExecutionReport(
                        source_name=self.name,
                        status="success",
                        results=results,
                        duration_seconds=duration,
                    )

        except httpx.TimeoutException:
            duration = round(time.time() - start_time, 3)
            logger.warning(f"Certificate Transparency query timed out for {domain}")
            return CollectorExecutionReport(
                source_name=self.name,
                status="partial",
                results=[],
                error_message="CT log service query timed out",
                duration_seconds=duration,
            )
        except asyncio.CancelledError:
            duration = round(time.time() - start_time, 3)
            logger.warning(f"Certificate Transparency query cancelled for {domain}")
            return CollectorExecutionReport(
                source_name=self.name,
                status="partial",
                results=[],
                error_message="CT log service query cancelled",
                duration_seconds=duration,
            )
        except Exception as exc:
            duration = round(time.time() - start_time, 3)
            logger.warning(f"CT collection failed for {domain}: {exc}")
            return CollectorExecutionReport(
                source_name=self.name,
                status="failed",
                results=[],
                error_message=str(exc),
                duration_seconds=duration,
            )
