# Tasks: appointment-role-null-hardening

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~77 production + ~153 test ≈ 230 (per design.md; re-checked against exact snippets below, no material change) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR, two commits (app code, then isolated migration commit) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | App-code guards (steps 1–5): exception, handler, filter, login, dispatch | PR 1 (commit 1) | `mvn -pl backend test -Dtest=GlobalExceptionHandlerInvalidRoleTest,DaoAuthenticationProviderWrappingCharacterizationTest,JwtAuthenticationFilterTest,AuthenticationServiceLoginRaceTest,AppointmentServiceImplTest` | `mvn test` full regression (H2, no Flyway) | `git revert` cleanly removes all 5 production files' changes; no schema state involved |
| 2 | Migration + entity constraint (step 6) | PR 1 (commit 2, isolated) | `mvn -pl backend test` (regression; V2 not exercised under H2) | Manual staging run: apply `V2__enforce_user_role_not_null.sql` against a MySQL staging DB with `flyway.enabled=true`, verify backfill + `NOT NULL` | Independently revertible pre-merge (separate commit); post-merge rollback needs a compensating `V3__relax_user_role_not_null.sql` (documented, not created here) |

If your own read of the exact diffs suggests otherwise: confirmed — the design's own snippets (reproduced verbatim below) match the ~230-line estimate; no refinement needed.

## Phase 1: Exception Type + Global Handler (Design Step 1 — genuine RED/GREEN)

