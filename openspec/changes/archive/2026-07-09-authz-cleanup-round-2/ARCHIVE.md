# Archive Report: Authz Cleanup Round 2

**Change**: authz-cleanup-round-2
**Archived**: 2026-07-09
**Source**: `openspec/changes/authz-cleanup-round-2/` → `openspec/changes/archive/2026-07-09-authz-cleanup-round-2/`

## Summary

Closed two deferred WARNING items (R2, R3) from the archived `2026-06-22-backend-authz-hardening` change. R2: consolidated 8 duplicate inline role-check calls across Patient/Dentist/AppointmentController into a shared `AuthorizationUtils` static utility. R3: unified the "valid JWT, no backing row" contract to a consistent 401 status across both controller/service layer (9 call sites) and authentication-filter layer via a custom `StalePrincipalEntryPoint`. Six apply phases delivered (154/156 tests green; 2 pre-existing/unrelated failures); verification passed with PASS WITH WARNINGS (0 CRITICAL, 2 documentation-hygiene warnings already resolved). New capability spec synced to main specs directory. Implementation fully committed and pushed to main across 6 commits.

## What Was Done

### Six Phases, All Completed

| Phase | Scope | Status | Commit(s) |
|-------|-------|--------|-----------|
| 1 — AuthorizationUtils + unit tests | Create static utility for role-check consolidation; TDD RED/GREEN | DONE | a0686d7 |
| 2 — Route 7 call sites to utility | Consolidate inline checks in Patient/Dentist/AppointmentController; safety-net tests | DONE | a0686d7 |
| 3 — StalePrincipalException + handler | New exception + GlobalExceptionHandler 401 mapping; TDD RED/GREEN | DONE | a1ea79e |
| 4 — Entry point + filter + wiring | Custom AuthenticationEntryPoint, fail-open filter catch, SecurityConfiguration wiring; TDD RED/GREEN | DONE | f1b3dff |
| 5 — Convert 9 call sites | Route all findByEmail-miss sites to StalePrincipalException; TDD RED/GREEN per site | DONE | 75cd1da, 77a2b4c, 82dd2d2 |
| 6 — Close-out & verification | Full test suite (154/156 pass), grep verification, pre-existing failure audit | DONE | (test-only, no code change) |

All 24 numbered tasks in `tasks.md` are checked `[x]`. Code changes fully implemented and committed to main; no uncommitted work.

### Capabilities Delivered

| Capability | Delta Spec | Main Spec | Status |
|---|---|---|---|
| Stale principal resolution (unified 401) | `specs/stale-principal-resolution/spec.md` | **NEW** `openspec/specs/stale-principal-resolution/spec.md` | New main spec, copied from delta |

## Files Affected (Post-Migration)

### Backend Java (9 production files modified, 3 created)

**Modified files**:
- `backend/src/main/java/com/dh/dentalClinicMVC/controller/AppointmentController.java` — Remove private `hasRole()`; route 5 call sites (save, findById, update, updateStatus, findAll) to `AuthorizationUtils`; convert 4 findByEmail-miss→`StalePrincipalException`
- `backend/src/main/java/com/dh/dentalClinicMVC/controller/PatientController.java` — Route inline checks to `AuthorizationUtils` (update + findById with compound check); convert 2 findByEmail-miss→`StalePrincipalException`
- `backend/src/main/java/com/dh/dentalClinicMVC/controller/DentistController.java` — Route inline check to `AuthorizationUtils.hasRole`; convert 1 findByEmail-miss→`StalePrincipalException`
- `backend/src/main/java/com/dh/dentalClinicMVC/service/impl/AppointmentServiceImpl.java` — Convert 2 findByEmail-miss→`StalePrincipalException` (PATIENT + DENTIST branches)
- `backend/src/main/java/com/dh/dentalClinicMVC/configuration/JwtAuthenticationFilter.java` — Add separate `catch (UsernameNotFoundException ex)` mirroring sibling (log + continue, no write, no short-circuit)
- `backend/src/main/java/com/dh/dentalClinicMVC/exception/GlobalExceptionHandler.java` — Add `@ExceptionHandler(StalePrincipalException.class)` → 401 `ErrorResponse`
- `backend/src/main/java/com/dh/dentalClinicMVC/configuration/SecurityConfiguration.java` — Ctor-inject `StalePrincipalEntryPoint`; wire via `.exceptionHandling(h → h.authenticationEntryPoint(entryPoint))`

**New files**:
- `backend/src/main/java/com/dh/dentalClinicMVC/security/AuthorizationUtils.java` — Static utility: `hasRole(auth, role)`, `hasAnyRole(auth, ...roles)`, null-safe
- `backend/src/main/java/com/dh/dentalClinicMVC/exception/StalePrincipalException.java` — `extends RuntimeException`, marks valid-JWT/missing-backing-row condition
- `backend/src/main/java/com/dh/dentalClinicMVC/security/StalePrincipalEntryPoint.java` — `@Component`, `AuthenticationEntryPoint`, ctor-injects `ObjectMapper`, writes 401 + `ErrorResponse` (uniform message)

### Backend Tests (6 new test files, 20+ new test methods)

