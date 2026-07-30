## Exploration: harden-playwright-e2e

### Current State

The current OpenSpec requirement is intentionally small: Playwright must run against a SvelteKit instance and cover login, navigation, and booking. Its only scenarios assert successful and invalid login. The repository has not yet turned that requirement into meaningful full-stack evidence.

- `frontend/playwright.config.js` starts `frontend/tests/mock-backend.js` on port 8080, builds/previews SvelteKit on port 4173, and runs Chromium only. It does not start Spring Boot.
- `frontend/tests/auth.spec.js` contains three auth tests, but all use hardcoded mock credentials and run against the mock server. They are useful fast tests, not full-stack E2E.
- The current mock and `frontend/src/hooks.server.js` both use `GET /api/auth/me`. The obsolete `/api/auth/validate` mismatch from audit #3335 is already fixed by `secure-auth-session-boundary` (commits `c40132a` and `550df21`) and must not be re-proposed.
- The SvelteKit hook resolves the httpOnly `authToken` through `/api/auth/me`, stores the public profile in `event.locals`, and guards `/dashboard`, `/patients`, `/dentists`, and `/appointments`. The dashboard requests `/api/dashboard/snapshot` and currently falls back to zero-valued data when that request fails, which can hide a broken backend.
- The appointment UI has a real navigation and booking path: `/appointments` loads appointment, patient, and dentist data; `/appointments/add` loads selectable patients/dentists and submits `POST /api/appointments`; the backend validates dates, times, conflicts, and role-specific access.
- Spring Boot uses context path `/api`. The `dev` profile uses an in-memory H2 database with `create-drop`; `DataInitializer` is active only in `dev` and `prod`, seeds relative-to-today demo appointments, and contains raw demo passwords. There is no dedicated E2E profile or deterministic E2E fixture lifecycle.
- `.github/workflows/ci.yml` runs Maven tests and frontend Vitest tests, but does not install browsers or execute `npm run test:e2e`.
- `frontend/test-results/.last-run.json` is tracked. `tools/screenshots/*.png` are tracked portfolio outputs and should not be removed as Playwright artifacts without confirming their separate purpose. Playwright report, blob, trace, video, and screenshot output directories need explicit ignore rules.
- The current worktree was clean during this read-only audit. The injected skill paths are valid; cached Engram skill registry observation #21 is stale and points to invalid `/home/gino/...` paths and pre-Svelte entries.

### Affected Areas

- `frontend/playwright.config.js` — separate full-stack startup from mock-test startup, define reusable projects/diagnostics, and make browser coverage explicit.
- `frontend/tests/auth.spec.js` and `frontend/tests/mock-backend.js` — retain as fast mock coverage only, remove credential literals, and label/configure the suite so it cannot be mistaken for full-stack evidence.
- `frontend/tests/fixtures/`, `frontend/tests/pages/`, and `frontend/tests/global-setup.js` (new locations) — provide role-aware fixtures, session setup, POMs, and deterministic test data access.
- `frontend/src/hooks.server.js`, `frontend/src/routes/dashboard/+page.server.js`, `frontend/src/routes/appointments/+page.server.js`, and `frontend/src/routes/appointments/add/+page.server.js` — are the SvelteKit server-side path exercised by login, authorization, navigation, and booking tests.
- `backend/src/main/resources/application-e2e.properties` (new) — isolate the E2E backend from dev/prod data with disposable H2 configuration and explicit CORS/JWT settings.
- `backend/src/main/java/com/dh/dentalClinicMVC/configuration/` (new or adjusted E2E-only seed) — create deterministic admin, dentist, patient, and appointment state without activating the existing dev/prod demo initializer.
- `.github/workflows/ci.yml` — add a mandatory full-stack E2E job, Java/Node/browser setup, environment injection, failure diagnostics, and no-failure-swallowing behavior.
- `.gitignore`, `frontend/test-results/.last-run.json`, and generated report paths — stop tracking generated Playwright artifacts and remove the already tracked last-run file.
- `openspec/specs/playwright-e2e-testing/spec.md` — later delta-spec work should distinguish full-stack scenarios from retained mock-based fast tests and define the CI gate.

### Approaches

