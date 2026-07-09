## Verification Report

**Change**: authz-cleanup-round-2
**Version**: N/A (no version field in artifacts)
**Mode**: Strict TDD

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 24 (6 phases) |
| Tasks complete | 24 |
| Tasks incomplete | 0 |

All 24 numbered tasks in `tasks.md` are checked `[x]`. Verified against actual source: every referenced file exists, every referenced call-site conversion is present in the current code (see Correctness table below).

### Build & Tests Execution
**Build**: Compiles as part of `mvn test` (no separate build step observed to fail).

**Tests**: 154 passed / 2 failed / 0 skipped, out of 156 total (independently executed, not taken from apply-progress claims)
```text
$ cd backend && ./mvnw test
[ERROR] Tests run: 156, Failures: 2, Errors: 0, Skipped: 0
[ERROR]   AppointmentControllerTest.adminShouldBeAbleToUpdateAnyAppointment:274 Status expected:<200> but was:<400>
[ERROR]   AppointmentControllerTest.dentistShouldBeAbleToUpdateOwnAppointment:301 Status expected:<200> but was:<400>
```
Independently confirmed these 2 failures are pre-existing and unrelated to this change (not just trusting the apply-progress claim):
- Root cause: `AppointmentControllerTest` uses `LocalDate.now().plusDays(2)` to compute a test appointment date. Today (2026-07-09, Thursday/`jueves`) + 2 days = 2026-07-11 = Saturday (`sábado`), which fails `AppointmentController`'s weekday-only `validateSchedule()` — a date-arithmetic test bug wholly unrelated to authz.
- Confirmed via `git show a0686d7^:...AppointmentControllerTest.java` that the identical `plusDays(2)` lines were already present in the commit immediately BEFORE this change's first commit (`a0686d7`) — i.e., the bug predates authz-cleanup-round-2 entirely. Accepted deviation, not a verify failure.

**Coverage**: Not available — no coverage tool (JaCoCo etc.) configured in this Maven project; skipped, not a failure.

### Spec Compliance Matrix

**Requirement: Controller/Service Layer Resolves Missing Backing Row as 401** (9 scenarios)

