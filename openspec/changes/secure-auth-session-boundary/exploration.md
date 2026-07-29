## Exploration: secure-auth-session-boundary

### Current State

The authentication flow currently crosses the frontend/backend boundary as follows:

1. The SvelteKit login action sends `POST /api/auth/login` server-side. Because the backend has `server.servlet.context-path=/api`, this reaches `AuthenticationController` at `/auth/login` and returns `AuthenticationResponse` with a JWT plus public user fields.
2. The action stores the JWT in an `authToken` httpOnly, `SameSite=Lax` cookie and also stores `userRole` and `userEmail` cookies. The cookie lifetime is 24 hours.
3. On the next request, `hooks.server.js` reads `authToken` and calls `/api/auth/validate` with a Bearer header. No backend mapping exists for `/auth/validate`, so `apiFetch` receives 404, the hook clears all three cookies, and guarded routes redirect to `/login`.
4. The current intended success path spreads the validation response into `event.locals.user` and adds `token` to that object. `+layout.server.js` returns `locals.user`, so the JWT is included in layout PageData. All protected loaders/actions then read `locals.user.token` and send it to the backend.
5. The backend JWT filter checks an Authorization Bearer token first and falls back to the `authToken` cookie. Invalid, malformed, and expired tokens are ignored by the filter and protected routes receive the custom 401 entry-point response. A valid JWT whose user row is gone is also left unauthenticated and receives 401. Authenticated users retain role authorities for `@PreAuthorize` checks; role-based behavior is not owned by the frontend.

The backend JWT expires after 10 hours (`JwtService`), while the frontend cookie lasts 24 hours. This is not an authentication bypass because backend validation still rejects the expired JWT, but it leaves a stale cookie for up to 14 hours until the next request clears it.

Existing OpenSpec coverage requires server-side cookie validation and `event.locals.user`, and the stale-principal specs already establish 401 behavior for invalid, expired, and deleted-user credentials. `openspec/config.yaml` has known drift (stale Svelte 4/Vite 5 versions and an outdated root path); it was read but not changed.

### Affected Areas

- `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationController.java` — add the authenticated session endpoint while preserving register/login/check-email behavior.
- `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationService.java` — resolve the authenticated email through the service boundary and map it to a public DTO; missing backing data must remain a stale-principal 401.
- `backend/src/main/java/com/dh/dentalClinicMVC/authentication/` — introduce a public user/session DTO that contains `id`, names, email, and role, but never `token`, password, authorities, or entity relationships. Keep `AuthenticationResponse` for the existing login/register contract unless a later proposal explicitly changes it.
- `backend/src/main/java/com/dh/dentalClinicMVC/configuration/SecurityConfiguration.java` — place the new session endpoint under `authenticated()` before the broad `/auth/**` `permitAll()` matcher; otherwise the endpoint would be public.
- `backend/src/main/java/com/dh/dentalClinicMVC/configuration/JwtAuthenticationFilter.java` and `backend/src/main/java/com/dh/dentalClinicMVC/security/StalePrincipalEntryPoint.java` — preserve the existing header/cookie precedence and 401 mechanism; no filter redesign is indicated.
- `backend/src/test/java/com/dh/dentalClinicMVC/authentication/AuthenticationControllerTest.java` and `backend/src/test/java/com/dh/dentalClinicMVC/security/StalePrincipalEntryPointIntegrationTest.java` — add endpoint shape, authentication, malformed/expired, and stale-user regression coverage. Existing filter tests already cover the filter mechanism but do not cover a session endpoint.
- `frontend/src/hooks.server.js` — call the real session endpoint, project only the allowed public fields into `locals.user`, and keep the token in a separate server-only local rather than inside the user object.
- `frontend/src/routes/+layout.server.js` and `frontend/src/app.d.ts` — expose only the public session DTO through PageData and remove `token` from the public user type. A separate `authToken` local can remain server-only and must never be returned by a loader.
- `frontend/src/routes/dashboard/+page.server.js` — stop reading `locals.user.token`; continue enforcing `ADMIN` and forward the private server-side token for dashboard API calls.
- `frontend/src/routes/patients/**/+page.server.js`, `frontend/src/routes/dentists/**/+page.server.js`, and `frontend/src/routes/appointments/**/+page.server.js` — replace all `locals.user.token` reads with the private server-side credential source while preserving existing authorization and API behavior.
- `frontend/src/lib/api.js` — the existing server-side Bearer helper can remain the single header builder; its tests should be aligned with the session contract if a small helper is added.
- `frontend/src/hooks.server.test.js`, `frontend/src/routes/layout.server.test.js`, `frontend/src/routes/login/login.server.test.js`, `frontend/src/routes/dashboard/dashboard.server.test.js`, and the affected route server tests — assert the same endpoint path, public response shape, 401 handling, private token forwarding, and absence of JWT from user/PageData fixtures.
- `CONEXION.md`, `README.md`, and archived OpenSpec evidence document the nonexistent `/api/auth/validate`; they are documentation drift to account for in a later proposal, but they were not modified during exploration.

