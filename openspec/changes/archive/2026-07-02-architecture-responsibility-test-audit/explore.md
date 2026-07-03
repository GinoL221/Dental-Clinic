# Explore: Architecture, Responsibility, and Test Audit

## Change

`architecture-responsibility-test-audit`

## Goal

Audit whether Dental-Clinic is consistent in architecture, responsibility boundaries, and tests, using the project rules plus Gentleman Book recommendations as the review lens.

## Inputs

- User intent: review project consistency with Gentleman Book recommendations.
- Execution mode: interactive.
- Artifact store: hybrid.
- Delivery strategy: auto-forecast.
- Review budget: 400 changed lines per slice.

## Gentleman Book Lens

The audit uses these principles:

- Separation of concerns, maintainability, testability, and explicit layer boundaries.
- Technologies serve the architecture; frameworks, databases, UI, and security integrations stay at the edges.
- Domain/business logic, application/use-case orchestration, and infrastructure/UI concerns should be distinguishable.
- Frontend views should remain presentational; business rules should not hide in templates.
- Tests should validate behavior and architectural contracts, not only incidental source shape.
- Avoid over-architecture: recommendations should be incremental and prioritized.

## Project Rules Lens

From `AGENTS.md`:

- Backend should follow Controller → Service interface + impl → Repository.
- API responses should use DTOs; JPA entities should not be exposed directly.
- Security rules should use `@PreAuthorize`.
- Controllers should use `@Valid` for request validation.
- Prefer constructor injection.
- Exceptions should go through `GlobalExceptionHandler`.
- Express routes should stay thin.
- EJS templates should stay presentational.
- Client-side JS should be modular.
- API calls should go through dedicated API modules.

## Current-State Architecture Map

### Backend

Observed architecture is mostly layered Spring MVC:

- Controllers under `backend/src/main/java/com/dh/dentalClinicMVC/controller`.
- Service interfaces under `backend/src/main/java/com/dh/dentalClinicMVC/service`:
  - `ISpecialtyService`
  - `IDentistService`
  - `IPatientService`
  - `IDashboardSnapshotService`
  - `IDashboardService`
  - `IAppointmentService`
- Service implementations under `backend/src/main/java/com/dh/dentalClinicMVC/service/impl`.
- Repositories under `backend/src/main/java/com/dh/dentalClinicMVC/repository`:
  - `IAppointmentRepository`
  - `IUserRepository`
  - `ISpecialtyRepository`
  - `IPatientRepository`
  - `IAddressRepository`
  - `IDentistRepository`
- DTOs under `backend/src/main/java/com/dh/dentalClinicMVC/dto`:
  - `SpecialtyDTO`
  - `SpecialtyResponseDTO`
  - `DashboardStatsDTO`
  - `DashboardSnapshotDTO`
  - `PatientResponseDTO`
  - `DentistResponseDTO`
  - `AppointmentDTO`

Positive examples:

- `SpecialtyController` uses `ISpecialtyService`, DTOs, `@Valid`, and `@PreAuthorize`.
- `DashboardController` depends on `IDashboardSnapshotService` and returns `DashboardSnapshotDTO`.

Potential inconsistencies:

- `AuthenticationController` injects `IUserRepository` directly alongside `AuthenticationService`, which may bypass the Controller → Service → Repository rule.
- Some create/update flows may still accept entity-shaped request bodies or expose entity concerns instead of dedicated request DTOs.

### Frontend

Observed frontend architecture is partially modularized:

- API modules exist under `frontend/public/js/api`.
- Feature modules exist for auth, patient, dentist, appointment, and dashboard flows.
- Examples include:
  - `frontend/public/js/auth/modules/index.js`
  - `frontend/public/js/appointment/modules/index.js`
  - `frontend/public/js/dashboard/dashboard-controller.js`
  - `frontend/public/js/dashboard/dashboard-api.js`
  - `frontend/public/js/appointment/modules/server-data-loader.js`
  - `frontend/public/js/appointment/modules/appointment-enricher.js`
- CSS is split into modular partials and wired through `frontend/src/views/partials/head.ejs`.

Positive examples:

- Dashboard uses a snapshot API module and a dedicated controller.
- Appointment server-data loading and enrichment were extracted from the larger appointment controller.
- Client code shows explicit manager/controller roles in several areas.

Potential inconsistencies:

- Some EJS templates still initialize global state such as `window.serverData`, `window.currentUser`, and `window.isAdmin`.
- Some role/state branching remains in EJS views and partials.
- Some modules still perform raw `fetch` calls outside dedicated API modules.
- `appointment-enricher.js` documents a preserved bug: fallback fetch path misses the `/api` prefix.

### Tests

Observed strategy:

- Backend has many Spring Boot / MockMvc integration tests, including authz, JWT, dashboard, appointment validation, and controller tests.
- Frontend has Jest/Supertest route tests, source-contract tests, SRP split tests, and jsdom XSS tests.
- Mockito appears mainly in `JwtAuthenticationFilterTest`.
- No `@MockBean` matches were observed in the prior exploration, suggesting limited isolated service-layer unit tests.

Strengths:

- Security and controller behavior have meaningful integration coverage.
- Frontend contains explicit architecture/source-contract tests for some refactors.
- XSS-oriented jsdom tests exist for UI manager concerns.

Potential gaps:

