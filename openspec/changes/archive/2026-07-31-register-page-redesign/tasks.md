# Tasks: Register Page Redesign

## Review Workload Forecast

| Field                   | Value                                                             |
| ----------------------- | ----------------------------------------------------------------- |
| Estimated changed lines | ~850-900 total (logic+tests ~400, template+CSS ~340, E2E ~120)    |
| 400-line budget risk    | High                                                              |
| Chained PRs recommended | Yes                                                               |
| Suggested split         | PR 1 (logic+unit tests) → PR 2 (Svelte template+CSS) → PR 3 (E2E) |
| Delivery strategy       | ask-on-risk                                                       |
| Chain strategy          | stacked-to-main                                                   |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                                         | Likely PR | Focused test command                                                                                       | Runtime harness                                                                             | Rollback boundary                                                                                                            |
| ---- | ------------------------------------------------------------ | --------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1    | Pure validation module + server action contract, unit-tested | PR 1      | `npx vitest run src/lib/validation/registerForm.test.js src/routes/users/register/register.server.test.js` | N/A — pure Vitest, no browser/backend needed                                                | Revert `registerForm.js/.test.js`, `+page.server.js`, `register.server.test.js`; independently restores old 409/400 branches |
| 2    | Svelte markup/state wiring + auth.css/forms.css restyle      | PR 2      | `npm run check`                                                                                            | `npm run dev` manual check (no component-test infra; blur/focus/aria unverified until PR 3) | Revert `+page.svelte`, `auth.css`, `forms.css`; PR 1's module stays valid but unused                                         |
| 3    | Playwright E2E on real backend                               | PR 3      | `npx playwright test tests/fullstack/register.spec.js`                                                     | `frontend/tests/fullstack/run-fullstack.js` (real backend+frontend)                         | Revert `pages/register.js`, `register.spec.js` only; no behavior change                                                      |

## Phase 1: Validation Rules Module (PR 1)

- [x] 1.1 RED — `src/lib/validation/registerForm.test.js`: failing cases for required fields, email format, password minlength 6, DNI numeric-only, confirmPassword match, and `validateRegisterForm` aggregation
- [x] 1.2 GREEN — `src/lib/validation/registerForm.js`: implement `validateRegisterField`/`validateRegisterForm` per design interfaces to pass 1.1
- [x] 1.3 REFACTOR — extract shared regex/message constants, add JSDoc typedefs (`RegisterValues`, `FieldErrors`)

## Phase 2: Server Action Contract (PR 1)

- [x] 2.1 RED — `register.server.test.js`: remove 409 test; add failing cases for backend-message passthrough, synthetic `HTTP error!` fallback, and confirmPassword-mismatch short-circuit (no `apiFetch` call)
- [x] 2.2 GREEN — `+page.server.js`: read `err.message` with synthetic-message filter, drop 409/400 branches, add confirmPassword guard before `apiFetch`

## Phase 3: Client Wiring (PR 2)

- [x] 3.1 `+page.svelte`: `values`/`fieldErrors`/`touched` state; call `validateRegisterField` on blur and on input (only after first failure)
- [x] 3.2 `+page.svelte`: call `validateRegisterForm` on submit via `use:enhance` `cancel()`; focus first invalid field
- [x] 3.3 `+page.svelte`: wire `aria-invalid`/`aria-describedby` per field; `role="alert"` general banner focused after render via `tick()`
- [x] 3.4 `+page.svelte`: mockup markup — gradient bar, icon+title header, 2-col grid (Datos Personales/Dirección/Seguridad), drop inline `style`

## Phase 4: Presentation CSS (PR 2)

- [x] 4.1 `auth.css`: gradient bar, header, 2-col section grid, restyled input tokens (bg/border/radius/focus ring), button icon+shadow, light-blue privacy card
- [x] 4.2 `forms.css`: narrow `.password-input` to geometry only (`padding-right`, `height`); collapse suppression block per design snippet
- [x] 4.3 Manual verification: `#loginForm` password field renders pixel-identical before/after (no automated coverage; `.auth-input`/`.is-invalid` unaffected)

## Phase 5: E2E Coverage (PR 3)

- [x] 5.1 Create `tests/fullstack/pages/register.js` POM (goto/fill/submit) following `pages/login.js` convention
- [x] 5.2 RED — `tests/fullstack/register.spec.js`: failing E2E for blur inline error, confirmPassword-mismatch block, real-backend duplicate-email 400 message, successful registration redirect
- [x] 5.3 GREEN — confirm Phase 3/4 wiring satisfies 5.2; fix any gap

## Phase 6: Verification

- [x] 6.1 `npm run check` clean (JSDoc + `checkJs`)
- [x] 6.2 `npx vitest run` full suite green
- [x] 6.3 `npx playwright test tests/fullstack/register.spec.js` green

## Out of Scope (per design/spec)

- Svelte component-test infra (deferred, see `dental-clinic/future-svelte-component-test-infra`)
- Login page CSS/layout changes, mobile responsiveness, dashboard, backend
