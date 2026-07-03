# Design: Auth Controller Service Boundary

## Overview

This change is a narrow backend authentication boundary cleanup. `AuthenticationController` currently injects `IUserRepository` and answers `GET /auth/check-email` by calling `userRepository.findByEmail(email).isPresent()` directly. The design moves that persistence-backed decision into `AuthenticationService`, preserving the public register/login/check-email API while restoring the project boundary: Controller → Service → Repository.

Scope stays limited to the authentication backend slice. No frontend changes, JWT/security redesign, broad DTO migration, or unrelated auth refactor is authorized.

## Current State Findings

Relevant source inspected:

- `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationController.java`
  - Injects `AuthenticationService` and `IUserRepository` via Lombok `@RequiredArgsConstructor` fields.
  - `checkEmailExists(@RequestParam String email)` returns `ResponseEntity.ok(userRepository.findByEmail(email).isPresent())`.
- `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationService.java`
  - Is a concrete `@Service`, not currently an interface-backed service abstraction.
  - Already owns `IUserRepository` for register/login behavior.
  - Uses `findByEmail` in registration duplicate checks and login user lookup.
- `backend/src/main/java/com/dh/dentalClinicMVC/repository/IUserRepository.java`
  - Exposes `Optional<User> findByEmail(String email)`; no `existsByEmail` method currently exists.
- `backend/src/test/java/com/dh/dentalClinicMVC/authentication/AuthenticationControllerTest.java`
  - Existing `@SpringBootTest` + `MockMvc` integration tests cover registration guard/default-role behavior and still inject `IUserRepository` for test setup/assertions.
  - No current `/auth/check-email` or `/auth/login` test coverage was found under backend auth tests.

Audit context confirms this is Slice 1 / BM-01 from the archived architecture-responsibility-test audit, with low review-size risk and required controller-boundary plus regression tests.

## Design Decisions

### 1. Add service-layer email existence method

Add a small public method to `AuthenticationService`:

```java
public boolean emailExists(String email) {
    return userRepository.findByEmail(email).isPresent();
}
```

Rationale:

- It preserves exact previous semantics because the controller previously used the same repository lookup expression.
- It avoids changing `IUserRepository` during this slice. Adding `existsByEmail` could be valid, but it changes the repository contract unnecessarily and is not needed to restore the controller boundary.
- It keeps persistence decisions in the service layer, where `AuthenticationService` already owns `IUserRepository` for register and login.

### 2. Remove repository dependency from controller

Update `AuthenticationController` to depend only on `AuthenticationService`:

```java
private final AuthenticationService authenticationService;
```

Then implement `checkEmailExists` as:

```java
@GetMapping("/check-email")
public ResponseEntity<Boolean> checkEmailExists(@RequestParam String email) {
    return ResponseEntity.ok(authenticationService.emailExists(email));
}
```

Also remove the `IUserRepository` import. Register and login endpoints should remain unchanged except for any formatting that is unavoidable.

### 3. Do not introduce a new auth service interface in this slice

The project instruction says Controller → Service interface/implementation → Repository, but the current authentication boundary is already a concrete `AuthenticationService` used by the controller. Introducing `IAuthenticationService` plus an implementation would widen this change beyond the approved low-risk boundary fix.

Decision: keep the existing concrete service and add the minimal method. Treat a future service-interface extraction as a separate approved slice if the project wants strict interface layering across auth.

## Runtime Data Flow

### Before

1. Client calls `GET /auth/check-email?email=user@example.com`.
2. `AuthenticationController` calls `IUserRepository.findByEmail(email)` directly.
3. Controller maps `Optional.isPresent()` to `ResponseEntity<Boolean>`.

### After

1. Client calls `GET /auth/check-email?email=user@example.com`.
2. `AuthenticationController` calls `authenticationService.emailExists(email)`.
3. `AuthenticationService` calls `IUserRepository.findByEmail(email)` internally.
4. Service returns `true`/`false` to the controller.
5. Controller returns `ResponseEntity<Boolean>` with the same response body as before.

Register and login flows remain unchanged:

- `POST /auth/register` delegates to `authenticationService.register(request)`.
- `POST /auth/login` delegates to `authenticationService.login(request)`.

## Planned File Changes

### Production

- `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationController.java`
  - Remove `IUserRepository` import.
  - Remove `private final IUserRepository userRepository`.
  - Delegate `/check-email` to `authenticationService.emailExists(email)`.

- `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationService.java`
  - Add `public boolean emailExists(String email)` using existing `userRepository.findByEmail(email).isPresent()`.
  - Do not alter register/login behavior.

### Tests

Prefer a small combination of behavior and boundary tests inside the existing authentication test package.

- `backend/src/test/java/com/dh/dentalClinicMVC/authentication/AuthenticationControllerTest.java`
  - Add MockMvc coverage for `GET /auth/check-email` existing-email and missing-email cases.
  - Seed the existing-email case through the public register endpoint or repository-backed setup already available in the integration test. Public registration is preferable when practical because it validates API compatibility; direct repository setup is acceptable if registration setup becomes noisy.
  - Assert response body strings remain `true` and `false`, preserving current boolean JSON compatibility.
  - Add a focused register compatibility assertion that a successful register call still returns the expected `AuthenticationResponse` public shape/fields used by existing clients. Do not redesign request/response DTOs.
  - Add at least one focused login success-path compatibility test. Prefer MockMvc against the existing `/auth/login` endpoint when a simple fixture is feasible; otherwise use a controller-level unit test that proves `login` still delegates to `AuthenticationService.login` and returns the same `AuthenticationResponse` body wrapper. If MockMvc login cannot be made reliable without broad JWT/security setup, record that residual risk in apply progress.