### Approaches

1. **Add `/auth/me` as an explicitly authenticated session endpoint** — return a dedicated public user/session DTO derived from the authenticated principal and have the hook call `/api/auth/me`.
   - Pros: expresses the resource being requested, separates session identity from validation mechanics, gives the frontend a stable public contract, and naturally preserves 401 behavior through the existing security entry point.
   - Cons: requires an explicit matcher before `/auth/**` `permitAll()`, a new backend method/DTO, and coordinated frontend/test updates.
   - Effort: Medium

2. **Implement `/auth/validate` to match the existing hook and documentation** — return the same dedicated public DTO from a validation-named endpoint.
   - Pros: smallest URL change, aligns with existing `CONEXION.md` and archived migration artifacts, and avoids changing the hook's endpoint name.
   - Cons: “validate” describes an operation rather than the returned session resource, still requires the endpoint to be explicitly authenticated before `/auth/**`, and perpetuates terminology that caused the current contract drift.
   - Effort: Medium

### Recommendation

Use **`GET /auth/me`** with a dedicated public session DTO. It is the clearest minimal contract: the backend owns JWT verification through the existing filter/security chain, while the controller/service owns mapping the authenticated user to non-sensitive data. Configure `/auth/me` as authenticated before the existing `/auth/**` permit-all rule so absent, malformed, expired, and stale credentials consistently produce the already-established 401 response.

In the SvelteKit hook, keep `event.locals.user` limited to the public DTO and store the validated JWT separately in a server-only local such as `event.locals.authToken`. Project the response explicitly instead of spreading arbitrary backend fields. Update server loaders/actions to use that private local for Bearer headers, and keep `+layout.server.js` returning only `locals.user`; this prevents the JWT from entering user state or serialized PageData without duplicating cookie parsing across every route.

Keep the existing login response token for now because the server-side login action needs it to establish the httpOnly cookie and the current login contract has regression coverage. Add aligned backend/frontend tests using the same `/api/auth/me`, 200 DTO shape, 401 statuses, role values, and “no `token`/`password`” assertions. Treat the 10-hour JWT versus 24-hour cookie lifetime as an explicit follow-up or narrowly scoped alignment decision; current 401 cleanup must remain unchanged.

### Risks

- If `/auth/me` is left behind the broad `/auth/**` `permitAll()` matcher, an unauthenticated request could bypass the intended security boundary.
- If the hook continues spreading the response or if any loader returns the private local, the JWT can re-enter PageData even after the backend DTO is safe.
- Changing every protected loader/action inconsistently could break API calls or role behavior; the complete `locals.user.token` inventory must be migrated and tested.
- A public DTO implemented by returning `User` directly could expose future entity fields or relationships; the DTO boundary must be explicit.
- The cookie/JWT lifetime mismatch can create repeated 401/redirect behavior after the JWT expires, although it does not make an expired token valid.
- Existing docs and archived verification artifacts assert `/api/auth/validate`; stale documentation can mislead future maintenance unless corrected in a later phase.

### Ready for Proposal

Yes. The current flow and failure are sufficiently understood, and `/auth/me` plus a separate server-only token local is the safest minimal direction. The proposal should define the exact DTO fields, matcher ordering, 401 contract, private-local naming, complete route/test migration inventory, and whether the cookie lifetime remains 24 hours or is aligned to the 10-hour JWT.
