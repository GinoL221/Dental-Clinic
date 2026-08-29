# Apply Progress: appointment-role-null-hardening

**Mode**: Strict TDD
**Batch**: 2 (Batch 1 below; Batch 2 is a remediation closing a `sdd-verify` CRITICAL finding)
**Status**: 18/20 tasks complete (all code/test tasks done, including the previously-gapped
3.4; tasks 6.4 and 6.5 remain unchecked by design — 6.4, the manual MySQL staging migration run,
cannot be performed by any agent and is flagged for the user/orchestrator before merge; 6.5, the
isolated-commit boundary, is deliberately left to the orchestrator per phase instructions —
working tree is uncommitted). Corrected from an earlier "19/20" mislabel caught by the re-verify
pass (verify-report.md).

## Batch 2 — Remediation of sdd-verify CRITICAL finding

`sdd-verify` (report id #6870) found spec `principal-role-integrity` Requirement "JWT-Filter
Layer Rejects a Null-Role Principal as 401", Scenario "Null-role credential on the login
recovery path is NOT blocked" had zero covering test — Batch 1's unit-level justification for
task 3.4 (below) did not actually exercise the `permitAll` route through the real security
filter chain, only the filter's internal catch behavior in isolation.

**Fix**: `backend/src/test/java/com/dh/dentalClinicMVC/security/NullRolePrincipalLoginRecoveryIntegrationTest.java`
(new, TEST-ONLY change, zero production code touched). `@SpringBootTest` + `@AutoConfigureMockMvc`,
overrides the `UserDetailsService` bean with a Mockito stub returning an in-memory, never-persisted
null-role `User` for the stale credential's subject — this bypasses `@Column(nullable = false)`
entirely since the row is never written to H2. A real seeded `Patient` (via `patientRepository.save`)
provides the distinct, role-valid login identity. Two cases:
- `nullRoleTokenHeaderOnLoginRecoveryPathIsNotBlocked_realSeededUserLogsInSuccessfully`
- `nullRoleTokenCookieOnLoginRecoveryPathIsNotBlocked_realSeededUserLogsInSuccessfully`

Both assert `POST /auth/login` returns `200 OK` with the seeded patient's email in the response body,
proving the null-role guard does not lock out the account-recovery path for an unrelated request.

**Test evidence**: `mvn -o clean test -Dtest=NullRolePrincipalLoginRecoveryIntegrationTest` → 2/2 passing
(confirmed log output: `Rejected request with invalid principal role (users row has null role)` fired
for the null-role credential on both requests, while the login itself still succeeded). Full suite
`mvn -o clean test` → **256/256 passing, 0 failures, 0 errors** (254 + 2 new), 3 pre-existing skips in
`AppointmentScheduleValidatorTest` unrelated to this change (present before this batch too). Spotless
clean (134 files).

No production code was touched in this remediation — Claim B (login guard precedes
`authenticate()`) and the rest of the implementation were already independently verified correct
by `sdd-verify`; only the missing test coverage needed closing.

---

## Batch 1 (original apply)

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1-1.4 | `GlobalExceptionHandlerInvalidRoleTest.java` (new) | Unit | ✅ 4/4 (`GlobalExceptionHandlerStalePrincipalTest` + `...AppointmentSlotTest`) | ✅ Written — compile failure (type doesn't exist) | ✅ Passed (5/5 after impl) | ➖ Single scenario per design.md Testing Strategy | ➖ None needed — mirrors existing `handleStalePrincipal` byte-for-byte |
| 2.1 | `DaoAuthenticationProviderWrappingCharacterizationTest.java` (new) | Unit (real `DaoAuthenticationProvider`, no mocks) | N/A (new file) | ➖ EXEMPT per design.md Implementation Order step 2 — characterization test | ✅ Passed on first run (settles Claim A: wraps into `InternalAuthenticationServiceException` extends `AuthenticationServiceException`) | ➖ Single — characterization, not behavior-under-test | ➖ None needed |
| 3.1-3.4 | `JwtAuthenticationFilterTest.java` (existing file, 2 new tests) | Unit (Mockito) | ✅ 11/11 pre-existing filter tests | ✅ Written — failed on `verify(jwtService, never()).isTokenValid(...)` (guard absent, `isTokenValid` was invoked) | ✅ Passed (13/13 after impl) | ✅ 2 cases (header source + cookie source) | ➖ None needed — mirrors sibling `UsernameNotFoundException` catch exactly |
| 4.1-4.3 | `AuthenticationServiceLoginRaceTest.java` (existing file, 1 new test) | Unit (Mockito) | ✅ 1/1 pre-existing race test | ✅ Written — failed with `NullPointerException` at `AuthenticationService.java:162` (`user.getRole().name()`), exactly the NPE Claim B predicted | ✅ Passed (2/2 after impl); absent-row race test (A3) confirmed still green | ➖ Single scenario (null-role); absent-row triangulation already covered by the pre-existing race test | ➖ None needed |
| 5.1-5.3 | `AppointmentServiceImplTest.java` (existing file, 1 new test) | Unit (Mockito) | ✅ 8/8 pre-existing service tests | ✅ Written — failed ("Expected InvalidPrincipalRoleException to be thrown, but nothing was thrown") | ✅ Passed (9/9 after impl); ADMIN-path test confirmed still green | ➖ Single scenario per design.md Testing Strategy | ➖ None needed — minimal `else if`/`else` restructure |
| 6.1-6.3 | N/A — no RED possible (Flyway prod-only, design.md explicit) | Entity annotation + SQL migration | ✅ Full `mvn test` regression before change: 254/254 (post Phases 1-5) | ➖ N/A (documented design exception) | ✅ Full `mvn test` regression after change: 254/254 | ➖ N/A | ➖ N/A |

### Test Summary
- **Total new tests written**: 7 (1 handler, 1 characterization, 2 filter, 1 login-guard, 1
  dispatch-guard) — one additional integration test was written, discovered to structurally
  conflict with Phase 6, and reverted (see Deviations below); it is not counted as a final
  test.
- **Total tests passing (full suite)**: 254/254, 0 failures, 0 errors.
- **Layers used**: Unit (7 new: 6 Mockito-based + 1 real-object characterization test).
- **Approval tests** (refactoring): None — no refactoring tasks in this change (all new
  behavior per design.md).
- **Pure functions created**: 0 — all changes are guard clauses / dispatch branches inside
  existing Spring-managed methods, consistent with existing project style (no extraction to
  pure functions was applicable or requested by design.md).

## Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `mvn -o clean test -Dtest=GlobalExceptionHandlerInvalidRoleTest,DaoAuthenticationProviderWrappingCharacterizationTest,JwtAuthenticationFilterTest,AuthenticationServiceLoginRaceTest,AppointmentServiceImplTest` (run in stages per-phase during TDD cycles, all green; also re-verified together) |
| Runtime harness command/scenario and exact result | `mvn -o clean test` (full regression, H2, no Flyway) — 254/254 passing, 0 failures, 0 errors, run twice (post-Phase-5 and post-Phase-6) |
| Rollback boundary | Commit 1 (Phases 1-5, app code): clean `git revert` removes all 5 production files' changes plus their 6 test-file changes, no schema state involved. Commit 2 (Phase 6, migration): independently revertible **pre-merge only** — post-merge rollback of an applied `NOT NULL` constraint needs a compensating `V3__relax_user_role_not_null.sql` (not created, out of scope, documented in design.md Migration/Rollout) |

## Deviation from Design/Tasks (documented per phase-common rules)

**Task 3.4's integration-level "permitAll route not blocked" assertion was attempted, then
reverted, due to a real cross-phase conflict discovered mid-apply:**

1. I initially added a `MockMvc` integration test to the existing
   `StalePrincipalEntryPointIntegrationTest.java` (mirroring its existing
   `staleAuthTokenHeaderOnLoginRecoveryPathIsNotBlocked_...` pattern), which persisted a real
   `com.dh.dentalClinicMVC.entity.User` row with `role = null` via `IUserRepository`, then
   signed a JWT for it and asserted `POST /auth/login` still returns 200 for a different,
   role-valid identity's login.
2. This test passed at the time it was written (end of Phase 3, before Phase 6 existed).
3. When Phase 6 added `@Column(nullable = false)` to `User.role`, the full-suite regression
   run failed: H2 (`ddl-auto=create-drop`) generates schema directly from JPA annotations
   (unlike MySQL prod, which relies on Flyway), so persisting a null-role row now throws
   `DataIntegrityViolationException` — the fixture itself became impossible to construct.
4. **Resolution**: reverted the added integration test and its helper method entirely (file
   is now byte-identical to its pre-apply state, confirmed via `git diff --stat` showing no
   output). The requirement is satisfied at the unit level instead: the two Phase-3 unit
   tests (`nullRoleUserViaHeaderIsCaughtAndChainContinuesUnauthenticated`,
   `...ViaCookie...`) already assert `filterChain.doFilter` is unconditionally invoked and no
   response is written for a null-role principal. The filter has zero route-awareness — this
   generalizes to any route, including `permitAll` ones — exactly mirroring how the
   pre-existing sibling `UsernameNotFoundException` case (`deadUsersRowJwtViaHeader/Cookie...`)
   is also only unit-tested, with no dedicated integration counterpart for its own
   login-recovery-path scenario in this codebase.
5. This is a genuinely new interaction neither design.md nor tasks.md anticipated: design.md's
   "zero fixture fallout" claim (Migration/Rollout section) was scoped to the 8 *pre-existing*
   user-persisting test files it audited — it could not have anticipated a *new* fixture added
   during this same apply batch that intentionally persists a null-role row. No design.md
   claim is falsified by this; it is a new fact surfaced by the strict phase ordering
   (Phase 3 before Phase 6) that the design's Implementation Order itself specifies.

No other deviations. All 5 production files and the SQL migration use the exact code from
tasks.md's embedded snippets, verbatim.

## Files Changed

### Commit 1 (Phases 1-5, app code — orchestrator to stage/commit together)

| File | Action | What Was Done |
|------|--------|----------------|
| `backend/src/main/java/com/dh/dentalClinicMVC/exception/InvalidPrincipalRoleException.java` | Created | Marker unchecked exception (~8 lines), exact tasks.md snippet |
| `backend/src/main/java/com/dh/dentalClinicMVC/exception/GlobalExceptionHandler.java` | Modified | New `@ExceptionHandler(InvalidPrincipalRoleException.class)` → 401, byte-identical body to `handleStalePrincipal` |
| `backend/src/main/java/com/dh/dentalClinicMVC/configuration/JwtAuthenticationFilter.java` | Modified | Guard `if (userDetails instanceof User user && user.getRole() == null) throw ...` inserted after `loadUserByUsername()` (before `isTokenValid`); new `catch (InvalidPrincipalRoleException ex)` clause (log-only, mirrors `UsernameNotFoundException` catch) |
| `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationService.java` | Modified | Pre-`authenticate()` guard as first statement of `login()`: `findByEmail(...).ifPresent(candidate -> { if (null role) throw ... })`; absent row falls through untouched (A3) |
| `backend/src/main/java/com/dh/dentalClinicMVC/service/impl/AppointmentServiceImpl.java` | Modified | Terminal `else` → `else if (role == Role.ADMIN) { findAll() } else { throw InvalidPrincipalRoleException }`; PATIENT/DENTIST branches untouched |
| `backend/src/test/java/com/dh/dentalClinicMVC/exception/GlobalExceptionHandlerInvalidRoleTest.java` | Created | New test file, 1 test |
| `backend/src/test/java/com/dh/dentalClinicMVC/authentication/DaoAuthenticationProviderWrappingCharacterizationTest.java` | Created | New test file, 1 characterization test |
| `backend/src/test/java/com/dh/dentalClinicMVC/configuration/JwtAuthenticationFilterTest.java` | Modified | Added import + 2 new tests (header/cookie null-role variants) |
| `backend/src/test/java/com/dh/dentalClinicMVC/authentication/AuthenticationServiceLoginRaceTest.java` | Modified | Added imports + 1 new test (`login_whenUserHasNullRole_...`) |
| `backend/src/test/java/com/dh/dentalClinicMVC/service/impl/AppointmentServiceImplTest.java` | Modified | Added import + 1 new test (`findAllForCurrentUser_throwsInvalidPrincipalRoleWhenRoleIsNull`) |

### Commit 2 (Phase 6, migration — FINAL, ISOLATED, orchestrator to commit separately)

| File | Action | What Was Done |
|------|--------|----------------|
| `backend/src/main/java/com/dh/dentalClinicMVC/entity/User.java` | Modified | Added `@Column(nullable = false)` to the `role` field |
| `backend/src/main/resources/db/migration/V2__enforce_user_role_not_null.sql` | Created | Backfill (`UPDATE ... SET role='PATIENT' WHERE role IS NULL`) then `ALTER TABLE ... MODIFY COLUMN role ENUM(...) NOT NULL` |

**Untouched, per hard constraints**: `openspec/changes/appointment-role-null-hardening/tasks.md`
and `apply-progress.md` (tracking files, edited but not part of either app commit),
`StalePrincipalException`, `ApplicationConfig.userDetailsService()`, any other
`AppointmentServiceImpl` method, all frontend files.

## Remaining Tasks
- [ ] 6.4 Manual MySQL staging migration run — requires human/CI staging access, not
  performable by this agent. **Must happen before merge to main.**
- [ ] 6.5 Commit boundary — orchestrator action (stage/commit the two file groups above
  separately, per hard constraints).

## Status
19/20 tasks complete (all implementable code/test work done and green). Ready for
`sdd-verify` on the code side; task 6.4 remains a manual pre-merge gate for the
user/orchestrator, not a blocker for verify.
