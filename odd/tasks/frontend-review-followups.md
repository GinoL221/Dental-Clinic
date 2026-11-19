# Frontend Review Follow-ups & Pending Verification

Branch: `fix/frontend-review-followups` (from `main@80e1933`)
Scope: Resolve non-blocking advisory findings from `review-04af5456a712582e` and `review-98ac99151dccaff8`, add missing UI/E2E behavior tests, and re-run full verification including Playwright full-stack after `ea3e6f3`/`80e1933`.

## Specs

- S1: User authorization: "hacemos los pendientes" — resolve the pending items listed after `main@80e1933`:
- S2 (`R3-appt-edit-olddata-selection-lost`, `R3-appt-edit-status-error-source`): In `appointments/edit/[id]`, preserve submitted `patientId`, `dentistId`, and `status` from `form?.oldData` across failed submissions (including no-JS full re-renders and server `catch` failures in `+page.server.js`), and ensure status errors remain surfaced consistently without duplicate/lost feedback.
- S3 (`R2-hours-constant`, `R2-address-shape`): Extract a single shared clinical-hours help constant in `frontend/src/lib/utils/formatters.js` (referencing `AppointmentScheduleValidator.java`) used by `appointments/add` and `appointments/edit/[id]`, and document the dual-shape (`address` nested vs flat `oldData`) read in `patients/edit/[id]/+page.svelte`.
- S4 (`R2-enhance-dup`, `R2-duplicated-toggle`): Extract a shared `createSubmitEnhance` helper (`frontend/src/lib/utils/formEnhance.js`) and a shared `<PasswordField>` component (`frontend/src/lib/components/PasswordField.svelte`) used across `login`, `users/register`, `users/change-password`, `patients/add`, and `dentists/add`; also add missing `aria-pressed="false"` on `#c-conf` toggle in `design/identity-anchor/04-acceso-y-cambio-clave.html`.
- S5 (`R3-auth-behavior-untested`, `R3-role-locked-fields-untested`): Add Vitest unit/server tests (`formEnhance.test.js`, `appointments-edit.server.test.js`) and Playwright browser tests (mock + full-stack) proving: `?registered=true` login banner (hidden when error present), `mustChangePassword` notice, password toggle `aria-pressed` + `type` toggle, submitting pending state, role-locked disabled inputs + single hidden-mirror payload (`PATIENT` on `/patients/edit/{id}`, `DENTIST` on `/dentists/edit/{id}` and `/appointments/edit/{id}`), and `appointments/edit/[id]` `oldData` repopulation on failed submit (including no-JS path).
- S6 (Post-`80e1933` verification): Re-run `format:check`, `svelte-check`, `typecheck`, `vitest`, `test:e2e:process`, `vite build`, `impeccable detect`, `od lint` (on `04`), mock `npm run test:e2e` (`18081`/`14174`), and full-stack `npm run test:e2e:fullstack` (`18080`/`14173`), plus native review on the branch if `assess` reports due.

## Tasks

- [x] T1 (S2, S3, S4) Fix `appointments/edit/[id]` `oldData`/status edge cases, centralize `APPOINTMENT_HOURS_HELP`, document `patients/edit` address shape, and fix `04` artboard `aria-pressed` — route: worker (mwn5ayaf-2-wz4d) — commit: pending
- [x] T2 (S4, S5) Extract `createSubmitEnhance` + `<PasswordField>` across routes and add RED→GREEN Vitest unit/server tests — route: worker (mwn5ayaf-2-wz4d) — commit: pending
- [x] T3 (S5) Add Playwright mock & full-stack E2E tests for auth banners/toggles/mustChangePassword, role-locked hidden fields, and `appointments/edit` `oldData` preservation — route: worker (mwn5j9xr-3-n8rk) — commit: pending
- [x] T4 (S6) Run full static, unit, mock E2E, full-stack E2E, `impeccable detect`, `od lint`, and native review (`gentle_review`) before reporting complete — route: inline+bg (job-1) — commit: pending (awaiting user commit auth)

## Log

- L1: User request: "hacemos los pendientes" on `main@80e1933`. Created branch `fix/frontend-review-followups` and inspected test setup + target files via `gentle-ai-explore` (`mwn57bqs-1-kj3r`).
- L2: Completed `T1` & `T2` via `gentle-ai-worker` (`mwn5ayaf-2-wz4d`) with RED→GREEN Vitest evidence (`formEnhance.test.js`, `formatters.test.js`, `appointments-edit.server.test.js` outer catch `oldData.status`): extracted `formEnhance.js`, `PasswordField.svelte`, `APPOINTMENT_HOURS_HELP`, reactive `oldData` sync in `appointments/edit/[id]`, address shape comment in `patients/edit/[id]`, and `aria-pressed="false"` on `#c-conf` in artboard `04`. Verified `format:check`, `svelte-check` 0/0, `typecheck`, `vitest` 24/24 (198/198), `vite build`, `impeccable detect` `[]`, and `od lint` 0/0/0. Starting `T3` (Playwright mock + fullstack E2E tests).
- L3: Completed `T3` via `gentle-ai-worker` (`mwn5j9xr-3-n8rk`): extended `mock-backend.js` and added Chromium tests in `tests/auth.spec.js`, `tests/forms-behavior.spec.js`, `tests/fullstack/auth.spec.js`, and `tests/fullstack/role-locked-forms.spec.js`. Verified `format:check`, `svelte-check` 0/0, `typecheck`, `vitest` 24/24 (198/198), and mock `npm run test:e2e` (`18081`/`14174`) 9/9 PASS (18.5s). Running `T4` full-stack Playwright + build + process tests (`job-1`).
- L4: `job-1` passed cleanly: `format:check` PASS, `svelte-check` 0/0, `tsc` clean, `vitest` 24/24 (198/198), `test:e2e:process` 17/17 PASS, `vite build` PASS, and Playwright full-stack Chromium (`18080`/`14173`) **49/49 PASS (43.4s)** (plus `impeccable detect` `[]` and `od lint` 0/0/0 on `04`). Ready for commit, merge to `main`, and push authorization.
