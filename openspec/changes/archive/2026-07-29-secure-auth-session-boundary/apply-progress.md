# Apply Progress: Secure Authentication Session Boundary

## Work Unit 1: Backend Protected `/auth/me`

### Completed Tasks

- [x] 1.1 Add integration coverage for the exact five-key response and absent, malformed, expired, and deleted-user `401 Unauthorized` behavior.
- [x] 1.2 Add `SessionProfileResponse`, service mapping, controller endpoint, and ordered security matcher.
- [x] 1.3 Preserve stale-principal handling, error bodies, login/register behavior, roles, header-over-cookie precedence, and `401`/`403` semantics.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | Triangulate | Refactor |
|---|---|---|---|---|---|---|---|
| 1.1 | `backend/src/test/java/com/dh/dentalClinicMVC/authentication/AuthenticationSessionIntegrationTest.java` | Spring Boot MockMvc integration | N/A (new) | Written first; initial run failed with `404` because `/auth/me` did not exist | 5/5 passed | Five scenarios: exact profile, absent, malformed, expired, deleted user | Cleaned exact field assertions and shared unauthorized assertion |
| 1.2 | `AuthenticationSessionIntegrationTest.java` | Spring Boot MockMvc integration | 25/25 existing focused tests passed | Endpoint tests referenced the missing DTO/route | 5/5 passed | Existing filter and stale-principal integration remained green | DTO record and constructor-injected service/controller layering |
| 1.3 | Existing compatibility/security tests | Spring Boot MockMvc/unit | 25/25 existing focused tests passed | Compatibility expectations were retained before production edits | 22/22 focused tests passed after implementation; adjacent controller suite 8/8 passed | Login/register, roles, precedence, stale principal, and 403 cases covered | No unrelated behavior changed |

### Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command | `cd backend && mvn -Dtest=AuthenticationSessionIntegrationTest,StalePrincipalEntryPointIntegrationTest,JwtAuthenticationFilterTest test` — BUILD SUCCESS; 22 tests, 0 failures, 0 errors |
| Adjacent compatibility command | `cd backend && mvn -Dtest=AuthenticationControllerTest test` — BUILD SUCCESS; 8 tests, 0 failures, 0 errors |
| Runtime harness | N/A — this slice has no separately deployed runtime boundary; MockMvc exercises the real Spring security filter chain, controller, service, repository, and error entry point |
| Rollback boundary | Revert `SessionProfileResponse.java`, `AuthenticationSessionIntegrationTest.java`, the `/auth/me` controller/service/matcher additions, and only the related security test behavior; no frontend, database, or existing auth contract changes are required |

### Delivery Boundary

- Strategy: stacked-to-main chained PRs, Work Unit 1 / PR 1.
- Scope: backend protected `GET /auth/me` contract only.
- Review budget: 217 authored changed lines across implementation, tests, and the progress artifact (216 additions, 1 deletion); implementation and tests account for 173 lines, under 400.
- Out of scope: frontend, protected route migration, E2E, documentation, and later phases.

### Remaining Tasks (superseded — see Work Unit 2 below)

## Work Unit 2: Frontend Session Boundary

### Completed Tasks