| Scenario | Test | Result |
|---|---|---|
| PatientController.update() missing row | `PatientControllerAuthzTest.whenPatientHasNoBackingRecordOnUpdate_then401Unauthorized` (also asserts victim row untouched — the spec's "AND no patient state is modified" clause) | ✅ COMPLIANT |
| PatientController.findById() missing row | `PatientControllerAuthzTest.whenPatientHasNoBackingRecordOnFindById_then401Unauthorized` | ✅ COMPLIANT |
| DentistController.update() missing row | `DentistControllerAuthzTest.whenDentistHasNoBackingRecordOnUpdate_then401Unauthorized` | ✅ COMPLIANT |
| AppointmentController.save() PATIENT branch | `AppointmentControllerTest.patientWithNoBackingRecordCreatingAppointment_then401Unauthorized` | ✅ COMPLIANT |
| AppointmentController.findById() DENTIST branch | `AppointmentControllerTest.dentistWithNoBackingRecordFindingAppointmentById_then401Unauthorized` | ✅ COMPLIANT |
| AppointmentController.update() DENTIST branch | `AppointmentControllerTest.dentistWithNoBackingRecordUpdatingAppointment_then401Unauthorized` | ✅ COMPLIANT |
| AppointmentController.updateStatus() DENTIST branch | `AppointmentControllerTest.dentistWithNoBackingRecordUpdatingStatus_then401Unauthorized` (+ 2 sibling regression tests confirming the "status field missing"/"invalid status" validation throws stay 400) | ✅ COMPLIANT |
| AppointmentServiceImpl.findAllForCurrentUser() PATIENT branch | `AppointmentControllerTest.patientWithNoBackingRecordListingAppointments_then401Unauthorized` | ✅ COMPLIANT |
| AppointmentServiceImpl.findAllForCurrentUser() DENTIST branch | `AppointmentControllerTest.dentistWithNoBackingRecordListingAppointments_then401Unauthorized` | ✅ COMPLIANT |

**Requirement: Authentication Filter Fails Open and a Custom Entry Point Yields 401** (2 scenarios)

| Scenario | Test | Result |
|---|---|---|
| Filter-layer missing users row on protected route | `StalePrincipalEntryPointIntegrationTest.deadUsersRowJwtOnProtectedRouteReturns401ViaEntryPoint` + `JwtAuthenticationFilterTest.deadUsersRowJwtViaHeaderIsCaughtAndChainContinuesUnauthenticated` / `...ViaCookie...` | ✅ COMPLIANT |
| Stale credential on login recovery path NOT blocked | `StalePrincipalEntryPointIntegrationTest.staleAuthTokenHeaderOnLoginRecoveryPathIsNotBlocked_realSeededUserLogsInSuccessfully` + `...Cookie...` — both assert `200 OK` with a DIFFERENT real identity's valid credentials, exactly matching the spec's "only 200 unambiguously proves it" reasoning (not merely "not 401") | ✅ COMPLIANT |

**Requirement: Authentication Filter Preserves Existing Invalid-Token Mechanism** (2 scenarios)

| Scenario | Test | Result |
|---|---|---|
| Expired/malformed JWT mechanism unaffected | `JwtAuthenticationFilterTest.malformedCookieTokenLeavesRequestUnauthenticatedWithoutThrowing` / `...HeaderToken...` / `expiredOrInvalidCookieTokenIsRejected` | ✅ COMPLIANT |
| Unauthenticated access to protected route now 401 (was 403) | `StalePrincipalEntryPointIntegrationTest.unauthenticatedAccessToProtectedRouteNowReturns401NotFormerly403`, `.malformedTokenOnProtectedRouteReturns401ViaEntryPoint` | ✅ COMPLIANT |
| Authenticated-but-forbidden still 403 (regression) | `StalePrincipalEntryPointIntegrationTest.authenticatedButWrongRoleStillReturns403ViaAccessDeniedHandlerUnchanged` + existing `PatientControllerAuthzTest.whenPatientRequestsDifferentId_thenForbiddenNoDataLeaked` and full `*AuthzTest` suites (still green) | ✅ COMPLIANT |

**Compliance summary**: 13/13 scenarios compliant (all runtime-verified via the test run above; zero UNTESTED, zero FAILING).

### Correctness (Static Evidence)
| Requirement | Status | Notes |
|------------|--------|-------|
| Zero remaining inline `getAuthorities()` checks | ✅ Implemented | `rg "getAuthorities\(\)" controller/` returns zero matches in Patient/Dentist/AppointmentController. All call sites route through `AuthorizationUtils.hasRole`/`hasAnyRole` (verified line-by-line in all 3 controllers). |
| `AuthorizationUtils` static utility | ✅ Implemented | `security/AuthorizationUtils.java` matches design's `Interfaces/Contracts` block exactly (final class, private ctor, static null-safe `hasRole`/`hasAnyRole`). |
| 9 `StalePrincipalException` throw sites | ✅ Implemented | Verified: `AppointmentController` (save L61, findById L83, update L112, updateStatus L186 — the 2 sibling `IllegalArgumentException` validation throws at L194/L201 correctly left untouched), `PatientController` (update L73, findById L107), `DentistController` (update L74), `AppointmentServiceImpl.findAllForCurrentUser` (PATIENT L250, DENTIST L254). Count = 9, matches spec exactly. |
| `GlobalExceptionHandler` 401 mapping | ✅ Implemented | `handleStalePrincipal` returns `HttpStatus.UNAUTHORIZED` with uniform message `"No autenticado"` / `"La sesión ya no es válida. Iniciá sesión nuevamente."` |
| `JwtAuthenticationFilter` fail-open catch | ✅ Implemented | New `catch (UsernameNotFoundException ex)` logs and falls through to `filterChain.doFilter` — no response write, no short-circuit, mirrors the sibling `JwtException | IllegalArgumentException` catch exactly, placed as a separate catch block above it. |
| `StalePrincipalEntryPoint` | ✅ Implemented | `@Component`, `@RequiredArgsConstructor` ctor-injects the Spring-managed `ObjectMapper` (not `new ObjectMapper()`), sets status/content-type/charset before writing, uses the identical uniform message and `ErrorResponse` shape as the controller-layer handler. |
| `SecurityConfiguration` wiring | ✅ Implemented | `stalePrincipalEntryPoint` is a ctor-injected final field, wired via `.exceptionHandling(handling -> handling.authenticationEntryPoint(stalePrincipalEntryPoint))`; `accessDeniedHandler` deliberately untouched. |
| `AuthenticationService.login()` 500 path untouched | ✅ Confirmed | Line 170: `.orElseThrow()` (bare, produces `NoSuchElementException`→500) — read directly from source, unchanged, exactly as tasks.md/apply-progress documented. |

### Coherence (Design)
| Decision | Followed? | Notes |
|----------|-----------|-------|
| Decision 1: static utility, not bean/base class | ✅ Yes | `AuthorizationUtils` is a `final class` with private constructor and only static methods, called directly (no DI) at all 9 call sites. |
| Decision 2: dedicated exception + one `@ExceptionHandler` | ✅ Yes | `StalePrincipalException extends RuntimeException`, single handler, uniform message policy honored at every site including `updateStatus()`'s single-throw carve-out. |
| Decision 3: fail-open filter + custom `AuthenticationEntryPoint` | ✅ Yes | Filter never writes/short-circuits; entry point is sole security-layer 401 writer; `accessDeniedHandler` (403 path) is untouched, confirmed both by source inspection and by the passing `authenticatedButWrongRoleStillReturns403ViaAccessDeniedHandlerUnchanged` test. |

### TDD Compliance
| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | apply-progress + tasks.md document RED/GREEN pairs per phase |
| All tasks have tests | ✅ | 24/24 tasks map to a test file or a verify/grep step |
| RED confirmed (tests exist) | ✅ | All referenced test files exist and were read directly: `AuthorizationUtilsTest`, `GlobalExceptionHandlerStalePrincipalTest`, `StalePrincipalEntryPointTest`, `StalePrincipalEntryPointIntegrationTest`, `JwtAuthenticationFilterTest`, plus additions to `PatientControllerAuthzTest`/`DentistControllerAuthzTest`/`AppointmentControllerTest` |
| GREEN confirmed (tests pass) | ✅ | All of the above pass on the fresh, independent `./mvnw test` run |
| Triangulation adequate | ✅ | `AuthorizationUtilsTest` has 10 cases across null/match/non-match/multi-role/empty-authorities; each of the 9 throw sites has its own dedicated test plus 2 explicit sibling-regression tests for `updateStatus()`'s untouched validation throws |
| Safety Net for modified files | ✅ | Phase 2.4 explicitly re-ran `PatientControllerAuthzTest,DentistControllerAuthzTest,AppointmentControllerTest` after the R2 refactor before proceeding |

**TDD Compliance**: 6/6 checks passed

### Assertion Quality
No tautologies, ghost loops, or assertion-free tests found in any of the new/modified test files inspected (`AuthorizationUtilsTest`, `GlobalExceptionHandlerStalePrincipalTest`, `StalePrincipalEntryPointTest`, `StalePrincipalEntryPointIntegrationTest`, `JwtAuthenticationFilterTest`, and the new methods in `PatientControllerAuthzTest`/`DentistControllerAuthzTest`/`AppointmentControllerTest`). All assertions call production code (`AuthorizationUtils.hasRole/hasAnyRole`, `GlobalExceptionHandler.handleStalePrincipal`, `StalePrincipalEntryPoint.commence`, real MockMvc HTTP round-trips) and assert concrete values (status codes, JSON body fields, or persisted-row state), not smoke-test-only patterns.

**Assertion quality**: ✅ All assertions verify real behavior

### Issues Found

**CRITICAL**: None

**WARNING**:
1. `proposal.md`'s "Success Criteria" checklist (5 items) is still entirely unchecked (`[ ]`) on disk, even though `tasks.md` is fully checked and the implementation independently verifies all 5 criteria are met. Documentation/process gap — recommend checking these off before archive so the artifact trail is self-consistent.
2. The Engram-stored `sdd/authz-cleanup-round-2/spec` observation (#1529) is a stale draft of `spec.md`: it still describes the earlier "Authentication Filter Translates Missing-Backing-Row to 401" requirement wording and a "5×400/3×403" split, while the on-disk `specs/stale-principal-resolution/spec.md` (the version actually used for this verification, per hybrid-mode source of truth) has since evolved to the "Fails Open... Custom Entry Point" wording, the added third requirement ("Preserves Existing Invalid-Token Mechanism"), and "6×400/3×403". Not a functional defect — the disk file is authoritative and correct — but the Engram copy should be re-synced so future sessions reading only Engram don't see an outdated contract.

**SUGGESTION**: None

### Verdict
**PASS WITH WARNINGS** — all 13 spec scenarios are runtime-verified compliant, all 24 tasks are complete and match the current code exactly, all 3 design decisions are faithfully implemented, the full backend suite is green apart from 2 independently-confirmed pre-existing/unrelated date-arithmetic failures, and TDD/assertion-quality audits are clean. The two WARNINGs are documentation-hygiene gaps (unchecked proposal checklist, stale Engram spec copy) that do not block archive but should be cleaned up.
