# Phase 11.6 — Authentication & Authorization Architecture Report

## 1. Executive Summary
OSINT Sentinel is currently operating in an entirely unauthenticated, trusted-network model. All backend endpoints—including sensitive assessment triggers and intelligence retrievals—are publicly accessible. While Phase 11.3 successfully implemented object-level target isolation (preventing cross-target data mixing), the system currently lacks user identity and ownership. This report defines the architectural blueprint for establishing a secure authentication boundary and target ownership model prior to multi-tenant or untrusted deployment.

## 2. Current State Audit
- **Backend Authentication:** None. No security dependencies, token validation, or session management exist.
- **Backend Authorization:** None. Target IDs are the only mechanism for data retrieval, but they are accessible to anyone who knows or guesses them.
- **Identity Models:** No `User` table exists. The `Target` model does not have an `owner_id` or tenant identifier.
- **Frontend State:** No authentication context, login flows, or credential storage. The API client assumes unrestricted access.
- **CORS/Cookies:** Operating with permissive local development defaults. No cookies or secure session tokens are utilized.

## 3. Endpoint Exposure Audit
Currently, **all** API routes allow unauthenticated access. 
- **System:** `GET /api/health` (Public)
- **Target Management:** `POST /v1/targets`, `GET /v1/targets`, `GET /v1/targets/{target_id}` (Currently Public - *Requires Auth + Ownership*)
- **Collection (Active Triggers):** `POST /v1/targets/{target_id}/collect/domain` (Currently Public - *Requires Auth + Ownership*)
- **Intelligence Retrieval:** `GET /v1/targets/{target_id}/assets`, `/evidence`, `/technologies`, `/relationships`, `/exposure-signals`, `/risk`, `/analysis/summary` (Currently Public - *Requires Auth + Ownership*)
- **Asset Retrieval:** `GET /v1/assets/{asset_id}` (Currently Public - *Requires Auth + Target Verification*)

*Risk:* Without authentication, an attacker can enumerate all targets, trigger arbitrary automated collections (resource exhaustion), and view sensitive intelligence reports belonging to others.

## 4. Current Security Boundaries (Phase 11.3)
The system currently implements:
`Object-Level Target Isolation` -> `Resource / Collection Controls`
It lacks the top-level identity layers. The future boundary must be:
**Authentication** (Is this a valid user?) -> **Identity** (Who is it?) -> **Target Ownership / Scope** (Does this user own this Target?) -> **Object-Level Target Isolation** (Does this Asset belong to this Target?)

## 5. Recommended Authentication Architecture
**Recommendation:** External Identity Provider (OIDC/OAuth2) with Secure Session Cookies.
- **Why:** OSINT Sentinel is a security tool; it should not roll its own cryptography for password hashing, MFA, or account recovery unless strictly air-gapped. Integrating an external IdP (like Auth0, Keycloak, or AWS Cognito) offloads this risk.
- **Mechanism:** The frontend redirects to the IdP for login. The backend receives the secure token/code and issues a local **Session Cookie** (`HttpOnly`, `Secure`, `SameSite=Strict`).
- **Why avoid local storage JWTs:** Storing JWTs in React local storage exposes them to XSS token theft. `HttpOnly` cookies provide superior resistance to XSS, while `SameSite=Strict` mitigates CSRF.

## 6. Target Ownership Model
A `User` model should be introduced to represent the authenticated identity.
The `Target` SQLAlchemy model must be updated:
```python
owner_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
```
Every target strictly belongs to exactly one user.

## 7. Recommended Authorization Architecture
**Recommendation:** Simple Ownership Model (No complex RBAC required yet).
- **Rule:** A user can exclusively read, modify, or execute collections against targets where `Target.owner_id == current_user.id`.
- Roles like "Admin" or "Auditor" are unnecessary for the initial single-user/isolated-tenant deployment and should be deferred.

## 8. Protected Endpoint Policy & Dependency Design
FastAPI should implement reusable security dependencies:
1. `get_current_user`: Validates the session cookie and returns the `User`. (Applied to all `/v1` routes).
2. `get_authorized_target`: Takes `target_id` from the path and `current_user`. Fetches the target, verifies `owner_id`, and returns the Target object. Throws `HTTP 404 Not Found` if the target doesn't exist *or* belongs to someone else (prevents enumeration).

Reports and exports must inherit this dependency. A report is simply a presentation of data; if the user cannot access the Target, they cannot generate or view its report.

## 9. Database & Migration Strategy
Because existing data exists, introducing `owner_id` as `nullable=False` requires a multi-step migration:
1. **Schema Update:** Create the `users` table. Add `owner_id` to `targets` as `nullable=True`.
2. **Backfill:** Create a default "System Development User". Update all existing targets to point to this `owner_id`.
3. **Constraint:** Alter `targets.owner_id` to `nullable=False`.
*Data Destruction:* No existing development assessments or targets will be deleted.

## 10. Frontend Integration Strategy
- **Routing:** Implement React Router `<ProtectedRoute>` wrappers around the dashboard and target views.
- **API Client:** Configure Axios to include `withCredentials: true` so secure cookies are automatically attached.
- **Interceptors:** Add a global response interceptor. If the backend returns `401 Unauthorized`, clear local user state and redirect to the login portal.

## 11. Security Test Strategy (Phase 11.7)
Future testing must explicitly validate:
1. **Unauthenticated Rejection:** Requests without a valid session cookie to `/v1/targets` yield `401`.
2. **Cross-Tenant Prevention:** Authenticated User A attempting to GET or Collect against User B's target yields `404 Not Found`.
3. **Inherited Isolation:** Asset/Evidence isolation rules remain enforced underneath the ownership layer.
4. **Token Integrity:** Expired or cryptographically invalid session cookies are rejected.

## 12. Threat Model & Risks
- **Unauthenticated API Access:** Mitigated by global route protection.
- **Cross-Target Access (IDOR):** Mitigated by strict `owner_id` validation. Returning `404` instead of `403` prevents attackers from confirming a target UUID exists.
- **Session Hijacking via XSS:** Mitigated by `HttpOnly` cookies (tokens cannot be read by JS).
- **CSRF:** Mitigated by `SameSite=Strict` cookies.

## 13. Implementation Sequence
1. Database migrations (Users table, Target ownership backfill).
2. FastAPI Auth dependencies and cookie management implementation.
3. Protect all `/v1` API routes.
4. React frontend AuthContext and login flow integration.

**Status:** Audit complete. Architecture designed. No code modifications made during this phase.