- [x] 2.1 Updated `frontend/src/hooks.server.test.js`, `src/routes/layout.server.test.js`, and `src/routes/login/login.server.test.js` for `/api/auth/me`, five-field projection, private `authToken`, PageData exclusion, cleanup/303, and `maxAge: 36000`.
- [x] 2.2 Changed `frontend/src/hooks.server.js` and `src/app.d.ts` to split `locals.user` (five safe fields) from `locals.authToken` (server-only JWT), call `/api/auth/me` instead of `/api/auth/validate`, and clear both locals plus all three cookies on a stale session. Changed `src/routes/login/+page.server.js` cookie `maxAge` from `24 * 60 * 60` (24h) to `36000` (10h, matching JWT expiry). `src/routes/+layout.server.js` required no functional change — it already returns only `{ user: locals.user }`, so the PageData boundary was already correct; a regression test now locks that contract.
- [x] 2.3 Proved public-route recovery (stale session on a public route clears cookies and resolves without redirecting) and proved no JWT is serialized into `locals.user` or PageData (`not.toHaveProperty('token'/'authToken')` plus `JSON.stringify(...).not.toContain(<token value>)` assertions). No password, authority, or relationship fields are present anywhere in this boundary — the backend `/auth/me` DTO (Work Unit 1) already returns exactly `id`, `firstName`, `lastName`, `email`, `role`. Reran the focused boundary command after the safety-net baseline; all green.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | Triangulate | Refactor |
|---|---|---|---|---|---|---|---|
| 2.1 | `frontend/src/hooks.server.test.js` | Vitest unit (SSR hook) | 9/9 baseline (3 focused files) passed before edits | Written first: added assertions for `/api/auth/me` call, `locals.authToken`, stale-session cleanup on guarded and public routes; 6/12 failed for the expected reasons (`/api/auth/validate` still called, `locals.authToken` undefined, `maxAge: 86400` instead of `36000`) | 12/12 passed after minimal implementation | 5 scenarios in `hooks.server.test.js`: missing token guarded, public no token, valid token five-field projection, stale session guarded (cleanup+303), stale session public (cleanup, no redirect) | Removed dead `...user, token` spread; kept hook body minimal and symmetric across all three exit branches |
| 2.1 | `frontend/src/routes/layout.server.test.js` | Vitest unit (load function) | Included in the same 9/9 baseline | Written first: asserted `authToken` never appears in returned PageData even when present in `locals` | Passed immediately — `+layout.server.js` already only returns `{ user: locals.user }`, so no production change was needed; the test locks the existing boundary as a regression guard | 3 scenarios: authenticated user, unauthenticated (`undefined`), private-field exclusion | None needed — file already minimal |
| 2.1 | `frontend/src/routes/login/login.server.test.js` | Vitest unit (SvelteKit action) | Included in the same 9/9 baseline | Written first: replaced `expect.any(Object)` with an exact cookie-options object asserting `maxAge: 36000`; failed with `86400` received | 4/4 passed after changing `maxAge` in `+page.server.js` | Existing 401 and already-logged-in scenarios continued to cover alternate paths | None needed |

### Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command | `cd frontend && npm run test -- src/hooks.server.test.js src/routes/layout.server.test.js src/routes/login/login.server.test.js` — 3 files, 12/12 tests passed |
| Full frontend regression (informational) | `cd frontend && npm run test` — 15 files, 50/50 tests passed; confirms this slice does not break Work Unit 1 or any currently-passing suite |
| Runtime harness | N/A — no separately deployed runtime boundary for this slice; Vitest exercises the real `handle` hook, `load` function, and login `actions.default` against a mocked `apiFetch`/`getAuthHeaders` boundary |
| Rollback boundary | Revert `frontend/src/hooks.server.js`, `frontend/src/hooks.server.test.js`, `frontend/src/app.d.ts`, `frontend/src/routes/layout.server.test.js`, `frontend/src/routes/login/+page.server.js`, and `frontend/src/routes/login/login.server.test.js`; `frontend/src/routes/+layout.server.js` was not modified. No backend, protected-route, mock, or documentation changes are required to roll back this slice. |

### Delivery Boundary

- Strategy: stacked-to-main chained PR, Work Unit 2 / PR 2.
- Scope: frontend session boundary only — `hooks.server.js`, `app.d.ts`, `+layout.server.js` (test-only), `login/+page.server.js`, and their four test files.
- Review budget: 137 authored changed lines across implementation and tests (117 additions, 20 deletions; `git diff --stat` on the six touched files), excluding this progress artifact and `tasks.md`. Under the 400-line budget.
- Out of scope: protected route (`dashboard`, `patients`, `dentists`, `appointments`) `locals.user.token` migration (Work Unit 3 / PR 3), E2E mock/docs (Work Unit 4 / PR 4), and Phase 5 full verification.

### Known Risk (flagged, not fixed in this slice)

34 references to `locals.user.token` remain in protected route loaders/actions (`dashboard`, `patients`, `dentists`, `appointments` and their `add`/`edit` variants). Their unit tests still pass because those tests construct `locals.user.token` fixtures directly rather than going through `hooks.server.js`. At real runtime, once this PR is deployed, `event.locals.user` populated by the hook no longer carries `token` — those routes would read `undefined` until Work Unit 3 migrates them to `locals.authToken`. This is the designed sequencing (hook/types before route consumers per `design.md` Migration/Rollout), but PR 2 and PR 3 should merge close together and PR 2 should not be deployed to production alone ahead of PR 3.

