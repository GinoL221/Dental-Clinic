# Verification Report: unify-global-wiring-source

**Verdict**: PASS WITH WARNINGS
**Date**: 2026-06-21
**Mode**: Full artifacts (proposal + specs + design + tasks + apply-progress) — fresh-context holistic re-derivation, not a re-run of per-slice verification.

## Summary

All 5 slices (Guard, Appointment, Patient, Dentist, Auth) are committed
(`93d8088`, `0a1d4a2`, `849ae17`, `8265ffc`, `c71cc6e`) and independently
re-derived from current source — not trusted from the apply-progress report.
Full suite: **178 passed, 6 skipped, 0 failed**, matching the baseline claimed
at every slice. Guard test: **14/14 green**. Live continuous-session
cross-entity smoke test (single browser tab, single login, sequential visits
to all 4 entities + back to a non-auth page): **zero accumulated console/page
errors**, `window.authController` persisted throughout, every entity
controller singleton existed and was initialized on its pages.

0 CRITICAL findings. 2 WARNING findings (both pre-existing process/documentation
gaps, not code defects). 1 SUGGESTION. Recommend `sdd-archive`.

## Task Completion Audit

Spot-checked tasks.md against current source — all `[x]` marks for Phases 0-4
hold true under independent re-inspection (not just trusted):

| Task | Claim | Verified against current source |
|---|---|---|
| 0.1-0.8 | Guard created, file-set/regex/exemption/messages implemented, 2 real bugs found+fixed | `frontend/test/global-wiring-source.test.js` read in full — matches spec's contract exactly (13-file table, all RHS styles, singleton exemption, actionable message). `window.confirmDeleteAppointment` and `window.cancelPatientEdit` each now assigned in exactly 1 file (grep-confirmed). |
| 1.1-1.6 | Appointment exports `initAppointmentController`, no self-listener, both wrappers delegate | Confirmed by direct read: canonical has 0 `DOMContentLoaded`, export matches design's exact code shape, both wrappers call `initAppointmentController()`. |
| 2.1-2.6 | Patient exports `initPatientController` over `getInstance()`, no self-listener, 3 wrappers delegate | Confirmed: canonical wraps `getInstance()` + `await controller.init()`, `isInitialized` guard present in `init()`. All 3 wrappers grep-confirmed delegating. |
| 3.1-3.5 | Dentist exports `initDentistController` over `getInstance()`, ordering preserved | Confirmed: `setupGlobalEvents()` in `dentist-controller.js` runs at line 22, strictly after `await initDentistController()` at line 14. Diff vs. pre-Slice-0 (`337d380`) shows ONLY the wiring-mechanism change, no stray edits. |
| 4.1-4.6 | Auth keeps canonical's listener routed through export, `login-controller.js` defers, `register-controller.js`/`head.ejs` untouched | Confirmed: canonical's listener (1 `DOMContentLoaded`) calls `initAuthController()` then route-protection/HTTP-interceptor setup. `login-controller.js` delegates. `register-controller.js` and `head.ejs` show **zero diff** in `git diff 337d380 HEAD` — explicitly re-verified, not assumed. |
| 5.1-5.3 | Marked `[ ]` (unchecked) in tasks.md, but apply-progress claims "effectively satisfied by cumulative evidence" | **WARNING** (see below) — now independently satisfied by this verify pass: full suite re-run fresh (178/0/6) and one continuous live cross-entity smoke test executed (the per-slice live checks were all isolated/per-entity; this is the first true single-session, single-login, cross-entity-in-one-pass check). |

No task marked done was found to be false. The Phase 5 checkbox gap is a
process/documentation issue, not an implementation gap — flagged as WARNING.

## Spec Conformance (re-derived independently per entity)

### Requirement: Single Controller-Init Path Per Entity

`DOMContentLoaded` listener count per canonical+wrapper file, read directly:

| File | Listeners |
|---|---|
| `appointment/modules/index.js` | 0 |
| `appointment/appointment-controller.js` | 1 (delegates) |
| `appointment/appointment-list-controller.js` | 1 (delegates) |
| `patient/modules/index.js` | 0 |
| `patient/patient-add-controller.js` | 1 (delegates) |
| `patient/patient-edit-controller.js` | 1 (delegates) |
| `patient/patient-list-controller.js` | 1 (delegates) |
| `dentist/modules/index.js` | 0 |
| `dentist/dentist-controller.js` | 1 (delegates) |
| `dentist/dentist-list-controller.js` | 1 (delegates) |
| `auth/modules/index.js` | 1 (the documented exception — performs the real construct-and-init sequence) |
| `auth/login-controller.js` | 1 (delegates via `initAuthController()`, does NOT re-instantiate) |
| `auth/register-controller.js` | 1 (form-validation only, never touches `AuthController`) |

