# Verification Report: backend-authz-hardening

**Change**: backend-authz-hardening
**Mode**: hybrid (engram + openspec file)
**Verdict**: PASS WITH WARNINGS
**Date**: 2026-06-22

## Summary

Independent fresh-context re-derivation against current source confirms all 5 audited
vulnerabilities are closed, the post-apply BLOCKER logging fix is real and fires live, and
the full test suite is green (49/49). 0 new CRITICAL findings. 4 pre-existing WARNING/SUGGESTION
items remain explicitly deferred by user choice from the prior 4R security review (not re-litigated
here, only restated for completeness). 1 new SUGGESTION noted (unique-constraint collision UX) that
is a refinement of the already-tracked R1 finding, not a new vulnerability.

## Task Completion Audit (tasks.md)

All 7 phases (0-6), every checkbox `[x]`, spot-checked against current source — no discrepancies.

| Phase | Claim | Verified |
|---|---|---|
| 0 | Test inventory, 0 insecure-behavior tests found, baseline 28 tests green | Confirmed via re-grep + current test count progression |
| 1 | `update-names` endpoint deleted, 404 (not 401/403) | Confirmed: route absent, GlobalExceptionHandler maps `NoResourceFoundException`→404 |
| 2 | `application-dev.properties` fallback removed | Confirmed: line 15 reads `app.jwt.secret=${JWT_SECRET}`, no `:` default |
| 3 | Admin registration lockdown, `createAdmin()` deleted | Confirmed: zero `createAdmin` matches repo-wide; guard present in `AuthenticationService.register()` |
| 4 | Appointment findById ownership | Confirmed: `hasRole(auth,"ROLE_DENTIST")` ownership check present, reuses existing helper |
| 5 | Patient/Dentist update IDOR + findById policy | Confirmed: controller-level resolve-from-principal + strip role/email, matches design verbatim |
| 6 | Final regression pass, 49/49, live curl verification | Re-ran independently: 49/49 confirmed; live exploits re-verified fresh (see below) |

No unchecked tasks. No CRITICAL from task-completion audit.

## Spec Conformance — Independently Re-Derived

### Admin Account Provisioning spec

| Requirement / Scenario | Source evidence | Test evidence | Status |
|---|---|---|---|
| Register role=PATIENT succeeds as PATIENT | `AuthenticationService.register()` switches on `requested` | `AuthenticationControllerTest` (4 tests) | PASS |
| Register role=DENTIST succeeds as DENTIST | same | same | PASS |
| Register role=ADMIN never creates ADMIN | guard: `if (requested == Role.ADMIN) throw IllegalArgumentException` → 400 via `GlobalExceptionHandler.handleIllegalArgument` | test + live curl: `400`, `check-email` confirms `false` after attempt | PASS |
| No role field defaults to non-privileged | `Role requested = request.getRole() == null ? Role.PATIENT : request.getRole();` | test covers null-role case | PASS |
| Seed admin account unaffected | `DataInitializer.java` uses `userRepository.save(admin)` directly, never calls `createAdmin()` (now deleted) | live login as `admin@dentalclinic.com` → `role:ADMIN` | PASS |
| `createAdmin()` actually deleted (not just unreachable) | `rg -n "createAdmin"` repo-wide → **zero matches** | — | PASS |

### Object-Level Authorization spec

