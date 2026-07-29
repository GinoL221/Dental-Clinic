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

### Remaining Tasks

- [ ] 3.1–3.3 Protected route token migration
- [ ] 4.1–4.3 E2E, documentation, and inventory
- [ ] 5.1 Full verification and scope gate

## Artifact Store Note

Hybrid consistency was restored from the approved Engram artifacts. Proposal, specification hierarchy, design, tasks, and this apply-progress artifact are now present under the canonical OpenSpec change path; Engram remains the approved recoverable source of truth.
