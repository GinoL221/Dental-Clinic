# Tasks: Secure Authentication Session Boundary

## Review Workload Forecast

Estimated authored additions + deletions: **420–500 lines**; estimated files changed: **40–45**; risk: **High**. Proposed boundaries: PR 1 backend, PR 2 boundary, PR 3 routes, PR 4 mock/docs/gates. Tests stay with behavior. Chain strategy is `stacked-to-main`.

Delivery: `ask-on-risk`; chain: `stacked-to-main`.

Decision needed before apply: Yes (resolved by user choosing chained PRs).
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | `/auth/me` DTO, service, matcher, compatibility | PR 1 | `cd backend && mvn -Dtest=AuthenticationSessionIntegrationTest,StalePrincipalEntryPointIntegrationTest,JwtAuthenticationFilterTest test` | N/A — MockMvc/integration tests | Backend endpoint, matcher |
| 2 | Hook locals, PageData, cookies | PR 2 | `cd frontend && npm run test -- src/hooks.server.test.js src/routes/layout.server.test.js src/routes/login/login.server.test.js` | N/A — Vitest SSR/API mocks | Boundary files and tests |
| 3 | Protected route token migration | PR 3 | `cd frontend && npm run test -- src/routes/dashboard src/routes/patients src/routes/dentists src/routes/appointments` | N/A — route loaders/actions | Protected route files and tests |
| 4 | E2E mock, docs, inventory, gates | PR 4 | `cd frontend && npm run test:e2e -- tests/auth.spec.js && npm run check && npm run typecheck` | E2E boots mock backend + preview | Mock/docs/inventory changes |

## Phase 1: Backend Contract and Security (TDD)

- [x] 1.1 **RED:** Add `backend/src/test/java/com/dh/dentalClinicMVC/authentication/AuthenticationSessionIntegrationTest.java` for exact five-key/200 and absent/malformed/expired/deleted-user 401; extend stale-principal/filter tests for matcher order, login/register, roles, precedence, and 401/403.
- [x] 1.2 **GREEN:** Create `backend/src/main/java/com/dh/dentalClinicMVC/authentication/SessionProfileResponse.java`; implement mapping and ordered `GET /auth/me` in `AuthenticationService.java`, `AuthenticationController.java`, and `configuration/SecurityConfiguration.java`.
- [x] 1.3 **REFACTOR:** Preserve `StalePrincipalException`, error bodies, and auth contracts; rerun the focused backend command.

## Phase 2: Frontend Session Boundary (TDD)

- [ ] 2.1 **RED:** Update `frontend/src/hooks.server.test.js`, `src/routes/layout.server.test.js`, and `src/routes/login/login.server.test.js` for `/api/auth/me`, five-field projection, private `authToken`, PageData exclusion, cleanup/303, and `maxAge: 36000`.
- [ ] 2.2 **GREEN:** Change `frontend/src/hooks.server.js`, `src/app.d.ts`, `src/routes/+layout.server.js`, and `src/routes/login/+page.server.js` to split locals, project safe data, and set 10-hour cookies.
- [ ] 2.3 **REFACTOR:** Prove public recovery and no serialized JWT/password/authority/relationship data; rerun the focused boundary command.

## Phase 3: Protected Routes (TDD)

- [ ] 3.1 **RED:** Update tests under `frontend/src/routes/{dashboard,patients,dentists,appointments}/` for `locals.authToken`, Bearer forwarding, guards, and unchanged API/role outcomes.
- [ ] 3.2 **GREEN:** Migrate `dashboard/+page.server.js` and every patients/dentists/appointments list, `add/+page.server.js`, and `edit/[id]/+page.server.js` consumer to `locals.authToken`.
- [ ] 3.3 **REFACTOR:** Confirm each protected loader/action is independently reversible; rerun the focused route command.

## Phase 4: E2E, Documentation, and Inventory (TDD)

- [ ] 4.1 **RED:** Extend `frontend/tests/auth.spec.js` for `/api/auth/me`, safe profile data, and preserved login success/failure before changing `frontend/tests/mock-backend.js`.
- [ ] 4.2 **GREEN:** Implement mock `/api/auth/me`; update `README.md`, `CONEXION.md`, `frontend/README.md`, `frontend/API-DOCS.md`, and `frontend/API-CONFIG.md` for `/me`, 10 hours, and server-only tokens.
- [ ] 4.3 **REFACTOR:** `rg -n --glob '!openspec/**' 'locals\.user\.token|/api/auth/validate' .` must return zero active matches.

## Phase 5: Full Verification and Scope Gate

- [ ] 5.1 Run `npm run check`, `npm run typecheck`, `npm run test`, `npm run test:e2e`, and `mvn test`; map results to scenarios. Exclude refresh/IAM/DB/role changes, runes, archives, and config drift. Threat rows are N/A; no extra RED tests apply.

## Apply Status

Work Unit 1 is complete. Work Units 2–4 and Phase 5 remain pending.
