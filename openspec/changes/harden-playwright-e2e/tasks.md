# Tasks: Harden Playwright E2E

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 650–850 lines |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1/2/3 target main; merge order: backend, runner, journeys/CI/hygiene |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | E2E profile, seed, authorization | PR 1 | `mvn -f backend/pom.xml -Dtest=E2e*Test test` | `SPRING_PROFILES_ACTIVE=e2e mvn -f backend/pom.xml spring-boot:run`; GET `/api/v3/api-docs` | Revert profile, config classes, registration, tests |
| 2 | Process runner and evidence modes | PR 2 | `npm --prefix frontend run test:e2e:process` | Mock/full-stack Chromium with fake services and occupied ports | Revert full-stack config, runner, scripts, labels |
| 3 | Journeys, CI, hygiene | PR 3 | `npm --prefix frontend run check && npm --prefix frontend run test:e2e:fullstack` | Disposable H2 preview; run login, booking, denial | Revert POMs, suites, CI, ignore/artifacts |

## Phase 1: Backend Foundation

- [ ] 1.1 **RED**: Test secret redaction, UTC slot, non-H2 rejection in `backend/src/test/java/com/dh/dentalClinicMVC/configuration/{E2eSeedPropertiesTest,E2eProfileBoundaryTest}.java`.
- [ ] 1.2 **GREEN**: Create `backend/src/main/resources/application-e2e.properties`, `configuration/{E2eSeedProperties,E2eDataInitializer,E2eProfileBoundary}.java`, and `META-INF/spring.factories`; isolate `DataInitializer`.
- [ ] 1.3 **RED**: Add `E2eProfileIntegrationTest.java` for seeded roles/appointment, `/api/auth/me`, appointment DTO persistence, and non-admin snapshot `403`.
- [ ] 1.4 **GREEN/REFACTOR**: Wire the contract without changing application behavior or restoring `/api/auth/validate`.

## Phase 2: Process Integration and Evidence Modes

- [ ] 2.1 **RED**: Test omitted `JWT_SECRET`/E2E credentials: no child/browser launch, nonzero exit, names only, no values, in `frontend/tests/fullstack/process-runner.spec.js`.
- [ ] 2.2 **RED**: Test fake `500`/never-ready services: bounded timeout, nonzero exit, cleanup, and no Playwright tests.
- [ ] 2.3 **RED**: Test backend child exit `17`: propagate status and prevent browser execution.
- [ ] 2.4 **RED**: Occupy `8080` and `4173`; assert `reuseExistingServer:false`, refusal to attach, and nonzero exit.
- [ ] 2.5 **RED**: Force failing spec; assert diagnostics and nonzero Playwright/CI status.
- [ ] 2.6 **RED**: Force success, timeout, and browser failure; assert child shutdown, reopened ports, and safe cleanup failure.
- [ ] 2.7 **GREEN**: Implement `frontend/playwright.fullstack.config.js`, `tests/fullstack/fixtures/e2e.js`, and `package.json` scripts for preflight, readiness, redacted diagnostics, shutdown, one worker.
- [ ] 2.8 **REFACTOR**: Keep `playwright.config.js`/`tests/mock-backend.js` independently mock-only; label `tests/auth.spec.js` results and separate reports.

## Phase 3: Browser Journeys

- [ ] 3.1 Create `tests/fullstack/pages/{login,dashboard,appointments,booking}.js` and `fixtures/e2e.js` role storage states via UI login.
- [ ] 3.2 Implement `auth.setup.js` and `auth.spec.js`: valid admin redirect plus seeded dashboard values, and invalid-login rejection.
- [ ] 3.3 Implement `booking.spec.js`: UTC slot, UI creation, rendered row, unique fields, ID extraction, authenticated detail lookup.
- [ ] 3.4 Implement `authorization.spec.js`: unauthenticated redirect and non-admin browser denial plus API `403`.

## Phase 4: CI and Hygiene

- [ ] 4.1 Modify `.github/workflows/ci.yml` for Chromium installation, credential fail-fast, full-stack gate, readiness diagnostics, and retention without secrets/state dumps.
- [ ] 4.2 Update `frontend/.gitignore`, delete `frontend/test-results/.last-run.json`, and verify reports/traces/screenshots/videos are untracked while portfolio screenshots remain.