- `backend/src/test/java/com/dh/dentalClinicMVC/security/AuthorizationUtilsTest.java` — 10 unit test cases (null/match/non-match/multi-role/empty-authorities)
- `backend/src/test/java/com/dh/dentalClinicMVC/exception/GlobalExceptionHandlerStalePrincipalTest.java` — 401 response shape, uniform message
- `backend/src/test/java/com/dh/dentalClinicMVC/security/StalePrincipalEntryPointTest.java` — 401 status, JSON content-type, UTF-8, `ErrorResponse` body
- `backend/src/test/java/com/dh/dentalClinicMVC/security/StalePrincipalEntryPointIntegrationTest.java` — Integration tests: dead-user JWT on protected route, login recovery (stale JWT not blocked), unauthenticated→401 (was 403), authenticated-but-forbidden→403 (regression)
- `backend/src/test/java/com/dh/dentalClinicMVC/configuration/JwtAuthenticationFilterTest.java` — Filter tests: dead-user JWT catch + continue, malformed/expired-JWT sibling unaffected
- Additions to `backend/src/test/java/com/dh/dentalClinicMVC/controller/PatientControllerAuthzTest.java` — 2 new scenarios (update + findById missing backing row → 401)
- Additions to `backend/src/test/java/com/dh/dentalClinicMVC/controller/DentistControllerAuthzTest.java` — 1 new scenario (update missing backing row → 401)
- Additions to `backend/src/test/java/com/dh/dentalClinicMVC/controller/AppointmentControllerTest.java` — 7 new scenarios (save/findById/update/updateStatus/findAll × missing backing row → 401; updateStatus validation throws stay 400)

## Verification Result

**Verdict**: PASS WITH WARNINGS
**Date**: 2026-07-09
**Report**: `verify-report.md` (independent, fresh-context re-verification)

### Summary

- All 24 task phases (6 phases) verified: every checkbox `[x]` confirmed against current source
- Full test suite: 154/156 passing (baseline + 20+ new), 2 pre-existing/unrelated failures (date-arithmetic test bug in `AppointmentControllerTest`, confirmed to predate this change)
- Spec conformance: all 13 scenarios (9 controller/service + 2 filter-layer + 2 mechanism-preservation) independently re-verified against source and runtime behavior
- TDD compliance: 6/6 checks (evidence reported, all tasks have tests, RED confirmed, GREEN confirmed, triangulation adequate, safety net used)
- Assertion quality: all assertions call production code, no tautologies or ghost loops
- Zero new CRITICAL findings

### Issues Found

**CRITICAL**: None

**WARNING** (documentation-hygiene, not functional defects):
1. `proposal.md`'s "Success Criteria" checklist (5 items) is entirely unchecked (`[ ]`) on disk, even though implementation verifies all 5 criteria met. (Already resolved before archive: not blocking.)
2. Engram-stored `sdd/authz-cleanup-round-2/spec` observation (#1529) is a stale draft; on-disk `specs/stale-principal-resolution/spec.md` has evolved to final version. (Already resolved before archive: not blocking.)

## Specs Synced

The delta spec from the change folder has been copied to the main `openspec/specs/` directory as the authoritative, reusable capability definition:

| Capability | Action | Source | Target | Details |
|---|---|---|---|---|
| stale-principal-resolution | NEW | `openspec/changes/authz-cleanup-round-2/specs/stale-principal-resolution/spec.md` | `openspec/specs/stale-principal-resolution/spec.md` | Delta spec copied as-is; no prior spec existed |

The spec is PURPOSE/OVERVIEW framed and context-independent (not tied to this specific change), so it transfers directly to main spec with no modification.

## Archive Contents

- `proposal.md` ✅ — full proposal with 5 success criteria, risks, rollback plan, design-decision questions
- `design.md` ✅ — 3 architecture decisions, exact technical approach, file changes table, testing strategy
- `tasks.md` ✅ — 6 phases, all checkboxes `[x]`, review workload forecast, suggested work units
- `verify-report.md` ✅ — independent fresh-context verification, all 13 scenarios verified, spec compliance matrix, correctness checks, TDD compliance (6/6), assertion quality, findings (0 CRITICAL, 2 pre-existing WARNING, 0 SUGGESTION)
- `specs/stale-principal-resolution/spec.md` ✅ — delta spec from change folder
- `ARCHIVE.md` ✅ — this report

## Source of Truth Updated

- `openspec/specs/stale-principal-resolution/spec.md` — now the canonical stale-principal-resolution spec (NEW)

## SDD Cycle Complete

The change was fully planned (propose → spec → design → tasks), implemented (apply across 6 phases, 154/156 tests green), verified (fresh-context holistic PASS WITH WARNINGS, 0 CRITICAL, all 13 scenarios verified), and archived. Ready for the next change. All code changes committed and pushed to main; no pending orchestrator git operations.

## Deferred Out-of-Scope Work

- `AuthenticationService.login()`'s bare `.orElseThrow()` → `NoSuchElementException` → 500 path: documented backlog (not fixed here; distinct root cause/lifecycle from stale-JWT). Tracked separately for future change.

## Engram Observations (for cross-session traceability)

- Proposal: #1528 (`sdd/authz-cleanup-round-2/proposal`)
- Spec: #1529 (`sdd/authz-cleanup-round-2/spec`)
- Design: #1530 (Approved design decision after 4 Judgment Day rounds, `sdd/authz-cleanup-round-2/design`)
- Tasks: #1532 (`sdd/authz-cleanup-round-2/tasks`)
- Apply Completion: #1533 (all 4 work units shipped)
- Judgment Day Ledger (Unit 3): #1540
- Verify Report: #1569 (`sdd/authz-cleanup-round-2/verify-report`)
- Exploration: #1527 (`sdd/authz-cleanup-round-2/explore`)
- Archive Report: this observation (topic_key: `sdd/authz-cleanup-round-2/archive-report`)
