# Tasks: Harden Playwright E2E

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 650–850 lines |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1A/1B/2/3 target main; merge order: profile foundation, fixtures/evidence, runner, journeys/CI/hygiene |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Approved Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1A | E2E profile foundation and boundary | PR 1A | `mvn -f backend/pom.xml -Dtest=E2eSeedPropertiesTest,E2eProfileBoundaryTest test` | `SPRING_PROFILES_ACTIVE=e2e mvn -f backend/pom.xml spring-boot:run`; GET `/api/v3/api-docs` | Revert profile properties, typed config, boundary, registration, unit tests |
| 1B | Deterministic role/appointment seed and authorization evidence | PR 1B | `mvn -f backend/pom.xml -Dtest=E2eProfileIntegrationTest test` | E2E profile with seeded roles and appointment | Revert seed initializer and integration evidence |
| 2 | Process runner and evidence modes | PR 2 | `npm --prefix frontend run test:e2e:process` | Mock/full-stack Chromium with fake services and occupied ports | Revert full-stack config, runner, scripts, labels |
| 3 | Journeys, CI, hygiene | PR 3 | `npm --prefix frontend run check && npm --prefix frontend run test:e2e:fullstack` | Disposable H2 preview; run login, booking, denial | Revert POMs, suites, CI, ignore/artifacts |

## Phase 1A: Backend E2E Profile Foundation

- [x] 1.1 **RED**: Test secret-safe typed configuration, UTC-safe next weekday calculation, and non-H2 rejection in `E2eSeedPropertiesTest` and `E2eProfileBoundaryTest`.
- [x] 1.2 **GREEN/REFACTOR**: Create disposable `application-e2e.properties`, typed credential validation, fail-closed boundary/configuration wiring, and `META-INF/spring.factories` registration; keep startup free of fixture seeding.

## Phase 1B: Deferred Deterministic Fixtures and Authorization Evidence

- [x] 1.3 **RED (PR1B)**: Add `E2eProfileIntegrationTest` for deterministic ADMIN/PATIENT/DENTIST and future appointment seed, `/api/auth/me`, appointment DTO persistence, and non-admin dashboard `403`.
- [x] 1.4 **GREEN/REFACTOR (PR1B)**: Add the profile-only seed initializer and integration wiring without changing normal profiles or restoring `/api/auth/validate`.

## Phase 2: Process Integration and Evidence Modes

- [x] 2.1 **RED**: Test omitted `JWT_SECRET`/E2E credentials: no child/browser launch, nonzero exit, names only, no values, in `frontend/tests/fullstack/process-runner.spec.js`.
- [x] 2.2 **RED**: Test fake `500`/never-ready services: bounded timeout, nonzero exit, cleanup, and no Playwright tests.
- [x] 2.3 **RED**: Test backend child exit `17`: propagate status and prevent browser execution.
- [x] 2.4 **RED**: Occupy `8080` and `4173`; assert `reuseExistingServer:false`, refusal to attach, and nonzero exit.
- [x] 2.5 **RED**: Force failing spec; assert diagnostics and nonzero Playwright/CI status.
- [x] 2.6 **RED**: Force success, timeout, and browser failure; assert child shutdown, reopened ports, and safe cleanup failure.
- [x] 2.7 **GREEN**: Implement `frontend/playwright.fullstack.config.js`, `tests/fullstack/fixtures/e2e.js`, and `package.json` scripts for preflight, readiness, redacted diagnostics, shutdown, one worker.
- [x] 2.8 **REFACTOR**: Keep `playwright.config.js`/`tests/mock-backend.js` independently mock-only; label `tests/auth.spec.js` results and separate reports.

## Phase 3: Browser Journeys

- [x] 3.1 Create `tests/fullstack/pages/{login,dashboard,appointments,booking}.js` and `fixtures/e2e.js` role storage states via UI login.
- [x] 3.2 Implement `auth.setup.js` and `auth.spec.js`: valid admin redirect plus seeded dashboard values, and invalid-login rejection.
- [x] 3.3 Implement `booking.spec.js`: UTC slot, UI creation, rendered row, unique fields, ID extraction, authenticated detail lookup.
- [x] 3.4 Implement `authorization.spec.js`: unauthenticated redirect and non-admin browser denial plus API `403`.

## Phase 4: CI and Hygiene

- [x] 4.1 Modify `.github/workflows/ci.yml` for Chromium installation, credential fail-fast, full-stack gate, readiness diagnostics, and retention without secrets/state dumps.
- [x] 4.2 Update `frontend/.gitignore`, delete `frontend/test-results/.last-run.json`, and verify reports/traces/screenshots/videos are untracked while portfolio screenshots remain.