- [x] 1.1 RED — Create `backend/src/test/java/.../exception/GlobalExceptionHandlerInvalidRoleTest.java` with `handleInvalidPrincipalRole_returns401WithUniformMessage`. Asserts 401, `error="No autenticado"`, message/path/timestamp shape identical to the existing `handleStalePrincipal` test. Confirm it fails to compile (RED — type doesn't exist yet).
- [x] 1.2 GREEN — Create `backend/src/main/java/com/dh/dentalClinicMVC/exception/InvalidPrincipalRoleException.java`:
  ```java
  package com.dh.dentalClinicMVC.exception;

  public class InvalidPrincipalRoleException extends RuntimeException {
    public InvalidPrincipalRoleException() {
      super();
    }
  }
  ```
- [x] 1.3 GREEN — Modify `backend/src/main/java/com/dh/dentalClinicMVC/exception/GlobalExceptionHandler.java`, append after `handleStalePrincipal` (:231-244):
  ```java
  @ExceptionHandler(InvalidPrincipalRoleException.class)
  public ResponseEntity<ErrorResponse> handleInvalidPrincipalRole(
      InvalidPrincipalRoleException e, WebRequest request) {
    ErrorResponse error =
        ErrorResponse.builder()
            .error("No autenticado")
            .message("La sesión ya no es válida. Iniciá sesión nuevamente.")
            .path(request.getDescription(false).replace("uri=", ""))
            .status(HttpStatus.UNAUTHORIZED.value())
            .timestamp(LocalDateTime.now())
            .build();
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
  }
  ```
- [x] 1.4 Verify 1.1 now passes (GREEN).

## Phase 2: Characterization Test (Design Step 2 — exempt from RED, expected GREEN)

- [x] 2.1 Create `backend/src/test/java/.../authentication/DaoAuthenticationProviderWrappingCharacterizationTest.java` with `wrapsForeignExceptionFromUserDetailsServiceIntoInternalAuthenticationServiceException`: wire a real `DaoAuthenticationProvider` with a stub `UserDetailsService` that throws `InvalidPrincipalRoleException` from `loadUserByUsername()`, call `authenticate()`, assert the resulting thrown exception type. Run immediately — expect GREEN on first run (settles design.md Claim A empirically against the real spring-security-core 6.2.1 jar; if refuted, no other task changes — A1 stands on Claim B alone per design.md).

## Phase 3: JWT Filter Null-Role Guard (Design Step 3)

- [x] 3.1 RED — In `backend/src/test/java/.../configuration/JwtAuthenticationFilterTest.java`, add `nullRoleUserViaHeaderIsCaughtAndChainContinuesUnauthenticated`: stub a `User` with `role == null` returned from `loadUserByUsername()` via Authorization header; assert `SecurityContextHolder` context is `null`, response status 200, empty body, `filterChain.doFilter` invoked, and `verify(jwtService, never()).isTokenValid(...)`. Confirm it fails with an NPE from `getAuthorities()` (RED).
- [x] 3.2 RED — Add `nullRoleUserViaCookieIsCaughtAndChainContinuesUnauthenticated` in the same file, same assertions, `authToken` cookie source instead of header. Confirm RED.
- [x] 3.3 GREEN — Modify `backend/src/main/java/com/dh/dentalClinicMVC/configuration/JwtAuthenticationFilter.java`. Insert immediately after line 68 (before `isTokenValid` at :71):
  ```java
  if (userDetails instanceof User user && user.getRole() == null) {
    throw new InvalidPrincipalRoleException();
  }
  ```
  Add a new `catch` clause between the existing `UsernameNotFoundException` catch and the `JwtException | IllegalArgumentException` catch:
  ```java
  } catch (InvalidPrincipalRoleException ex) {
    log.warn("Rejected request with invalid principal role (users row has null role)");
  }
  ```
  Do not write a response and do not short-circuit — mirrors the sibling `UsernameNotFoundException` catch exactly (A6).
- [x] 3.4 Verify 3.1 and 3.2 now pass (GREEN). Confirm `permitAll` routes (e.g. `POST /auth/login`) remain reachable with a null-role credential attached per spec scenario "Null-role credential on the login recovery path is NOT blocked" — add/verify this as a scenario-level assertion if not already covered by an existing filter/integration test. **REMEDIATED (post-verify)**: the original apply batch's unit-level-only justification was rejected by `sdd-verify` (CRITICAL finding — the scenario literally exercises the `permitAll` route through the real security filter chain, which no unit test does). Closed by `backend/src/test/java/com/dh/dentalClinicMVC/security/NullRolePrincipalLoginRecoveryIntegrationTest.java` (new, 2 cases: header + cookie), a `@SpringBootTest`/`@AutoConfigureMockMvc` test that overrides the `UserDetailsService` bean with a Mockito stub returning an in-memory, never-persisted null-role `User` for the stale credential's subject — sidestepping `@Column(nullable = false)` entirely since no DB write occurs — while a real seeded `Patient` row provides the distinct, role-valid login identity. Both cases assert `POST /auth/login` still returns `200 OK`. Full suite re-run: 256/256 passing (254 + 2 new), 0 failures/errors, 3 pre-existing unrelated skips in `AppointmentScheduleValidatorTest`.

## Phase 4: Login Guard (Design Step 4)

- [x] 4.1 RED — In `backend/src/test/java/.../authentication/AuthenticationServiceLoginRaceTest.java`, add `login_whenUserHasNullRole_thenThrowsInvalidPrincipalRoleBeforeAuthenticating`: stub `userRepository.findByEmail(...)` to return a null-role `User`; assert `assertThrows(InvalidPrincipalRoleException.class, () -> ...)` AND the load-bearing `verify(authenticationManager, never()).authenticate(any())`. Confirm RED (no exception thrown today; `never()` verify fails).
- [x] 4.2 GREEN — Modify `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationService.java`. Insert as the FIRST statement of `login()`, before `authenticationManager.authenticate(...)` (:132):
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
  An absent row (email not found) MUST fall through this guard untouched (A3) — do not throw on `Optional.empty()`; preserves existing `BadCredentialsException` → 401 and keeps the race-detector re-fetch at `login():135-154` (A4) unmodified.
- [x] 4.3 Verify 4.1 now passes (GREEN). Verify existing `AuthenticationServiceLoginRaceTest` cases (absent-row path) remain green — confirms A3.

## Phase 5: `findAllForCurrentUser()` Explicit ADMIN Branch (Design Step 5)

- [x] 5.1 RED — In `backend/src/test/java/.../service/impl/AppointmentServiceImplTest.java`, add `findAllForCurrentUser_throwsInvalidPrincipalRoleWhenRoleIsNull`: dispatch with `role == null`; assert `assertThrows(InvalidPrincipalRoleException.class, ...)` and `verifyNoInteractions(appointmentRepository)`. Confirm RED (currently falls through to `findAll()`).
- [x] 5.2 GREEN — Modify `backend/src/main/java/com/dh/dentalClinicMVC/service/impl/AppointmentServiceImpl.java`, replace the terminal `else` (:216-219):
  ```java
  } else if (role == Role.ADMIN) {
    appointments = appointmentRepository.findAll();
  } else {
    throw new InvalidPrincipalRoleException();
  }
  ```
  PATIENT and DENTIST branches stay unchanged.
- [x] 5.3 Verify 5.1 passes (GREEN). Verify the existing ADMIN-path test still passes unchanged.

## Phase 6: Migration + Entity Constraint — FINAL, ISOLATED COMMIT (Design Step 6)

No RED possible (Flyway is prod-only; H2 test/dev/e2e profiles have `flyway.enabled=false`). Verification is regression + manual staging run, not a failing test.

- [x] 6.1 Modify `backend/src/main/java/com/dh/dentalClinicMVC/entity/User.java`: add `@Column(nullable = false)` to the `role` field.
- [x] 6.2 Create `backend/src/main/resources/db/migration/V2__enforce_user_role_not_null.sql`:
  ```sql
  UPDATE users SET role = 'PATIENT' WHERE role IS NULL;

  ALTER TABLE users
      MODIFY COLUMN role ENUM('ADMIN', 'DENTIST', 'PATIENT') NOT NULL;
  ```
  Backfill runs before the constraint (a null row would abort the `ALTER`). The full `ENUM(...)` restatement (not a bare nullability change) is required so `MODIFY COLUMN` converges both the normal V1 lineage and any `baseline-on-migrate=true` lineage where V1 was marked applied without running.
- [x] 6.3 Run full `mvn test` regression — confirm zero fixture fallout (all 8 user-persisting test files already call `setRole(...)`). Result: 254/254 passing, 0 failures, 0 errors. Note: fixture fallout was NOT quite zero — see 3.4's deviation note; the fallout hit a *new* test fixture added during this apply batch (now reverted), not any of the 8 pre-existing files design.md audited.
- [x] 6.4 **Post-archive validation (orchestrator, no real staging environment existed for this project — only dev/e2e/prod, and prod's DB is Railway-managed with credentials outside this session)**. Validated against an ephemeral `mysql:8.0` Docker container instead: applied V1 fresh, seeded a null-role row (proving today's schema allows it), ran V2 — backfill converted it to `PATIENT`, `role` became `NOT NULL`, and a subsequent null-role `INSERT` was rejected (`ERROR 1048: Column 'role' cannot be null`). Separately simulated the `baseline-on-migrate` lineage design.md worried about (a Hibernate-generated `VARCHAR(255) NULL` `role` column instead of V1's `ENUM`) in a second fresh database — V2 converged it to `enum('ADMIN','DENTIST','PATIENT') NOT NULL` with backfill intact, confirming design.md's claim that restating the full `ENUM(...)` (not a bare nullability change) handles both lineages, with real evidence instead of only source-level reasoning. This validates the SQL itself; it does not touch the actual Railway prod database — running it there (or against a real provisioned staging instance, if the user creates one before then) remains the final pre-deploy step, now materially de-risked.
- [x] 6.5 Commit boundary executed by the orchestrator: commit `82010d5` (Phases 1-5, app code + tests) and commit `4380707` (Phase 6 only: `User.java` + `V2__enforce_user_role_not_null.sql`, isolated). Both pushed to `origin/main`; CI green on all 3 jobs (Frontend, Backend, Full-Stack E2E).

## Out of Scope (do not touch)

- Widening `StalePrincipalException`.
- A second `AuthenticationEntryPoint`.
- Any `AppointmentServiceImpl` method other than `findAllForCurrentUser()`.
- Frontend.
- `ApplicationConfig.userDetailsService()` shared lambda (guard stays at the two call sites — A1).
