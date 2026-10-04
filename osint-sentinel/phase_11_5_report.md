# Phase 11.5 — Outbound Request / Resource Controls

## 1. Current Outbound Collection Architecture
The OSINT Sentinel architecture employs a multi-source orchestration approach (`CollectionService` -> `DomainIntelligenceCollector`), generating concurrent outbound requests across four passive collectors:
- **HTTP/HTTPS Headers** (`HTTPHeaderCollector`)
- **DNS** (`DNSCollector`)
- **RDAP** (`RDAPCollector`)
- **Certificate Transparency** (`CertificateTransparencyCollector`)

These collectors originally operated unconstrained by application-level bounds on concurrency, target request limits, or duplicated discovery destinations.

## 2. Resource Exhaustion Risks Discovered
During the audit, the following resource risks were identified:
- **Unbounded Global Concurrency**: Concurrent requests could rapidly accumulate if multiple targets were assessed simultaneously.
- **Missing Assessment Budget**: There was no upper limit on the number of outbound requests a single assessment could trigger.
- **Duplicate Execution**: `HTTPHeaderCollector` and others could be invoked multiple times for identical targets, needlessly generating network operations.
- **Concurrent Duplicate Assessments**: Calling the assessment API endpoint multiple times for the same target simultaneously would launch overlapping parallel pipelines, causing race conditions and database locks.
- **No Active Asset Limits**: While assets (hostnames/IPs) were saved to the database, the system currently inherently restricts active collection only to the primary domain (0 active assets assessed). If future phases expand collection recursively, limits were lacking.

## 3. Files Changed
- `backend/app/config/settings.py` (added configuration parameters)
- `backend/app/utils/resource_controls.py` (created `AssessmentContext`, `GlobalResourceController`)
- `backend/app/services/collection_service.py` (added per-assessment context & locking)
- `backend/collectors/base.py` (injected context to `collect` signature)
- `backend/collectors/domain_collector.py` (passed context down)
- `backend/collectors/dns/dns_collector.py` (added context bounds & semaphore)
- `backend/collectors/http/header_collector.py` (added context bounds & semaphore)
- `backend/collectors/rdap/rdap_collector.py` (added context bounds & semaphore)
- `backend/collectors/certificates/ct_collector.py` (added context bounds & semaphore)
- `backend/tests/test_phase11_5_resource_controls.py` (added regression suite)

## 4. Configuration Added
Added the following to `app/config/settings.py` and configurable via `.env`:
- `MAX_CONCURRENT_OUTBOUND_REQUESTS` (default: 10)
- `MAX_REQUESTS_PER_ASSESSMENT` (default: 50)
- `COLLECTION_TIMEOUT_SECONDS` (default: 10.0)
- `MAX_ACTIVE_COLLECTION_ASSETS` (default: 20)

## 5. Concurrency Control
A singleton `GlobalResourceController` now maintains a global `asyncio.Semaphore` initialized with `MAX_CONCURRENT_OUTBOUND_REQUESTS`. Every outbound request (HTTP, RDAP, CT, and DNS thread operations) must successfully acquire a permit from this semaphore before launching, preventing OSINT Sentinel from overwhelming its host or the network.

## 6. Request Budget
An `AssessmentContext` is instantiated at the start of `CollectionService.run_domain_collection`. It tracks `requests_made` up to `MAX_REQUESTS_PER_ASSESSMENT`. When the limit is reached, downstream collectors gracefully return a `no_data` state with the reason `"Collection skipped: outbound request budget exhausted."`

## 7. Duplicate Suppression
The `AssessmentContext` tracks uniquely requested destination signatures (e.g., `http_headers:https://example.com`, `dns:example.com`). If an identical collector signature is observed within the same assessment, it is skipped safely.

## 8. Repeated-Assessment Protection
An asynchronous per-target lock (`asyncio.Lock()`) ensures that a given `target_id` cannot be collected more than once concurrently. Attempting to start a concurrent assessment for a target in progress immediately returns an `HTTP 409 Conflict`.

## 9. Asset Candidate Limits
Currently, OSINT Sentinel strictly assesses the primary target domain (`target.primary_domain`) and extracts passive artifacts to populate the Asset repository. It does **not** recursively launch automated active collection against discovered internal hostnames or external assets. Consequently, an implicit candidate limit of `0` active assets is securely maintained. Future iterations expanding active probing must integrate the new `MAX_ACTIVE_COLLECTION_ASSETS` bound into asset discovery loops.

## 10. Timeout / Retry Behavior
- `HTTPHeaderCollector`, `RDAPCollector`, and `CertificateTransparencyCollector` use strict client-level timeouts configurable by their internal defaults or bounds.
- `DNSCollector` executes inside `asyncio.to_thread` with built-in DNS query timeouts.
- Concurrency semaphores are securely wrapped using `async with` blocks to guarantee release upon timeout, failure, or cancellation.
- The system explicitly **does not** introduce infinite retry loops, honoring the passive and ephemeral constraints of OSINT assessment.

## 11. Observability / Skip Reasons
Collections constrained by limits intentionally record clear internal notes rather than failing silently, including:
- `"Collection skipped: outbound request budget exhausted."`
- `"Collection skipped: duplicate request to [URL]"`
- `"Target '[target_id]' is already being assessed."` (HTTP 409)

## 12. Tests Added
Four comprehensive behavioral regression tests were added in `test_phase11_5_resource_controls.py`:
1. `test_global_concurrency_limit_respected`: Validates that parallel queries execute synchronously when the semaphore is reduced to 1.
2. `test_request_budget_stops_additional_work`: Validates that collectors halt execution correctly when the context budget is exhausted.
3. `test_duplicate_requests_suppressed`: Validates that consecutive requests to identical destinations by the same collector are skipped.
4. `test_different_targets_can_collect_concurrently`: Verifies that locking occurs strictly per target ID, allowing distinct assessments to proceed safely in parallel.

## 13. Full Backend Test Result
- All new and existing security regression tests passed successfully.
- Phase 11.1 (SafeBackend/SafeTransport), Phase 11.2 (RDAP SSRF), Phase 11.3 (Target Isolation), and Phase 11.4 (Internal/Private IP intelligence) were securely layered behind the resource control boundary. No network protections were circumvented or weakened.

## 14. Frontend Build Result
The frontend UI remains fully compliant. The backend's graceful integration of collection `no_data` skips natively populates the UI without introducing misleading "fake progress."

## 15. Remaining Limitations
- Subdomains discovered via CT logs are not actively parsed or fed into a secondary collection loop. This guarantees target-scope adherence but implies recursive OSINT expansion is currently deferred.

## 16. Deferred Findings
- No invasive network activity (e.g., active scanning, crawling) was added.
- The database storage retains observed HTTP responses up to 64KB and RDAP up to 1MB. While large batch operations could still induce DB overhead, the implementation remains strictly bounded by explicit sizing.

**Final Statement:** Outbound collection is bounded by configured concurrency, request, candidate, and timeout controls.
