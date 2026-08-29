# Delta for Principal Role Integrity

## Purpose

Defines the observable HTTP contract when a request carries a valid, unexpired
JWT (or valid login credentials) whose principal's backing row DOES exist but
whose `role` column is `null` or otherwise fails to resolve to a known
`Role` value. This is a distinct condition from the one covered by
`stale-principal-resolution`: that capability's Purpose statement scopes it to
"the principal's backing data no longer exists" (a missing `users`, `Patient`,
or `Dentist` row via `findByEmail`-miss, or a missing `users` row at the JWT
filter). A null-role principal has an existing row — the identity resolves —
but the role attribute on that row is unusable for authorization decisions.

### Relationship to `stale-principal-resolution`

This is intentionally a **new capability spec**, not a `## MODIFIED
Requirements` delta on `stale-principal-resolution`, for two reasons:

1. **Different trigger, different code path.** The existing capability's
   filter-layer requirement is scoped specifically to
   `UsernameNotFoundException` (no backing row at all). A null-role principal
   never raises that exception — `UserDetailsService.loadUserByUsername()`
   succeeds and returns a row; the defect surfaces later, when `getAuthorities()`
   or the fail-safe dispatch logic reads a null `role`. Extending the existing
   requirement's wording to also cover "row exists but role is null" would
   misrepresent what `UsernameNotFoundException` actually signals.
2. **Different service-layer shape.** `stale-principal-resolution` documents
   `findByEmail`-miss `orElseThrow(StalePrincipalException::new)` sites. The
   null-role condition instead requires an explicit role-dispatch check (see
   `AppointmentServiceImpl.findAllForCurrentUser()` below) and a distinct
   exception type (`InvalidPrincipalRoleException`), justified by that type's
   own scope: `StalePrincipalException` documents itself as "no backing row";
   collapsing a different failure mode into it would blur that distinction in
   code and logs even though the wire contract stays identical.

No `## MODIFIED Requirements` entry against `stale-principal-resolution/spec.md`
is needed: every existing requirement and scenario there is scoped to its own
missing-row trigger conditions and remains accurate unchanged. The null-role
JWT-filter guard is a new, independent `catch` clause alongside the existing
`UsernameNotFoundException` catch in `JwtAuthenticationFilter.doFilterInternal()`,
not a change to that existing clause's behavior — so it reuses the same
already-specified `StalePrincipalEntryPoint` mechanism without altering its
contract.

## Out of Scope

- Widening `StalePrincipalException` to also represent a null role.
- A second `AuthenticationEntryPoint`; the existing `StalePrincipalEntryPoint`
  is reused unchanged for the JWT-filter-layer scenario below.
- Write-path role defaulting (`PatientServiceImpl`, `DentistServiceImpl`,
  `AuthenticationService.createPatient`/`register`, data initializers) — all
  already default a non-null role; unaffected by this change.
- `AppointmentServiceImpl` methods other than `findAllForCurrentUser()`.
- `AppointmentController.findAll()`'s non-`User`-principal `else` branch —
  already fails safe to PATIENT and is unaffected.
