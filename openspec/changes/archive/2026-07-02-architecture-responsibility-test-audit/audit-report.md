# Audit Report — Architecture, Responsibility, and Test Audit

## Executive Summary

This diagnostic audit found a mostly layered backend and a fairly modular frontend, but with several boundary leaks that deserve attention.

Key findings:

- One backend controller bypasses the service layer and reads a repository directly.
- Patient and dentist update/create flows still use entity-shaped request bodies and controller-owned mutation logic.
- Appointment handling is better structured than the other controllers, but validation is still too manual in the controller.
- Frontend routes are generally thin, but some view and browser modules still own global bootstrap and responsibility branching.
- Test coverage is strong in authz, integration, jsdom/XSS, and source-contract guards, but it is still heavier on source shape than runtime behavior in a few places.

## Backend Findings

| ID | Priority | Confidence | Impact | Test Gap | Review-Size Risk | Remediation Gate |
| --- | --- | --- | --- | --- | --- | --- |
| BM-01 | P0 | high | high | missing | low | unapproved |
| BM-02 | P1 | high | medium | weak | medium | unapproved |
| BM-03 | P1 | high | medium | weak | medium | unapproved |
| BM-04 | P1 | medium | medium | weak | medium | unapproved |
| BM-05 | P3 | high | low | none | low | unapproved |
| BM-06 | P3 | high | low | none | low | unapproved |
| BM-07 | P3 | medium | low | none | low | unapproved |

Highlights:

- `AuthenticationController` directly injects `IUserRepository` in `checkEmailExists`, which violates the controller → service → repository boundary.
- `PatientController` and `DentistController` accept entity request bodies and mutate authoritative fields in the controller before delegating.
- `AppointmentController` keeps DTOs, but validation is still mostly manual and controller-owned.
- `SpecialtyController` is a clean positive example and should remain the template.
- `GlobalExceptionHandler` is present and centralizes exception mapping correctly.

## Frontend Findings

| ID | Priority | Confidence | Impact | Test Gap | Review-Size Risk | Remediation Gate |
| --- | --- | --- | --- | --- | --- | --- |
| FM-01 | P3 | high | low | none | low | unapproved |
| FM-02 | P3 | high | low | none | low | unapproved |
| FM-03 | P2 | medium | medium | weak | low | unapproved |
| FM-04 | P3 | medium | low | none | low | unapproved |
| FM-05 | P2 | medium | medium | weak | medium | unapproved |
| FM-06 | P2 | medium | medium | weak | medium | unapproved |
| FM-07 | P2 | medium | medium | weak | medium | unapproved |
| FM-08 | P2 | medium | medium | weak | medium | unapproved |
| FM-09 | P2 | medium | medium | weak | medium | unapproved |
| FM-10 | P0 | high | high | missing | low | unapproved |
| FM-11 | P3 | high | low | none | low | unapproved |

Highlights:

- `app.js` and `routes.js` are well-composed and mostly thin.
- `dashboardRoutes.js` still owns inline auth/role branching before rendering.
- `dashboard.ejs` and appointment EJS templates inject `window.serverData`, `window.currentUser`, and `window.isAdmin`; this is acceptable as bootstrap data only if it stays narrowly scoped.
- `appointment-enricher.js` contains a preserved missing-`/api` fallback bug; that is a real behavior defect.
- `dashboard-api.js` is the best frontend boundary example: network access is centralized and normalized there.

## Test Strategy Findings

| ID | Priority | Confidence | Impact | Test Gap | Review-Size Risk | Remediation Gate |
| --- | --- | --- | --- | --- | --- | --- |
| TM-01 | P3 | high | low | none | low | unapproved |
| TM-02 | P3 | high | low | none | low | unapproved |
| TM-03 | P2 | medium | medium | weak | low | unapproved |
| TM-04 | P3 | high | low | none | low | unapproved |
| TM-05 | P3 | high | low | none | low | unapproved |
| TM-06 | P2 | high | medium | weak | medium | unapproved |
| TM-07 | P2 | high | medium | missing | low | unapproved |

Observations:

- Backend authz and controller integration coverage is meaningful and should be preserved.
- Service-level behavior coverage exists for dashboard snapshot aggregation.
- Frontend tests are strongest where they encode runtime safety or explicit boundary rules.
- Several frontend tests are still source-contract checks; those are acceptable only when they defend a named architecture boundary.
- The skipped `app.test.js` suite does not currently enforce route rendering.

## CI / Test Enforcement Findings

| ID | Priority | Confidence | Impact | Test Gap | Review-Size Risk | Remediation Gate |
| --- | --- | --- | --- | --- | --- | --- |
| TM-08 | P3 | high | low | none | low | unapproved |

CI already runs both backend Maven tests and frontend Jest tests. That is a strong baseline; no CI change is authorized in this change.

## Prioritized Top Risks

1. **BM-01 / FM-10 — P0**
   - Direct repository access in a controller breaks the backend layer contract.
   - The appointment enricher fallback bug can 404 in real usage.

2. **BM-02 / BM-03 — P1**
   - Entity-shaped request bodies keep business rules too close to the controller layer.
   - Future DTO hardening should be incremental and test-backed.

3. **FM-03 / FM-05 / FM-06 / FM-07 / FM-08 / FM-09 — P2**
   - Frontend responsibilities are still split across routes, views, and browser modules with some global leakage.

4. **TM-06 / TM-07 — P2**
   - Some protections are still source-shape oriented, and the skipped route suite leaves a runtime gap.

## Confirmed Alignments Worth Preserving

- `SpecialtyController` cleanly follows controller → service → DTO → authorization patterns.
- `GlobalExceptionHandler` centralizes exception mapping.
- `DashboardController` is thin and returns a snapshot DTO.
- Frontend `app.js` and main route wiring are composition-root style.
- `dashboard-api.js` centralizes API access and response normalization.
- Backend authz tests exercise real security behavior and ownership constraints.
- Frontend XSS tests protect actual DOM behavior, not just source shape.

## Diagnostic-Only Remediation Gate

This change is diagnostic-only.

Out of scope:

- code remediation
- tests/CI edits
- feature behavior changes
- broad architecture migrations
- Clean Architecture rewrites

Any future remediation slice remains an **unapproved candidate** until the user explicitly approves it.
