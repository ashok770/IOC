# System Architecture & Design Principles

## Overview

**OSINT Sentinel** is engineered as a decoupled, modular system for passive external attack surface discovery. The architecture strictly isolates public intelligence gathering from correlation and risk analysis.

## Core Modules & Boundaries

```
backend/
├── app/
│   ├── config/      # Pydantic Settings & environment validation
│   ├── api/         # REST API route handlers (v1, routers)
│   ├── models/      # SQLAlchemy ORM domain entities
│   ├── schemas/     # Pydantic request/response validation schemas
│   └── services/    # Business workflow orchestration
├── collectors/      # Passive OSINT acquisition modules (isolated)
├── analyzers/       # Domain-specific inspection logic
├── correlation/     # Entity deduplication & graph linking
├── risk/            # Deterministic, explainable scoring rules
├── database/        # Engine lifecycle and session management
└── tests/           # Unit, integration, and security regression tests
```

### Module Responsibilities

1. **`collectors/`**:
   - Each collector inherits a standard interface (`BaseCollector`).
   - Collectors must be strictly passive and public.
   - Each data point captured must be wrapped in an `EvidenceRecord` containing:
     - `source`: Collector identifier (e.g. `crt.sh`, `dns_lookup`).
     - `timestamp`: UTC collection time.
     - `raw_data`: Verifiable payload.

2. **`correlation/`**:
   - Links subdomains to resolved IP blocks, autonomous systems (ASNs), and certificates.
   - Resolves aliases (CNAME chains) without fabricating relationships.

3. **`risk/`**:
   - Employs deterministic scoring logic.
   - Computes exposure levels based on explicit configuration weaknesses (e.g. missing SPF/DMARC records, dangling DNS entries pointing to unregistered cloud resources, outdated TLS certificates).
   - No opaque AI or speculative scoring: every finding links to its supporting evidence record.

4. **`database/`**:
   - Resilience: Database connections are lazily initialized. Failure to reach the database during development or offline assessment does not prevent API bootstrap.

## Domain Entity Hierarchy

The platform organizes exposure intelligence across three distinct conceptual tiers under each authorized `Target`:

```
Target
  │
  ├── Assets
  │     ├── Domain (Primary authorized target domain)
  │     ├── Subdomain / Hostname (MX, NS, CNAME targets within scope)
  │     ├── IP (Resolved public IPv4/IPv6 addresses)
  │     └── Certificate-associated hostname (SANs and hostnames from CT logs)
  │
  ├── Evidence (Raw verifiable artifacts: DNS records, RDAP payloads, CT log entries)
  │
  └── Findings (Deterministic, explainable factual observations referencing evidence)
```

- **`Target`**: The root boundary for an authorized assessment scope.
- **`Assets`**: Discovered, deduplicated perimeter attack surface elements extracted from verified evidence.
- **`Evidence`**: Unmodified provenance records maintaining exact raw source payloads and collection timestamps.
- **`Findings`**: Factual architectural observations and verified security exposure signals.

## Operational Constraints

| Constraint | Enforcement Mechanism |
| :--- | :--- |
| **Authorized Scope Only** | Assessments require analyst-provided domain scoping and verification confirmation before pipeline triggering. |
| **No Offensive Actions** | The codebase contains zero exploitation tools, wordlist brute-forcers, or active vulnerability scanners. |
| **Auditability** | Every finding generated must maintain an intact lineage to its raw evidence and timestamp. |
