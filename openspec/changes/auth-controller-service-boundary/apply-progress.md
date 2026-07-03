# Apply Progress: auth-controller-service-boundary

## Status

- State: completed apply slice
- Artifact store: openspec
- Change: auth-controller-service-boundary
- Scope: backend auth controller/service boundary only
- Structured status consumed: applyState=ready, nextRecommended=sdd-apply, actionContext.mode=repo-local, allowedEditRoots=/home/ginopc/Desarrollo/Dental-Clinic

## Completed Work

- Added RED tests for:
  - `GET /auth/check-email` existing-email -> `true`
  - `GET /auth/check-email` missing-email -> `false`
  - register compatibility response shape/fields
  - login compatibility response shape/fields
  - controller repository-boundary enforcement via reflection + import scan
- Added GREEN production support:
  - `AuthenticationService.emailExists(String email)`
  - removed `IUserRepository` from `AuthenticationController`
  - delegated `checkEmailExists` through `authenticationService.emailExists(email)`
- Refactored auth tests only within allowed scope to reduce duplication with small helper methods.

## Files Changed

- `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationController.java`
- `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationService.java`
- `backend/src/test/java/com/dh/dentalClinicMVC/authentication/AuthenticationControllerTest.java`
- `backend/src/test/java/com/dh/dentalClinicMVC/authentication/AuthenticationControllerBoundaryTest.java`
- `openspec/changes/auth-controller-service-boundary/tasks.md`
- `openspec/changes/auth-controller-service-boundary/apply-progress.md`

## TDD Cycle Evidence

| Phase | Evidence |
| --- | --- |
| RED | Added failing MockMvc coverage for check-email, register compatibility, login compatibility, and a failing boundary test before production edits. |
| GREEN | Implemented `emailExists`, removed direct repository dependency from controller, and delegated check-email through service. |
| TRIANGULATE | Ran `cd backend && mvn test -Dtest=AuthenticationControllerTest,AuthenticationControllerBoundaryTest` successfully. |
| REFACTOR | Reduced repetition in auth tests with small helper methods; reran focused tests successfully. |
| VERIFY | Ran full backend suite with `cd backend && mvn test` successfully. |

## Commands Run

- `cd backend && mvn test -Dtest=AuthenticationControllerTest,AuthenticationControllerBoundaryTest`
- `cd backend && mvn test`

## Validation Results

- Focused tests: PASS
- Full backend suite: PASS
- Boundary test: PASS after production change
- Behavior coverage retained for register/login/check-email compatibility

## Residual Risks

- None observed in this auth slice.
- The optional `AuthenticationControllerDelegationTest` was not added because focused MockMvc login/check-email coverage plus the boundary test covered the required design constraints.

## Workload / PR Boundary

- Forecast remained low risk and under the 400-line budget.
- Slice stayed within a single backend-auth work unit / single PR boundary.
- Current working tree also contains separate, previously approved non-auth work units:
  - `.gitignore` housekeeping for `.pi/` and `judgment/` local artifacts.
  - Archived OpenSpec artifacts for `architecture-responsibility-test-audit`.
- Those non-auth files are **not part of the auth slice** and should be committed/reviewed separately from `auth-controller-service-boundary`.

## Remaining Tasks

- None for this auth apply slice.

## Notes

- Repository dependency was removed only from the controller; the service continues to own repository-backed email lookup as designed.
- No frontend, JWT, security, CI, repository interface, or unrelated controller changes were made by this auth apply.
- Commit hygiene: do not include `.gitignore` or `openspec/changes/archive/2026-07-02-architecture-responsibility-test-audit/` in the auth-boundary commit/PR unless the user explicitly chooses a combined documentation/housekeeping commit.
