# Design: Secure Authentication Session Boundary

## Technical Approach

Keep the stateless JWT model and Spring Security filter/entry-point behavior. Add protected `GET /auth/me` mapped to a dedicated five-field DTO. The SvelteKit hook calls `/api/auth/me`, explicitly projects it, and keeps the JWT in a separate server-only local.

**Request/response flow:**

1. Login sends `POST /api/auth/login`; the existing `AuthenticationResponse` (including `token`) stays unchanged. The action consumes the token server-side, sets `authToken`, `userRole`, and `userEmail` as `httpOnly`, `SameSite=Lax`, `path=/`, `maxAge=36,000` cookies, then redirects.
2. The hook reads `authToken` and sends `GET /api/auth/me` with `Authorization: Bearer <token>` (`/api` is the backend context path).
3. The filter preserves header-over-cookie precedence, validates the token/user, and controller/service returns exactly the five fields.
4. The hook stores the projection in `event.locals.user` and the token in `event.locals.authToken`. `+layout.server.js` returns only `user`, creating the PageData boundary.
5. Protected loaders/actions require both locals, call `getAuthHeaders(locals.authToken)`, and never read `locals.user.token`.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|---|---|---|---|
| Session endpoint | `GET /auth/me` plus `SessionProfileResponse` | Recreate `/auth/validate`; return `User` | Exact resource contract without entity/password/relationship leakage. |
| Matcher | `GET /auth/me` `.authenticated()` before `/auth/**`.permitAll()` | Broad matcher or frontend checks | First-match ordering routes anonymous and stale credentials to the established 401 entry point. |
| Local boundary | `user: PublicUser \| null`; `authToken: string \| null` | Token inside `user`; session store | Preserves SSR while making serialization explicit without new infrastructure. |
| Route migration | Reuse `getAuthHeaders`; add paired local guards | New auth abstraction or cookie parsing | Existing helper is sufficient; redirect policy stays in routes. |

## Interfaces / Contracts

Backend: create `authentication/SessionProfileResponse.java` with only `Long id`, `String firstName`, `String lastName`, `String email`, and `String role`. Add `AuthenticationController.me(Authentication)` returning `ResponseEntity<SessionProfileResponse>` and `AuthenticationService.getSessionProfile(String email)`, mapping `IUserRepository.findByEmail` or throwing `StalePrincipalException`.

Frontend `App.Locals` becomes:

```js
user: { id: number; firstName: string; lastName: string; email: string;
        role: 'ADMIN' | 'PATIENT' | 'DENTIST' } | null;
authToken: string | null; // server-only; never returned by a load
```

The hook initializes both locals on every branch. No token sets both null; guarded requests get 303 `/login`, public requests resolve. A failed `/auth/me` deletes `authToken`, `userRole`, and `userEmail`, sets both null, and has the same guarded/public outcome. Existing role checks, login/register shapes, 401/403 semantics, and filter precedence remain unchanged.

## File-Level Impact Map

| Area | Files | Action |
|---|---|---|
| Backend | `authentication/SessionProfileResponse.java`; `AuthenticationController.java`; `AuthenticationService.java`; `configuration/SecurityConfiguration.java` | Add DTO/method/service mapping and ordered matcher. |
| Backend tests | New `authentication/AuthenticationSessionIntegrationTest.java`; `security/StalePrincipalEntryPointIntegrationTest.java` | RED-first exact shape, matcher, 200/401, stale cases, and 403 compatibility. |
| Frontend boundary | `src/hooks.server.js`; `src/app.d.ts`; `src/routes/+layout.server.js`; `src/routes/login/+page.server.js` | Split locals, project PageData, use `/me`, and enforce 10-hour cookies. |
| Protected routes/tests | `src/routes/dashboard/+page.server.js`; `src/routes/{patients,dentists,appointments}/{+page.server.js,add/+page.server.js,edit/[id]/+page.server.js}`; corresponding `*.server.test.js` files | Migrate every `locals.user.token` consumer/fixture to `locals.authToken`; preserve authorization/API calls. |
| E2E/docs | `frontend/tests/mock-backend.js`; `README.md`; `CONEXION.md`; `frontend/README.md`; `frontend/API-DOCS.md`; `frontend/API-CONFIG.md` | Mock `/api/auth/me`; replace active `/validate`, 24-hour, and token-in-user references. |

## Testing Strategy

Strict TDD writes RED assertions before production changes. Backend tests cover exact five-key shape with no sensitive fields, authenticated 200, anonymous/malformed/expired/deleted 401, matcher ordering, stale lookup, precedence, unchanged login/register, 403, and error-body consistency. Frontend tests cover hook `/me` projection and both locals, cleanup/redirects, layout PageData exclusion, 10-hour cookie options, every protected route’s Bearer forwarding, and zero `locals.user.token` references. Update the E2E mock and retain login success/failure. Verify docs by repository search for active `/validate`, 24-hour, or token-in-user claims; run `npm run check`, `npm run typecheck`, `npm run test`, and `mvn test` during apply.

## Threat Matrix

| Boundary | Applicability and response | Planned RED test |
|---|---|---|
| Documentation-like paths | N/A — docs are prose only; no executable classification changes. | None |
| Git repository selection | N/A — no repository-selection automation. | None |
| Commit state | N/A — this change does not automate commits. | None |
| Push state | N/A — this change does not automate pushes. | None |
| PR commands | N/A — this change does not compose PR commands. | None |

## Migration / Rollout

Sequence: backend DTO/service/controller/matcher; RED/green tests; hook/types; login/layout; route consumers/fixtures; mock/docs; compatibility verification. Rollback reverts endpoint/DTO/matcher, local split, migrations, tests, mock, and docs together; no database, token-format, refresh-token, IAM, role, or runes migration. Preserve warning logs and 401 bodies; never log JWTs. Estimated authored delta: **330–380 lines**, under 400; `.svelte-kit`, `target`, reports, and lockfiles are generated/excluded and not intentionally changed. With `ask-on-risk`/`ask-always`, stop and ask before apply if it exceeds 400.

## Open Questions

None blocking. Follow-up only: `openspec/config.yaml` has known root/Svelte-toolchain drift; do not modify it in this change.
