# OSINT Sentinel — Authorized External Security Exposure Assessment Platform

> **Notice:** OSINT Sentinel is strictly designed for **authorized** external security assessments. It collects and correlates publicly accessible external exposure signals (passive OSINT) to help defensive security teams evaluate their external perimeter. It explicitly prohibits and does not include credential stuffing, brute force, exploit delivery, active intrusion, or unauthorized scanning.

---

## 1. Project Purpose

Modern organizations face an expanding external attack surface comprising registered domains, subdomains, cloud assets, misconfigured DNS records, exposed services, and leaked metadata. **OSINT Sentinel** provides a structured, automated, and explainable mechanism to:
- Ingest authorized target domains/organizations supplied by security analysts.
- Passively discover externally exposed assets through open sources (public DNS records, certificate transparency logs, WHOIS/RDAP, search engine indexing, HTTP headers).
- Normalize, correlate, and persist observed assets with complete evidence chains (collection source and UTC timestamps).
- Evaluate exposure deterministically without guessing or fabricating findings when data is unavailable.
- Provide defensive prioritization to help remediate risks before threat actors exploit them.

---

## 2. Core Security & Ethical Constraints

The platform enforces strict guardrails:
1. **Authorized Assessments Only**: Must be executed only against target assets and domains where explicit written authorization has been granted by the domain owner.
2. **Strictly Non-Destructive**: No active exploitation, fuzzing, brute force, vulnerability weaponization, or credential testing.
3. **Passive & Public Intelligence**: All data collection originates from publicly available sources and non-intrusive metadata queries.
4. **Deterministic & Explainable**: Findings must have clear evidentiary provenance. We reject speculative AI hallucinations and do not invent security findings when data is absent.
5. **No Hard-Coded Targets**: Target domains, scope boundaries, and organizations are dynamic inputs provided by the analyst.

---

## 3. Architecture Direction

```
                      +-----------------------------------+
                      |        Security Analyst           |
                      +-----------------+-----------------+
                                        |
                                        v
                      +-----------------------------------+
                      |      Frontend: React + Vite       |
                      |   (Perimeter Dashboard & Reports) |
                      +-----------------+-----------------+
                                        | REST API
                                        v
+-----------------------------------------------------------------------------------+
| Backend: FastAPI Application                                                      |
|                                                                                   |
|  +--------------------+   +-----------------------+   +------------------------+  |
|  |   API & Routing    |   | Passive Collectors    |   | Correlation & Risk     |  |
|  | - /api/health      |   | - DNS & Subdomains    |   | - Asset Deduplication  |  |
|  | - /api/v1/targets  |   | - Certificate Transp. |   | - Exposure Scoring     |  |
|  | - /api/v1/assess   |   | - Header Inspection   |   | - Deterministic Rules  |  |
|  +---------+----------+   +-----------+-----------+   +-----------+------------+  |
|            |                          |                           |               |
|            +--------------------------+---------------------------+               |
|                                       v                                           |
|                           +-----------------------+                               |
|                           | Database Layer (SQLA) |                               |
|                           +-----------+-----------+                               |
+---------------------------------------|-------------------------------------------+
                                        v
                      +-----------------------------------+
                      |      PostgreSQL Database          |
                      |  (Assets, Evidence & Findings)    |
                      +-----------------------------------+
```

- **Backend**: Python 3.12+ / FastAPI with modular subsystems (`collectors/`, `analyzers/`, `correlation/`, `risk/`, `database/`).
- **Database**: PostgreSQL with SQLAlchemy ORM (resilient lazy connectivity).
- **Frontend**: React + Vite (interactive analyst workspace and reporting interface).
- **Output**: Deterministic findings with complete evidentiary metadata and structured export formats.

---

## 4. Current Development Phase

- [x] **Phase 1: Foundation**
  - Repository structure and package modularization.
  - FastAPI application bootstrap with CORS and lifecycle management.
  - Configuration management via Pydantic Settings and environment variables.
  - Resilient PostgreSQL database configuration layer (graceful offline behavior).
  - Health check endpoint (`GET /api/health`) with automated test coverage.
- [x] **Phase 2: Target Registration & Passive Domain Intelligence (Current)**
  - SQLAlchemy models for Target, EvidenceItem, and Finding with foreign keys.
  - Strict domain validation and normalization (rejection of URLs, paths, ports, and IPs).
  - Target registration and retrieval endpoints (`POST /api/v1/targets`, `GET /api/v1/targets`).
  - Modular passive collectors: DNS (A, AAAA, MX, NS, TXT, CNAME, SOA), RDAP, Certificate Transparency (crt.sh).
  - Factual architectural analyzer (no speculative vulnerabilities).
  - Collection execution and evidence inspection endpoints (`POST .../collect/domain`, `GET .../evidence`, `GET .../findings`).
  - 24 automated unit and integration tests with mocked external OSINT calls.
- [ ] **Phase 3: Expanded Intelligence & Perimeter Inspection**
  - HTTP security header inspector, TLS certificate deep analysis, dangling DNS exposure detection.
- [ ] **Phase 4: Correlation & Exposure Risk Engine**
  - Deterministic risk assessment and evidentiary graph linking.
- [ ] **Phase 5: Frontend Dashboard & Executive Reporting**
  - React/Vite interface and downloadable assessment reports.

---

## 5. Getting Started (Backend)

### Prerequisites
- Python 3.12+
- PostgreSQL (optional for initial health check, required for persistence)

### Setup & Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Activate the virtual environment:
   ```bash
   source .venv/bin/activate
   ```

3. Ensure dependencies are installed:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment:
   ```bash
   cp .env.example .env
   ```

5. Run automated tests:
   ```bash
   pytest tests/ -v
   ```

6. Start the local development server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

7. Verify health:
   ```bash
   curl http://localhost:8000/api/health
   ```

Interactive API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