- Add or update a focused boundary test, for example `backend/src/test/java/com/dh/dentalClinicMVC/authentication/AuthenticationControllerBoundaryTest.java`.
  - Use reflection against `AuthenticationController.class` to assert declared fields, constructor parameter types, and declared method parameter/return types do not live under `com.dh.dentalClinicMVC.repository` and do not equal `IUserRepository`.
  - Add a narrow source import guard that scans only import lines in `AuthenticationController.java` for `com.dh.dentalClinicMVC.repository.`. This is required because the explicit boundary includes repository imports; keep it narrow to avoid brittle formatting assertions.
  - Do not add ArchUnit unless it already exists; `spring-boot-starter-test` is sufficient for JUnit assertions, and adding a test dependency would widen the slice.

- Add a focused controller delegation unit test if it remains small:
  - Instantiate `AuthenticationController` with a mocked `AuthenticationService` after the repository constructor parameter is removed.
  - Call `checkEmailExists(email)` directly.
  - Verify the service method is called and the response body is preserved.
  - This can provide strong service-delegation evidence with little cost, especially if MockMvc setup makes specific branch assertions noisy.

- Login/register compatibility:
  - Do not leave login/register compatibility as optional. The apply phase must include either focused MockMvc compatibility coverage or a documented fallback controller-level test plus residual risk note if full endpoint setup would broaden the slice.
  - Login coverage must protect public behavior enough to catch accidental controller response/status/body changes, not just compile-time delegation.
  - Register coverage must protect the public response shape/fields without expanding into broad auth redesign.

## Test Design Details

### Check-email behavior regression

Assertions should cover:

- Existing email:
  - Given an account exists for `check-email-existing@test.com`.
  - When `GET /auth/check-email?email=check-email-existing@test.com` is called.
  - Then status is 200 and body is `true`.

- Missing email:
  - Given no account exists for `check-email-missing@test.com`.
  - When `GET /auth/check-email?email=check-email-missing@test.com` is called.
  - Then status is 200 and body is `false`.

Keep `@Transactional` + `@Rollback` behavior from the existing integration test so data does not leak between tests.

### Boundary/architecture test

Use JUnit assertions similar to:

```java
assertFalse(type.getPackageName().startsWith("com.dh.dentalClinicMVC.repository"));
assertNotEquals(IUserRepository.class, type);
```

Apply to:

- `AuthenticationController.class.getDeclaredFields()` field types.
- `AuthenticationController.class.getDeclaredConstructors()` parameter types.
- `AuthenticationController.class.getDeclaredMethods()` parameter and return types.

For the required source import guard, read:

`backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationController.java`

and inspect only lines starting with `import` so comments or method bodies do not create false positives.

### Register/login compatibility guard

The apply phase should avoid expanding this into a broad auth test rewrite, but it must still protect public auth compatibility:

- Register: assert a successful register call still returns the expected `AuthenticationResponse` public shape/fields used by existing clients.
- Login: require at least one focused success-path compatibility test. Prefer MockMvc against `/auth/login` when feasible. If full endpoint setup would broaden the slice, use a controller-level test that preserves status/body wrapper semantics and record the residual risk in `apply-progress.md`.

## Validation Commands

Run focused backend tests first:

```bash
cd backend && mvn test -Dtest=AuthenticationControllerTest,AuthenticationControllerBoundaryTest
```

If a separate controller unit test is added, include it in the focused command:

```bash
cd backend && mvn test -Dtest=AuthenticationControllerTest,AuthenticationControllerBoundaryTest,AuthenticationControllerDelegationTest
```

If feasible before completion, run the full backend suite:

```bash
cd backend && mvn test
```

Because strict TDD is enabled in project SDD context, the apply phase should create or strengthen failing tests first, then implement the minimal production change, then rerun the focused command until green.

## Rollout and Work Unit Plan

This should be one small backend work unit under the 400 changed-line review budget:

1. Add/strengthen failing tests for `/auth/check-email` behavior and controller repository independence.
2. Add `AuthenticationService.emailExists(String email)`.
3. Remove `IUserRepository` from `AuthenticationController` and delegate through the service.
4. Run focused Maven tests.
5. Run full backend Maven tests if feasible.
6. Commit as one coherent conventional commit only after user approval for commit operations, e.g. `refactor(auth): route email checks through service boundary`.

No git push should happen without explicit user permission.

## Risks and Tradeoffs

- Auth-sensitive surface: even a small wiring change touches public authentication routes, so behavior tests are mandatory.
- Concrete service boundary: `AuthenticationService` is not currently an interface. Keeping it concrete minimizes scope, but does not fully address the AGENTS.md preference for service interface/implementation layering.
- Boundary test brittleness: reflection-based dependency assertions are preferred over broad source-text checks. Any source guard should be limited to import lines and the explicit repository-boundary contract.
- Test setup tradeoff: using repository access inside tests is acceptable for seeding/asserting persisted state; the production boundary rule applies to controllers, not test fixtures.
- Avoid broad auth/JWT redesign: login compatibility should be guarded without introducing new security architecture or token behavior changes.

## Future Apply Constraints

- Strict TDD historical context applies: tests first, then minimal implementation.
- Stay backend-auth only.
- Keep the slice below the 400 changed-line review budget.
- Do not migrate DTOs, alter JWT claims, change security filters, or touch frontend auth flows.
- Do not add new dependencies unless a blocker proves they are necessary; current JUnit/Spring Boot test dependencies are sufficient.