- Test suite appears integration-heavy on the backend.
- Service/application behavior may not have enough isolated tests.
- Some frontend tests validate source shape instead of runtime behavior.
- CI is known to run backend Maven tests only, so frontend regression coverage may not be enforced in CI.

## Gentleman Book Alignment Matrix

| Area | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Backend layered architecture | Partial | Service interfaces, impls, repositories, DTOs exist; `SpecialtyController` and `DashboardController` are good examples. | Direct repository access in `AuthenticationController` needs review. |
| DTO/API boundary | Partial | Response DTOs exist for several flows. | Create/update request DTO consistency needs audit. |
| Security at backend boundary | Aligned | `@PreAuthorize` appears in representative controllers; authz tests exist. | Confirm full endpoint coverage in spec phase. |
| Constructor injection | Mostly aligned | Representative controllers/services use constructor injection or Lombok constructor injection. | Verify no field injection remains in spec/design. |
| Exception handling | Unknown/Partial | Project rule requires `GlobalExceptionHandler`. | Needs targeted verification. |
| Frontend modularity | Partial | Feature controllers/managers and API modules exist. | Raw `fetch` outside API modules and globals indicate boundary leakage. |
| EJS presentational boundary | Partial | Templates render views and pass initial state. | Role branches and global state initialization may hide behavior in views. |
| Tests as behavior contracts | Partial | Backend integration tests and frontend XSS/source-contract tests exist. | Add/strengthen behavior and architecture-contract tests where gaps are confirmed. |
| Avoiding over-architecture | Aligned as a constraint | Existing app is mixed MVC/full-stack, not pure Clean Architecture. | Improvements should be incremental and sliceable, not a wholesale rewrite. |

## Evidence Paths

Backend:

- `backend/src/main/java/com/dh/dentalClinicMVC/controller/SpecialtyController.java`
- `backend/src/main/java/com/dh/dentalClinicMVC/controller/DashboardController.java`
- `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationController.java`
- `backend/src/main/java/com/dh/dentalClinicMVC/service/`
- `backend/src/main/java/com/dh/dentalClinicMVC/service/impl/`
- `backend/src/main/java/com/dh/dentalClinicMVC/repository/`
- `backend/src/main/java/com/dh/dentalClinicMVC/dto/`

Frontend:

- `frontend/public/js/api/config.js`
- `frontend/public/js/api/auth-api.js`
- `frontend/public/js/auth/modules/index.js`
- `frontend/public/js/appointment/modules/index.js`
- `frontend/public/js/appointment/modules/server-data-loader.js`
- `frontend/public/js/appointment/modules/appointment-enricher.js`
- `frontend/public/js/dashboard/dashboard-api.js`
- `frontend/public/js/dashboard/dashboard-controller.js`
- `frontend/src/views/dashboard/dashboard.ejs`
- `frontend/src/views/partials/header.ejs`
- `frontend/src/views/partials/head.ejs`

Tests:

- `backend/src/test/java/com/dh/dentalClinicMVC/`
- `frontend/test/`
- `frontend/test/*srp-split.test.js`
- `frontend/test/*xss.test.js`
- `frontend/test/app.test.js`
- `.github/workflows/ci.yml`

## Risks and Candidate Improvement Areas

### P0 — Architecture rule violations with high leverage

1. Confirm any controller-to-repository bypasses and record them as unapproved remediation candidates.
   - Candidate: `AuthenticationController` → `IUserRepository`.
   - Desired future direction: controller delegates to application/service layer only.

2. Confirm entity exposure / entity-shaped request bodies and record affected endpoints as unapproved remediation candidates.
   - Desired future direction: request DTOs for create/update boundaries; response DTOs for output.
   - Must be incremental because some existing flows may rely on current shape.

### P1 — Responsibility boundary cleanup candidates

1. Identify raw frontend `fetch` calls outside API modules and classify whether each is acceptable, a migration candidate, or a violation.
2. Identify role/state logic in EJS templates and classify whether it is presentation-only or boundary leakage.
3. Review `window.*` global usage and classify it as bootstrap data, shared state, command wiring, or remediation candidate.
4. Record the known appointment fallback path bug as a future remediation candidate that requires a behavior test before any fix.

### P2 — Test strategy improvement candidates

1. Recommend backend service/use-case unit tests for important business rules where gaps are confirmed.
2. Recommend architecture-contract tests for controller/service/repository boundaries where gaps are confirmed.
3. Recommend frontend runtime behavior tests where current tests only assert source shape.
4. Classify frontend CI enforcement as a future candidate unless explicitly approved.

## Recommendation

Proceed to `sdd-proposal` for `architecture-responsibility-test-audit`.

The proposal should not promise a rewrite or authorize remediation. It should define an incremental diagnostic audit with clear scope boundaries:

- Identify and prioritize the highest-confidence architecture boundary violations as findings.
- Preserve working behavior during this diagnostic change.
- Recommend tests that should precede any later risky remediation.
- Produce future remediation backlog candidates that remain unapproved until the user explicitly authorizes them.

## Open Questions for Proposal

- Should the first implementation slice include fixes, or only produce an audit report and task backlog?
- Should frontend CI be in scope for this change, or deferred?
- Should request DTO migration be scoped to only confirmed entity-exposing endpoints, or all CRUD endpoints?
- Should role/view cleanup include EJS templates now, or focus first on JavaScript API-module boundaries?
