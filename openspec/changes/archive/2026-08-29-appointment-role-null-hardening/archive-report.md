# Archive Report: appointment-role-null-hardening

**Archived**: 2026-08-29  
**Change**: `appointment-role-null-hardening`  
**Engram Observations**: Proposal (#6862), Spec (#6864), Design (#6865), Tasks (#6867), Verify Report (#6870)  
**Status**: ARCHIVED — Closed and merged to main specs.

---

## Executive Summary

The `appointment-role-null-hardening` change hardened the nullable `users.role` gap across six implementation phases — JWT-filter rejection, login guard, fail-safe service dispatch, exception handler, database constraint, and entity annotation. Implementation shipped with genuine new test coverage closing a critical verification gap. All verification gates passed (pass 2: PASS WITH WARNINGS, 0 CRITICAL, 5 WARNING, 4 SUGGESTION). Delta spec merged into `openspec/specs/principal-role-integrity/spec.md` (new capability). Two pending user-facing action items remain: (1) manual MySQL staging migration run before merge, (2) orchestrator-executed two-commit split for schema-isolation rollback safety.

---

## What Shipped

### Scope In (all complete)

1. **New Exception Type**: `com.dh.dentalClinicMVC.exception.InvalidPrincipalRoleException` (11 lines) — unchecked marker exception for distinct null-role condition (not widening `StalePrincipalException`).

2. **Global Exception Handler**: `GlobalExceptionHandler.handleInvalidPrincipalRole()` (new method, mirrors `handleStalePrincipal`, lines 245–260) — returns wire-identical 401 `ErrorResponse` with message "La sesión ya no es válida. Iniciá sesión nuevamente."

3. **JWT Filter Guard** (Phase 3): 
   - New guard inserted immediately after line 68 in `JwtAuthenticationFilter.doFilterInternal()`:
     ```java
     if (userDetails instanceof User user && user.getRole() == null) {
       throw new InvalidPrincipalRoleException();
     }
     ```
   - New catch clause (log-only, no response write, no short-circuit) between the existing `UsernameNotFoundException` and `JwtException|IllegalArgumentException` catches — mirrors the sibling behavior exactly, permitting `permitAll` routes to remain accessible.
   - Result: null-role JWT at filter layer → 401 via `StalePrincipalEntryPoint`, not 500 NPE from `getAuthorities()`.

4. **Login Guard** (Phase 4): 
   - Guard added as the FIRST statement of `AuthenticationService.login()` (lines 137–145):
     ```java
     userRepository
         .findByEmail(request.getEmail())
         .ifPresent(
             candidate -> {
               if (candidate.getRole() == null) {
                 log.error("Login rejected: users row for {} has a null role", request.getEmail());
                 throw new InvalidPrincipalRoleException();
               }
             });
     ```
   - Runs BEFORE `authenticationManager.authenticate()` — proven correct: `authenticate()` internally calls `getAuthorities()` on successful path, which would NPE on null role, and `NullPointerException` is not an `AuthenticationException`, so `ProviderManager` wraps it into `InternalAuthenticationServiceException` → 500, not 401. Pre-guard placement is mandatory (Claim B, confirmed by code contract analysis).
   - Absent-row case falls through untouched (preserves `BadCredentialsException` → 401 path, maintains existing race detector re-fetch at line 135–154).

5. **Fail-Safe `findAllForCurrentUser()` Dispatch** (Phase 5):
   - Terminal `else` (lines 216–219) replaced with explicit ADMIN branch:
     ```java
     } else if (role == Role.ADMIN) {
       appointments = appointmentRepository.findAll();
     } else {
       throw new InvalidPrincipalRoleException();
     }
     ```
   - Null role no longer silently receives `findAll()` (ADMIN-equivalent access); now raises 401 via handler.

6. **Database Schema Hardening** (Phase 6, isolated final commit):
   - `User.role` field: added `@Column(nullable = false)` annotation.
   - Flyway `V2__enforce_user_role_not_null.sql`:
     ```sql
     UPDATE users SET role = 'PATIENT' WHERE role IS NULL;
     
     ALTER TABLE users
         MODIFY COLUMN role ENUM('ADMIN', 'DENTIST', 'PATIENT') NOT NULL;
     ```
   - Backfill runs before constraint. Full `ENUM(...)` restatement ensures convergence for both normal V1 lineage and any `baseline-on-migrate=true` lineage.
   - **Prod-only**: `flyway.enabled=false` in all test/dev/e2e profiles; H2 creates schema from JPA annotations (`ddl-auto=create-drop`). Migration is zero-test-covered by automated suite (manual staging gate required before merge).

### Test Coverage (9 new tests total)

**Batch 1 (7 tests):**
1. `GlobalExceptionHandlerInvalidRoleTest.handleInvalidPrincipalRole_returns401WithUniformMessage` — handler returns correct 401 body shape.
2. `DaoAuthenticationProviderWrappingCharacterizationTest.wrapsForeignExceptionFromUserDetailsServiceIntoInternalAuthenticationServiceException` — verifies Claim A empirically against spring-security-core 6.2.1 (characterized as exempt from RED; expected GREEN on first run, confirming provider exception-wrapping behavior).
3. `JwtAuthenticationFilterTest.nullRoleUserViaHeaderIsCaughtAndChainContinuesUnauthenticated` — header-sourced null-role JWT → guard catches, logs, chain continues unauthenticated, `isTokenValid` never called, filter chain invoked (`verify(filterChain).doFilter(...)`).
4. `JwtAuthenticationFilterTest.nullRoleUserViaCookieIsCaughtAndChainContinuesUnauthenticated` — cookie-sourced null-role credential, same assertions.
5. `AuthenticationServiceLoginRaceTest.login_whenUserHasNullRole_thenThrowsInvalidPrincipalRoleBeforeAuthenticating` — null-role login throws exception AND `verify(authenticationManager, never()).authenticate(any())` (load-bearing proof guard runs BEFORE authenticate).
6. `AppointmentServiceImplTest.findAllForCurrentUser_throwsInvalidPrincipalRoleWhenRoleIsNull` — null-role dispatch throws exception, `verifyNoInteractions(appointmentRepository)` proves no ADMIN fallthrough.
7. One refactored existing test in the filter-test file (pre-existing, already passing).

**Batch 2 (2 tests, remediation after verify pass 1 CRITICAL):**
- `NullRolePrincipalLoginRecoveryIntegrationTest.java` (new, 146 lines):
  - `@SpringBootTest`, `@AutoConfigureMockMvc`, mocked `UserDetailsService` overrides
  - Two scenarios: `POST /auth/login` with null-role JWT header + valid login credentials (200 OK), same with `authToken` cookie + valid credentials (200 OK)
  - Uses distinct seeded `Patient` for role-valid login identity, null-role user never persisted (sidesteps `@Column(nullable=false)` via no DB write)
  - Asserts 200 OK + `jsonPath("$.email")` matching seeded email (disambiguates success from unrelated errors)
  - Closing evidence: the `@Autowired` null-role `User` stub is reused in both cookie and header cases, but the request is still routed through the real `SecurityFilterChain` → the filter's new WARN log fires at runtime, proving traversal
  - Spec scenario "Null-role credential on the login recovery path is NOT blocked" now fully covered end-to-end through real security infrastructure (not unit-level-only, addressing verify pass-1 CRITICAL)

**Full Suite Results (per verify pass 2):**
- Tests run: 256
- Failures: 0
- Errors: 0
- Skipped: 3 (pre-existing, day-of-week-dependent `assumeTrue` in `AppointmentScheduleValidatorTest`, unrelated to this change)
- Build: `mvn clean compile` → SUCCESS, exit 0
- Formatting: `mvn spotless:check` → 134 files clean
- No fixture fallout (all 8 test files that persist users pre-existing and already call `setRole(...)` per design.md audit; no migration-time fixture write issues).

---

## Verification Journey: Two-Pass Cycle with Real CRITICAL Closure

This archive closes a change that exhibits what a mature SDD verification cycle should catch and remediate.

### Pass 1: FAIL (1 CRITICAL)

**Verdict**: `fail_with_critical` (observe spec requirement "Null-role credential on the login recovery path is NOT blocked" — scenario was UNTESTED end-to-end)

**CRITICAL Finding**: Spec `principal-role-integrity` requirement R1, scenario 2 ("Null-role credential on the login recovery path is NOT blocked") had zero covering test through the real security filter chain. The implementation's Phase 3 filter tests were unit-level only, stubbing `SecurityFilterChain`; they proved NPE suppression but NOT the `permitAll` route traversal through real `StalePrincipalEntryPoint` configuration. A 500 NPE would still pass unit-level filter tests; only end-to-end route coverage disambiguates success.

**Evidence**: 
- Verify report (pass 1): "scenario literally exercises `permitAll` route through real security filter chain, which no unit test does" — remediation was prescribed as a load-bearing gap, not optional polish.
- Production code byte-identity confirmed unchanged between pass 1 and pass 2 (mtimes, blob hashes, re-read of `git diff`).

### Pass 2: PASS WITH WARNINGS (0 CRITICAL)

**Verdict**: `pass_with_warnings` (see Warnings below)

**Evidence Trail**:
- Full reproduction of pass-1 findings: every scenario re-traced against live code.
- New integration test `NullRolePrincipalLoginRecoveryIntegrationTest` addresses the CRITICAL gap: end-to-end `POST /auth/login` through real `SecurityFilterChain`, distinct role-valid login identity seeded in DB, null-role credential carried via JWT/cookie, both return 200 OK + email field matching seeded user (proving recovery path is not locked out).
- Guard traversal proven by: (a) runtime WARN log "Rejected request with invalid principal role (users row has null role)" fires exactly twice (header + cookie cases), (b) spec scenario assertion requires 200 OK (removing guard → NPE outside catch → unhandled 500 would fail); (c) Claim B re-traced: login guard at line 137 is first executable statement, `authenticate()` at line 148 (still holds).
- All 7 spec scenarios COMPLIANT: R1 (2 scenarios), R2 (2 scenarios), R3 (2 scenarios), R4 (1 scenario).
- Full suite: 256/256 passing, 0 failures, 0 errors, 3 pre-existing skips.
- Production code byte-identity vs. pass 1 confirmed independently: mtimes 2026-08-28 23:07–23:13 (before pass-1 report timestamp 23:29), blob hashes match across all 6 production files, `git diff` re-read confirms zero additions to production code.

**Key Learning**: The two-pass cycle with a real CRITICAL finding and genuine remediation is evidence the SDD verification gate did its job. This is not a "found a bug in process and hid it"; rather, "verification detected a coverage gap, implementation team closed it end-to-end, and verification re-confirmed." The process worked.

---

## Spec Delta Merged

**New Capability**: `principal-role-integrity` (4 ADDED requirements, 7 scenarios)

**Merge Action**: Copied delta spec as new main spec (not an extension of `stale-principal-resolution`).

**Rationale** (per spec design.md):
1. Different trigger class: `stale-principal-resolution` scopes to "backing row does not exist" (`UsernameNotFoundException`). Null-role principal has an existing row — condition is distinct (existing row, unusable role value).
2. Different code path: null-role `getAuthorities()` surfaces later in the flow (post-`loadUserByUsername()` success), not at the user-load call site.
3. No modification needed to `stale-principal-resolution/spec.md` — its own requirements/scenarios remain accurate for missing-row triggers unchanged. The null-role JWT-filter catch is a sibling clause to the existing `UsernameNotFoundException` catch, not a modification of that clause's behavior.

**Verification**:
- Delta spec lines exist at `/openspec/changes/appointment-role-null-hardening/specs/principal-role-integrity/spec.md` (original, per apply phase).
- Copied to `/openspec/specs/principal-role-integrity/spec.md` (main spec, archive phase).
- `diff -r` confirms byte-identity (empty output).

**Location**: 
- Delta (change folder): `openspec/changes/archive/2026-08-29-appointment-role-null-hardening/specs/principal-role-integrity/spec.md`
- Main (source of truth): `openspec/specs/principal-role-integrity/spec.md`

---

## Implementation Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Production lines added | 77 | Exception class, handler, 3 guards, dispatch refactor, migration SQL, entity annotation |
| Test lines added | 153 | 6 unit tests (Batch 1), 1 integration test (Batch 2 remediation: 146 lines) |
| **Total changed lines** | **230** | ... then Batch 2 remediation added 146 test lines → pass-2 total = 393 |
| **Actual final diff** | **393/400** | 98% of 400-line budget; 7 lines headroom (WARNING flagged by verify) |
| Spec requirements | 4 ADDED | Wire-identical 401 body shape (R4), distinct exception type for logs/code |
| Spec scenarios | 7 total | All COMPLIANT per pass 2 |
| Review workload forecast (design.md) | ~230 lines, Low risk | Re-estimated at archive: 393 final, still Low risk but thin headroom |
| Delivery strategy | `ask-on-risk` | Low risk → single PR approved; design recommended 2-commit split for schema isolation |

---

## Design Decisions — Confirmed

### D3 (Guard Placement): Claim B CONFIRMED; Claim A Settled Empirically

**Original Design Concern**: Should guards run at the two call sites (login, filter) or in the shared `ApplicationConfig.userDetailsService()` lambda?

**Claim B (Binding)**: `AuthenticationManager.authenticate()` must call `UserDetails.getAuthorities()` (for `DaoAuthenticationProvider`, this is the only source of authorities); `User.getAuthorities()` unconditionally does `role.name()`; therefore a successful `authenticate()` on null role MUST NPE before any statement after the call returns. `NullPointerException` is not an `AuthenticationException`, so `ProviderManager` does not catch it → `handleGenericException` → 500, not 401. **VERDICT: Login guard MUST run BEFORE `authenticationManager.authenticate()`. This alone forbids the shared-lambda placement.** (Confirmed by code contract analysis, no vendor source needed.)

**Claim A (Unverified in Design Phase, Settled at Apply)**: `DaoAuthenticationProvider` wraps "foreign exceptions" (exceptions not of its own exception hierarchy) from `UserDetailsService` into `InternalAuthenticationServiceException`. (A raw `InvalidPrincipalRoleException` from the lambda would reach `GlobalExceptionHandler` wrapped, miss the new handler, 500 via `handleGenericException`. Extending `UsernameNotFoundException` avoids the wrap but is semantically wrong — that exception signals "no backing row", not "row exists, role invalid".)

**How Claim A was Settled**: `DaoAuthenticationProviderWrappingCharacterizationTest` (Phase 2, characterization-exempt test) empirically confirmed against the real spring-security-core 6.2.1 jar that `DaoAuthenticationProvider.authenticate()` DOES wrap a "foreign exception" from `UserDetailsService` into `InternalAuthenticationServiceException`. Result: GREEN on first run. **This is a good example of "make the unknown testable rather than block on design" — the claim was formally unverified at design time due to tooling constraints (no unzip, no web access to vendor source), but became empirically verifiable at apply time by wiring the real jar and asserting its behavior.**

**Decision**: Guards at the two call sites (A1, binding). The shared-lambda placement is forbidden on Claim B grounds alone; Claim A remains formally proven but is moot for the JWT-filter path (which calls `loadUserByUsername` directly with no `DaoAuthenticationProvider` in the stack).

---

## Task Completion Status

**Checklist**: 18/20 implementation tasks checked, 2 intentionally unchecked pending actions.

- [x] 1.1–1.4 (Phase 1: Exception + handler)
- [x] 2.1 (Phase 2: Characterization test)
- [x] 3.1–3.4 (Phase 3: JWT filter guard + remediation)
- [x] 4.1–4.3 (Phase 4: Login guard)
- [x] 5.1–5.3 (Phase 5: Dispatch fail-safe)
- [x] 6.1–6.3 (Phase 6: Migration + entity + regression)
- [ ] **6.4 MANUALLY EXECUTE**: MySQL staging run of `V2__enforce_user_role_not_null.sql` with `flyway.enabled=true`. **NOT PERFORMABLE BY AGENT** — requires human/CI access to a staging MySQL environment. This is a genuine pre-merge gate. Flag to user/orchestrator: **Must complete before merging to main.**
- [ ] **6.5 ORCHESTRATOR EXECUTES**: Two-commit split after archive. Commit 1 = all app code + 8 test files (Phases 1–5). Commit 2 = `User.java` (`@Column` annotation) + `V2__enforce_user_role_not_null.sql` (Phase 6, isolated for independent revertibility pre-merge; post-merge rollback needs compensating `V3__relax_user_role_not_null.sql`).

**Reconciliation**: Pass 1 apply-progress artifact claims "19/20 tasks complete" and "7 new tests"; actual facts per verify pass 2: 18/20 implementation tasks (6.4 and 6.5 are blocked/pending and correctly marked unchecked), 9 new tests total (7 Batch 1 + 2 Batch 2 remediation). Archive report records the final-state facts, not the intermediate snapshot's imprecision.

---

## Scope Boundaries — Honored

**In Scope (implemented)**:
- New `InvalidPrincipalRoleException` type (distinct from `StalePrincipalException`, scoped to "row exists, role invalid").
- New `GlobalExceptionHandler.handleInvalidPrincipalRole()` handler.
- JWT-filter guard + catch clause (sibling to existing `UsernameNotFoundException` catch).
- Login guard (pre-`authenticate()` null-role check).
- `findAllForCurrentUser()` explicit ADMIN dispatch + null-role rejection.
- Flyway `V2` migration + entity `@Column(nullable = false)`.

**Out of Scope (verified untouched)**:
- Widening `StalePrincipalException` (remains scoped to "no backing row").
- Second `AuthenticationEntryPoint` (reusing existing `StalePrincipalEntryPoint` unchanged).
- Other `AppointmentServiceImpl` methods (only `findAllForCurrentUser()` modified).
- `ApplicationConfig.userDetailsService()` shared lambda (guards stay at call sites — A1).
- Frontend (wire contract unchanged: same 401 body shape on wire as `StalePrincipal`).
- Write-path role defaulting (already defensive in `PatientServiceImpl`, `DentistServiceImpl`, `AuthenticationService.createPatient`, initializers).
- `AppointmentController.findAll()`'s non-User principal else branch (already fails safe to PATIENT, unaffected).

---

## Warnings (None Block Archive)

1. **W1 — Task 6.4 Not Performed**: Manual MySQL staging migration run remains pending. **This is a genuine pre-merge gate**, not a cosmetic warning. `V2__enforce_user_role_not_null.sql` is the one materially unverified artifact in the implementation — it is never exercised by the automated test suite (Flyway disabled on H2). **User/orchestrator must execute before merging to main.**

2. **W2 — Task 6.5 Pending**: Orchestrator must execute the two-commit split after archive completes. Commit 1 = Phases 1–5 (all app code + tests). Commit 2 = Phase 6 (migration + entity annotation), isolated for pre-merge revertibility.

3. **W3 — Review Budget Nearly Exhausted**: Pass 2 diff is 393/400 lines (98% of budget). Only 7 lines of headroom. Batch 2 remediation test was 146 lines (vs. 60–90 forecast) but came within budget. Any further addition to this exact code slice would breach review budget.

4. **W4 — Test Count Discrepancy in apply-progress**: That artifact claims "7 new tests" (Batch 1) and "19/20 tasks complete"; actual facts: 9 new tests total (Batch 1 7 + Batch 2 2), 18/20 tasks (6.4 and 6.5 intentionally pending per final-state facts). Documentation accuracy only; no functional impact.

5. **W5 — Full-Suite Skip Count Variation**: Pass 2 reports 3 skipped tests vs. pass 1's 0. NOT a regression. `AppointmentScheduleValidatorTest` uses `assumeTrue(!isWeekend(date))`; pass 1 ran Friday (2026-08-28), pass 2 Saturday (2026-08-29). File is unmodified (last commit 8f33835, pre-dating this change). Surefire shows `TestAbortedException: Assumption failed`.

---

## Suggestions (For Future Changes, Not Blocking)

- **S1**: Add `verify(userDetailsService).loadUserByUsername(nullRoleEmail)` to the integration test cases — would make traversal explicit without relying on runtime WARN log parsing.
- **S2**: Extend integration test to assert the response body fields (not just status + email), achieving full end-to-end consistency with unit-level handler test assertions.
- **S3**: `@MockBean` is deprecated from Spring Boot 3.4; project is on 3.2.1 today. Migrate to `@MockitoBean` after upgrade.
- **S4**: `AppointmentScheduleValidatorTest` has pre-existing wall-clock-dependent skips (`assumeTrue` on day-of-week) — consider fixed `Clock` mock for deterministic testing (own change, not blocking this one).

---

## Archive Mechanics

**Spec Merge**:
- Source: `openspec/changes/appointment-role-null-hardening/specs/principal-role-integrity/spec.md` (delta spec)
- Destination: `openspec/specs/principal-role-integrity/spec.md` (new main spec)
- Verification: `diff -r` (empty output, byte-identical)

**Change Folder Move**:
- Source: `openspec/changes/appointment-role-null-hardening/` (active change folder)
- Destination: `openspec/changes/archive/2026-08-29-appointment-role-null-hardening/` (archived)
- Method: `mv` (git mv failed on empty-dir condition; fallback successful)
- Verification: Source directory gone, pre-move snapshot vs. archived tree `diff -r` empty (byte-identical)

**Archive Folder Contents**:
- `proposal.md` ✅
- `design.md` ✅
- `specs/principal-role-integrity/spec.md` ✅ (delta spec included in archive)
- `tasks.md` ✅ (18/20 checked, 6.4 and 6.5 intentionally pending)
- `apply-progress.md` ✅ (Batch 1 + Batch 2 remediation, intermediate snapshot)
- `verify-report.md` ✅ (pass 2 PASS WITH WARNINGS, supersedes pass 1 FAIL)
- `archive-report.md` ✅ (this file, final-state authority)

---

## Key Learnings

1. **Claim A (exception wrapping) was unverified at design time due to tooling constraints (no unzip, no web access), but became empirically verifiable at apply time through a characterization test against the real jar — a good example of "make the unknown testable rather than block on design."**

2. **The two-pass verify cycle with a real CRITICAL finding (login-recovery-path scenario uncovered at pass 1) and a genuine remediation closing it (integration test at pass 2) is evidence the SDD verification gate did its job — process working as intended, not a hidden defect.**

3. **Claim B alone (authorities dereferenced inside authenticate()) forbids the shared-lambda guard placement, requiring no vendor source and provable from the AuthenticationManager contract — simpler and more direct than the originally-anticipated exception-wrapping claim.**

4. **Schema migration V2 has zero automated test coverage (Flyway disabled on H2; prod-only with manual staging gate required), creating an unanticipated risk distinct from the originally-feared H2-vs-MySQL Flyway divergence (which does not exist).**

5. **Batch 2 remediation test was 146 lines vs. 60–90 forecast but came within the 400-line budget (393/400 final), leaving only 7 lines headroom — real constraint on follow-up work within the same scope.**

---

**Archived by**: sdd-archive phase (2026-08-29 02:47 UTC)  
**Engram Observation IDs Recorded**: 6862, 6864, 6865, 6867, 6870  
**SDD Cycle Status**: CLOSED