1. **Reuse the existing dev profile and demo initializer** — point Playwright at a Spring Boot `dev` process and use the current seeded users and appointments.
   - Pros: smallest initial infrastructure change; existing H2 setup and broad demo data are immediately available.
   - Cons: credentials remain coupled to application demo data; dates are relative to the clock; the initializer is not E2E-specific; a reused database or an existing admin causes the seed to be skipped; tests become dependent on unrelated records.
   - Effort: Low

2. **Dedicated E2E Spring profile with disposable H2 and environment-provided credentials** — start Spring Boot with an `e2e` profile, keep the existing `dev`/`prod` initializer inactive, seed only the required roles and booking state, and run the frontend against that process.
   - Pros: deterministic and isolated local/CI lifecycle; no production data access; credentials are supplied through ignored local environment or CI secrets; fixed fixture identities and computed future weekdays avoid current-time failures; supports real login, navigation, backend authorization, and booking in one browser.
   - Cons: requires a small backend fixture/profile addition and a clear guard against using the profile with a persistent database; seed maintenance follows domain changes.
   - Effort: Medium

3. **Disposable production-like database plus API-driven global setup** — run the backend against an ephemeral MySQL/Testcontainers service, authenticate through the real API, create the role-specific users and booking records in global setup, then let browser tests execute only UI flows.
   - Pros: closer to production persistence and less coupling to a Java seed implementation; setup can clean up by run identifier.
   - Cons: highest CI/runtime complexity; requires new service/dependency orchestration; API setup can itself become a second test system; current endpoint permissions and entity constraints make complete role setup non-trivial.
   - Effort: High

### Recommendation

Choose Approach 2 for the first implementation. Use an explicit full-stack Playwright configuration that starts a dedicated Spring Boot `e2e` profile on port 8080 and the SvelteKit preview on port 4173. Use one disposable H2-backed backend process per run, one worker initially, deterministic seeded admin/dentist/patient data, and a future weekday/time for the booking fixture. Pass test credentials through environment variables; fail fast when required values are absent rather than embedding them in tests or mocks.

Keep the current mock suite as an explicitly named fast suite with its own config/script. It should continue to validate SvelteKit form/error behavior quickly, but its report must not count as the full-stack gate. The full-stack suite should initially cover:

- admin login through the browser, dashboard navigation, real `/api/auth/me`, and a non-fallback dashboard snapshot;
- admin navigation to appointments, creation of a booking through `/appointments/add`, and verification that the resulting appointment is rendered from backend state;
- unauthenticated access to a guarded route redirecting to `/login`;
- a seeded non-admin user reaching an admin-only route and receiving the expected forbidden behavior.

Add POMs for login, dashboard, appointments, and booking, plus role/session fixtures that reuse authenticated browser state without bypassing the login scenario. Add CI as a required job with browser installation, backend/frontend startup health checks, traces/screenshots/report upload on failure, and a failing exit status on any E2E failure. Make Chromium the first mandatory project so the gate is stable, then enable Firefox and WebKit using observed compatibility/runtime/flakiness evidence rather than claiming browser coverage based only on configuration.

### Risks

- A missing or mismatched E2E credential environment can make CI fail before tests, while logging secrets during setup would create a security incident. Validate presence without printing values.
- The E2E profile must be impossible to mistake for `dev` or `prod`; enforce disposable H2 configuration and document the profile boundary.
- The existing dashboard fallback can produce a green-looking page after a backend failure. Full-stack tests must assert meaningful seeded data or observe the snapshot request, not only the heading.
- Relative dates and the backend weekday/time validation can cause midnight, weekend, or timezone flakiness unless fixtures compute a safe future slot.
- Shared state and parallel workers can create appointment conflicts. Start with one worker and move to per-worker isolation only when parallelism is justified.
- CI browser matrix expansion increases runtime and may expose frontend behavior differences; use failure evidence and retain artifacts for diagnosis.
- `frontend/test-results/.last-run.json` is confirmed tracked. Portfolio screenshots are also tracked but are not proven to be Playwright output; deletion should remain scoped to test artifacts.
- The cached skill registry is stale. Future phases must continue using the injected valid skill paths, not registry path suggestions.

### Ready for Proposal

Yes. The first proposal should scope a dedicated E2E profile/fixture lifecycle, explicit separation of mock and full-stack Playwright suites, reusable POM/session infrastructure, the four initial browser journeys, cleanup of tracked Playwright artifacts, and a mandatory Chromium CI gate. It should defer additional browser projects until the first full-stack baseline supplies evidence, while recording the expansion criterion.
