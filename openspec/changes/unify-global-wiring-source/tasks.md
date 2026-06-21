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
- [ ] **0.7 BLOCKED** — GREEN check against current (post-`337d380`) source FAILS: the guard correctly detects 2 real, pre-existing, non-singleton duplicate `window.*` assignments the spec claimed (incorrectly) did not exist — `window.confirmDeleteAppointment` (`appointment-controller.js` + `appointment-list-controller.js`) and `window.cancelPatientEdit` (`patient/modules/index.js` + `patient-edit-controller.js`). Fixing either requires editing entity wiring code, out of scope for this guard-only slice. See apply-progress (Engram `sdd/unify-global-wiring-source/apply-progress`) for full detail. Needs orchestrator/spec decision before Phase 1 can proceed with a fully-green guard.
- [x] 0.8 Run full suite `cd frontend && npm test` — 176 passed (164 pre-existing + 12 new guard assertions), 2 failed (the 2 real bugs above, not a guard defect), 6 skipped, 184 total. Zero collateral regressions confirmed via isolated run excluding the new test file (164 passed / 6 skipped, matching exact pre-change baseline). **Gate not met**: do not proceed to Phase 1 until 0.7's blocker is resolved (either by fixing the 2 bugs as part of Phase 1/2 scope, or an explicit documented exemption decision).

## Phase 1: Appointment (pilot — `new` variant)

- [ ] 1.1 Edit `frontend/public/js/appointment/modules/index.js`: add `export async function initAppointmentController()` (check-existing → `new AppointmentController()` → publish `window.appointmentController` BEFORE `await controller.init()` → return instance) per design's exact code shape. Remove the self-running `DOMContentLoaded` listener and the `initializationCount` debug counter. Keep `export default AppointmentController;`.
- [ ] 1.2 Re-verify EJS script-tag wiring for `appointment-controller.js`: confirmed tagged on both `appointmentAdd.ejs:161` and `appointmentEdit.ejs:248` (shared add/edit wrapper) — no surprise vs. design's file list.
- [ ] 1.3 Edit `frontend/public/js/appointment/appointment-controller.js`: import `initAppointmentController` from `../appointment/modules/index.js`, replace the instantiate-publish-init block with `appointmentController = await initAppointmentController(); isInitialized = true;`, keep all page-specific glue (`setupGlobalFunctions()`, autocomplete wiring, filter handlers, debug fns) untouched after the `await`.
- [ ] 1.4 Edit `frontend/public/js/appointment/appointment-list-controller.js`: same delegation pattern as 1.3, preserving its own (disjoint) page glue verbatim.
- [ ] 1.5 Run `cd frontend && npm test` — confirm guard still green and no regressions in `appointment-srp-split.test.js` or elsewhere.
- [ ] 1.6 Live-verify: start backend (Spring Boot) + frontend (Express/EJS), open `/appointments` (list) and `/appointments/add` and `/appointments/:id/edit` in a browser (Playwright), confirm `window.appointmentController` exists exactly once, list/add/edit flows work, and no console errors/duplicate-init warnings.

## Phase 2: Patient (`getInstance` variant, 3 wrappers)

- [ ] 2.1 Edit `frontend/public/js/patient/modules/index.js`: add `export async function initPatientController()` wrapping `PatientController.getInstance()` + `await controller.init()` per design's exact code shape (do NOT replace `getInstance` with `new`). Remove the self-running `DOMContentLoaded` listener. Keep `export default PatientController;`.
- [ ] 2.2 Edit `frontend/public/js/patient/patient-list-controller.js`: replace `new PatientController()`/publish block with `await initPatientController()`, keep page-specific glue.
- [ ] 2.3 Edit `frontend/public/js/patient/patient-add-controller.js`: same delegation pattern, preserve its own glue.
- [ ] 2.4 Edit `frontend/public/js/patient/patient-edit-controller.js`: same delegation pattern, preserve its own glue.
- [ ] 2.5 Run `cd frontend && npm test` — confirm guard still green and no regressions in `patient-srp-split.test.js` or elsewhere.
- [ ] 2.6 Live-verify: start backend+frontend, open `/patients` (list, tagged `patient-list-controller.js`), `/patients/add` (tagged `patient-add-controller.js`), `/patients/:id/edit` (tagged `patient-edit-controller.js`) in a browser (Playwright), confirm `window.patientController` exists exactly once per page, ~15 patient globals callable, list/add/edit flows work, no console errors.

