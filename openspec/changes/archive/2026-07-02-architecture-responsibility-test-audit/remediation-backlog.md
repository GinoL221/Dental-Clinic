# Remediation Backlog

All items below are **unapproved candidate** slices only. They are future options, not work authorized by this diagnostic change.

## Slice 1 — Remove direct repository access from `AuthenticationController`

- **Status:** unapproved candidate
- **Evidence IDs:** BM-01, TM-01, TM-03
- **Intended outcome:** make the auth controller delegate email-existence checks through the service/application layer instead of calling `IUserRepository` directly.
- **Required tests:** controller boundary test, architecture-boundary test, and regression coverage for existing register/login behavior.
- **Affected areas:** `backend/src/main/java/com/dh/dentalClinicMVC/authentication/`, backend controller tests
- **Review-size risk vs 400 changed lines:** low
- **Suggested sequencing:** first slice if backend boundary cleanup starts here.
- **Rollback notes:** revert the controller/service wiring and any added boundary tests as a single unit.
- **Explicit approval requirement:** user approval required before implementation.

## Slice 2 — Introduce explicit request DTOs for patient and dentist CRUD

- **Status:** unapproved candidate
- **Evidence IDs:** BM-02, BM-03, TM-01, TM-03
- **Intended outcome:** replace entity-shaped request bodies with explicit create/update request DTOs; keep response DTOs for output only.
- **Required tests:** controller boundary tests, validation tests, and authz/ownership regression checks.
- **Affected areas:** `backend/src/main/java/com/dh/dentalClinicMVC/controller/`, `backend/src/main/java/com/dh/dentalClinicMVC/dto/`, selected backend controller tests
- **Review-size risk vs 400 changed lines:** medium
- **Suggested sequencing:** after the auth-controller boundary fix, or as a separate backend DTO hardening slice.
- **Rollback notes:** restore existing request signatures and mappings if the DTO migration destabilizes integration.
- **Explicit approval requirement:** user approval required before implementation.

## Slice 3 — Tighten appointment validation and orchestration boundaries

- **Status:** unapproved candidate
- **Evidence IDs:** BM-04, TM-01, TM-02, TM-04
- **Intended outcome:** move request validation toward explicit DTO validation and reduce controller-owned parsing/checking where the service layer can own it.
- **Required tests:** appointment validation test, controller behavior test, and service behavior regression tests.
- **Affected areas:** `backend/src/main/java/com/dh/dentalClinicMVC/controller/AppointmentController.java`, appointment-related backend tests
- **Review-size risk vs 400 changed lines:** medium
- **Suggested sequencing:** after DTO hardening or as a separate slice if the scope grows.
- **Rollback notes:** revert controller parsing and validation changes together with the tests that pin them.
- **Explicit approval requirement:** user approval required before implementation.

## Slice 4 — Frontend API-module boundary cleanup and appointment fallback fix

- **Status:** unapproved candidate
- **Evidence IDs:** FM-07, FM-08, FM-09, FM-10, TM-05, TM-06
- **Intended outcome:** move raw network access closer to dedicated API modules where practical and fix the appointment enricher fallback so it calls the correct `/api` endpoint.
- **Required tests:** appointment-enricher behavior test, API-module boundary test, and the existing jsdom/XSS suite as a safety net.
- **Affected areas:** `frontend/public/js/auth/`, `frontend/public/js/appointment/modules/`, `frontend/test/`
- **Review-size risk vs 400 changed lines:** medium
- **Suggested sequencing:** split the behavior bug fix from any broader module cleanup if this grows beyond the budget.
- **Rollback notes:** restore the previous fallback path and any extracted module wiring together.
- **Explicit approval requirement:** user approval required before implementation.

## Slice 5 — Reduce template-owned bootstrap/state leakage in dashboard and appointment views

- **Status:** unapproved candidate
- **Evidence IDs:** FM-03, FM-05, FM-06, TM-06
- **Intended outcome:** keep templates presentational while trimming global bootstrap ownership and role/state branching.
- **Required tests:** dashboard view boundary test, appointment view boundary test, and route behavior regression checks.
- **Affected areas:** `frontend/src/views/dashboard/`, `frontend/src/views/appointments/`
- **Review-size risk vs 400 changed lines:** high
- **Suggested sequencing:** only after the smaller backend and module-boundary slices are approved and stable.
- **Rollback notes:** revert template and script changes together; do not separate them across PRs unless a new decision is made.
- **Explicit approval requirement:** user approval required before implementation.

## Notes

- No slice here is approved for implementation in this change.
- Any slice estimated to exceed 400 changed lines should be split or re-decided before work starts.
- Keep remediation incremental; no broad Clean Architecture rewrite is authorized.
