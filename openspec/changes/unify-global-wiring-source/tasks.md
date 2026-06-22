# Tasks: Unify Global Wiring Source (single-listener delegation + guard)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~430-520 total (guard ~90-120; Appointment ~50; Patient ~70; Dentist ~60; Auth ~40, incl. test scaffolding) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 0 (guard) → PR 1 (Appointment) → PR 2 (Patient) → PR 3 (Dentist) → PR 4 (Auth) |
| Delivery strategy | ask-on-risk (orchestrator-cached default; confirm before apply) |
| Chain strategy | pending — orchestrator decision required before apply |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 0 | Land guard test, green on current source | PR 0 | Test-only, additive, TDD safety net for units 1-4; base = main (or tracker, if feature-branch-chain) |
| 1 | Appointment single-listener delegation | PR 1 | 1 canonical + 2 wrappers; pilot/cleanest; independent of 2-4 |
| 2 | Patient single-listener delegation | PR 2 | 1 canonical + 3 wrappers; `getInstance` variant; independent of 1,3,4 |
| 3 | Dentist single-listener delegation | PR 3 | 1 canonical + 2 wrappers; `getInstance` variant + at-risk cross-call ordering; independent of 1,2,4 |
| 4 | Auth single-listener delegation | PR 4 | 1 canonical + 1 wrapper (`login-controller.js`); `register-controller.js` untouched; `head.ejs` untouched; independent of 1-3 |

Each unit is independently revertable per design's Rollback section. Total exceeds the 400-line budget across the whole change, but no single unit exceeds it — the guard rule is "decide chain strategy before apply," not "shrink the work."

## Phase 0: Guard (TDD safety net — must land and pass before any entity slice)