## Phase 3: Dentist (`getInstance` variant + at-risk cross-call ordering)

- [ ] 3.1 Edit `frontend/public/js/dentist/modules/index.js`: add `export async function initDentistController()` wrapping `DentistController.getInstance()` + `await controller.init()` per design's exact code shape. Remove the self-running `DOMContentLoaded` listener. Keep `export default DentistController;`.
- [ ] 3.2 Edit `frontend/public/js/dentist/dentist-list-controller.js`: replace instantiate-publish block with `await initDentistController()`, keep page-specific glue.
- [ ] 3.3 Edit `frontend/public/js/dentist/dentist-controller.js`: replace instantiate-publish block with `await initDentistController()`; explicitly preserve the ordering where `setupGlobalEvents()` and the `window.refresh/export/get/add…` glue run AFTER the `await`, so `window.cancelDentistEdit` (published by canonical during init) exists before this glue reads it (proposal risk row 2 / design Decision 3 note).
- [ ] 3.4 Run `cd frontend && npm test` — confirm guard still green and no regressions in `dentist-srp-split.test.js` or elsewhere.
- [ ] 3.5 Live-verify: start backend+frontend, open `/dentists` (list, tagged `dentist-list-controller.js`), `/dentists/add` and `/dentists/:id/edit` (both tagged `dentist-controller.js`) in a browser (Playwright); specifically exercise the cancel-edit flow to confirm `window.cancelDentistEdit` works correctly with the new ordering. Confirm `window.dentistController` exists exactly once per page, no console errors.

## Phase 4: Auth (Decision 1 Option B — canonical keeps its listener, routed through export; `head.ejs` untouched)

- [ ] 4.1 Edit `frontend/public/js/auth/modules/index.js`: add `export async function initAuthController()` (check-existing → `new AuthController()` → publish `window.authController` BEFORE `await controller.init()` → return instance). Keep the existing `DOMContentLoaded` listener but route it through `initAuthController()`, then call `controller.setupAutomaticRouteProtection()` and `controller.setupHttpInterceptors()` per design's exact code shape. Keep `window.login/register/logout/isAuthenticated/…` module-top-level exports verbatim. Keep `export default AuthController;`.
- [ ] 4.2 Edit `frontend/public/js/auth/login-controller.js`: drop its own `new AuthController()` + publish + `await init()` block; import `initAuthController` from `../auth/modules/index.js` and defer (`authController = await initAuthController(); isInitialized = true;`); keep only `window.validateLoginForm` / `window.debugLoginController` glue.
- [ ] 4.3 Confirm no edit needed to `frontend/public/js/auth/register-controller.js` (re-verified: tagged only on `register.ejs:160`; it never instantiates `AuthController` — covered by guard only, no change required).
- [ ] 4.4 Confirm `frontend/src/views/partials/head.ejs` line 42 is untouched (byte-for-byte) — no edit in this slice.
- [ ] 4.5 Run `cd frontend && npm test` — confirm guard still green and no regressions in `auth-srp-split.test.js`, `require-auth.test.js`, or elsewhere.
- [ ] 4.6 Live-verify: start backend+frontend, open `/users/login` (wrapper flow) and a non-auth page e.g. `/dentists` (sitewide `head.ejs`-only flow) in a browser (Playwright). Confirm exactly one `window.authController` instance on each, `window.isAuthenticated()`/`getCurrentUser`/`isAdmin`/`login`/`logout` all callable and correct, login form submits successfully, route protection still redirects unauthenticated users, no console errors or duplicate-init warnings. Also open `/users/register` to confirm `register-controller.js`'s unchanged glue still works.

## Phase 5: Final regression pass (after all 4 entity slices land)

- [ ] 5.1 Run `cd frontend && npm test` once more on the fully-migrated tree — full suite green, guard green.
- [ ] 5.2 Live-verify spot-check across all 4 entities in one pass (list/add/edit pages + login + a non-auth page) to confirm no cross-entity interaction regressed after all slices combined.
- [ ] 5.3 Confirm proposal's Success Criteria checklist is fully satisfied (guard exists+passes+fails-on-reintroduction; each entity exports init with no self-running duplicate listener except Auth's single routed listener; no `window.*` global added/removed/renamed/behavior-changed; Auth initializes on both entry points).