**Compliant.** Exactly one controller-construct-and-init path per entity.
Auth's canonical legitimately keeps its listener per Decision 1 Option B; no
wrapper duplicates the construct-and-init sequence.

### Requirement: Exported Init Function Is Idempotent

- Appointment/Auth (`new` variant): `if (window.xController) return window.xController;` confirmed as the first line of each export, by direct read.
- Patient/Dentist (`getInstance` variant): `getInstance()` itself guards re-construction (`if (!window.xController) { window.xController = new XController(); }`); `controller.init()` is additionally guarded by `if (this.isInitialized) { ...; return; }` confirmed present in both `patient/modules/index.js:55-59` and `dentist/modules/index.js:56-60`.

**Compliant** for both variants — idempotency confirmed at the source level, not just claimed.

### Requirement: No Observable Runtime Surface Change

`git diff 337d380 HEAD -- frontend/public/js/ frontend/src/views/partials/head.ejs`
shows exactly 12 files changed (the 11 design-listed files plus `login-controller.js`
already counted), 64 insertions / 219 deletions — all deletions are the removed
duplicate instantiate-publish-init blocks and debug counters, confirmed by spot-checking
`dentist-controller.js`'s diff line-by-line: the only change is
`new DentistController()` + manual publish/init block → `await initDentistController()`.
No `window.*` assignment was added, removed, or renamed as a side effect anywhere
in the diff. `head.ejs` and `register-controller.js` show **zero diff** (confirmed,
not assumed) — `git diff 337d380 HEAD` returns empty output for both.

The 2 dead-code removals (`confirmDeleteAppointment`, `cancelPatientEdit`) from
Slice 0 are correctly excluded from this check, per instructions — they were a
deliberate, separate, pre-refactor bugfix, not a side effect of the wiring-mechanism
change in Slices 1-4.

**Compliant.**

### Requirement: Auth Initializes Correctly From Both Entry Points

Live-verified in this pass (not just trusted from apply-progress) via a single
continuous browser session: non-auth pages (`/patients`, `/dentists`, and their
`/add` variants) reached only through the sitewide `head.ejs` tag show
`window.authController` defined and `isInitialized: true`; the login-page wrapper
flow (`/users/login` → submit → redirect to `/appointments`) produces exactly one
`window.authController` instance throughout (no second instance created), and
`window.login`/`isAuthenticated`/`getCurrentUser`/`isAdmin` are all callable and
correct after login on a later non-auth page in the same session.

**Compliant.**

## Guard Conformance

`frontend/test/global-wiring-source.test.js` read in full as it stands post all
5 slices (including the Slice 1 and Slice 3 updates to pre-existing assertions).
Matches `duplicate-window-assignment-guard/spec.md` exactly:

- File-set table: 13 files (Appointment 3, Patient 4, Dentist 3, Auth 3) — matches spec table, with an explicit code comment correctly noting the spec's own summary line undercounts itself (11 vs. table's actual 13). This is a spec documentation defect, not a guard defect — see WARNING below.
- Assignment-detection regex (`/window\.([A-Za-z_$][A-Za-z0-9_$]*)\s*=(?!=)/g`) covers all RHS styles per spec, confirmed not flagging reads (`if (window.x)`) or `window.location.*`.
- Singleton exemption rule implemented exactly: `appointmentController`/`patientController`/`dentistController`/`authController` excluded from the duplicate check.
- Actionable failure message format pinned by a dedicated synthetic-fixture test, includes offending global name + both file paths.

Ran in isolation: **14/14 tests passed**.

## Regression Check

Full suite run fresh, this session: **178 passed, 6 skipped, 0 failed** — exact
match to the baseline reported identically across all 5 slices. No CRITICAL finding.

## Live Cross-Entity Smoke Test (continuous single session)

Backend (Spring Boot, port 8080) + frontend (Express/EJS, port 3000) started
fresh. Single browser tab, single login as seeded admin
(`admin@dentalclinic.com`/`admin123`), then sequential same-tab navigation:

