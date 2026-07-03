# Tasks: Auth Controller Service Boundary

## Review Workload Forecast

| Field | Value |
| ------- | ------- |
| Estimated changed lines | 120-220 changed lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Apply Boundary

Allowed production writes:

- `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationController.java`
- `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationService.java`

Allowed test writes:

- `backend/src/test/java/com/dh/dentalClinicMVC/authentication/AuthenticationControllerTest.java`
- `backend/src/test/java/com/dh/dentalClinicMVC/authentication/AuthenticationControllerBoundaryTest.java`
- `backend/src/test/java/com/dh/dentalClinicMVC/authentication/AuthenticationControllerDelegationTest.java` only if needed to keep login/check-email compatibility coverage focused

Allowed SDD artifact writes:

- `openspec/changes/auth-controller-service-boundary/tasks.md`
- Engram topic `sdd/auth-controller-service-boundary/apply-progress`

Do not edit frontend files, CI files, package/build configuration, JWT/security architecture, DTO contracts beyond assertions, repository interfaces, unrelated controllers, or unrelated tests.

## Implementation Tasks

### RED: Read and confirm current slice

- [x] Read `openspec/changes/auth-controller-service-boundary/proposal.md`, `openspec/changes/auth-controller-service-boundary/specs/auth-controller-service-boundary/spec.md`, and `openspec/changes/auth-controller-service-boundary/design.md` before editing.
- [x] Read `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationController.java`, `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationService.java`, and existing auth tests under `backend/src/test/java/com/dh/dentalClinicMVC/authentication/`.
- [x] Confirm strict TDD applies and keep first edits limited to failing tests.

### RED: Add failing behavior and compatibility tests

- [x] Add failing MockMvc coverage in `backend/src/test/java/com/dh/dentalClinicMVC/authentication/AuthenticationControllerTest.java` for `GET /auth/check-email?email=...` returning `true` for an existing account and `false` for a missing account.
- [x] Add a failing successful-register compatibility assertion in `backend/src/test/java/com/dh/dentalClinicMVC/authentication/AuthenticationControllerTest.java` that verifies status and `AuthenticationResponse` public response shape/fields remain compatible, including at least `token`, `role`, `id`, `firstName`, `lastName`, and `email`.
- [x] Add a failing login success-path compatibility test, preferably MockMvc against `POST /auth/login`, that verifies status and response body wrapper/fields remain compatible; if endpoint setup would broaden scope, add a focused controller-level fallback test and record the residual risk in apply progress.
- [x] Add a failing boundary test in `backend/src/test/java/com/dh/dentalClinicMVC/authentication/AuthenticationControllerBoundaryTest.java` that fails while `AuthenticationController` directly depends on repository types.
- [x] Ensure the boundary test inspects `AuthenticationController` declared fields, constructors, method parameter types, method return types, and `AuthenticationController.java` import lines for repository dependencies, including `IUserRepository`.

### GREEN: Minimal production change

- [x] Add `public boolean emailExists(String email)` to `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationService.java` using the existing `userRepository.findByEmail(email).isPresent()` semantics.
- [x] Remove the `IUserRepository` import and field from `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationController.java`.
- [x] Update `AuthenticationController.checkEmailExists(String email)` to return `ResponseEntity.ok(authenticationService.emailExists(email))` without changing register or login behavior.

### TRIANGULATE: Focused validation

- [x] Run `cd backend && mvn test -Dtest=AuthenticationControllerTest,AuthenticationControllerBoundaryTest` and make the focused tests pass.
- [x] `AuthenticationControllerDelegationTest` was not added; MockMvc login/check-email coverage plus the boundary test satisfied the design, so the conditional delegation-test command is not applicable.
- [x] Verify the boundary test would catch repository dependencies through fields, constructors, method signatures, and import lines rather than only incidental formatting.

### REFACTOR / VERIFY: Keep the slice reviewable

- [x] Refactor only within the allowed auth source/test files to remove duplication or clarify assertions without widening scope.
- [x] Run `cd backend && mvn test` if feasible before completion; if skipped, record why in apply progress.
- [x] Update Engram topic `sdd/auth-controller-service-boundary/apply-progress` with tests added, production files changed, commands run, validation results, full-suite status, and any residual risks.
- [x] Mark completed task checkboxes in `openspec/changes/auth-controller-service-boundary/tasks.md` during apply as each task is finished.

## Work Unit and Rollback

This is one backend-auth work unit. Start by adding tests, finish when focused Maven tests pass and apply progress is saved. Rollback is limited to reverting the auth controller/service changes, the new/updated auth tests, and apply-progress/task checkbox updates. No push is allowed without explicit user permission; commit only if the user approves a coherent conventional commit such as `refactor(auth): route email checks through service boundary`.
