# Stale Principal Resolution Specification

## Purpose

Defines the observable HTTP contract when a request carries a valid, unexpired JWT but the principal's backing data no longer exists ("stale principal"). This condition can surface at two layers: the authentication filter (missing `users` row) and controller/service resolution (missing `users`, `Patient`, or `Dentist` row via `findByEmail`-miss). Both layers MUST resolve to the same status so callers experience one consistent contract.

## Requirements

### Requirement: Controller/Service Layer Resolves Missing Backing Row as 401

The system MUST respond with `401 Unauthorized` — not 400, 403, or any other status — when a valid, unexpired JWT resolves to a principal whose backing row cannot be found (`findByEmail`-miss) at any of the following call sites, replacing today's inconsistent 6×400 / 3×403 split.

#### Scenario: PatientController.update() with missing backing row
- GIVEN a valid, unexpired JWT whose principal has no backing `Patient`/`users` row
- WHEN the client invokes `PatientController.update()` for that principal
- THEN the response is `401 Unauthorized`
- AND no patient state is modified

#### Scenario: PatientController.findById() with missing backing row (non-privileged/PATIENT branch)
- GIVEN a valid JWT whose principal fails the compound ADMIN||DENTIST check (falls into the non-privileged/PATIENT branch) and has no backing `Patient` row
- WHEN the client invokes `PatientController.findById()`
- THEN the response is `401 Unauthorized`

#### Scenario: DentistController.update() with missing backing row
- GIVEN a valid JWT whose principal has no backing `Dentist`/`users` row
- WHEN the client invokes `DentistController.update()`
- THEN the response is `401 Unauthorized`

#### Scenario: AppointmentController.save() PATIENT branch with missing backing row
- GIVEN a valid JWT for a PATIENT-branch principal with no backing row
- WHEN the client invokes `AppointmentController.save()`
- THEN the response is `401 Unauthorized`

#### Scenario: AppointmentController.findById() DENTIST branch with missing backing row
- GIVEN a valid JWT for a DENTIST-branch principal with no backing row
- WHEN the client invokes `AppointmentController.findById()`
- THEN the response is `401 Unauthorized`

#### Scenario: AppointmentController.update() DENTIST branch with missing backing row
- GIVEN a valid JWT for a DENTIST-branch principal with no backing row
- WHEN the client invokes `AppointmentController.update()`
- THEN the response is `401 Unauthorized`

#### Scenario: AppointmentController.updateStatus() DENTIST branch with missing backing row
- GIVEN a valid JWT for a DENTIST-branch principal with no backing row
- WHEN the client invokes `AppointmentController.updateStatus()`
- THEN the response is `401 Unauthorized`

#### Scenario: AppointmentServiceImpl.findAllForCurrentUser() PATIENT branch with missing backing row
- GIVEN a valid JWT for a PATIENT-branch principal with no backing `Patient` row
- WHEN `AppointmentServiceImpl.findAllForCurrentUser()` resolves the current user via the PATIENT-branch `findByEmail`-miss throw site
- THEN the caller receives `401 Unauthorized`

#### Scenario: AppointmentServiceImpl.findAllForCurrentUser() DENTIST branch with missing backing row
- GIVEN a valid JWT for a DENTIST-branch principal with no backing `Dentist` row
- WHEN `AppointmentServiceImpl.findAllForCurrentUser()` resolves the current user via the DENTIST-branch `findByEmail`-miss throw site
- THEN the caller receives `401 Unauthorized`

### Requirement: Authentication Filter Fails Open and a Custom Entry Point Yields 401

The system MUST catch `UsernameNotFoundException` raised inside `JwtAuthenticationFilter.doFilterInternal()` (valid, unexpired JWT whose `users` row is entirely gone) by logging and continuing the filter chain unauthenticated — mirroring the existing `JwtException | IllegalArgumentException` catch — instead of letting it escape untranslated past `ExceptionTranslationFilter` (currently surfaces as an untranslated 500). The filter MUST NOT write a response or short-circuit the chain. A custom `AuthenticationEntryPoint` configured on the security filter chain MUST then produce a `401 Unauthorized` with the `ErrorResponse` body (matching the controller-layer 401 shape and uniform message) for any unauthenticated request that reaches a protected (`authenticated()`) route.

#### Scenario: Filter-layer missing users row on a protected route
- GIVEN a valid, unexpired JWT whose `users` row no longer exists
- WHEN `JwtAuthenticationFilter.doFilterInternal()` attempts to load the user and the request targets a protected (`authenticated()`) route
- THEN the filter catches the resulting `UsernameNotFoundException`, logs, and continues the chain unauthenticated without writing a response
- AND the custom `AuthenticationEntryPoint` produces `401 Unauthorized` with the `ErrorResponse` body, not an untranslated 500

#### Scenario: Stale credential on the login recovery path is NOT blocked
- GIVEN a request carrying a stale `authToken` cookie or `Bearer` token whose `users` row no longer exists, AND a request body with a real seeded user's VALID email+password (an identity distinct from whatever principal the stale token would resolve to)
- WHEN the client invokes `POST /auth/login` (a `permitAll` route) with both the stale credential and the valid login body
- THEN the filter does NOT short-circuit the request
- AND the response is `200 OK` (not merely "not 401" — `POST /auth/login` is `permitAll` so the new entry point can never fire there regardless of whether the fix works, and a wrong-password attempt would also yield 401 via `BadCredentialsException` for an unrelated reason; only `200 OK` unambiguously proves the request reached and was processed by the login handler rather than being blocked by the filter)

### Requirement: Authentication Filter Preserves Existing Invalid-Token Mechanism

Adding `UsernameNotFoundException` handling MUST NOT alter the MECHANISM the filter uses for a genuinely invalid, malformed, or expired JWT: the existing `JwtException | IllegalArgumentException` catch path MUST continue to log and continue the chain unauthenticated exactly as before (no filter-level response write, no short-circuit).

Note (observable status change, in scope): because this change introduces a custom `AuthenticationEntryPoint` that replaces Spring Security's default `Http403ForbiddenEntryPoint`, unauthenticated access to a protected (`authenticated()`) route — including the malformed/expired/absent-token path — now resolves to `401 Unauthorized` instead of the previous `403 Forbidden`. This is a deliberate, semantically-correct consistency improvement (401 = unauthenticated). Authenticated-but-forbidden access (wrong role / `@PreAuthorize` deny) is unaffected and remains `403 Forbidden` via the access-denied handler.

#### Scenario: Expired or malformed JWT mechanism is unaffected
- GIVEN a request with a malformed, tampered, or expired JWT
- WHEN `JwtAuthenticationFilter.doFilterInternal()` processes the token
- THEN the existing `JwtException | IllegalArgumentException` handling triggers exactly as it did before this change (log + continue, unauthenticated, no filter-level write)

#### Scenario: Unauthenticated access to a protected route resolves to 401 (was 403)
- GIVEN a request to a protected (`authenticated()`) route with a malformed, expired, or absent token
- WHEN the security filter chain evaluates authorization and finds the request unauthenticated
- THEN the custom `AuthenticationEntryPoint` produces `401 Unauthorized` (replacing the previous `403 Forbidden`)

#### Scenario: Authenticated-but-forbidden access still resolves to 403 (regression)
- GIVEN a request with a valid JWT whose principal is authenticated but lacks the required role
- WHEN authorization denies the request (`@PreAuthorize` / role rule)
- THEN the response is `403 Forbidden`, unchanged from current behavior
