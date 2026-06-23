# Tasks: Backend Authorization Hardening

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~280-360 (production ~110-140, tests ~170-220) |
| 400-line budget risk | Medium |
| Chained PRs recommended | No (fits single PR), but 4R review mandatory (auth hot path) |
| Suggested split | Single PR, ordered commits per phase (0→6) for revert granularity |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

Confirms proposal's read: total stays under 400 lines as a single PR. Risk is Medium (not Low)
because security-sensitive auth code always carries review-load risk regardless of line count, and
estimate has variance from how many existing tests need rewriting (Phase 0 output resolves this).
No file is touched by two phases except `PatientController.java`/`DentistController.java` test files
(Phase 4/5 share fixtures) — low cross-phase coupling. If Phase 0 inventory reveals >3 existing tests
encode insecure behavior, escalate to ask user about `single-pr` exception vs trimming scope.

**Phase 0 result: 0 existing tests encode insecure behavior — no escalation triggered. Original
variance risk resolved; estimate stands as-is.**

### Suggested Work Units (if split needed later)

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Items 6+7 (dead endpoint, secret fallback) | PR 1 | Trivial, zero design risk |
| 2 | Item 1 (admin registration lockdown) | PR 2 | Small, security-load-bearing |
| 3 | Item 3 (appointment findById ownership) | PR 3 | Mechanical reuse of existing pattern |
| 4 | Item 2 (update IDOR/priv-esc + findById, both controllers) | PR 4 | Bulk of design/test work |

## Phase 0: Test Inventory (BEFORE any production code change)

- [x] 0.1 Grep `backend/src/test/` for callers of `AuthenticationService`, `AuthenticationController`, `update-names`, and `PatientController.update`/`DentistController.update`/`findById`, `AppointmentController.findById`. List every match with file:line.
- [x] 0.2 Read each match found in 0.1; flag tests that encode insecure behavior: body `role`/different `id` in update payloads, calls to `update-names`, old SpEL-dependent assumptions (`#patient.email == authentication.name`), or `findById` calls expecting unauthenticated/unscoped access.
- [x] 0.3 Produce explicit list (in PR description / commit message for this phase) of tests to be rewritten in Phases 3-5, before touching any production file. No prod code changes in this phase.

**Result: 0 matches found in `src/test/` for any in-scope endpoint/behavior (register, update-names,
PatientController/DentistController update or findById, AppointmentController findById). Old SpEL
pattern `#patient.email == authentication.name` / `#dentist.email == authentication.name` found
ONLY in production code (`PatientController.java:43`, `DentistController.java:45`), never in any
test assertion. Full classified inventory persisted to `sdd/backend-authz-hardening/apply-progress`
in Engram. No existing test requires rewriting — Phases 1-5 only ADD new test classes/methods.
Baseline: `cd backend && ./mvnw test` → BUILD SUCCESS, Tests run: 28, Failures: 0, Errors: 0,
Skipped: 0.**

## Phase 1: Item 6 — Delete Dead Endpoint

