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

### Remaining Tasks

- [ ] 2.1–2.3 Frontend session boundary
- [ ] 3.1–3.3 Protected route token migration
- [ ] 4.1–4.3 E2E, documentation, and inventory
- [ ] 5.1 Full verification and scope gate

## Artifact Store Note

Hybrid consistency was restored from the approved Engram artifacts. Proposal, specification hierarchy, design, tasks, and this apply-progress artifact are now present under the canonical OpenSpec change path; Engram remains the approved recoverable source of truth.
