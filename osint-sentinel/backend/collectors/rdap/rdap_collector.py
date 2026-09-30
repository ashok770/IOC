import time
import logging
from typing import Dict, Any, List, Optional
import httpx

from collectors.base import BaseCollector, CollectorResult, CollectorExecutionReport

logger = logging.getLogger(__name__)


class RDAPCollector(BaseCollector):
    """
    Passive RDAP (Registration Data Access Protocol) Collector.
    Queries open, public RDAP registry endpoints to collect domain registration metadata
    (registrar, lifecycle timestamps, nameservers, domain status) without active probing.
    """

    name: str = "rdap"
    DEFAULT_BOOTSTRAP_URL = "https://rdap.org/domain/{domain}"

    def __init__(self, timeout: float = 6.0, custom_url: Optional[str] = None):
        self.timeout = timeout
        self.url_template = custom_url or self.DEFAULT_BOOTSTRAP_URL

    def _extract_events(self, events: List[Dict[str, Any]]) -> Dict[str, str]:
        """Normalize event dates from RDAP response."""
        extracted: Dict[str, str] = {}
        for event in events:
            action = event.get("eventAction")
            date = event.get("eventDate")
            if action and date:
                extracted[action] = date
        return extracted

    def _extract_registrar(self, entities: List[Dict[str, Any]]) -> Optional[str]:
        """Extract registrar organization name from RDAP entities."""
        for entity in entities:
            roles = entity.get("roles", [])
            if "registrar" in roles:
                vcard = entity.get("vcardArray", [])
                if len(vcard) > 1 and isinstance(vcard[1], list):
                    for item in vcard[1]:
                        if len(item) > 3 and item[0] in ("fn", "org"):
                            return str(item[3])
                # Alternative fallback: publicIds or handle
                if "handle" in entity:
                    return str(entity["handle"])
        return None

    def _extract_nameservers(self, nameservers: List[Dict[str, Any]]) -> List[str]:
        """Extract authoritative nameservers listed in RDAP."""
        ns_list = []
        for ns in nameservers:
            ldh_name = ns.get("ldhName")
            if ldh_name:
                ns_list.append(ldh_name.lower().rstrip("."))
        return ns_list

    async def collect(self, domain: str) -> CollectorExecutionReport:
        start_time = time.time()
        query_url = self.url_template.format(domain=domain)

        headers = {
            "User-Agent": "OSINT-Sentinel/0.1.0 (Defensive Security Exposure Assessment)",
            "Accept": "application/rdap+json, application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                response = await client.get(query_url, headers=headers)

                if response.status_code == 404:
                    duration = round(time.time() - start_time, 3)
                    logger.info(f"RDAP record not found for {domain} (404)")
                    return CollectorExecutionReport(
                        source_name=self.name,
                        status="no_data",
                        results=[],
                        duration_seconds=duration,
                    )

                if response.status_code == 429:
                    duration = round(time.time() - start_time, 3)
                    logger.warning(f"RDAP rate limit reached for {domain} (429)")
                    return CollectorExecutionReport(
                        source_name=self.name,
                        status="partial",
                        results=[],
                        error_message="RDAP registry rate limit reached",
                        duration_seconds=duration,
                    )

                response.raise_for_status()
                payload = response.json()

                # Normalize registration metadata
                events = self._extract_events(payload.get("events", []))
                registrar = self._extract_registrar(payload.get("entities", []))
                nameservers = self._extract_nameservers(payload.get("nameservers", []))
                statuses = payload.get("status", [])

                rdap_data: Dict[str, Any] = {
                    "domain": domain,
                    "handle": payload.get("handle"),
                    "registrar": registrar,
                    "status": statuses,
                    "created_date": events.get("registration"),
                    "expiration_date": events.get("expiration"),
                    "last_updated_date": events.get("last changed"),
                    "nameservers": nameservers,
                }

                result = CollectorResult(
                    evidence_type="rdap_registration",
                    source="RDAP",
                    source_url=query_url,
                    data=rdap_data,
                    confidence=1.0,
                    notes=f"Retrieved RDAP registration info for {domain}",
                )

                duration = round(time.time() - start_time, 3)
                return CollectorExecutionReport(
                    source_name=self.name,
                    status="success",
                    results=[result],
                    duration_seconds=duration,
                )

        except httpx.TimeoutException:
            duration = round(time.time() - start_time, 3)
            logger.warning(f"RDAP lookup timed out for {domain}")
            return CollectorExecutionReport(
                source_name=self.name,
                status="partial",
                results=[],
                error_message="RDAP lookup timed out",
                duration_seconds=duration,
            )
        except Exception as exc:
            duration = round(time.time() - start_time, 3)
            logger.warning(f"RDAP lookup failed for {domain}: {exc}")
            return CollectorExecutionReport(
                source_name=self.name,
                status="failed",
                results=[],
                error_message=str(exc),
                duration_seconds=duration,
            )