### Remaining Tasks (superseded — see Work Unit 3 below)

## Work Unit 3: Protected Routes

### Completed Tasks

- [x] 3.1 Updated tests under `frontend/src/routes/{dashboard,patients,dentists,appointments}/` (10 `*.server.test.js` files) to construct `locals.authToken` as a sibling field instead of `user.token`, and added one new guard scenario per file asserting a 303 `/login` redirect when `authToken` is missing even though `locals.user` is present.
- [x] 3.2 Migrated `dashboard/+page.server.js` and every patients/dentists/appointments `+page.server.js`, `add/+page.server.js`, and `edit/[id]/+page.server.js` loader/action (10 files) from `locals.user.token` to `locals.authToken`, and paired every guard clause to `if (!locals.user || !locals.authToken)` per `design.md`'s "paired local guards" decision.
- [x] 3.3 Confirmed each of the 10 protected loader/action files changes independently (guard + token-read only, no shared helper introduced) and reran the focused route command after the full regression pass.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | Triangulate | Refactor |
|---|---|---|---|---|---|---|---|
| 3.1 | 10 files: `dashboard/dashboard.server.test.js`, `patients/patients.server.test.js`, `patients/add/patients-add.server.test.js`, `patients/edit/[id]/patients-edit.server.test.js`, `dentists/dentists.server.test.js`, `dentists/add/dentists-add.server.test.js`, `dentists/edit/[id]/dentists-edit.server.test.js`, `appointments/appointments.server.test.js`, `appointments/add/appointments-add.server.test.js`, `appointments/edit/[id]/appointments-edit.server.test.js` | Vitest unit (SvelteKit loaders/actions) | 15/15 baseline test files passed before edits | Written first: moved `token` out of `user` fixtures into a sibling `authToken` field and added a missing-`authToken`-but-present-`user` guard scenario per file; 27/42 tests in the Phase 3 scope failed for the expected reason (`Authorization: Bearer undefined` instead of `Bearer mock-token`, and guard tests resolving instead of rejecting with 303) | 42/42 passed after minimal implementation | 10 route files, each covering redirect-when-unauthenticated, redirect-when-authToken-missing, authenticated success with exact Bearer-token forwarding, and (where applicable) role/error/delete-action outcomes | None needed beyond the fixture/guard-test additions |
| 3.2 | Same 10 `*.server.test.js` files | Vitest unit | 27/42 Phase-3-scope tests failing pre-implementation (see above) | N/A (GREEN step) | 42/42 passed | Existing role (`ADMIN` 403), delete/create/update success, and 409-conflict error paths all continued to pass unchanged, proving the migration did not alter authorization or API-call behavior | Replaced `const token = locals.user.token;` and inline `locals.user.token` reads with `locals.authToken`; paired every `if (!locals.user)` guard to `if (!locals.user \|\| !locals.authToken)` |
| 3.3 | Same 10 `*.server.test.js` files plus full suite | Vitest unit | 42/42 focused, then 60/60 full suite | N/A (REFACTOR step) | 60/60 passed | Full regression confirms Work Unit 1 (backend, N/A here) and Work Unit 2 (hook/layout/login boundary) remain green alongside the Work Unit 3 route migration | No structural refactor needed; each of the 10 files remains a self-contained guard + token-read change, independently revertible |

### Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command | `cd frontend && npm run test -- src/routes/dashboard src/routes/patients src/routes/dentists src/routes/appointments` — 10 files, 42/42 tests passed |
| Full frontend regression (informational) | `cd frontend && npm run test` — 15 files, 60/60 tests passed; confirms this slice does not break Work Unit 1 (N/A, backend) or Work Unit 2 (hook/layout/login boundary) |
| `rg -n "locals\.user\.token" frontend/src/routes` | Zero matches (confirmed before and after implementation) |
| Runtime harness | N/A — no separately deployed runtime boundary for this slice; Vitest exercises the real `load`/`actions` functions against a mocked `apiFetch`/`getAuthHeaders` boundary, matching the pattern established in Work Unit 2 |
| Rollback boundary | Revert the 10 production `+page.server.js` files (`dashboard/+page.server.js`; `patients/+page.server.js`, `patients/add/+page.server.js`, `patients/edit/[id]/+page.server.js`; `dentists/+page.server.js`, `dentists/add/+page.server.js`, `dentists/edit/[id]/+page.server.js`; `appointments/+page.server.js`, `appointments/add/+page.server.js`, `appointments/edit/[id]/+page.server.js`) and their 10 paired `*.server.test.js` files together. No backend, hook/boundary, E2E, or documentation changes are required to roll back this slice. |