`/users/login` (pre-login) → login submit → `/appointments` (post-redirect) →
`/patients` → `/dentists` → `/appointments/add` → `/patients/add` →
`/dentists/add` → `/dentists` (final non-auth check)

Results:
- `window.authController` existed and was `isInitialized: true` on every single
  page visited, including pre-login.
- `window.appointmentController` existed on both appointment pages;
  `window.patientController` on both patient pages; `window.dentistController`
  on both dentist pages — each exactly once per page (no duplicate-instance
  warnings observed).
- `window.isAuthenticated()` → `true`, `window.getCurrentUser()` →
  `{id:1, email:"admin@dentalclinic.com", role:"ADMIN", isAdmin:true, ...}`,
  `window.isAdmin()` → `true`, all checked on the final non-auth page after the
  full navigation sequence.
- **Zero console/page errors accumulated across the entire session** (checked
  cumulatively, not per-page reset) — this is the dimension the per-slice
  verifications could not exercise, since each slice tested its entity in
  isolation.

One methodological note (not a product finding): the first run of this smoke
test showed `isAuthenticated: false` immediately after the submit click — this
was traced to the test script clicking submit without awaiting the resulting
navigation (a race in the harness itself, not the product). Re-run with
`page.waitForURL(...)` alongside the click resolved it cleanly and reproduced
on a second independent run. Not flagged as a finding against the change.

Both servers stopped cleanly after verification (port 8080 required an explicit
`kill -9` after `pkill` did not fully release it — same fallback pattern noted
in the Slice 3/4 apply-progress).

## Findings

### CRITICAL
None.

### WARNING

1. **tasks.md Phase 5 (5.1-5.3) left unchecked despite apply-progress claiming
   "effectively satisfied."** The checklist items themselves were never run as
   a dedicated, separate confirmation pass before this verify phase — they were
   inferred from cumulative per-slice evidence. This verify pass now
   independently satisfies 5.1 (fresh full-suite run, 178/0/6) and 5.2 (one
   continuous live cross-entity smoke test, the first that wasn't per-entity
   isolated). Recommend checking off 5.1-5.3 in `tasks.md` before archive,
   citing this verify report as the evidence, rather than leaving them
   permanently `[ ]` on a "done" change.

2. **Spec documentation defect**: `duplicate-window-assignment-guard/spec.md`'s
   Entity File-Set Definition section states "11 files total" in its scenario
   text, but its own table lists 13 (Appointment 3 + Patient 4 + Dentist 3 +
   Auth 3). The implementation correctly followed the table (13), and the test
   file even contains a code comment explicitly calling out the spec's own
   miscount. This is harmless because the guard test took the table as the
   actual source of truth and is correct — but the spec artifact itself remains
   internally inconsistent and should be corrected at archive time so future
   readers of the spec are not misled by the prose vs. table mismatch.

### SUGGESTION

1. The guard's `EXCLUDED_FILES` list (`dentist-specialty-ui.js`,
   `dashboard-controller.js`) is asserted as "not in scope" but there's no
   assertion that these files are themselves free of the duplicate-assignment
   bug class — they're just out of THIS guard's scope by design (correct per
   spec), but if either file is ever folded into a canonical/wrapper pair in
   the future, nothing currently warns that it needs adding to
   `ENTITY_FILE_SETS`. Not blocking; worth a one-line backlog note if the
   codebase grows another entity.

## Out-of-Scope Discoveries (already tracked, not re-flagged as this change's bugs)

Encountered again during this pass but correctly NOT treated as findings of
`unify-global-wiring-source`, per their own out-of-scope status:
- `dentist-specialty-ui.js` dead/duplicate-listener code (separate from this guard's scope).
- Patient edit form `_edit`-suffix field-ID bug in `ui-manager.js`/`patientEdit.ejs` (pre-existing, introduced in `e774f69`).
- Appointment `AppointmentController` async-init abort-on-navigate characteristic (pre-existing lifecycle behavior, no abort handling).
- The already-merged, explicitly out-of-scope `dentist-controller.js` 9-collision fix (`337d380`), predating this change.

## Next Recommended

`sdd-archive` — 0 CRITICAL findings, both WARNINGs are documentation/process
cleanup items that can be folded into the archive step (check off tasks.md
Phase 5, optionally fix the spec's 11-vs-13 prose) rather than blocking
archive. All Success Criteria in `proposal.md` are satisfied by source
inspection plus the live smoke test in this report.
