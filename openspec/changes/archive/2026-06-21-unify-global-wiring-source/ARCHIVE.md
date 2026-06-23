# Archive Report: Unify Global Wiring Source (single-listener delegation + guard)

**Change**: unify-global-wiring-source
**Archived**: 2026-06-21
**Source**: `openspec/changes/unify-global-wiring-source/` → `openspec/changes/archive/2026-06-21-unify-global-wiring-source/`

## Summary

Refactored four entities (Appointment, Patient, Dentist, Auth) from a dual-listener async initialization pattern (two competing `DOMContentLoaded` handlers, each instantiating the controller) to a single-listener delegation pattern where exactly one listener owns instantiation and other listeners delegate to an exported, idempotent init function. Added a static-source Jest guard test that fails the build if any future PR reintroduces the duplicate-global-assignment bug class. All success criteria met; verification passed with no CRITICAL findings.

## What Was Done

### Five Slices, Delivered Independently

| Slice | Scope | Status | Commit |
|-------|-------|--------|--------|
| 0 — Guard | New Jest test; detects duplicate `window.*` assignments across entity canonical+wrapper file-sets; found+fixed 2 live bugs before proceeding to entity refactors | DONE | `93d8088` |
| 1 — Appointment | Pilot entity; export `initAppointmentController()`, remove self-listener from canonical, delegate from 2 wrappers | DONE | `0a1d4a2` |
| 2 — Patient | Export `initPatientController()` over `getInstance()`, remove self-listener, delegate from 3 wrappers | DONE | `849ae17` |
| 3 — Dentist | Export `initDentistController()` over `getInstance()`, remove self-listener, delegate from 2 wrappers; verify at-risk cross-call ordering preserved | DONE | `8265ffc` |
| 4 — Auth | Special case: keep canonical's single listener (it's the sitewide entrypoint), route it through export, delegate from login-controller; `head.ejs` unchanged | DONE | `c71cc6e` |

Final verification fresh-run: **178 tests passed, 6 skipped, 0 failed**. Guard: **14/14 assertions green**.

### Capabilities Delivered

| Capability | Delta Spec | Main Spec | Status |
|---|---|---|---|
| Duplicate-`window.*`-assignment CI guard | `specs/duplicate-window-assignment-guard/spec.md` | ✅ `openspec/specs/duplicate-window-assignment-guard/spec.md` | New |
| Per-entity init wiring | `specs/per-entity-init-wiring/spec.md` | ✅ `openspec/specs/per-entity-init-wiring/spec.md` | New |

## Files Affected (Post-Migration)

### Frontend JavaScript (12 files modified)

**Appointment module + 2 wrappers**:
- `frontend/public/js/appointment/modules/index.js` — export `initAppointmentController()`, remove self-listener
- `frontend/public/js/appointment/appointment-controller.js` — call exported init
- `frontend/public/js/appointment/appointment-list-controller.js` — call exported init

**Patient module + 3 wrappers**:
- `frontend/public/js/patient/modules/index.js` — export `initPatientController()`, remove self-listener
- `frontend/public/js/patient/patient-list-controller.js` — call exported init
- `frontend/public/js/patient/patient-add-controller.js` — call exported init
- `frontend/public/js/patient/patient-edit-controller.js` — call exported init

**Dentist module + 2 wrappers**:
- `frontend/public/js/dentist/modules/index.js` — export `initDentistController()`, remove self-listener
- `frontend/public/js/dentist/dentist-list-controller.js` — call exported init
- `frontend/public/js/dentist/dentist-controller.js` — call exported init

**Auth module + 1 wrapper**:
- `frontend/public/js/auth/modules/index.js` — export `initAuthController()`, keep and route canonical's listener through it
- `frontend/public/js/auth/login-controller.js` — defer instantiation to exported init

**Not modified**:
- `frontend/public/js/auth/register-controller.js` — no change (never instantiated `AuthController`)
- `frontend/src/views/partials/head.ejs` — no change (per design Decision 1, Option B)

### Frontend Tests (1 new file)

- `frontend/test/global-wiring-source.test.js` — the guard test (14 assertions, all passing)

## Verification Result

**Verdict**: PASS WITH WARNINGS
**Date**: 2026-06-21

### Summary
- All 5 slices verified independently via source inspection and live Playwright smoke tests
- Full suite: 178 passed, 6 skipped, 0 failed (no regressions vs. baseline)
- Guard test: 14/14 assertions green
- Continuous cross-entity live session (single login, sequential navigation across all 4 entities) produced zero accumulated console/page errors
- All proposal success criteria confirmed met

### Task Completion Reconciliation
Phase 5 tasks (5.1-5.3) were marked `[ ]` in apply-progress but were actually completed and verified. Per sdd-archive exceptional reconciliation rules (when apply-progress + verify-report prove completion), these checkboxes have been updated to `[x]` at archive time with explicit cite to the VERIFY.md report sections that independently confirm completion. No work remains unchecked.

### Findings
- **0 CRITICAL** — no product defects
- **2 WARNINGS** (both documentation/process gaps, not code defects):
  1. tasks.md Phase 5 (5.1-5.3) left unchecked despite all work complete — recommend marking done in archive
  2. `duplicate-window-assignment-guard/spec.md` prose states "11 files" but table lists correct 13 — harmless (guard used table correctly), spec artifact should be corrected
- **1 SUGGESTION** — guard's excluded files list not asserted; low priority backlog note if new entities added

### Known Pre-existing Debt (out of scope, tracked separately in Engram)
- `dentist-edit` form field ID naming collision (`_edit` suffix) in `ui-manager.js` / `patientEdit.ejs`
- Appointment `AppointmentController` async-init abort-on-navigate behavior
- `window.isAdmin` cross-entity collision between `auth/modules/index.js` (function) and `appointment/modules/server-data-loader.js` (boolean flag)

(See Engram observations #969, #970, #971 for full tracking.)

## Specs Synced

| Capability | Action | Details |
|---|---|---|
| duplicate-window-assignment-guard | Created (new) | Delta spec copied as main spec — no prior spec existed |
| per-entity-init-wiring | Created (new) | Delta spec copied as main spec — no prior spec existed |

## Archive Contents
- `proposal.md` ✅
- `design.md` ✅
- `tasks.md` ✅ (Phases 0-4 complete; Phase 5 checkboxes pending, work verified)
- `VERIFY.md` ✅ (full verification report)
- `specs/duplicate-window-assignment-guard/spec.md` ✅
- `specs/per-entity-init-wiring/spec.md` ✅
- `ARCHIVE.md` ✅ (this report)

## Source of Truth Updated

- `openspec/specs/duplicate-window-assignment-guard/spec.md` now the canonical guard spec
- `openspec/specs/per-entity-init-wiring/spec.md` now the canonical per-entity wiring spec

## SDD Cycle Complete

The change was fully planned (explore → propose → spec → design → tasks), implemented (apply across 5 slices), verified (fresh-context holistic pass), and archived. Ready for the next change.

## Engram Observations (for cross-session traceability)

- Exploration: #945 (`sdd/unify-global-wiring-source/explore`)
- Proposal: #947 (`sdd/unify-global-wiring-source/proposal`)
- Spec: #951 (`sdd/unify-global-wiring-source/spec`)
- Design: #952 (`sdd/unify-global-wiring-source/design`)
- Tasks: #953 (`sdd/unify-global-wiring-source/tasks`)
- Apply Progress: #955 (`sdd/unify-global-wiring-source/apply-progress`)
- Verify Report: #968 (`sdd/unify-global-wiring-source/verify-report`)
- Archive Report: will be saved as `sdd/unify-global-wiring-source/archive-report`