### Delivery Boundary

- Strategy: stacked-to-main chained PR, Work Unit 3 / PR 3.
- Scope: protected route loader/action token migration only — 10 `+page.server.js` files and their 10 paired test files under `dashboard/`, `patients/`, `dentists/`, `appointments/`.
- Review budget: 232 authored changed lines across implementation and tests (171 additions, 61 deletions per `git diff --stat` on the 20 touched files), excluding this progress artifact and `tasks.md`. Under the 400-line budget.
- Out of scope: backend (Work Unit 1), hook/layout/login boundary (Work Unit 2), E2E mock/docs (Work Unit 4), and Phase 5 full verification. `frontend/tests/` (E2E/mock) files were not touched.

### Remaining Tasks (superseded — see Work Unit 4 below)

## Work Unit 4: E2E, Documentation, and Inventory

### Completed Tasks

- [x] 4.1 Extended `frontend/tests/auth.spec.js`: added profile-projection assertions (`Bienvenido/a, Admin`, `admin@dentalclinic.com` rendered from `/api/auth/me`) to the existing login-success test, and added a new test proving the JWT and cookie are never exposed to the client, before touching `frontend/tests/mock-backend.js`.
- [x] 4.2 Implemented `GET /api/auth/me` in `frontend/tests/mock-backend.js` (removed `/api/auth/validate`), returning exactly the five `SessionProfileResponse` fields. Updated `README.md`, `CONEXION.md`, `frontend/README.md`, `frontend/API-DOCS.md`, and `frontend/API-CONFIG.md` to describe `/api/auth/me`, the 10-hour (`maxAge: 36000`) cookie lifetime, and the `event.locals.user`/`event.locals.authToken` server-only split.
- [x] 4.3 Confirmed via `rg -n --glob '!openspec/**' 'locals\.user\.token|/api/auth/validate' .` that zero active references remain in code or maintained documentation.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | Triangulate | Refactor |
|---|---|---|---|---|---|---|---|
| 4.1 | `frontend/tests/auth.spec.js` | Playwright E2E (real preview server + mock backend) | 2/2 baseline auth E2E tests running before edits (1 already failing pre-existing because the hook already called `/api/auth/me` while the mock only served `/api/auth/validate`) | Written first: extended the login-success test with profile-projection assertions and added a new "no sensitive data exposed" test; ran before touching the mock — 2/3 failed for the expected reason (`toHaveURL(/.*dashboard/)` received `http://localhost:4173/login` because the mock backend had no `/api/auth/me` route, so the hook's `apiFetch` call 404'd, treated the session as stale, cleared cookies, and redirected) | 3/3 passed after minimal mock implementation | 3 scenarios: successful login + safe profile rendering, failed login (unchanged), and no-JWT/no-cookie-leak assertions | None needed — test bodies stayed minimal and readable |
| 4.2 | `frontend/tests/mock-backend.js` | Node `http` mock server | 3/3 focused E2E tests (from 4.1 RED run) as the safety net | N/A (GREEN step) | 3/3 passed | Verified both the authorized (`Bearer mock-admin-token`) and unauthorized (401) branches of `/api/auth/me` | Replaced `/api/auth/validate` route handler in place with `/api/auth/me`; kept field order matching the backend `SessionProfileResponse` (`id`, `firstName`, `lastName`, `email`, `role`) |
| 4.3 | Repository-wide `rg` sweep | Static inventory check | 3/3 E2E, `npm run check`, `npm run typecheck` all green | Ran `rg` before any doc edit to see remaining references (found 5 doc lines + the mock route) | Ran `rg` again after all edits — zero matches under active code/docs; only historical planning artifacts for the already-merged, unrelated `sdd/migrate-to-sveltekit/*` change remain (analogous to an archived `openspec/changes/archive/` entry, out of scope for this change's five named docs) | N/A (inventory task, not behavior) | None needed |

### Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command | `cd frontend && npm run test:e2e -- tests/auth.spec.js && npm run check && npm run typecheck` — E2E 3/3 passed; `check` 380 files, 0 errors, 0 warnings; `typecheck` clean (no output, exit 0) |
| Runtime harness | E2E boots the real mock backend (`node tests/mock-backend.js`, port 8080) and a real SvelteKit preview build (`npm run build && npm run preview`, port 4173) via Playwright's `webServer` config — this is a genuine integration boundary, not a unit-test mock |
| `rg -n --glob '!openspec/**' 'locals\.user\.token\|/api/auth/validate' .` | Zero matches in active code or the five maintained docs; 5 remaining matches are in `sdd/migrate-to-sveltekit/{tasks,design}` — frozen historical planning artifacts for an already-merged, unrelated change |
| Rollback boundary | Revert `frontend/tests/auth.spec.js`, `frontend/tests/mock-backend.js`, `README.md`, `CONEXION.md`, `frontend/README.md`, `frontend/API-DOCS.md`, and `frontend/API-CONFIG.md` together; no backend, hook/boundary, or protected-route changes are required to roll back this slice |

### Delivery Boundary

- Strategy: stacked-to-main chained PR, Work Unit 4 / PR 4 (final PR in the stack).
- Scope: E2E mock backend `/api/auth/me` route and five documentation files only.
- Review budget: 68 authored changed lines across implementation, tests, and docs (46 additions, 22 deletions per `git diff --stat` on the 7 touched files), excluding this progress artifact and `tasks.md`. Well under the 400-line budget.
- Out of scope: backend (Work Unit 1), hook/layout/login boundary (Work Unit 2), protected route migration (Work Unit 3), and Phase 5 full verification (`mvn test`, full `npm run test`) — those were explicitly not run as part of this work unit.

### Remaining Tasks (superseded — see Phase 5 below)

## Phase 5: Full Verification and Scope Gate

### Completed Tasks

- [x] 5.1 Ran `npm run check`, `npm run typecheck`, `npm run test`, `npm run test:e2e`, and `mvn test` from a clean working tree on `feat/e2e-auth-me-docs-inventory` (no code changes made in this phase); mapped every result to the four spec files' scenarios.

### Full Command Evidence

| Command | Result |
|---|---|
| `cd frontend && npm run check` | `svelte-check` — 380 files, 0 errors, 0 warnings, 0 files with problems |
| `cd frontend && npm run typecheck` | `tsc -p jsconfig.json --noEmit` — clean, no output, exit 0 |
| `cd frontend && npm run test` | Vitest — 15 test files, 60/60 tests passed |
| `cd frontend && npm run test:e2e` | Playwright — 3/3 tests passed (`tests/auth.spec.js`); build-time warnings about `untrack`/`fork`/`settled` not exported by `svelte/runtime` appeared during the SvelteKit dev/preview build but caused no test failures — this is a pre-existing Svelte-toolchain/runes version-mismatch warning, explicitly out of scope per task 5.1's exclusions (runes), not introduced by this change |
| `cd backend && mvn test` | Maven Surefire — 162 tests, 0 failures, 0 errors, 0 skipped; `BUILD SUCCESS` |

### Scenario-to-Test Mapping

| Spec file | Scenario | Proved by | Result |
|---|---|---|---|
| `auth-controller-service-boundary/spec.md` | Profile and matcher are protected (200 for existing user / 401 for anonymous, matcher precedes `permitAll()`) | `AuthenticationSessionIntegrationTest` (5/5) + `StalePrincipalEntryPointIntegrationTest` (6/6) in `mvn test` | Pass |
| `auth-controller-service-boundary/spec.md` | Existing auth behavior is unchanged (login/register, roles, header-over-cookie precedence, 401/403) | `AuthenticationControllerTest` (8/8), `JwtAuthenticationFilterTest` (11/11), `DentistControllerAuthzTest` (7/7), `PatientControllerAuthzTest` (12/12) in `mvn test`; `login.server.test.js` (4/4) in `npm run test`; full backend suite 162/162 shows no regression | Pass |
| `auth-session-contract/spec.md` | Authenticated profile (200 + exact five fields) | `AuthenticationSessionIntegrationTest` exact-field assertions (`mvn test`); E2E `auth.spec.js` login-success test asserting `Bienvenido/a, Admin` / `admin@dentalclinic.com` rendered from `/api/auth/me` (`npm run test:e2e`) | Pass |
| `auth-session-contract/spec.md` | Invalid profile request (absent/malformed/expired/deleted-user → 401) | `AuthenticationSessionIntegrationTest`'s four negative cases + `StalePrincipalEntryPointIntegrationTest` (`mvn test`) | Pass |
| `auth-session-contract/spec.md` | Protected state is safe (only public profile serializes, private token forwarded) | `hooks.server.test.js` + `layout.server.test.js` (private-field exclusion assertions) + all 10 protected-route `*.server.test.js` files (Bearer forwarding from `locals.authToken`) in `npm run test`; E2E "no sensitive data exposed" test in `npm run test:e2e` | Pass |
| `auth-session-contract/spec.md` | Guarded stale session recovers (cookies clear, redirect to `/login`) | `hooks.server.test.js` stale-session-guarded (cleanup + 303) and stale-session-public (cleanup, no redirect) scenarios in `npm run test` | Pass |
| `server-side-hooks/spec.md` | Unauthenticated guarded request (clear cookies, redirect `/login`) | `hooks.server.test.js` in `npm run test` | Pass |
| `server-side-hooks/spec.md` | Authenticated request (`/api/auth/me` used, locals hold only five public fields) | `hooks.server.test.js` + `layout.server.test.js` in `npm run test` | Pass |
| `server-side-hooks/spec.md` | Protected call is private (forwards `locals.authToken`, serializes only public data, 10-hour cookies) | All 10 protected-route `*.server.test.js` files (Bearer forwarding) + `login.server.test.js` (`maxAge: 36000`) in `npm run test` | Pass |
| `stale-principal-resolution/spec.md` | Invalid credential on `GET /auth/me` (absent/malformed/expired/deleted-user → established 401) | `AuthenticationSessionIntegrationTest`'s four negative cases + `StalePrincipalEntryPointIntegrationTest` in `mvn test` | Pass |

### Scope Exclusions (per task 5.1, not re-tested)

Refresh tokens, IAM/logout redesign, database migrations, and role-enforcement changes are non-goals of this change (`proposal.md` Non-goals) and were not touched, so no new tests target them — existing role/authorization suites (`DentistControllerAuthzTest`, `PatientControllerAuthzTest`, `JwtAuthenticationFilterTest`) already cover regression and passed unchanged. Svelte runes are out of scope; the `test:e2e` build warnings about `untrack`/`fork`/`settled` are a pre-existing toolchain/runes version-mismatch artifact of the unrelated `chore(frontend): modernize Svelte toolchain` commit, not a defect introduced by this change. `openspec/changes/archive/` and `openspec/config.yaml` drift are explicitly out of scope per `proposal.md` Non-goals and were not inspected. Threat-model rows are N/A for this change (no new attack surface beyond the already-covered stale-principal/IDOR suites), so no extra RED tests were written in this phase — Phase 5 is verification-only, consistent with the task text.

### Work Unit Evidence

| Evidence | Result |
|---|---|
| Full verification command sequence | `npm run check` → `npm run typecheck` → `npm run test` → `npm run test:e2e` → `mvn test`, all run from a clean tree with zero implementation changes |
| Regression scope | 60/60 frontend unit tests, 3/3 E2E tests, 162/162 backend tests — zero failures across all five commands, confirming Work Units 1–4 compose correctly |
| Runtime harness | E2E via real mock backend + SvelteKit preview (Playwright); backend via MockMvc against the real Spring Security filter chain and an in-memory H2 database |
| Rollback boundary | N/A — this phase made no code changes; it is a read-only verification gate |

### Delivery Boundary

- Strategy: stacked-to-main, final verification gate (not a separate PR; confirms readiness of the full stack).
- Scope: verification only — no files modified except `tasks.md` and this progress artifact.
- Out of scope: any further implementation; this change is now complete and ready for `sdd-verify`.

## Artifact Store Note

Hybrid consistency was restored from the approved Engram artifacts. Proposal, specification hierarchy, design, tasks, and this apply-progress artifact are now present under the canonical OpenSpec change path; Engram remains the approved recoverable source of truth.