- Database-level `NOT NULL` enforcement (schema/migration behavior is not an
  observable HTTP contract and is out of this spec's scope).

## ADDED Requirements

### Requirement: JWT-Filter Layer Rejects a Null-Role Principal as 401

The system MUST treat a principal whose `role` is `null` as unauthenticated
at the JWT-filter layer. When `JwtAuthenticationFilter.doFilterInternal()`
calls `UserDetailsService.loadUserByUsername()` and the returned user has a
`null` role, the filter MUST reject the request the same way it already
handles a `UsernameNotFoundException` (per `stale-principal-resolution`):
log the condition, write no response, do not short-circuit the chain, and
fall through `filterChain.doFilter()` unauthenticated. The existing
`StalePrincipalEntryPoint`, already configured on the security filter chain,
MUST then produce `401 Unauthorized` with the `ErrorResponse` body for any
protected (`authenticated()`) route the now-unauthenticated request cannot
pass. `permitAll` routes (for example `POST /auth/login`) MUST NOT be
blocked by this guard.

#### Scenario: JWT-filter layer null-role principal on a protected route

- GIVEN a valid, unexpired JWT whose principal has an existing `users` row
  with a `null` role
- WHEN `JwtAuthenticationFilter.doFilterInternal()` loads that user and the
  request targets a protected (`authenticated()`) route
- THEN the filter rejects the null-role condition by logging and continuing
  the chain unauthenticated, without writing a response
- AND the existing `StalePrincipalEntryPoint` produces `401 Unauthorized`
  with the `ErrorResponse` body, not an untranslated `500`

#### Scenario: Null-role credential on the login recovery path is NOT blocked

- GIVEN a request carrying a JWT or `authToken` cookie whose principal has a
  `null` role, AND a request body with a real seeded user's VALID
  email+password for a different, role-valid identity
- WHEN the client invokes `POST /auth/login` (a `permitAll` route) with both
  the null-role credential and the valid login body
- THEN the filter does NOT short-circuit the request
- AND the response is `200 OK`, proving the null-role guard does not lock
  out the account-recovery path for unrelated requests

### Requirement: Login Rejects a Null-Role Account as 401

`AuthenticationService.login()` MUST reject an account whose `role` is
`null` with `401 Unauthorized`. The rejection MUST occur before a successful
`200 OK` `AuthenticationResponse` (including a JWT) is ever returned to the
caller — a null-role account MUST NOT be issued a working session token.

#### Scenario: Login for a null-role account is rejected as 401

- GIVEN a seeded account with valid, matching credentials but a `null` role
  on its `users` row
- WHEN the client invokes `POST /auth/login` with that account's correct
  email and password
- THEN the response is `401 Unauthorized` with the `ErrorResponse` body
- AND no `AuthenticationResponse` (token, id, role, or profile fields) is
  returned

#### Scenario: Login for a role-valid account is unaffected

- GIVEN a seeded account with valid credentials and a non-null `role`
- WHEN the client invokes `POST /auth/login` with correct email and password
- THEN the response is `200 OK` with a valid `AuthenticationResponse`,
  unchanged from current behavior

### Requirement: `findAllForCurrentUser()` Fail-Safe Dispatch Requires an Explicit ADMIN Match

`AppointmentServiceImpl.findAllForCurrentUser(String email, Role role)`
MUST require an explicit `Role.ADMIN` match to reach the
`appointmentRepository.findAll()` branch. The PATIENT and DENTIST branches
are unchanged. A `null` role (or any role value that is neither `PATIENT`,
`DENTIST`, nor `ADMIN`) MUST NOT fall through to the `findAll()` branch, and
MUST instead resolve to `401 Unauthorized` for the caller — never an empty
list, and never the unrestricted appointment collection.

#### Scenario: Null-role principal does not receive ADMIN-equivalent access

- GIVEN a principal whose `role` is `null` is dispatched into
  `findAllForCurrentUser(email, role)`
- WHEN the method evaluates the PATIENT and DENTIST branches (neither
  matches) and reaches the terminal branch
- THEN the caller receives `401 Unauthorized` with the `ErrorResponse` body
- AND `appointmentRepository.findAll()` is never invoked

#### Scenario: ADMIN principal is unaffected

- GIVEN a principal whose `role` is `Role.ADMIN`
- WHEN `findAllForCurrentUser(email, role)` is invoked
- THEN the caller receives the full, unrestricted appointment collection,
  unchanged from current behavior

### Requirement: Null-Role 401s Are Wire-Indistinguishable From Stale-Principal 401s

The system MUST raise a distinct `InvalidPrincipalRoleException` (handled by
a new `@ExceptionHandler` in `GlobalExceptionHandler`, not
`handleStalePrincipal()`) for the login-path and
`findAllForCurrentUser()`-path rejections above. Despite being a distinct
exception type, the resulting HTTP response body MUST match the same
`ErrorResponse` shape (`error`, `message`, `path`, `status`, `timestamp`
fields, with equivalent `error`/`message` copy) already produced by
`GlobalExceptionHandler.handleStalePrincipal()`. An external caller MUST NOT
be able to distinguish a null-role rejection from a stale-principal
rejection based on the response body or status code alone.

#### Scenario: Null-role 401 body matches stale-principal 401 body shape

- GIVEN a null-role principal triggers `401 Unauthorized` via
  `AuthenticationService.login()` or
  `AppointmentServiceImpl.findAllForCurrentUser()`
- WHEN that response body is compared field-by-field to a
  `StalePrincipalException`-triggered `401` response body
- THEN both share the same `ErrorResponse` structure and equivalent
  `error`/`message` values, differing only in `path` and `timestamp`
