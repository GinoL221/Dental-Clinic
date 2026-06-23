# Archive Report: Backend Authorization Hardening

**Change**: backend-authz-hardening
**Archived**: 2026-06-22
**Source**: `openspec/changes/backend-authz-hardening/` → `openspec/changes/archive/2026-06-22-backend-authz-hardening/`

## Summary

Closed 5 critical-to-medium backend authorization gaps (items 1, 2, 3, 6, 7 of the security audit): prevented admin self-registration via public endpoint, fixed IDOR + privilege escalation in patient/dentist update endpoints, added record-ownership authorization to read paths (patient PII, appointment cross-tenant), deleted dead endpoint, and removed hardcoded JWT secret fallback from dev profile. Six apply phases delivered (49/49 tests all green); verification passed with 0 CRITICAL findings. Four pre-existing deferred WARNING items from the 4R security review remain tracked separately; 2 SUGGESTION items (JWT_SECRET onboarding doc, PR description note for out-of-band secret rotation). Implementation is uncommitted pending orchestrator's git operations (items 4-5 of the audit — frontend XSS + JWT storage — are a separate, not-yet-started sibling change).

## What Was Done

### Six Phases, All Completed

| Phase | Scope | Status | Commit | Engram Record |
|-------|-------|--------|--------|---------------|
| 0 — Test Inventory | Grep `src/test/` for insecure-behavior tests before any prod code change; found 0 existing vulnerable-behavior tests | DONE | N/A (no code change) | `sdd/backend-authz-hardening/apply-progress` (#980) |
| 1 — Dead Endpoint (Item 6) | Delete `PUT /auth/update-names/{email}` + mapping; add 404 test; confirm zero remaining callers | DONE | (uncommitted, code applied) | id #980 |
| 2 — JWT Secret Fallback (Item 7) | Remove fallback from `application-dev.properties`; add static-config test | DONE | (uncommitted) | id #980 |
| 3 — Admin Registration Lockdown (Item 1) | Guard `register()` to reject `role:ADMIN`; default null→PATIENT; delete unreachable `createAdmin()` method; 4 RED→GREEN test scenarios | DONE | (uncommitted) | id #980 |
| 4 — Appointment Read Ownership (Item 3) | Add DENTIST ownership check to `findById()`; reuse existing `hasRole()` helper; 4 test scenarios (own/cross/admin/patient) | DONE | (uncommitted) | id #980 |
| 5 — Patient/Dentist Update IDOR + findById (Item 2a,2b) | Controller-level resolve-from-principal; strip role/email for self-service; imperative self-check for findById; service-layer defense-in-depth; 12 test scenarios (8 patient + 4 dentist) | DONE | (uncommitted) | id #980 |
| 6 — Regression & Live Verification | Run 49/49 tests; re-grep for deleted items; live curl exploit matrix + legitimate-flow verification against running app | DONE | (uncommitted) | id #1011 (verify-report) |

All phases marked `[x]` in tasks.md. No unchecked work. Code changes applied but not yet committed (awaiting orchestrator's git operations).

### Capabilities Delivered

| Capability | Delta Spec | Main Spec | Status |
|---|---|---|---|
| Admin account provisioning (privileged-creation boundary) | `specs/admin-account-provisioning/spec.md` | **✅ NEW** `openspec/specs/admin-account-provisioning/spec.md` | New main spec, copied from delta |
| Object-level (record-ownership) authorization | `specs/object-level-authorization/spec.md` | **✅ NEW** `openspec/specs/object-level-authorization/spec.md` | New main spec, copied from delta |

## Files Affected (Post-Migration)

### Backend Java (8 production files modified)

- `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationService.java` — Item 1: admin guard + default null→PATIENT, delete `createAdmin()`
- `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationController.java` — Item 6: delete `updateUserNames` method + mapping
- `backend/src/main/java/com/dh/dentalClinicMVC/controller/PatientController.java` — Item 2a (update resolve + strip) + 2b (findById self-check)
- `backend/src/main/java/com/dh/dentalClinicMVC/controller/DentistController.java` — Item 2a (mirrored patient update pattern)
- `backend/src/main/java/com/dh/dentalClinicMVC/controller/AppointmentController.java` — Item 3: DENTIST ownership check on findById
- `backend/src/main/java/com/dh/dentalClinicMVC/service/impl/PatientServiceImpl.java` — Item 2a: service-layer defense (reject `Role.ADMIN` if non-null)
- `backend/src/main/java/com/dh/dentalClinicMVC/service/impl/DentistServiceImpl.java` — Item 2a: mirrored defense
- `backend/src/main/resources/application-dev.properties` — Item 7: remove JWT_SECRET fallback (line 15)

### Backend Tests (5 new test files, 21 new test methods)

- `backend/src/test/java/com/dh/dentalClinicMVC/authentication/AuthenticationControllerTest.java` — Phase 1+3: update-names 404, 4 register scenarios (PATIENT/DENTIST/ADMIN/no-role)
- `backend/src/test/java/com/dh/dentalClinicMVC/configuration/JwtSecretConfigurationTest.java` — Phase 2: static-config assertion on fallback-absence
- `backend/src/test/java/com/dh/dentalClinicMVC/controller/PatientControllerAuthzTest.java` — Phase 5: 8 scenarios (update own/cross/role-admin/admin-override + findById own/cross/admin/dentist)
- `backend/src/test/java/com/dh/dentalClinicMVC/controller/DentistControllerAuthzTest.java` — Phase 5: 4 scenarios (update own/cross/role-admin/admin-override, findById already ADMIN-only)
- `backend/src/test/java/com/dh/dentalClinicMVC/controller/AppointmentControllerTest.java` — Phase 4: 4 new scenarios (DENTIST own/cross + ADMIN/PATIENT regressions)

### Configuration & Properties

- `backend/src/main/resources/application-dev.properties` — removed JWT_SECRET fallback literal
- `backend/src/main/resources/application-prod.properties` — no change (already no fallback)

### Not Modified

- `SecurityConfiguration.java` — no new endpoint (decision against admin-only create route)
- `DataInitializer.java` — seed unchanged; `createAdmin()` deletion doesn't affect it

## Verification Result

**Verdict**: PASS WITH WARNINGS
**Date**: 2026-06-22
**Report**: `VERIFY.md` (independent, fresh-context re-verification)

### Summary

- All 7 task phases (0-6) verified: every checkbox `[x]` confirmed against current source
- Full test suite: 49/49 passing (baseline 28 + 21 new), 0 failures, 0 errors, 0 skipped
- Spec conformance: all 12 scenarios (6 admin-account + 6 object-level-authz) independently re-verified against source and live behavior
- Live exploit re-verification: all 5 vulnerabilities confirmed closed via real curl payloads against running instance
- Logging BLOCKER fix: all 5 `log.warn(...)` denial points confirmed firing live (one BLOCKER discovered during post-apply 4R review, added in apply phase 5)
- Zero new CRITICAL findings

### Task Completion Reconciliation

| Phase | Claim | Source Evidence | Status |
|---|---|---|---|
| 0 | 0 insecure-behavior tests found, baseline 28 green | Re-grep + file count progression | CONFIRMED |
| 1 | `update-names` deleted, 404 (not 401/403) | Route absent, handler maps exception correctly | CONFIRMED |
| 2 | Fallback removed from application-dev.properties | Line 15: `app.jwt.secret=${JWT_SECRET}` (no `:` default) | CONFIRMED |
| 3 | Admin lockdown + `createAdmin()` deleted | Repo-wide grep: zero `createAdmin` matches | CONFIRMED |
| 4 | Appointment findById ownership check | Source: `hasRole()` check + ownership compare present | CONFIRMED |
| 5 | Patient/Dentist IDOR fix + findById policy | Source: resolve-from-principal + strip logic verbatim matches design | CONFIRMED |
| 6 | 49/49 tests pass, live exploit closure, zero remaining references | Full suite re-run + grep + live curl matrix | CONFIRMED |

No unchecked tasks. No CRITICAL findings from completion audit.

### Findings

- **0 CRITICAL** — no product vulnerabilities detected in archive verification
- **4 WARNINGS** — pre-existing, deferred by explicit user choice from prior 4R security review (not re-litigated, only restated):
  - **R3**: `findByEmail`-miss edge case (stale JWT + missing backing row) has zero test coverage and inconsistent HTTP status codes (403 vs 400). Classified WARNING (non-blocking, quality debt).
  - **R2**: Inline `isAdmin`/`privileged` role-check duplication across 3 controllers despite `AppointmentController.hasRole()` helper existing. Classified WARNING (non-blocking, refactoring debt).
  - **R1**: Self-service update's strip-list (`role`, `email`) doesn't include `cardIdentity`/`registrationNumber`; unique-constraint collision returns confusing 400 instead of silent ignore. Classified WARNING (non-blocking, UX debt).
  - **R4**: Missing `JWT_SECRET` on dev profile fails to boot with buried stack trace. Classified WARNING (non-blocking, onboarding debt).
- **2 SUGGESTION**:
  - Consider documenting in README/`.env.example` that `JWT_SECRET` must be set for both `dev` and `prod` profiles.
  - PR description MUST include operational note: historical JWT_SECRET fallback (now removed from config) is NOT rotated by this change — team must rotate out-of-band via env var update.

### Known Pre-existing Debt (out of scope for this change)

- Items 4-5 of the audit (frontend stored-XSS in `ui-manager.js` + JWT-in-localStorage vs httpOnly cookie) are a separate, not-yet-started sibling SDD change.
- Three earlier out-of-scope items from the prior wiring change (irrelevant to this change, documented in separate Engram observations).

## Specs Synced

Both delta specs from the change folder have been moved to the main `openspec/specs/` directory as the authoritative, reusable capability definitions:

| Capability | Action | Source | Target | Details |
|---|---|---|---|---|
| admin-account-provisioning | NEW | `openspec/changes/backend-authz-hardening/specs/admin-account-provisioning/spec.md` | `openspec/specs/admin-account-provisioning/spec.md` | Delta spec copied as-is; no prior spec existed |
| object-level-authorization | NEW | `openspec/changes/backend-authz-hardening/specs/object-level-authorization/spec.md` | `openspec/specs/object-level-authorization/spec.md` | Delta spec copied as-is; no prior spec existed |

Both specs are PURPOSE/OVERVIEW framed and context-independent (not tied to this specific change), so they transfer directly to main specs with no modification.

## Archive Contents

- `proposal.md` ✅ — full proposal with 9 success criteria, risks, rollback plan
- `design.md` ✅ — 3 architecture decisions, exact technical approach, file changes, testing strategy
- `tasks.md` ✅ — 6 phases, all checkboxes `[x]`, Phase 0 test inventory, review workload forecast
- `VERIFY.md` ✅ — independent fresh-context verification, all scenarios re-verified, live exploit re-verification, findings (0 CRITICAL, 4 pre-existing WARNING, 2 SUGGESTION)
- `specs/admin-account-provisioning/spec.md` ✅ — delta spec from change folder
- `specs/object-level-authorization/spec.md` ✅ — delta spec from change folder
- `ARCHIVE.md` ✅ — this report

## Source of Truth Updated

- `openspec/specs/admin-account-provisioning/spec.md` — now the canonical admin-account-provisioning spec (NEW)
- `openspec/specs/object-level-authorization/spec.md` — now the canonical object-level-authorization spec (NEW)

## SDD Cycle Complete

The change was fully planned (propose → spec → design → tasks), implemented (apply across 6 phases, 49/49 tests green), verified (fresh-context holistic pass, 0 CRITICAL, all 5 vulnerabilities closed), and archived. Ready for the next change. Orchestrator must handle final git operations: move `openspec/changes/backend-authz-hardening/` out of active changes (it is now replaced by the archive folder), commit all code changes (production + test files, config, new main specs), and coordinate with the PR workflow.

## Deferred Out-of-Scope Work

**Items 4-5 (Sibling Change - Not Started)**:
- Item 4: Frontend stored-XSS escaping in `appointment/`, `patient/`, `dentist/` `modules/ui-manager.js` (template-literal `innerHTML` with unescaped user fields) and `postLogin.js`'s inline `<script>` interpolation.
- Item 5: JWT double-storage (`localStorage` vs httpOnly cookie) in `auth-api.js` / `postLogin.js`.

These are explicitly out of scope here; a separate SDD change must be initiated to cover frontend transport/XSS concerns.

## Engram Observations (for cross-session traceability)

- Proposal: #976 (`sdd/backend-authz-hardening/proposal`)
- Spec: #977 (`sdd/backend-authz-hardening/spec`)
- Design: #978 (`sdd/backend-authz-hardening/design`)
- Tasks: #979 (`sdd/backend-authz-hardening/tasks`)
- Apply Progress: #980 (`backend-authz-hardening: all 6 apply phases done + 4R security review + BLOCKER logging fix`)
- Verify Report: #1011 (`sdd/backend-authz-hardening/verify-report`)
- Archive Report: will be saved as `sdd/backend-authz-hardening/archive-report`