- [x] 0.1 Create `frontend/test/global-wiring-source.test.js` following the `*-srp-split.test.js` static-source style (`fs.readFileSync`, regex/string assertions, no DOM/import execution).
- [x] 0.2 Define the single source-of-truth file-set map for the 4 entities (paths relative to `frontend/public/js/`) per spec's Entity File-Set Definition table. **Correction**: spec's table totals 13 files (Appointment 3 + Patient 4 + Dentist 3 + Auth 3), not 11 as its summary line states — implemented per the table (13), which is the actual source of truth. Exclude `dentist/dentist-specialty-ui.js` and `dashboard/dashboard-controller.js` explicitly (asserted NOT scanned).
- [x] 0.3 Implement the assignment-extraction regex matching `window.<identifier> = ` across all RHS styles (arrow fn, async arrow, function expr, async function expr, direct value/instance) per spec's Assignment Detection Rule; must not flag reads (`if (window.x)`) or `window.location.*` access. Verified against real source for all 4 styles.
- [x] 0.4 Implement per-entity duplicate-name assertion: no global name in 2+ files of the same set, EXCEPT the singleton-controller-instance name per entity (`window.appointmentController`, `window.patientController`, `window.dentistController`, `window.authController`), which is exempt.
- [x] 0.5 Implement actionable failure messages containing the offending global name and both file paths (per spec's Actionable Failure Output requirement).
- [x] 0.6 RED check: injected `window.test123` into 2 auth files (the only currently-clean entity), confirmed the guard FAILS with an actionable message naming `test123` and both file paths, then fully reverted (`git diff --stat` confirms zero residual change in real source).
- [x] 0.7 RESOLVED — both real, pre-existing duplicate `window.*` assignments (`window.confirmDeleteAppointment` and `window.cancelPatientEdit`) were fixed in Slice 0 itself, isolated, before any entity-wiring slice started (dead/broken copies removed, confirmed zero runtime behavior change via grep + live Playwright). Guard is fully green on current source. See apply-progress (Engram `sdd/unify-global-wiring-source/apply-progress`) for full detail.
- [x] 0.8 Run full suite `cd frontend && npm test` — 176 passed (164 pre-existing + 12 new guard assertions), 2 failed (the 2 real bugs above, not a guard defect), 6 skipped, 184 total. Zero collateral regressions confirmed via isolated run excluding the new test file (164 passed / 6 skipped, matching exact pre-change baseline). **Gate not met**: do not proceed to Phase 1 until 0.7's blocker is resolved (either by fixing the 2 bugs as part of Phase 1/2 scope, or an explicit documented exemption decision).

## Phase 1: Appointment (pilot — `new` variant) — DONE

- [x] 1.1 Edit `frontend/public/js/appointment/modules/index.js`: add `export async function initAppointmentController()` (check-existing → `new AppointmentController()` → publish `window.appointmentController` BEFORE `await controller.init()` → return instance) per design's exact code shape. Remove the self-running `DOMContentLoaded` listener and the `initializationCount` debug counter. Keep `export default AppointmentController;`.
- [x] 1.2 Re-verify EJS script-tag wiring for `appointment-controller.js`: confirmed tagged on both `appointmentAdd.ejs:161` and `appointmentEdit.ejs:248` (shared add/edit wrapper) — no surprise vs. design's file list.
- [x] 1.3 Edit `frontend/public/js/appointment/appointment-controller.js`: import `initAppointmentController` from `../appointment/modules/index.js`, replace the instantiate-publish-init block with `appointmentController = await initAppointmentController(); isInitialized = true;`, keep all page-specific glue (`setupGlobalFunctions()`, autocomplete wiring, filter handlers, debug fns) untouched after the `await`.
- [x] 1.4 Edit `frontend/public/js/appointment/appointment-list-controller.js`: same delegation pattern as 1.3, preserving its own (disjoint) page glue verbatim.
- [x] 1.5 Run `cd frontend && npm test` — confirm guard still green and no regressions in `appointment-srp-split.test.js` or elsewhere. NOTE: `appointment-srp-split.test.js` had one pre-existing assertion pinning the OLD self-running-listener shape (byproduct of an earlier unrelated refactor) — updated it to pin the new exported-init shape, since the old shape is intentionally removed by this slice's design. Full suite: 178 passed, 6 skipped, 0 failed.
- [x] 1.6 Live-verify: started backend (Spring Boot) + frontend (Express/EJS), opened `/appointments` (list), `/appointments/add`, and `/appointments/edit/1` (real id) in a browser (Playwright), confirmed `window.appointmentController` exists exactly once and is initialized on all 3 pages, list/add/edit flows work (data loads correctly), filter/autocomplete interaction works, no console errors/duplicate-init warnings. Both servers stopped cleanly after.

## Phase 2: Patient (`getInstance` variant, 3 wrappers) — DONE

- [x] 2.1 Edit `frontend/public/js/patient/modules/index.js`: add `export async function initPatientController()` wrapping `PatientController.getInstance()` + `await controller.init()` per design's exact code shape (do NOT replace `getInstance` with `new`). Remove the self-running `DOMContentLoaded` listener. Keep `export default PatientController;`.
- [x] 2.2 Edit `frontend/public/js/patient/patient-list-controller.js`: replace `new PatientController()`/publish block with `await initPatientController()`, keep page-specific glue.
- [x] 2.3 Edit `frontend/public/js/patient/patient-add-controller.js`: same delegation pattern, preserve its own glue.
- [x] 2.4 Edit `frontend/public/js/patient/patient-edit-controller.js`: same delegation pattern, preserve its own glue.
- [x] 2.5 Run `cd frontend && npm test` — confirm guard still green and no regressions in `patient-srp-split.test.js` or elsewhere. Result: 178 passed, 6 skipped, 0 failed (no test needed updating, unlike Appointment's slice).
- [x] 2.6 Live-verify: start backend+frontend, open `/patients` (list, tagged `patient-list-controller.js`), `/patients/add` (tagged `patient-add-controller.js`), `/patients/edit/6` (tagged `patient-edit-controller.js`, real id from list) in a browser (Playwright), confirm `window.patientController` exists exactly once per page, search/filter callable, list/add/edit flows work, fresh single instance after reload, zero console/page errors on all 3 pages. Found (not introduced) a pre-existing, unrelated bug: `ui-manager.js`'s `fillForm` looks up `firstName_edit`/`lastName_edit` field IDs, but `patientEdit.ejs` uses plain `firstName`/`lastName` (no suffix) — edit form loads but text fields render empty. Confirmed via `git stash` that this reproduces identically on pre-Slice-2 source (introduced in original commit `e774f69`, untouched by Slices 0-2) — NOT a wiring regression, out of scope for this slice, noted for visibility only (same severity class as Slice 1's `getListState` finding).

## Phase 3: Dentist (`getInstance` variant + at-risk cross-call ordering) — DONE

- [x] 3.1 Edit `frontend/public/js/dentist/modules/index.js`: add `export async function initDentistController()` wrapping `DentistController.getInstance()` + `await controller.init()` per design's exact code shape. Remove the self-running `DOMContentLoaded` listener. Keep `export default DentistController;`.
- [x] 3.2 Edit `frontend/public/js/dentist/dentist-list-controller.js`: replace instantiate-publish block with `await initDentistController()`, keep page-specific glue.
- [x] 3.3 Edit `frontend/public/js/dentist/dentist-controller.js`: replace instantiate-publish block with `await initDentistController()`; explicitly preserve the ordering where `setupGlobalEvents()` and the `window.refresh/export/get/add…` glue run AFTER the `await`, so `window.cancelDentistEdit` (published by canonical during init) exists before this glue reads it (proposal risk row 2 / design Decision 3 note). Verified by reading the file before AND after the edit — ordering preserved.
- [x] 3.4 Run `cd frontend && npm test` — guard green, no regressions in `dentist-srp-split.test.js`. NOTE: `global-wiring-source.test.js` had 2 pre-existing assertions reading REAL `dentist-controller.js` source to demonstrate "direct value/instance assignment style" and "singleton exemption" (dual-assignment in canonical+wrapper) — both pinned the OLD shape (the wrapper used to assign `window.dentistController` directly). Post-migration the assignment lives ONLY in the canonical's `getInstance()`. Updated both tests: the assignment-style test now reads the canonical instead of the wrapper; the singleton-exemption test now asserts the canonical's real assignment plus the exemption-rule logic via a synthetic two-file map (since no real file pair dual-assigns anymore — this was already true for Appointment/Patient post their slices, just not exercised by a Dentist-specific assertion until now). Full suite: 178 passed, 6 skipped, 0 failed (same baseline as Slices 1-2).
- [x] 3.5 Live-verified: started backend (Spring Boot) + frontend (Express), logged in as seeded admin, opened `/dentists` (list, tagged `dentist-list-controller.js`), `/dentists/add` and `/dentists/edit/2` (real id, both tagged `dentist-controller.js`). Confirmed `window.dentistController` exists exactly once and is initialized on all 3 pages; list shows 4 dentists, `window.searchDentists("María")` returns 1 match; fresh singleton confirmed after full reload; add page initializes correctly; edit page loads real dentist data (María González, registrationNumber 12345, dentist_id 2) into the form. Ordering-risk check: called `window.cancelDentistEdit()` directly on the edit page — returned successfully with no error, confirming `setupGlobalEvents()`'s Escape-handler glue (which reads this global) runs after `await initDentistController()` resolves, after the canonical's `setupGlobalFunctions()` already published it during `init()`. Zero console/page errors across all pages. Both servers stopped cleanly after (ports 8080 and 3000 confirmed free).

## Phase 4: Auth (Decision 1 Option B — canonical keeps its listener, routed through export; `head.ejs` untouched) — DONE

- [x] 4.1 Edit `frontend/public/js/auth/modules/index.js`: add `export async function initAuthController()` (check-existing → `new AuthController()` → publish `window.authController` BEFORE `await controller.init()` → return instance). Keep the existing `DOMContentLoaded` listener but route it through `initAuthController()`, then call `controller.setupAutomaticRouteProtection()` and `controller.setupHttpInterceptors()` per design's exact code shape. Keep `window.login/register/logout/isAuthenticated/…` module-top-level exports verbatim. Keep `export default AuthController;`.
- [x] 4.2 Edit `frontend/public/js/auth/login-controller.js`: drop its own `new AuthController()` + publish + `await init()` block; import `initAuthController` from `../auth/modules/index.js` and defer (`authController = await initAuthController(); isInitialized = true;`); keep only `window.validateLoginForm` / `window.debugLoginController` glue.
- [x] 4.3 Confirmed no edit needed to `frontend/public/js/auth/register-controller.js` (re-verified: tagged only on `register.ejs:160`; it never instantiates `AuthController` — covered by guard only, no change required). `git diff --stat` confirms zero diff.
- [x] 4.4 Confirmed `frontend/src/views/partials/head.ejs` line 42 is untouched (byte-for-byte) — `git diff --stat` shows zero output.
- [x] 4.5 Ran `cd frontend && npm test` — 178 passed, 6 skipped, 0 failed. Guard green, no regressions in `auth-srp-split.test.js`, `require-auth.test.js`, or `global-wiring-source.test.js`. No pre-existing test needed updating for this slice (unlike Slices 1 and 3).
- [x] 4.6 Live-verified via Playwright (backend Spring Boot + frontend Express, real seeded admin login): `/users/login` (not logged in) loads with zero errors, `window.authController` exists (published by the sitewide canonical listener before any login attempt). Logged in as `admin@dentalclinic.com` successfully (`window.isAuthenticated()` → true, redirected to `/appointments`). Navigated to `/patients` and `/dentists` (fresh tabs, same session) — `window.authController` exists and `isInitialized: true` on both, zero console/page errors. `/users/register` loads with zero errors, `registerForm` present (register-controller.js untouched, still works). `window.isAuthenticated()`/`getCurrentUser()`/`isAdmin()` all callable without error on a non-auth page (`/dentists`), returning correct values (`isAuthenticated: true`, `currentUserEmail: "admin@dentalclinic.com"`, `isAdmin: true`).

## Phase 5: Final regression pass (after all 4 entity slices land)

- [x] 5.1 Run `cd frontend && npm test` once more on the fully-migrated tree — full suite green, guard green. Confirmed by `sdd-verify`: 178 passed, 6 skipped, 0 failed; guard 14/14.
- [x] 5.2 Live-verify spot-check across all 4 entities in one pass (list/add/edit pages + login + a non-auth page) to confirm no cross-entity interaction regressed after all slices combined. Confirmed by `sdd-verify`'s continuous single-session cross-entity smoke test (login → appointments → patients → dentists → add pages → back to a non-auth page) — zero accumulated console/page errors.
- [x] 5.3 Confirm proposal's Success Criteria checklist is fully satisfied (guard exists+passes+fails-on-reintroduction; each entity exports init with no self-running duplicate listener except Auth's single routed listener; no `window.*` global added/removed/renamed/behavior-changed; Auth initializes on both entry points). Confirmed by `sdd-verify` — see VERIFY.md.
