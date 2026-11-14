# Playwright config hardening

Status: DONE (implemented on branch `chore/playwright-config-hardening`).
Scope: `frontend/playwright.config.js`, `frontend/playwright.fullstack.config.js`, one new drift test, one README line. About 40 lines, one commit.

## Specs

- S1: Every `test:*` script in `frontend/package.json` must reference a config file that exists and only `--project=` names declared in that config (no script/config drift).
- S2: Full-stack config captures failure evidence without retrying: `trace: "retain-on-failure"`, `screenshot: "only-on-failure"`, `expect.timeout` of 10 s. No `retries` in full-stack, because journeys such as `booking.spec.js` mutate real backend state and a retry could produce false failures.
- S3: Mock config uses `retries: process.env.CI ? 2 : 0` so `trace: "on-first-retry"` can actually fire.
- S4: Mock config reads `E2E_BACKEND_PORT` / `E2E_FRONTEND_PORT` (defaults 8080 / 4173) and does not reuse existing servers, matching the full-stack behavior.
- S5: `frontend/README.md` documents the two modes and why full-stack has no retries.

## Tasks

- [x] T1 (S1) Drift test, RED first (comment out a project in a scratch copy, confirm failure, then GREEN). Placed in `frontend/tests/playwright-config-drift.test.js` and included in `vite.config.js` (`tests/*.test.js`) so CI and pre-commit run it.
- [x] T2 (S2) `playwright.fullstack.config.js` (`trace: "retain-on-failure"`, `screenshot: "only-on-failure"`, `expect.timeout: 10_000`, no `retries`).
- [x] T3 (S3) `playwright.config.js` (`retries: process.env.CI ? 2 : 0`, plus `testMatch: /.*\.spec\.js/` so Vitest `.test.js` files are not collected by Playwright).
- [x] T4 (S4) Mock port symmetry (`E2E_BACKEND_PORT`/`E2E_FRONTEND_PORT` with defaults `8080`/`4173`, `reuseExistingServer: false`, `tests/mock-backend.js` updated to read `E2E_BACKEND_PORT`).
- [x] T5 (S5) README line (`frontend/README.md` documents mock vs full-stack modes and why full-stack has no retries).

## Verification

- `npx playwright test --list` with both configs: both parse, same project sets as before.
- Vitest (186 + new), `svelte-check`, `tsc`, Prettier.
- Full-stack E2E run is optional (T2 only adds failure artifacts), on alternate ports if run.

## Risk

Risk: none of the high-risk items apply (no data, security, contracts, concurrency, delivery). The mock-backend port change in T4 is the only possible scope growth.

## Log

- L1: User asked "es correcta la configuracion de playwright para el proyecto? coincide con las de mis notas? que forma es mejor?", then "no, pero arma un plan para luego implementarlo", then "dejalo guardado".
- L2: Correction recorded: retries are NOT applied to full-stack (stateful journeys); `retain-on-failure` is used instead.
- L3: Implemented T1–T5. Verified: `npx playwright test --list` on both configs (3 mock tests, 46 full-stack tests), Vitest 188/188 (23 files), `tsc` clean, `svelte-check` 0 errors / 0 warnings, Prettier clean. Risk: none.
