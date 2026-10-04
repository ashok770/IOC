import re
import time
import logging
import asyncio
import socket
import ipaddress
from typing import Dict, Any, List, Optional
import httpx
import httpcore

from collectors.base import BaseCollector, CollectorResult, CollectorExecutionReport
from collectors.network_security import SSRFViolation, SafeTransport

logger = logging.getLogger(__name__)

META_GENERATOR_REGEX = re.compile(
    r'<meta\s+[^>]*name=["\']generator["\'][^>]*content=["\']([^"\']+)["\']',
    re.IGNORECASE,
)
META_GENERATOR_REGEX_ALT = re.compile(
    r'<meta\s+[^>]*content=["\']([^"\']+)["\'][^>]*name=["\']generator["\']',
    re.IGNORECASE,
)

class HTTPHeaderCollector(BaseCollector):
    """
    Passive HTTP Header & Observable Metadata Collector.
    Queries the public web root (HTTPS/HTTP) using standard, non-intrusive GET requests
    with strict timeouts to observe public response headers and generator metadata.
    Does NOT crawl, fuzz, brute-force, or test injection vectors.
    """

    name: str = "http_headers"

    def __init__(self, timeout: float = 4.0):
        self.timeout = timeout

    async def collect(self, domain: str) -> CollectorExecutionReport:
        start_time = time.time()
        headers = {
            "User-Agent": "OSINT-Sentinel/0.1.0 (Defensive Security Exposure Assessment)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

        # Attempt HTTPS first, then fallback to HTTP
        schemes = ["https", "http"]
        results: List[CollectorResult] = []
        last_error: Optional[str] = None
        
        transport = SafeTransport(verify=False)

        for scheme in schemes:
            url = f"{scheme}://{domain}"
            try:
                async with httpx.AsyncClient(
                    transport=transport,
                    timeout=self.timeout,
                    follow_redirects=True,
                    max_redirects=3,
                ) as client:
                    
                    async with client.stream("GET", url, headers=headers) as response:
                        # Extract headers as dictionary
                        resp_headers: Dict[str, str] = {}
                        for k, v in response.headers.items():
                            resp_headers[k.lower()] = v

                        # Extract generator meta tags from HTML head if text response
                        meta_generators: List[str] = []
                        content_type = response.headers.get("content-type", "").lower()
                        if "text/html" in content_type or "text/plain" in content_type:
                            sample_text = ""
                            bytes_read = 0
                            max_bytes = 65536  # Strictly bounded to 64 KB
                            
                            async for chunk in response.aiter_text():
                                sample_text += chunk
                                bytes_read += len(chunk.encode("utf-8", errors="ignore"))
                                if bytes_read >= max_bytes:
                                    break
                            
                            sample_text = sample_text[:max_bytes]
                            matches1 = META_GENERATOR_REGEX.findall(sample_text)
                            matches2 = META_GENERATOR_REGEX_ALT.findall(sample_text)
                            meta_generators = sorted(list(set(matches1 + matches2)))

                        evidence_data: Dict[str, Any] = {
                            "domain": domain,
                            "probed_url": url,
                            "final_url": str(response.url),
                            "status_code": response.status_code,
                            "http_version": response.http_version,
                            "headers": resp_headers,
                            "meta_generators": meta_generators,
                        }

                        results.append(
                            CollectorResult(
                                evidence_type="http_headers",
                                source="HTTP",
                                source_url=str(response.url),
                                data=evidence_data,
                                confidence=1.0,
                                notes=f"Observed HTTP response metadata from {response.url} (Status: {response.status_code})",
                            )
                        )
                        # Successful probe on this scheme; avoid redundant fallback probe
                        break

            except SSRFViolation as ssrf_err:
                last_error = f"Security rejection on {scheme}: {str(ssrf_err)}"
                logger.warning(f"SSRF violation detected for {domain}: {ssrf_err}")
                break # If a domain resolves to a private IP, we don't try fallback HTTP
            except (httpx.ConnectError, httpx.ConnectTimeout) as conn_err:
                last_error = f"Connection failed on {scheme}: {str(conn_err)}"
                continue
            except httpx.TimeoutException:
                last_error = f"Request timed out on {scheme}"
                continue
            except Exception as exc:
                if "SSRFViolation" in str(exc) or "private" in str(exc):
                    last_error = f"Security rejection on {scheme}: {str(exc)}"
                    logger.warning(f"SSRF violation detected for {domain}: {exc}")
                    break
                last_error = f"Probe error on {scheme}: {str(exc)}"
                continue

        duration = round(time.time() - start_time, 3)
        if results:
            return CollectorExecutionReport(
                source_name=self.name,
                status="success",
                results=results,
                duration_seconds=duration,
            )
        else:
            logger.info(f"No HTTP service observed for {domain}: {last_error}")
            return CollectorExecutionReport(
                source_name=self.name,
                status="no_data",
                results=[],
                error_message=last_error,
                duration_seconds=duration,
            )