| Requirement / Scenario | Source evidence | Test evidence | Status |
|---|---|---|---|
| PATIENT updates own record — succeeds | `PatientController.update()` resolve-from-principal | `PatientControllerAuthzTest` (8 tests) | PASS |
| PATIENT sends victim id — victim unchanged | body `id` forced to `own.getId()` before service call | live curl: victim id=17 byte-for-byte unchanged after attacker PUT targeting id=17 | PASS |
| PATIENT sends role=ADMIN — never persisted | `patient.setRole(null)` strip + service defense-in-depth (`PatientServiceImpl.update`, rejects inbound `Role.ADMIN`) | live curl: re-login as attacker after attack confirms `role:PATIENT` | PASS |
| ADMIN updates by body id — override preserved | `else if (patient.getId() == null)` branch only blocks missing id, not admin-by-id | live curl: admin PUT targeting id=17 → 200, applied | PASS |
| DentistController mirrors same 4 scenarios | `DentistController.update()` mirrors Patient controller exactly | `DentistControllerAuthzTest` (4 tests) | PASS |
| Patient findById: PATIENT self=200, other=403 | imperative check: `if (!own.getId().equals(id)) return 403` | live curl: attacker→403 (no body) on victim id; victim→200 on own id | PASS |
| Patient findById: ADMIN/DENTIST unrestricted | `privileged` flag bypasses self-check | covered in `PatientControllerAuthzTest` regression-guard cases | PASS |
| Appointment findById: DENTIST own=200 | `found.get().getDentist_id().equals(dentist.getId())` | live curl: Maria (dentist_id=2) on appointment id=1 (own) → 200 | PASS |
| Appointment findById: DENTIST cross=403 | same check, else branch | live curl: Maria on appointment id=5 (Luis's, dentist_id=5) → 403 | PASS |
| Appointment findById: ADMIN unrestricted | role gate bypasses ownership check entirely | live curl: ADMIN on appointment id=5 → 200 | PASS |
| Appointment findById: PATIENT still excluded (no regression) | `@PreAuthorize("hasAnyRole('ADMIN','DENTIST')")` — PATIENT never reaches method body | live curl: victim (PATIENT) on appointment id=5 → 403 at role-gate level | PASS |
| Dead endpoint returns 404, not 401/403 | route mapping deleted from `AuthenticationController.java`; `GlobalExceptionHandler` maps `NoResourceFoundException`→404 | live curl: `PUT /auth/update-names/...` → `404 {"error":"Recurso no encontrado",...}` | PASS |
| JWT secret has no dev fallback | `application-dev.properties:15` = `app.jwt.secret=${JWT_SECRET}` | `JwtSecretConfigurationTest` (1 test, static-assertion per spec's accepted fallback mechanism) | PASS |

### NEW for this verify — BLOCKER logging fix (from post-apply 4R pass)

All 5 `log.warn(...)` call sites read directly from current source and confirmed firing live
during independent fresh exploit re-verification:

| Class | Denial point | Confirmed in source | Confirmed firing live (log line) |
|---|---|---|---|
| `AuthenticationService.java:46` | ADMIN self-registration rejection | yes | `Privilege escalation attempt: public registration requested role=ADMIN for email verify-admin-exploit@evil.com` |
| `PatientController.java:60` | findByEmail-miss on update | yes | not triggered in this run (requires stale-token edge case, see R3) |
| `PatientController.java:64` | cross-record update attempt | yes | `IDOR attempt: patient 16 tried to update record of patient 17` |
| `PatientController.java:99` | cross-patient findById FORBIDDEN | yes | `IDOR attempt: patient 16 requested record of patient 17` |
| `DentistController.java:61,65` | findByEmail-miss / cross-record update | yes | not triggered (no dentist exploit attempted this run, prior apply-progress already verified it) |
| `AppointmentController.java:84-85` | cross-dentist FORBIDDEN | yes | `IDOR attempt: dentist 2 requested appointment 5 owned by dentist 5` |

BLOCKER fix confirmed real, not just claimed.

## Test Suite — Fresh Run

```
cd backend && ./mvnw test
...
[INFO] Tests run: 49, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

Matches the claimed 49/49 baseline exactly. File-by-file new-test counts cross-checked against
source: `PatientControllerAuthzTest` 8, `DentistControllerAuthzTest` 4, `AppointmentControllerTest`
7 (3 pre-existing + 4 new), `AuthenticationControllerTest` 4, `JwtSecretConfigurationTest` 1 — all
match tasks.md claims exactly.

Re-grep repo-wide: `createAdmin`, `updateUserNames` → zero matches. `update-names` → zero
route/caller matches (only the test's own assertion string). Old SpEL pattern
(`#patient.email == authentication.name` / `#dentist.email == authentication.name`) → zero matches
anywhere in the repo.

## Live Exploit Re-Verification (independently re-run, fresh)

Backend started with a freshly generated throwaway `JWT_SECRET` (`openssl rand -hex 32`), never
reusing the leaked fallback value. Seed confirmed: `DataInitializer: seed completado — 15 usuarios,
35 citas.`

1. **`POST /auth/register {"role":"ADMIN"}`** → `400 {"message":"El registro público no permite
   crear cuentas de administrador"}`. `check-email` for that address → `false`. No account created.
2. **Attacker PATIENT (id=16) → `PUT /patients {"id":17,...,"role":"ADMIN"}`** targeting victim
   (id=17) → server returned `200` but mutated the **attacker's own record** (id=16), not the
   victim's. Victim record (id=17) confirmed byte-for-byte unchanged (`firstName:"Victim"`,
   original email, original cardIdentity). Attacker re-login after the attempt confirms
   `role:PATIENT` (never became ADMIN).
3. **Attacker → `GET /patients/17`** (victim's record) → `403`, empty body, no PII leak.
4. **Logging verified live**: all triggered log.warn lines found in `/tmp/backend-verify-final.log`
   at the exact timestamps of each curl call (see table above).
5. **`PUT /auth/update-names/verify-victim@test.com`** → `404
   {"error":"Recurso no encontrado","message":"La ruta solicitada no existe"}` — confirmed NOT
   401/403.
6. **Appointment ownership** (extra coverage beyond the prompt's minimum ask): dentist Maria
   (dentist_id=2) on own appointment (id=1) → 200; on Luis's appointment (id=5, dentist_id=5) →
   403; ADMIN on id=5 → 200; PATIENT on id=5 → 403 (role-level, unchanged baseline).
7. **Legitimate flows confirmed**: victim self-update → 200, applied; seed admin login → `role:ADMIN`
   confirmed; ADMIN override-by-id on victim's record → 200, applied.

Backend stopped cleanly after verification; port 8080 confirmed free.

## Findings

### CRITICAL
None found in this verify pass.

### WARNING (already known, deferred by explicit user choice — restated for completeness, not re-flagged as new)

- **R3** — `findByEmail`-miss edge case (valid JWT, no backing Patient/Dentist row) has zero test
  coverage across all 3 controllers, and uses inconsistent HTTP status codes for the same conceptual
  failure (403 via `AccessDeniedException` in Patient/Dentist controllers, 400 via
  `IllegalArgumentException` in the pre-existing `AppointmentController` pattern). Originally flagged
  CRITICAL by the 4R review; not fixed, deferred by user. Status unchanged.
- **R2** — `isAdmin`/`privileged` role-check logic duplicated inline 3 times across
  `PatientController`/`DentistController` despite `AppointmentController.hasRole(Authentication,
  String)` already existing as the right abstraction. Not fixed, deferred.
- **R1** — self-service update's strip-list (`role`, `email`) is narrower than "identity-relevant
  fields" — `cardIdentity`/`registrationNumber` aren't stripped. Reproduced again incidentally during
  this verify's own live testing: an attacker who happens to reuse another record's `cardIdentity` in
  the update body gets a `400 "El número de documento ya está registrado"` instead of the field being
  silently ignored. DB unique constraint still prevents real data corruption — confirmed no security
  impact, just a confusing error message UX gap, exactly as previously documented. Not fixed,
  deferred.
- **R4** — missing `JWT_SECRET` env var on `dev` profile fails to boot with a buried stack trace and
  no actionable message. Not fixed, deferred. (Worked around this in verification by generating a
  throwaway secret via `openssl rand -hex 32`, confirming the gap is real but non-blocking for this
  verify.)

### SUGGESTION
- Consider documenting in README/.env.example that `JWT_SECRET` must be set for both `dev` and
  `prod` profiles (relates to R4, cosmetic/onboarding only).
- PR description must include the operational JWT_SECRET rotation follow-up note (tasks.md 6.4
  flags this as a documentation gate, not yet executed since the change is not committed/PR'd yet —
  carry this forward into the PR description when this change is shipped).

## Risks Carried Forward (not blocking archive)

- R1, R2, R3, R4 from the 4R review remain open by explicit user decision. They do not violate any
  spec requirement (the spec's observable-outcome scenarios are all met) and do not constitute new
  vulnerabilities — they are quality/consistency debt items, correctly classified as WARNING.
- Historical JWT secret leak (committed in prior git history) is not remediated by this change —
  rotation is an out-of-band operational action, explicitly flagged in proposal.md Risks and in
  tasks.md 6.4 as a required PR description note.

## Verdict

**PASS WITH WARNINGS** — 0 CRITICAL, 4 WARNING (all pre-existing, deferred by user choice, restated
not re-litigated), 2 SUGGESTION. All 9 proposal Success Criteria items independently re-verified
against current source and live behavior. Safe to proceed to `sdd-archive`.