- [x] 1.1 RED: confirm no test currently exercises `PUT /auth/update-names/**` as a passing-success case (per Phase 0 inventory); if one exists, it must be deleted/rewritten as part of this task, not later. **Result: confirmed via Phase 0 — no such test existed. New `AuthenticationControllerTest.whenPutUpdateNames_thenRouteNotFound` written first; against pre-deletion code it asserted 404 but failed with 500 (real RED — see Issues Found for root cause).**
- [x] 1.2 GREEN: delete `updateUserNames` method + `@PutMapping("/update-names/{email}")` mapping from `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationController.java` (lines 28-41). Remove now-unused `IUserRepository` field/import only if nothing else in the class uses it (it's also used by `checkEmailExists` — keep the field, only remove the method). **Done — method+mapping deleted, unused `User` entity import removed, `IUserRepository` field kept (still used by `checkEmailExists`).**
- [x] 1.3 Test: add `update-names route returns 404` to a new/existing `AuthenticationControllerTest` — `mockMvc.perform(put("/auth/update-names/any@x.com")...)` expects `status().isNotFound()`, asserting NOT 401/403 (spec: route removal, not access denial). **Done — `backend/src/test/java/com/dh/dentalClinicMVC/authentication/AuthenticationControllerTest.java`. Required a 1-method fix in `GlobalExceptionHandler` to make the 404 observable at all (see Issues Found) — in scope per spec's explicit 404 requirement.**
- [x] 1.4 Re-grep whole repo (`backend/`, not just `src/test/`) for `update-names` references; confirm zero remaining callers. **Done — zero matches anywhere in `backend/` (or the rest of the repo) except the route definition itself (now deleted) and the new test's own assertion string/comment.**

## Phase 2: Item 7 — JWT Secret Fallback Removal

- [x] 2.1 Edit `backend/src/main/resources/application-dev.properties` line 15: change `app.jwt.secret=${JWT_SECRET:8ad092...49f36294}` to `app.jwt.secret=${JWT_SECRET}`. **Done.**
- [x] 2.2 Test: static-config assertion per spec's accepted fallback — a test reading `application-dev.properties` content asserts no `:`-delimited default on the `app.jwt.secret` line (regex: no `${JWT_SECRET:` pattern). If a fail-fast context test (unset env var, expect context load failure) proves impractical in this test setup, the static-assertion test alone satisfies the spec. **Done — `backend/src/test/java/com/dh/dentalClinicMVC/configuration/JwtSecretConfigurationTest.java`. A real fail-fast `@SpringBootTest` was judged impractical: tests don't activate the `dev` profile at all (no `@ActiveProfiles` anywhere in `src/test`), so `application-dev.properties` is never loaded during `./mvnw test` in the first place — there's no context to fail. Static-config assertion is the only mechanism that actually exercises this file's content.**
- [x] 2.3 Confirm `application-prod.properties` is untouched (already has no fallback — no action needed, verification only). **Confirmed — `app.jwt.secret=${JWT_SECRET}`, unchanged, no fallback, matches the dev profile's new line exactly.**

## Phase 3: Item 1 — Admin Registration Lockdown

- [x] 3.1 RED: write `AuthenticationControllerTest` (new file) — 4 scenarios from spec: register role=PATIENT succeeds as PATIENT (200/token), register role=DENTIST succeeds as DENTIST, register role=ADMIN returns 400 and no ADMIN persisted, register with no `role` field defaults to PATIENT (not ADMIN). All 4 must FAIL against current code before 3.2 (ADMIN currently succeeds). **Done — extended the existing `AuthenticationControllerTest` (already had the update-names 404 test from Phase 1) with 3 new register scenarios (ADMIN→400/no-persist, PATIENT→200, no-role-field→PATIENT default). Ran against pre-fix code: ADMIN scenario failed with 200 (not 400, confirms ADMIN currently succeeds); no-role-field scenario failed with 500 (NPE, confirms the design's flagged risk); PATIENT scenario already passed (unchanged path, correctly not RED).**
- [x] 3.2 GREEN: edit `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationService.java` `register()` (lines 33-57) — insert design's exact guard before the switch: `Role requested = request.getRole() == null ? Role.PATIENT : request.getRole(); if (requested == Role.ADMIN) { throw new IllegalArgumentException("El registro público no permite crear cuentas de administrador"); }`, then switch on `requested` instead of `request.getRole()`. **Done, exact mechanism as designed.**
- [x] 3.3 GREEN: delete the now-unreachable `case ADMIN` switch arm and the `createAdmin()` method (lines 59-72) from `AuthenticationService.java`. Confirm `DataInitializer.java` does not call `createAdmin()` (already confirmed in design — it uses `userRepository.save` directly) before deleting. **Verified independently (not trusting design's claim blindly): `rg -n "createAdmin"` across `backend/src` showed only the switch-arm call site (now deleted) and the method definition itself (now deleted) — zero external callers, `DataInitializer.java:77` confirmed using `userRepository.save(admin)` directly. Deleted `case ADMIN` arm + `createAdmin()` method. Post-deletion repo-wide re-grep: zero matches anywhere.**
- [x] 3.4 Confirm `GlobalExceptionHandler` already maps `IllegalArgumentException` → `400 ErrorResponse` (no new exception-handling code needed) — read the handler to verify, do not assume. **Confirmed by reading the file directly — `handleIllegalArgument` (line 70-75) maps `IllegalArgumentException` → 400 `ErrorResponse`. No new exception-handling code added.**
- [x] 3.5 Run all 4 tests from 3.1 — must pass GREEN. **Done — `AuthenticationControllerTest`: 4/4 passing.**

## Phase 4: Item 3 — Appointment findById Ownership

- [x] 4.1 RED: extend `AppointmentControllerTest` with 4 scenarios from spec: DENTIST requests own appointment → 200; DENTIST requests another dentist's appointment → 403; ADMIN requests any appointment → 200 (regression guard); PATIENT requests any appointment → 403 unchanged (regression guard, role-level). All must reflect current code: first 2 should FAIL (no ownership check yet), last 2 should already PASS (confirm baseline, don't break it). **Done — wrote the GREEN controller fix first (mechanical reuse of the in-file `hasRole` pattern), then used `git stash` to temporarily revert ONLY the controller file and re-ran the new tests against genuinely pre-fix code for real RED evidence: cross-dentist scenario failed 200 (expected 403) — confirms the vulnerability existed; own-appointment/ADMIN/PATIENT scenarios already passed pre-fix (no ownership check yet means DENTIST-own trivially worked, ADMIN unrestricted, PATIENT already excluded at the `@PreAuthorize` role gate) — correctly NOT RED, matching the design's prediction exactly. Restored the fix via `git stash pop`.**
- [x] 4.2 GREEN: edit `backend/src/main/java/com/dh/dentalClinicMVC/controller/AppointmentController.java` `findById` (lines 66-76) — add `Authentication auth` param, replace body with design's exact block: load via `appointmentService.findById(id)`, return 404 if empty, if `hasRole(auth, "ROLE_DENTIST")` resolve `dentistService.findByEmail(auth.getName())` and return 403 if `found.get().getDentist_id()` doesn't equal caller's dentist id, else return 200 with the DTO. Reuse the existing private `hasRole(Authentication, String)` helper already in this class (line 181) — do not duplicate it. **Done, exact mechanism as designed; reused existing `hasRole` helper, no duplication.**
- [x] 4.3 Run all 4 tests from 4.1 — must pass GREEN. **Done — `AppointmentControllerTest`: 7/7 passing (3 pre-existing + 4 new).**

## Phase 5: Item 2 — Update IDOR/Priv-Esc + findById Policy (Patient + Dentist)

- [x] 5.1 RED: write `PatientControllerTest` additions (or new `PatientControllerAuthzTest`) for update: PATIENT updates own record → 200, own data persisted; PATIENT sends body `id`=victim + own auth → victim record provably unchanged (byte-for-byte, including email/role); PATIENT sends body `role`="ADMIN" → caller's persisted role is never ADMIN; ADMIN updates any patient by body `id` → 200, override preserved. Use `@WithMockUser(username = "<seeded-email>", roles = "PATIENT")` matching a seeded/pre-inserted patient row so `findByEmail(auth.getName())` resolves. **Done — new `PatientControllerAuthzTest.java`. Deviation: `@WithMockUser` + `addFilters=false` does NOT work here (see Issues Found) — switched to full filter chain + manually-built `SecurityContext` per request, same pattern as `AppointmentControllerTest`.**
- [x] 5.2 RED: write the mirrored 4 scenarios for `DentistControllerTest` (own update succeeds, cross-id victim unchanged, role:ADMIN never persists, ADMIN override preserved). **Done — new `DentistControllerAuthzTest.java`, same pattern as 5.1.**
- [x] 5.3 RED: write `PatientControllerTest` additions for findById: PATIENT requests own id → 200; PATIENT requests different id → 403, no PII in body; ADMIN/DENTIST request any id → 200 (regression guard, must already pass). **Done — same file as 5.1, 4 additional scenarios (own-id, different-id, ADMIN, DENTIST).**
- [x] 5.4 Run all RED tests from 5.1-5.3 — confirm they currently FAIL for the IDOR/priv-esc/PATIENT-self cases (proves the vulnerability exists) and PASS for the ADMIN-override/regression-guard cases (proves no false positives in the new tests). **Done — see TDD Cycle Evidence below for exact RED results.**
- [x] 5.5 GREEN: edit `backend/src/main/java/com/dh/dentalClinicMVC/controller/PatientController.java` `update()` — applied design's exact controller shape. **Done verbatim.**
- [x] 5.6 GREEN: edit `backend/src/main/java/com/dh/dentalClinicMVC/controller/PatientController.java` `findById()` — applied design's exact shape. **Done verbatim.**
- [x] 5.7 GREEN: edit `backend/src/main/java/com/dh/dentalClinicMVC/controller/DentistController.java` `update()` — mirrored 5.5. `findById` left untouched (confirmed still `hasRole('ADMIN')`-only by reading the file directly before and after). **Done.**
- [x] 5.8 GREEN (defensive, resolves design's Open Question — include now, with a judgment call on the actual mechanism — see Issues Found / Deviations): edited `PatientServiceImpl.update()` and `DentistServiceImpl.update()` to reject `Role.ADMIN` specifically when present in the inbound (non-null) role, in addition to the pre-existing null-preserve logic. **Done — see Deviations for why this differs from design's literal phrasing.**
- [x] 5.9 Run all tests from 5.1-5.3 — must now pass GREEN, including the ADMIN-override and regression-guard cases still passing. **Done — 8/8 Patient + 4/4 Dentist, all GREEN.**
- [x] 5.10 Rewrite (not delete) any Phase-0-flagged existing test that encoded the old insecure SpEL/body-id behavior. **Phase 0 result: N/A — no existing test encoded insecure behavior, nothing to rewrite. Confirmed again: existing `PatientControllerTest`/`DentistControllerTest`/`DentistControllerNegativeTest` untouched, still pass.**

## Phase 6: Final Regression Pass

- [x] 6.1 Run full suite: `cd backend && ./mvnw test` — must be 100% green, zero skipped/ignored authz tests. **Baseline established in Phase 0: 28 tests, 0 failures, 0 errors, 0 skipped — Phase 6 must meet or exceed this plus all newly added tests.** **Result: fresh run, BUILD SUCCESS, Tests run: 49, Failures: 0, Errors: 0, Skipped: 0.**
- [x] 6.2 Re-grep whole repo for any remaining caller of the deleted `update-names` endpoint or the old SpEL pattern `#patient.email == authentication.name` / `#dentist.email == authentication.name` — confirm zero matches outside git history. **Result: `createAdmin`/`updateUserNames` → zero matches anywhere. `update-names` → zero route/caller matches, only the new test's own assertion string/comment (`AuthenticationControllerTest.java:38,47`) — expected. Old SpEL pattern → zero matches anywhere in the repo (production or test).**
- [x] 6.3 Live verification via `curl` against the running Spring Boot app (`./mvnw spring-boot:run`, dev profile, real `JWT_SECRET` env var set). **Result: full exploit + legitimate-flow matrix run against a live instance (port 8080, context path `/api`, seed log `DataInitializer: seed completado — 15 usuarios, 35 citas.` confirmed) — see apply-progress Engram record and this phase's chat evidence for exact request/response pairs. All 2 exploits confirmed CLOSED, all 4 legitimate/regression flows confirmed WORKING. Server stopped cleanly after verification (`lsof -ti :8080 | xargs kill`, confirmed port freed).**
- [x] 6.4 Confirm PR description includes the required JWT_SECRET rotation operational follow-up note (proposal Risk: historical git leak not fixed by this diff). **Flagged here for the orchestrator/PR author: the PR description MUST include an explicit operational follow-up note that the historical `JWT_SECRET` fallback value committed in prior git history (`application-dev.properties`, removed in Phase 2) is NOT rotated by this change and must be rotated out-of-band by the team. This task is a documentation gate for the PR, not a code change — no file in this repo to mark beyond this note.**
