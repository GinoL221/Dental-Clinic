# Proposal: Appointment Role Null Hardening

## What

Harden the nullable `users.role` gap across three layers — auth-layer rejection with 401, fail-safe service dispatch, and a DB `NOT NULL` constraint.

## Why

Two independent failure modes on a null role. (1) `User.getAuthorities()` (`User.java:44-46`) does `role.name()`; its call site `JwtAuthenticationFilter.doFilterInternal():77` is inside the `try` but outside both catches (`UsernameNotFoundException` :88, `JwtException|IllegalArgumentException` :100), and filters run before `DispatcherServlet`, so it surfaces as an untranslated 500 on every authenticated request. (2) `AppointmentServiceImpl.findAllForCurrentUser()` :205-222 dispatches PATIENT/DENTIST/`else → findAll()`, so a null role silently gets ADMIN-equivalent global access. Only role-dispatch-with-fallthrough site in the codebase (verified by full grep).

**Reachability (honest framing)**: preventive / defense-in-depth, NOT an active incident. Every current write path already defensively defaults a null role (`PatientServiceImpl.save/update`, `DentistServiceImpl.save/update`, `AuthenticationService.createPatient/register`, both data initializers); `V1` has no `INSERT INTO users`. No live code path can persist a null-role row today. Exposure is direct DB writes, restores, or a future write path skipping the defaulting pattern.

## Scope

### In Scope

- New `InvalidPrincipalRoleException` in `com.dh.dentalClinicMVC.exception` + new `@ExceptionHandler` in `GlobalExceptionHandler` (next to `handleStalePrincipal()` :231-244), same 401 `ErrorResponse` shape.
- JWT-filter guard after `loadUserByUsername()` (:68), before `isTokenValid`/`getAuthorities()`; new catch clause mirroring the `UsernameNotFoundException` sibling (log, no response write, no short-circuit, fall through unauthenticated) so `StalePrincipalEntryPoint` (`SecurityConfiguration.java:64`) writes the 401 and permitAll routes stay open (no lockout regression).
- Login-path guard in `AuthenticationService.login()` (user-confirmed: null-role account unusable end-to-end).
- Fail-safe `findAllForCurrentUser()` dispatch: explicit `Role.ADMIN` required, rejecting the terminal `else`.
- Flyway `V2__enforce_user_role_not_null.sql`: defensive `UPDATE users SET role='PATIENT' WHERE role IS NULL` BEFORE `ALTER TABLE ... NOT NULL`; plus `nullable = false` on `User.role`. Genuine scope expansion — unlike its predecessor, this change touches Flyway.
- Tests: `JwtAuthenticationFilterTest`, `AppointmentServiceImplTest`, `AuthenticationServiceLoginRaceTest` (confirmed as the existing mock-based unit test of `login()`), `GlobalExceptionHandlerStalePrincipalTest`.

### Out of Scope

Frontend (wire shape unchanged). Widening `StalePrincipalException`. A second `AuthenticationEntryPoint`. Write-path role defaulting elsewhere. Other `AppointmentServiceImpl` methods. `AppointmentController.findAll()`'s non-`User`-principal `else` (already fails safe to PATIENT).

## Key Decisions

### D1 — 401 Unauthorized (binding, inherited)

From `appointment-collection-mapping` D2 + `openspec/specs/stale-principal-resolution/spec.md`. Settled.

### D2 — New distinct exception type (binding)

Not a widened `StalePrincipalException` — that type's own doc comment scopes it to "no backing row"; null role is "row exists, role invalid". Same wire response, distinct in code/logs.

### D3 — Guard placement: call sites, not the shared bean (recommended, needs design-phase verification)

Guard at the two call sites (JWT filter, login), not inside the shared `ApplicationConfig.userDetailsService()` lambda (:23-32).

Reasoning (reasoned about, NOT executed this phase — `sdd-design` MUST verify both claims against the classpath version): `DaoAuthenticationProvider.retrieveUser()` is understood to catch `UsernameNotFoundException` and `InternalAuthenticationServiceException` specifically and wrap every other exception into `InternalAuthenticationServiceException` — a raw `InvalidPrincipalRoleException` thrown from the shared lambda would reach `GlobalExceptionHandler` wrapped, miss the new handler, and 500 via `handleGenericException`, defeating D1 on login. Extending `UsernameNotFoundException` avoids the wrap but collapses into `BadCredentialsException` → 401 "Credenciales inválidas" (right status, misleading message, no distinct handler). Separately, the login guard must sit BEFORE `authenticationManager.authenticate()`, because `createSuccessAuthentication` calls `userDetails.getAuthorities()` and would NPE first.

### D4 — Flyway V2 with backfill sequenced before the constraint (binding, user-confirmed)

## Review Workload Forecast

~60-70 production lines across 7 files + ~120-180 test lines across 4 files = **250-350 lines vs. a 400-line budget**. Fits but not comfortably. `sdd-tasks` should plan a possible two-slice split under `ask-on-risk`:

- Slice 1: exception + handler + both guards + service fail-safe + tests.
- Slice 2: Flyway V2 + entity annotation + fixture fallout.

## Rollback Asymmetry

Slice 1 is a clean `git revert`. Slice 2 is NOT — reverting the migration file does not drop an already-applied `NOT NULL`; rollback needs a compensating `V3`. This is the main reason to sequence the schema change last if split into slices.

## Open Items for Design Phase (recorded, non-blocking for this proposal)

1. D3's placement claim about `DaoAuthenticationProvider`'s exception wrapping must be verified against the actual Spring Security version on the classpath before implementation.
2. `V1` is MySQL-specific (`ENGINE=InnoDB`, `ENUM`), so `V2`'s `ALTER TABLE ... MODIFY` dialect and how the test suite provisions schema (H2 vs MySQL) must be confirmed before writing the migration.
3. Whether to pre-commit to one slice or two, versus deciding at the `sdd-tasks` review-workload gate.

## Proposal Question Round

Three binding decisions were confirmed by the user before this phase: (1) include the Flyway `NOT NULL` migration in this change rather than deferring it; (2) reject a null-role user at login too, not only via the JWT filter; (3) use a new, distinct exception type rather than widening `StalePrincipalException`. See D2 and D4 above.
