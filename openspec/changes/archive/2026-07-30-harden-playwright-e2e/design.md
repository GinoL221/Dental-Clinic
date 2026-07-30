# Design: Harden Playwright E2E

## Technical Approach

Run a Spring `e2e` profile with disposable H2 beside SvelteKit preview. Full-stack Chromium tests use UI/server flows; mocks remain a separate command. Preserve `/api/auth/me`; never reintroduce `/api/auth/validate`.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|---|---|---|---|
| Boundary | H2 `mem`, `create-drop`, disabled `import.sql`, and a guard rejecting non-H2 URLs. | `dev`; external DB. | Disposable state cannot touch dev/prod data. |
| Fixtures/time | Profile-only seed for ADMIN, PATIENT, DENTIST, and an upcoming appointment; booking uses the next UTC weekday, 08:00–18:00. | Existing broad seed; fixed dates. | Existing dates are clock-sensitive; UTC avoids weekend/timezone failures. |
| Evidence | Mock `playwright.config.js`; full-stack `playwright.fullstack.config.js`; separate scripts/reports. | Conditional single config. | Mock results cannot masquerade as backend evidence. |
| Sessions | Login/dashboard/appointments/booking POMs, UI-created role storage states, one worker. | Token-only setup; parallel workers. | Reuses sessions without bypassing the explicit login test; one H2 process is not parallel-safe. |
| Authorization | Browser denial plus non-admin API request to `/api/dashboard/snapshot`, expecting `403`. | Frontend guard only. | Proves `DashboardController`'s `@PreAuthorize`, not just SvelteKit policy. |

## Data Flow

```text
preflight → Spring e2e/H2 seed → SvelteKit preview → browser POMs
                                      ↓
                      /api/auth/me, dashboard, appointments
```

UI submits `/appointments/add`; `/appointments` renders the row from `GET /api/appointments/search`. Extract its edit-link ID and verify persistence with `GET /api/appointments/{id}` using the admin bearer token. Match unique description/date/time; dashboard requires seeded counts and an upcoming appointment, never a heading or zero fallback.

## Interfaces / Contracts

- Context path `/api`. `GET /api/appointments/{id}` requires `Authorization: Bearer <admin-token>` and ADMIN/DENTIST; `200` returns `AppointmentDTO` fields `id`, `dentist_id`, `patient_id`, `date`, `time`, `description`, `status`, matching the form.
- The page loader's `GET /api/appointments/search` uses the same bearer and returns a Spring `Page`; appointments come from `content[]` with those fields.
- Required: `JWT_SECRET`, `E2E_ADMIN_EMAIL/PASSWORD`, `E2E_NON_ADMIN_EMAIL/PASSWORD`. `E2eSeedProperties` maps/validates them; `E2eDataInitializer` is `@Profile("e2e")`, while `DataInitializer` stays `dev`/`prod`.
- Readiness: backend `GET http://127.0.0.1:8080/api/v3/api-docs` returns `200` via existing Springdoc/permit rules; frontend `GET http://127.0.0.1:4173/` returns `200` via the existing root route. Use UTC, no reuse, bounded timeout, shutdown, and redacted diagnostics; never upload state/env dumps.

## File Changes

| File | Action | Description |
|---|---|---|
| `backend/src/main/resources/application-e2e.properties` | Create | H2 profile and seed mappings. |
| `backend/src/main/java/com/dh/dentalClinicMVC/configuration/{E2eDataInitializer,E2eSeedProperties,E2eProfileBoundary}.java` | Create | Seed, config validation, H2 guard. |
| `backend/src/main/resources/META-INF/spring.factories` | Modify | Register guard. |
| `frontend/playwright.config.js`, `frontend/playwright.fullstack.config.js`, `frontend/package.json` | Modify/Create | Separate orchestration and scripts. |
| `frontend/tests/auth.spec.js`, `frontend/tests/mock-backend.js` | Modify | Label and sanitize mock evidence. |
| `frontend/tests/fullstack/{fixtures/e2e.js,pages/*.js,auth.setup.js,auth.spec.js,booking.spec.js,authorization.spec.js}` | Create | Fixtures, POMs, sessions, tests. |
| `.github/workflows/ci.yml` | Modify | Chromium gate, preflight, diagnostics, retention. |
| `frontend/.gitignore`, `frontend/test-results/.last-run.json` | Modify/Delete | Ignore/delete generated output; preserve portfolio screenshots. |

## Testing Strategy

| Layer | Coverage | Approach |
|---|---|---|
| Unit | Guard, UTC slot, env validation. | RED first; assert no secret values. |
| Integration | Seed, `/auth/me`, snapshot, DTO, non-admin `403`. | Spring tests with `e2e` H2. |
| E2E | Login, dashboard, booking, redirect, denial. | Full-stack POMs; mocks reported separately. |

## Threat Matrix

| Reference boundary | Applicability |
|---|---|
| Documentation-like paths | N/A — no document/executable classification. |
| Git repository selection | N/A — no `git -C` or selector. |
| Commit state | N/A — CI does not stage or commit. |
| Push state | N/A — CI does not push/refspec. |
| PR commands | N/A — no GitHub/PR command. |

Process cases are applicable:

| Case | Safe behavior | Failure/propagation | Exact RED boundary |
|---|---|---|---|
| Missing environment | List missing names; start no services/browser. | Nonzero before browser; never log values. | Omit each variable; assert no launch and names-only stderr. |
| Readiness timeout/bad readiness | Wait for both `200` URLs within bound. | Timeout/non-200 fails, cleans child, runs no tests. | Fake `500`/never-ready; assert timeout, nonzero, cleanup. |
| Child early exit | Detect exit before readiness. | Propagate nonzero; no false pass. | Fake backend exits `17`; assert nonzero and no browser. |
| Stale port/service reuse | `reuseExistingServer:false`; reject occupied `8080`/`4173`. | Refuse attachment; fail before tests. | Occupy each port; assert no reuse and nonzero exit. |
| Browser nonzero exit | Preserve diagnostics and exact failure. | Propagate Playwright status to CI. | One failing spec; assert runner/CI nonzero. |
| Cleanup/shutdown | SIGTERM/await children after every outcome. | Cleanup error/non-termination fails and retains diagnostics. | Force outcomes; assert children exit and ports reopen. |

## Migration / Rollout

No migration; make Chromium CI required. Roll back by reverting E2E/CI/artifact changes together; app and `/api/auth/me` remain unchanged. Defer Firefox/WebKit, complete role matrix, and full booking lifecycle; preserve portfolio screenshots.

## Open Questions

None blocking; CI secrets are an operational prerequisite.
