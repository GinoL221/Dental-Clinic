# Proposal: Secure Authentication Session Boundary

## Intent

Fix the SvelteKit/Spring Boot boundary: the hook calls nonexistent `/api/auth/validate`, may expose JWT through `locals.user`/PageData, and keeps cookies 24 hours versus a 10-hour JWT. Decisions set `/auth/me`, five public fields, 10-hour cookies, stale-session cleanup/redirects, preserved auth contracts, and docs; refresh tokens/IAM redesign are deferred.

## Scope

### In Scope

- Authenticated `GET /auth/me` (`/api/auth/me`) returning `id`, `firstName`, `lastName`, `email`, and `role`.
- Clear `authToken`, `userRole`, and `userEmail`; redirect guarded requests to `/login` for invalid, expired, or deleted-user sessions.
- Keep `event.locals.user` public-only; store JWT server-side and migrate every `locals.user.token` consumer.
- Backend/frontend contract tests for shape, 200/401, stale credentials, private forwarding, and no JWT/password exposure.
- Update active auth references in `README.md`, `CONEXION.md`, and frontend documentation.

### Non-goals

- Refresh tokens, logout/IAM redesign, or register/login contract changes.
- Role enforcement, header-over-cookie precedence, and established 401/403 behavior.
- `openspec/config.yaml` drift and archived evidence; track config separately.

## First-slice Outcomes

- Non-sensitive profile only in `locals.user`/PageData; zero `locals.user.token` references.
- Hook uses `/api/auth/me`; security-chain authentication and stale-principal 401s remain authoritative.

## Capabilities

### New Capabilities

- `auth-session-contract`: `/auth/me` profile and server-only credential boundary.

### Modified Capabilities

- `auth-controller-service-boundary`: Add the session endpoint through controller/service/DTO layers.
- `server-side-hooks`: Validate, project safe fields, and clean up stale sessions.
- `stale-principal-resolution`: Cover `/auth/me` with uniform 401 handling.

## Approach

Use a DTO/service lookup; match `/auth/me` before broad `/auth/**` `permitAll()`; explicitly project the hook response; retain JWT only in a server-only local. Verify with contract tests.

## Product and Security Impact

Users get login recovery. JWTs cannot enter serialized user state; Spring Security owns authentication and authorization.

## Affected Areas

- Backend auth/security: controller, service, DTO, matcher, and tests.
- Frontend hook/routes/types: session fetch, private local, loaders/actions, and tests.
- Active documentation: replace `/validate` and token-in-user claims.

## Risks

- Matcher order could expose `/auth/me`; require ordering and a security test.
- A private token could be re-serialized; use type/fixture assertions.
- Partial migration could break calls/roles; use route tests and preserve rules.

## Rollback Boundary

Revert endpoint, DTO, hook/local, routes, tests, and docs together. No database migration or token-format change is introduced.

## Review Workload

Estimated delta: **250–350 lines**, **medium** workload, within the 400-line budget. Reassess during task planning; ask before applying if exceeded.

## Success Criteria

- [ ] Backend/frontend tests agree on `/api/auth/me`, five fields, roles, and 200/401 outcomes.
- [ ] Invalid, expired, and deleted-user sessions clear cookies and redirect guarded requests.
- [ ] JWT/password are absent from PageData; no active `locals.user.token` references remain.
- [ ] Cookies last 10 hours; login/register, roles, precedence, and 401/403 remain compatible.
- [ ] `README.md` and `CONEXION.md` accurately describe the shipped flow.
