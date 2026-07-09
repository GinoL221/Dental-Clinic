# Tasks: Authz Cleanup Round 2

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~560-650 (main ~265, tests ~300+) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (R2, Units 1) -> PR 2 (R3, Units 2-4) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | R2: `AuthorizationUtils` + route 7 call sites | PR 1 | Pure refactor, behavior-preserving, ~150 lines incl. unit test; base = main |
| 2 | R3 foundation: `StalePrincipalException` + `GlobalExceptionHandler` + `StalePrincipalEntryPoint` | PR 2a | New 401 contract pieces; base = PR 1 (or main if PR 1 merged) |
| 3 | R3 wiring: `JwtAuthenticationFilter` catch + `SecurityConfiguration` entry-point wiring | PR 2b | Depends on Unit 2; base = Unit 2 branch |
| 4 | R3 call sites: 9 controller/service throws -> `StalePrincipalException` + regression suite | PR 2c | Depends on Units 2-3; base = Unit 3 branch |

Orchestrator: ask user for chain strategy (stacked-to-main / feature-branch-chain / size-exception) before `sdd-apply`.

## Phase 1: R2 — AuthorizationUtils (TDD)

- [x] 1.1 RED: `security/AuthorizationUtilsTest.java` — null auth -> false; matching/non-matching role; `hasAnyRole` true/false cases.
- [x] 1.2 GREEN: create `security/AuthorizationUtils.java` (static `hasRole`/`hasAnyRole`, per design Interfaces).

## Phase 2: R2 — Route call sites (refactor, existing suites are the safety net)

- [x] 2.1 `AppointmentController`: remove private `hasRole()`; swap its 4 callers (`save`, `findById`, `update`, `updateStatus`) to `AuthorizationUtils.hasRole`; replace `findAll()`'s inline `getAuthorities()` block with `AuthorizationUtils.hasRole`/`hasAnyRole`.
- [x] 2.2 `PatientController`: `update()` inline check -> `AuthorizationUtils.hasRole(auth,"ROLE_ADMIN")`; `findById()` compound check -> `AuthorizationUtils.hasAnyRole(auth,"ROLE_ADMIN","ROLE_DENTIST")`.
- [x] 2.3 `DentistController`: `update()` inline check -> `AuthorizationUtils.hasRole(auth,"ROLE_ADMIN")`.
- [x] 2.4 VERIFY: `cd backend && ./mvnw test -Dtest=PatientControllerAuthzTest,DentistControllerAuthzTest,AppointmentControllerTest` — zero behavior change.

## Phase 3: R3 — StalePrincipalException + handler (TDD)

- [x] 3.1 RED: MockMvc test — a controller path throwing `StalePrincipalException` returns 401 + `ErrorResponse` (uniform "No autenticado" message).
- [x] 3.2 GREEN: create `exception/StalePrincipalException.java` (extends `RuntimeException`); add `@ExceptionHandler(StalePrincipalException.class)` to `GlobalExceptionHandler` -> 401 `ErrorResponse`.

## Phase 4: R3 — Entry point + filter + wiring (TDD)

- [x] 4.1 RED: `security/StalePrincipalEntryPointTest.java` — asserts 401 status, JSON content-type, UTF-8, `ErrorResponse` body via injected `ObjectMapper`.
- [x] 4.2 GREEN: create `security/StalePrincipalEntryPoint.java` (`@Component`, ctor-injects `ObjectMapper`, implements `AuthenticationEntryPoint`).
- [x] 4.3 RED: filter test — dead-user JWT on protected route: `UsernameNotFoundException` caught, chain continues unauthenticated, no filter-level write; malformed/expired-JWT sibling path unaffected.
- [x] 4.4 GREEN: add `catch (UsernameNotFoundException ex)` in `JwtAuthenticationFilter.doFilterInternal()` mirroring the existing `JwtException | IllegalArgumentException` catch.
- [x] 4.5 RED+GREEN: entry-point regression test — protected route + absent/malformed/expired token now 401 (was 403); authenticated-but-wrong-role stays 403. Wire: ctor-inject `StalePrincipalEntryPoint` into `SecurityConfiguration`, `.exceptionHandling(h -> h.authenticationEntryPoint(entryPoint))`.
- [x] 4.6 RED+GREEN: login-recovery test — stale/dead JWT (header or `authToken` cookie) + a DIFFERENT real seeded user's valid credentials in body on `POST /auth/login` -> asserts `200 OK` (not blocked).

## Phase 5: R3 — Convert 9 findByEmail-miss sites to 401 (TDD, one RED+GREEN pair each)

- [x] 5.1 `AppointmentController.save()` PATIENT branch -> `StalePrincipalException`; test asserts 401.
- [x] 5.2 `AppointmentController.findById()` DENTIST branch -> `StalePrincipalException`; test asserts 401.
- [x] 5.3 `AppointmentController.update()` DENTIST branch -> `StalePrincipalException`; test asserts 401.
- [x] 5.4 `AppointmentController.updateStatus()` DENTIST branch findByEmail-miss ONLY -> `StalePrincipalException` (leave the 2 sibling validation `IllegalArgumentException` throws untouched); test asserts 401 for missing-row and unchanged 400 for bad/missing status.
- [x] 5.5 `PatientController.update()` `AccessDeniedException` -> `StalePrincipalException`; test asserts 401.
- [x] 5.6 `PatientController.findById()` `AccessDeniedException` -> `StalePrincipalException`; test asserts 401.
- [x] 5.7 `DentistController.update()` `AccessDeniedException` -> `StalePrincipalException`; test asserts 401.
- [x] 5.8 `AppointmentServiceImpl.findAllForCurrentUser()` PATIENT branch -> `StalePrincipalException`; test via `GET /appointments`.
- [x] 5.9 `AppointmentServiceImpl.findAllForCurrentUser()` DENTIST branch -> `StalePrincipalException`; test via `GET /appointments`.

## Phase 6: Close-out

- [x] 6.1 Full suite: `cd backend && ./mvnw test`; confirm all `*AuthzTest`/`AppointmentControllerTest` stay green. 156 tests, 154 pass; 2 pre-existing failures (`adminShouldBeAbleToUpdateAnyAppointment`, `dentistShouldBeAbleToUpdateOwnAppointment`) confirmed via `git stash` to already fail on the pre-Phase-5 commit (date-dependent: `plusDays(2)` lands on a weekend, rejected by `validateSchedule()`) — unrelated to this change, not fixed here.
- [x] 6.2 Grep: zero inline `getAuthorities()` role checks remain in Patient/Dentist/AppointmentController; all 9 former sites (4 in AppointmentController, 2 in PatientController/DentistController, 2 in AppointmentServiceImpl.findAllForCurrentUser) now throw `StalePrincipalException`. Confirmed via grep.
- [x] 6.3 Confirm `AuthenticationService.login()`'s `NoSuchElementException` 500 path is untouched (documented backlog, out of scope). Confirmed: bare `.orElseThrow()` at line 170, unchanged.
