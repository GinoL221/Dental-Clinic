```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:760fa18b1e3b358a9d8638bfa002debbd4b751877c1c6dfb0cc301afaaceb46c
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 4/4
scenarios: 7/7
test_command: mvn -o clean test
test_exit_code: 0
test_output_hash: sha256:4befc79912513ec1784653de56ae1cc1805088361ec22325d0fa61fe3987bd98
build_command: mvn -o clean compile
build_exit_code: 0
build_output_hash: sha256:7bb587ea1830d3ca9313793a74d84234959fd5e4c49f7619f76cc4f7640b1b3b
```

## Verification Report

**Change**: appointment-role-null-hardening
**Version**: N/A (new capability spec `principal-role-integrity`)
**Mode**: Strict TDD
**Pass**: RE-VERIFY (pass 2) — supersedes the prior FAIL
**Verified from**: working tree (uncommitted), `backend/` module
**Verified on**: 2026-08-29

### Prior Pass — What Failed and What Changed

Pass 1 (same file, Engram id #6870) returned **FAIL** with exactly one CRITICAL finding:
spec `principal-role-integrity` Requirement *"JWT-Filter Layer Rejects a Null-Role Principal
as 401"*, Scenario *"Null-role credential on the login recovery path is NOT blocked"* had
**zero covering test**. The original apply batch justified task 3.4 at the unit level only,
which proves the filter does not short-circuit in isolation but never drives a null-role
credential through the real `SecurityFilterChain` onto the `permitAll` `POST /auth/login`
route. Everything else in pass 1 passed independent scrutiny.

Batch 2 (remediation) added a **test-only** file and touched no production code:
`backend/src/test/java/com/dh/dentalClinicMVC/security/NullRolePrincipalLoginRecoveryIntegrationTest.java`.

**This pass independently re-checked every pass-1 finding rather than inheriting it.**
The gap is closed. This report records `pass_with_warnings`.

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 20 |
| Tasks complete | 18 |
| Tasks incomplete | 2 (6.4 manual MySQL staging run; 6.5 commit boundary) |

Both incomplete items are explicitly designated non-agent work: 6.4 requires human/CI staging
MySQL access; 6.5 is an orchestrator commit action that by definition occurs *after*
verification. Verification proceeded rather than returning `blocked`, because blocking on a
task whose execution is ordered after this phase would deadlock the pipeline. Neither is a
code defect. See W1/W2.

### Build & Tests Execution

**Build**: PASSED
```text
$ cd backend && mvn -o clean compile
[INFO] BUILD SUCCESS — exit 0
sha256(stdout+stderr) = 7bb587ea1830d3ca9313793a74d84234959fd5e4c49f7619f76cc4f7640b1b3b
```

**Tests (full suite, independently re-run by this phase)**: PASSED
```text
$ cd backend && mvn -o clean test
[WARNING] Tests run: 256, Failures: 0, Errors: 0, Skipped: 3
[INFO] BUILD SUCCESS — exit 0
sha256(stdout+stderr) = 4befc79912513ec1784653de56ae1cc1805088361ec22325d0fa61fe3987bd98
```

The orchestrator-reported 256/256 is **confirmed** on totals (256 run, 0 failures, 0 errors),
with one correction: the run reports **3 skipped**, not 0. Cause independently established —
see W5. The skips are in `AppointmentScheduleValidatorTest`, a file untouched by this change.

**Focused re-run of the remediation test (isolated)**: PASSED
```text
$ cd backend && mvn -o test -Dtest=NullRolePrincipalLoginRecoveryIntegrationTest \
    -DfailIfNoSpecifiedTests=false
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```
Runtime log captured during that run, twice (once per test case):
```text
WARN c.d.d.c.JwtAuthenticationFilter : Rejected request with invalid principal role (users row has null role)
```
This is load-bearing evidence: that WARN exists at exactly one site in the codebase
(`JwtAuthenticationFilter.java:112`), so its emission proves the new null-role guard was
actually traversed on both the header and the cookie request — while the same request still
returned `200 OK`. Path traversal and non-lockout are therefore both proven, not assumed.

**Formatter**: Spotless `check` — 134 files clean, 0 need changes, BUILD SUCCESS.

**Coverage**: Not available — no JaCoCo or equivalent plugin in `backend/pom.xml`. Skipped,
not a failure.

### Remediation Test — Adequacy Review (the pass-1 CRITICAL)

Read in full and checked against the scenario's own wording, clause by clause:

| Scenario clause | Satisfied by | Verdict |
|---|---|---|
| "a request carrying a JWT **or** `authToken` cookie" | Two cases: `...HeaderOnLoginRecoveryPath...` uses `.header("Authorization", "Bearer " + nullRoleToken)`; `...CookieOnLoginRecoveryPath...` uses `.cookie(new Cookie("authToken", nullRoleToken))` | Both sources covered |
| "whose principal has a `null` role" | `@MockBean UserDetailsService` stubbed to return `User.builder()....role(null).build()` for the token's subject; matches the production guard's exact `userDetails instanceof User user && user.getRole() == null` shape | Yes |
| "a real seeded user's VALID email+password for a **different**, role-valid identity" | `seedLoginablePatient(...)` persists a real `Patient` via `patientRepository.save` with `Role.PATIENT` and a `passwordEncoder.encode`d password; its email differs from the null-role subject email | Yes — genuinely distinct identities |
| "the client invokes `POST /auth/login` (a `permitAll` route)" | Real `MockMvc` `post("/auth/login")` through the full `@SpringBootTest` + `@AutoConfigureMockMvc` security filter chain — **not** a unit-level filter harness | Yes — this is precisely what pass 1 found missing |
| "the filter does NOT short-circuit the request" | Implied by the 200 (a short-circuit would return 401/500) and directly evidenced by the WARN log firing without a written response | Yes |
| "the response is `200 OK`" | `.andExpect(status().isOk())` plus `.andExpect(jsonPath("$.email").value(seededPatient.getEmail()))` | Yes — asserts 200 explicitly, not merely "not 401" |

**Why 200 specifically is required** (checked against the test's own inline rationale and the
spec's reasoning): `/auth/login` is `permitAll`, so the filter's `InvalidPrincipalRoleException`
catch never writes a response there; and a merely-not-401 assertion would be satisfied by a 500
NPE, while a 401 could arise from an unrelated `BadCredentialsException`. Only a 200 carrying
the seeded patient's own email unambiguously proves the request reached **and was successfully
processed by** the login handler. The test's assertion pair matches that reasoning exactly.

The bean-override technique is sound: persisting a null-role `users` row is genuinely
impossible under H2 `ddl-auto=create-drop` once Phase 6 added `@Column(nullable = false)`, and
the stub never writes to the database, so it sidesteps the constraint without weakening it.
The login identity remains a **real** persisted row because `AuthenticationService.login()`
reads it through the real `IUserRepository`, independent of the stubbed `UserDetailsService`.

### Spec Compliance Matrix

Authoritative counts read from `specs/principal-role-integrity/spec.md`: **4 requirements, 7 scenarios**.

| Requirement | Scenario | Covering test (passed at runtime) | Result |
|-------------|----------|------|--------|
| R1 JWT-filter rejects null-role as 401 | Null-role principal on protected route | `JwtAuthenticationFilterTest > nullRoleUserViaHeaderIsCaughtAndChainContinuesUnauthenticated` (:250) + `...ViaCookie...` (:273) for the filter leg; `StalePrincipalEntryPointIntegrationTest > unauthenticatedAccessToProtectedRouteNowReturns401NotFormerly403` (:159) for the entry-point 401 leg | COMPLIANT (composed — see S2) |
| R1 JWT-filter rejects null-role as 401 | **Null-role credential on login recovery path NOT blocked (200 OK)** | `NullRolePrincipalLoginRecoveryIntegrationTest > nullRoleTokenHeaderOnLoginRecoveryPathIsNotBlocked_realSeededUserLogsInSuccessfully` + `...Cookie...` — 2/2 passing, guard traversal confirmed by WARN log | **COMPLIANT (was UNTESTED in pass 1 — gap closed)** |
| R2 Login rejects null-role as 401 | Login for null-role account rejected 401 | `AuthenticationServiceLoginRaceTest > login_whenUserHasNullRole_thenThrowsInvalidPrincipalRoleBeforeAuthenticating` (:63) + `GlobalExceptionHandlerInvalidRoleTest > handleInvalidPrincipalRole_returns401WithUniformMessage` (:19) | COMPLIANT |
| R2 Login rejects null-role as 401 | Role-valid login unaffected (200 OK) | `StalePrincipalEntryPointIntegrationTest > staleAuthTokenHeader/CookieOnLoginRecoveryPathIsNotBlocked_...` (:106, :132), plus both new remediation cases, which each perform a real role-valid 200 login | COMPLIANT (now doubly covered) |
| R3 `findAllForCurrentUser()` explicit ADMIN match | Null-role gets no ADMIN-equivalent access | `AppointmentServiceImplTest > findAllForCurrentUser_throwsInvalidPrincipalRoleWhenRoleIsNull` (:166), asserts the throw **and** `verifyNoInteractions(appointmentRepository)` | COMPLIANT |
| R3 `findAllForCurrentUser()` explicit ADMIN match | ADMIN principal unaffected | `AppointmentServiceImplTest > findAllForCurrentUser_returnsAllAppointmentsForAdmin` (:105) | COMPLIANT |
| R4 Null-role 401 wire-indistinguishable | Body matches stale-principal 401 body shape | `GlobalExceptionHandlerInvalidRoleTest` vs `GlobalExceptionHandlerStalePrincipalTest` — identical `error`/`message`/`status` assertions, differ only in `path`/`timestamp` | COMPLIANT |

**Compliance summary**: **7/7 scenarios compliant, 0 UNTESTED, 0 failing** (pass 1: 6/7, 1 UNTESTED).

### Production Code Unchanged Since Pass 1 — Independently Confirmed

The remediation claims zero production change. Verified three independent ways:

1. **Timestamps.** Every production file's mtime is `2026-08-28 23:07:23`–`23:13:50`. The pass-1
   report was written at `23:29`; the new test file at `23:34`; `tasks.md`/`apply-progress.md` on
   `2026-08-29 13:49`/`13:50`. No production file was touched after pass 1 read it.
2. **Content.** `git diff -- backend/src/main/java/` re-read in full this pass. Every hunk is
   byte-for-byte what pass 1 validated and what `tasks.md`/`design.md` specify verbatim.
3. **Blob hashes** (recorded for future passes):

| File | `git hash-object` |
|---|---|
| `AuthenticationService.java` | `eb454ef0f3f72b8cc8b43693c188b3dfae9c588c` |
| `JwtAuthenticationFilter.java` | `0100547d9b35277e04e5cd2dc042718c2e8bda9c` |
| `User.java` | `a7aa7a5d919deefa49fff611f13b152f0083627b` |
| `GlobalExceptionHandler.java` | `0d5830bcd5636bf2d55790f6649f07d86ff38665` |
| `AppointmentServiceImpl.java` | `f7627b26a2f9ffbff5902a4ee34ecab8179db919` |
| `InvalidPrincipalRoleException.java` | `e0a0aefbc8a51eac3475292e4a4d63505491eccd` |
| `V2__enforce_user_role_not_null.sql` | `751216cf87845571464539c9814f392f6e4a19dd` |

`git status --porcelain` shows exactly the same 5 modified + 2 new production paths as pass 1 —
no additions, no removals.

### Correctness (Static Evidence, re-read from source this pass)

| Requirement | Status | Notes |
|------------|--------|-------|
| `InvalidPrincipalRoleException` created | Implemented | 10 lines, extends `RuntimeException`, matches design Interfaces block verbatim |
| `handleInvalidPrincipalRole` in `GlobalExceptionHandler` | Implemented | Body construction line-for-line identical to `handleStalePrincipal` (:231-244); satisfies A5 |
| Filter guard placement | Implemented | `JwtAuthenticationFilter.java:75`, immediately after `loadUserByUsername()` (:70) and **before** `isTokenValid()` (:80). Java 21 `instanceof` pattern per A6 |
| Filter new catch clause | Implemented | `:109`, positioned between the `UsernameNotFoundException` catch (:97) and the `JwtException` catch (:114). Log-only; writes no response; does not short-circuit |
| Filter fall-through is unconditional | Verified | `filterChain.doFilter(request, response)` at `:123` sits **outside** the try/catch, so no catch clause can structurally short-circuit the chain |
| Login guard placement (Claim B) | Implemented | Re-traced this pass — see below |
| Absent-row falls through (A3) | Implemented | `.ifPresent(...)` — `Optional.empty()` is a no-op, so a missing row reaches `authenticate()` and yields the pre-existing `BadCredentialsException` → 401. No user enumeration added |
| Race-detector re-fetch preserved (A4) | Verified | `AuthenticationService.java:157-170` untouched; the second `findByEmail` and its `IllegalStateException` remain intact |
| `findAllForCurrentUser` explicit ADMIN branch | Implemented | `else if (role == Role.ADMIN) { findAll() } else { throw ... }`. PATIENT/DENTIST branches unchanged |
| `@Column(nullable = false)` on `User.role` | Implemented | `User.java:40`, single-line addition |
| `V2__enforce_user_role_not_null.sql` | Implemented | Backfill `UPDATE` precedes `ALTER TABLE ... MODIFY COLUMN ... NOT NULL`; full `ENUM(...)` restated for `baseline-on-migrate` lineage convergence |

#### Claim B — re-traced this pass, STILL CONFIRMED

Re-read `AuthenticationService.login()` from current source rather than trusting pass 1:

- `login()` opens at `:131`.
- The null-role guard occupies `:137-145` and is the **first executable statement** of the method
  (`:132-136` are comments).
- `authenticationManager.authenticate(...)` is at `:148`.

The guard provably throws before `authenticate()` is reachable. The covering test's load-bearing
assertion is `verify(authenticationManager, never()).authenticate(any())`; because
`authenticationManager` is an unstubbed Mockito mock, relocating the guard after `authenticate()`
would let the call through and fail that verification. The assertion is genuinely load-bearing.

#### Claim A — settled empirically (re-confirmed)

`DaoAuthenticationProviderWrappingCharacterizationTest` wires a **real** `DaoAuthenticationProvider`
(spring-security-core, Spring Boot 3.2.1) with a stub `UserDetailsService` throwing
`InvalidPrincipalRoleException`, and asserts the wrapping exception type. It passes in this pass's
full-suite run, corroborating why the guard cannot live in `ApplicationConfig.userDetailsService()` (A1).

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| A1 guard at the two call sites, not in `ApplicationConfig` | Yes | `ApplicationConfig.java` untouched (`git status --porcelain` empty for it) |
| A2 login guard pre-`authenticate()` | Yes | Re-traced; guard `:137-145`, `authenticate()` `:148` |
| A3 absent row falls through | Yes | `.ifPresent` semantics; pre-existing race test still green |
| A4 second `findByEmail`, race detector intact | Yes | `:157-170` unmodified |
| A5 distinct type, byte-identical wire body | Yes | Handler bodies compared field-by-field; identical |
| A6 Java 21 `instanceof` pattern in the filter | Yes | `userDetails instanceof User user && user.getRole() == null` |
| A7 new focused handler-test file | Yes | `GlobalExceptionHandlerInvalidRoleTest` created; `...StalePrincipalTest` untouched |
| Slice boundary: single PR, < 400 lines | Yes, but see W3 | 393/400 after the remediation |

### Scope Boundaries (independently re-confirmed via `git status --porcelain`)

| Constraint | Result |
|---|---|
| `ApplicationConfig.userDetailsService()` untouched | Confirmed — no porcelain entry |
| `StalePrincipalException` not widened | Confirmed — no porcelain entry |
| No second `AuthenticationEntryPoint` | Confirmed — no new entry-point file; `SecurityConfiguration` unmodified |
| No other `AppointmentServiceImpl` method touched | Confirmed — diff contains exactly one hunk, inside `findAllForCurrentUser()` |
| No frontend files touched | Confirmed — `git status --porcelain -- frontend/` empty |
| Batch 2 touched zero production code | Confirmed — see the three-way check above |

**Pass-1 revert claim re-confirmed cryptographically.** `StalePrincipalEntryPointIntegrationTest.java`:
`git hash-object` = `45f8243727a4b66b6476bd14c080934ad271acf7`;
`git rev-parse HEAD:<path>` = `45f8243727a4b66b6476bd14c080934ad271acf7`. Identical blobs prove
byte-identity with HEAD. Note the remediation deliberately created a **new sibling file** in the same
package rather than reopening this one — the right call, since it keeps the reverted file pristine.

### Review Workload Guard

| Metric | Value |
|---|---|
| Tracked diff | 154 insertions, 2 deletions = **156** changed lines |
| New untracked source/test/SQL files | 10 + 12 + 34 + 35 + **146 (new)** = **237** lines |
| **Total authored change** | **393 lines** |
| Budget | 400 |
| Result | **Within budget (98%)** — 7 lines of headroom |

Pass 1 measured 247. The remediation test is 146 lines, materially larger than the 60–90 lines
forecast for it. See W3. OpenSpec planning artifacts under `openspec/changes/` are documentation
and remain excluded from the code-review budget, consistent with pass 1.

### TDD Compliance

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | "TDD Cycle Evidence" table present in `apply-progress.md` (Batch 1 section) |
| All tasks have tests | ✅ | Every code task 1.x–5.x maps to a named, existing, passing test file |
| RED confirmed (tests exist) | ✅ | 6/6 batch-1 test files verified present on disk |
| GREEN confirmed (tests pass) | ✅ | All re-executed in this pass's full-suite run: 256 run, 0 failures, 0 errors |
| Triangulation adequate | ✅ | R1 triangulated 2× at unit level (header/cookie) **and** 2× at integration level (header/cookie); R3 has null + ADMIN variance |
| Safety Net for modified files | ✅ | 11/11 filter, 1/1 login-race, 8/8 service pre-existing tests recorded green before modification |

**TDD Compliance**: 6/6 checks passed.

**Batch 2 and the RED phase — stated honestly.** The remediation added a test for behavior that
was already implemented and already green, so no RED observation against failing production code
was possible or meaningful; this is the correct shape for closing a coverage gap, not a protocol
violation. Its failure-detection power was instead established two ways in this pass: (a) the
guard's unique WARN log fires on both cases, proving the code path is genuinely traversed; and
(b) removing the guard would let `User.getAuthorities()` dereference `role.name()` and NPE
outside both existing catch clauses, which would surface as a 500 and fail `status().isOk()`.
A residual hardening opportunity remains — see S1.

### Test Layer Distribution (this change's new tests)

| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit | 6 | 5 | JUnit 5 + Mockito (1 file uses a real `DaoAuthenticationProvider`, no mocks) |
| Integration | 2 | 1 | `@SpringBootTest` + `@AutoConfigureMockMvc` + H2 |
| E2E | 0 | 0 | not applicable to this change |
| **Total new** | **8** | **6** | |

Full suite: 256 tests run, 253 executed, 3 skipped (see W5).

### Changed File Coverage

Coverage analysis skipped — no JaCoCo or equivalent coverage plugin configured in
`backend/pom.xml`. Not a failure.

### Assertion Quality

Audited all 6 test files created or modified by this change, with focus on the new
`NullRolePrincipalLoginRecoveryIntegrationTest`.

- No tautologies (`assertTrue(true)` and equivalents): none found.
- No orphan empty-collection assertions.
- No type-only assertions used alone: the new integration test pairs `status().isOk()` with a
  real value assertion, `jsonPath("$.email").value(seededPatient.getEmail())`.
- No ghost loops: no assertions inside loops over possibly-empty collections.
- Every assertion is downstream of a real production-code invocation (MockMvc request through the
  real filter chain, or a direct service/handler call).
- Not smoke-test-only: the integration test asserts a specific response body value, not mere
  absence of a crash.
- Mock/assertion ratio is healthy: 1 `@MockBean` + 2 stubbings vs. 2 assertions per test case.
- Load-bearing negative assertions confirmed present where they matter:
  `verify(authenticationManager, never()).authenticate(any())` (R2) and
  `verifyNoInteractions(appointmentRepository)` (R3).

**Assertion quality**: ✅ 0 CRITICAL, 0 WARNING. One hardening SUGGESTION recorded as S1.

### Quality Metrics

**Formatter (Spotless)**: ✅ No violations — 134 files clean, BUILD SUCCESS.
**Compiler**: ✅ `mvn -o clean compile` exit 0, no errors.
**Linter / type checker**: ➖ None beyond the compiler and Spotless configured in this project.

IDE/LSP diagnostics flagging Lombok-generated accessors and same-package new-type resolution are
known false positives in this workspace; Maven compiles and all tests pass. Not re-litigated.

### Issues

#### CRITICAL

**None.** The single pass-1 CRITICAL is resolved and independently re-verified.

#### WARNING

- **W1 — Task 6.4 incomplete (pre-merge human gate, re-flagged, not resolved).** The manual
  MySQL staging run of `V2__enforce_user_role_not_null.sql` with `flyway.enabled=true` has not
  been performed and cannot be performed by any agent in this environment. H2 test profiles have
  Flyway disabled and generate schema from JPA annotations, so **no automated test in this suite
  exercises the migration SQL at all**. This is the one materially unverified artifact in the
  change. It is a human/CI gate, not a verify blocker — but it **must** happen before merge to
  main. Not resolved by this pass, by design.
- **W2 — Task 6.5 incomplete (ordering, not a defect).** The commit boundary is an orchestrator
  action ordered after verification. `User.java` + `V2__enforce_user_role_not_null.sql` must land
  as the last, isolated commit so the migration stays independently revertible pre-merge.
- **W3 — Review budget headroom is now thin: 393/400 lines (98%).** The remediation test is 146
  lines versus the 60–90 forecast for it, moving the change from 62% to 98% of budget. Still
  within budget, so no chained-PR decision is forced, but any further addition to this slice
  would breach 400.
- **W4 — Tracking artifacts overstate completion and test counts.** `apply-progress.md` and
  Engram #6869 both state "19/20 tasks complete"; the actual unchecked count in `tasks.md` is 2
  (6.4 and 6.5), so it is **18/20**. Separately, `apply-progress.md` claims "Total new tests
  written: 7" while its own enumeration and the diff both sum to **6** for Batch 1 (4 new `@Test`
  in modified files + 2 new test files). Documentation accuracy only; no code impact. Pass 1
  raised the 19/20 discrepancy and it was not corrected in Batch 2.
- **W5 — Skip-count claim is imprecise; the suite has date-dependent tests.** The full run reports
  3 skipped, whereas pass 1 recorded 0 skipped. `apply-progress.md` describes these as
  "pre-existing... present before this remediation too", which is not quite right — they were
  **not** present in the pass-1 run. Root cause independently established: `AppointmentScheduleValidatorTest`
  uses `assumeTrue(!isWeekend(date))` and `assumeTrue(LocalTime.now().isAfter(OPENING_TIME))`;
  pass 1 ran on Friday 2026-08-28, this pass on **Saturday** 2026-08-29, so 3 assumptions abort.
  Surefire confirms `org.opentest4j.TestAbortedException: Assumption failed`. The file is untouched
  by this change (`git status --porcelain` empty; last commit 8f33835, predating this change), so
  this is unrelated pre-existing behavior and **not** a regression. Recorded so the delta is not
  mistaken for one later.

#### SUGGESTION

- **S1 — Pin the guard traversal inside the remediation test.** Both new cases would still pass
  200 if the null-role branch were never reached (for example, if token parsing threw
  `JwtException`, whose catch is also log-only and non-short-circuiting). Adding
  `verify(userDetailsService).loadUserByUsername(nullRoleEmail)` would make traversal an in-test
  assertion rather than something confirmed only by reading the runtime WARN log, as this pass did
  manually. Cheap, and it removes the last inferential step from the scenario's evidence.
- **S2 — R1's protected-route scenario is composed, not end-to-end.** Its 401 leg is currently
  borrowed from `unauthenticatedAccessToProtectedRouteNowReturns401NotFormerly403`, which has a
  *different* trigger (no token at all). The composition is sound because `StalePrincipalEntryPoint`
  is trigger-agnostic, so this is not a gap. Still, the very `@MockBean` technique the remediation
  introduced would give that scenario a direct end-to-end case in a few lines. Note W3's budget
  headroom if pursued in this slice.
- **S3 — `@MockBean` is deprecated from Spring Boot 3.4.** This project is on 3.2.1, so the usage
  is correct today. Flag for a future upgrade, where `@MockitoBean` is the replacement.
- **S4 — Date-dependent `assumeTrue` skips are pre-existing tech debt.** `AppointmentScheduleValidatorTest`
  silently loses 3 of 11 cases every weekend. A fixed `Clock` would make the suite deterministic.
  Out of scope here; worth its own change.

### Verdict

**PASS WITH WARNINGS**

All 4 requirements and all 7 scenarios of `principal-role-integrity` are satisfied by named tests
that passed at runtime in this pass's own execution. The single pass-1 CRITICAL is genuinely
closed by a real integration test through the actual security filter chain, covering both the
header and cookie credential sources and asserting `200 OK` with the seeded identity's own email —
matching the scenario's own reasoning for why 200 specifically is required. Production code is
byte-identical to what pass 1 validated, confirmed by content, timestamps, and blob hashes. Claim
B, Claim A, the revert byte-identity, and every scope boundary were re-traced from source this
pass and all still hold. The change is 393 lines against a 400-line budget, Spotless-clean, and
compiles and tests green (256 run, 0 failures, 0 errors, exit 0).

Nothing blocks archive. Before **merge**, task 6.4 (manual MySQL staging run of
`V2__enforce_user_role_not_null.sql`) must be performed by a human or CI — it is the only
artifact in this change that no automated test exercises — and task 6.5's isolated migration
commit boundary must be respected.
