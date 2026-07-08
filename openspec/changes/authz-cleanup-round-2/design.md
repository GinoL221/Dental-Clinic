# Design: Authz Cleanup Round 2

## Technical Approach

Two independent, revertible workstreams over the same files:

- **R2 (role-check consolidation)** — extract `AppointmentController.hasRole()` into a stateless
  static utility and route all inline `getAuthorities()` checks through it. Byte-for-byte
  behavior-preserving; no `@PreAuthorize` or object-level-authorization outcome changes.
- **R3 (missing-backing-row → 401)** — unify the "valid JWT, no backing row" contract on **401
  Unauthorized** at both layers: controller/service (9 sites) via a new exception mapped in
  `GlobalExceptionHandler`, and the authentication-filter layer via a **custom
  `AuthenticationEntryPoint`** (the filter itself fails open, exactly like its existing sibling
  catch).

Locked-in decision: status is **401** everywhere; goal is contract consistency + closing the
filter's 500 leak, not defensive hardening of an unreachable orphan DB state.

## Architecture Decisions

### Decision 1: Role-check helper is a static utility, not a bean or base class

**Choice**: New final class `com.dh.dentalClinicMVC.security.AuthorizationUtils` with
`static boolean hasRole(Authentication, String)` (null-safe, mirrors current logic) and
`static boolean hasAnyRole(Authentication, String...)`. Called directly at each site.
`PatientController.findById()`'s compound `ADMIN || DENTIST` uses
`hasAnyRole(auth, "ROLE_ADMIN", "ROLE_DENTIST")`.

| Option | Tradeoff | Verdict |
|--------|----------|---------|
| Static util (chosen) | Pure function, zero DI ceremony, unit-testable, ~5 sites | ✅ |
| `@Component` bean | Needless Spring wiring + constructor changes in 3 controllers for a pure function | ❌ over-engineered |
| Abstract base controller | Inheritance for a cross-cutting concern; couples unrelated controllers | ❌ wrong axis |

**Rationale**: The logic has no dependencies and no state. A static util is the minimal
behavior-preserving extraction for a 5-site surface. `AppointmentController.hasRole()` is removed
and its 4 in-file callers plus `findAll()`'s inline block route through the util.

### Decision 2: Controller/service 401 via a new dedicated exception

**Choice**: New `com.dh.dentalClinicMVC.exception.StalePrincipalException extends RuntimeException`.
Add one `@ExceptionHandler(StalePrincipalException.class)` to `GlobalExceptionHandler` returning
`ErrorResponse` with `HttpStatus.UNAUTHORIZED` (mirrors the existing 401 handlers' shape). All 9
`.orElseThrow(...)` sites (6× `IllegalArgumentException`→400, 3× `AccessDeniedException`→403) now
throw `StalePrincipalException`.

**Message policy**: all 9 controller/service sites AND the filter-layer entry point (Decision 3)
emit a **single uniform message** (neutral/professional Spanish, aligned with the existing
`AuthenticationCredentialsNotFoundException` handler, e.g. `error:"No autenticado"`,
`message:"La sesión ya no es válida. Iniciá sesión nuevamente."`) — NOT per-site text. Per-site
messages would leak WHICH lookup missed (`users` vs `Patient` vs `Dentist`), an
information-disclosure vector, while the client's remedy (re-authenticate) is identical regardless.

**`AppointmentController.updateStatus()` disambiguation**: this method has 3 separate
`IllegalArgumentException` throw sites. Only the `findByEmail`-miss throw (DENTIST branch, own
`dentistService.findByEmail(auth.getName())` lookup) converts to `StalePrincipalException`. The two
sibling validation throws — "El campo 'status' es obligatorio" (missing `status` field) and
"Status inválido: ..." (invalid `AppointmentStatus` value) — are unrelated input-validation errors
and MUST remain `IllegalArgumentException`→400, untouched.

| Option | Tradeoff | Verdict |
|--------|----------|---------|
| New exception + one mapping (chosen) | Self-documenting contract, single mapping point, consistent body | ✅ |
| Reuse `AuthenticationCredentialsNotFoundException` (already 401) | Wrong semantics ("missing credentials" — credentials WERE valid); misleading | ❌ |
| Build `ResponseEntity(401)` inline at each site | Re-introduces the duplication R2 removes; impossible at the service-layer sites | ❌ |

**Spring nuance (no conflict)**: a controller/service exception is resolved by DispatcherServlet's
`HandlerExceptionResolver` (`@RestControllerAdvice`) and converted to a response before it can
unwind to `ExceptionTranslationFilter`, so the security entry point never fires here. Single 401,
`ErrorResponse` body.

### Decision 3: Filter fails open; a custom `AuthenticationEntryPoint` produces the 401

**Choice**: `JwtAuthenticationFilter` gains a **separate** `catch (UsernameNotFoundException ex)`
that MIRRORS the existing `JwtException | IllegalArgumentException` sibling — log a warning, write
NOTHING, do NOT short-circuit; leave `SecurityContextHolder` unauthenticated and fall through to
`filterChain.doFilter`. `StalePrincipalEntryPoint` is `@Component`-annotated and
constructor-injected — via Lombok `@RequiredArgsConstructor`, matching the existing
`jwtAuthenticationFilter`/`authenticationProvider` pattern — as a new final field into
`SecurityConfiguration`, which passes it to
`.exceptionHandling(h -> h.authenticationEntryPoint(entryPoint))`; it writes `401` +
`ErrorResponse` JSON (uniform message) for any unauthenticated request that reaches a protected
(`authenticated()`) route. `StalePrincipalEntryPoint` MUST itself constructor-inject the
application's Spring-managed `ObjectMapper` bean (not instantiate its own `new ObjectMapper()`),
so JSON serialization of `ErrorResponse` — including the `LocalDateTime timestamp` field, which
requires the registered `JavaTimeModule` — behaves identically to the controller-layer 401s.
`ExceptionTranslationFilter` invokes it ONLY for unauthenticated requests. The filter no longer
needs `ObjectMapper`.

| Option | Tradeoff | Verdict |
|--------|----------|---------|
| A: fail-open filter + custom entry point (chosen) | Idiomatic; no route matching in the filter; login recovery works; ONE security-layer 401 body source | ✅ |
| B: filter matches route type before hard-blocking | Duplicates `SecurityConfiguration`'s matchers (the exact duplication R2 removes); fragile to route-config drift | ❌ |
| Original: filter hard-writes 401 + `return` | Runs on EVERY request incl. `permitAll` `/auth/**`; blocks `POST /auth/login` with a stale cookie → account **lockout on the recovery path** | ❌ |

**Rationale**: The original hard-block ran on every request, including `permitAll` `/auth/**`. A
user whose account was deleted but who still holds a stale `authToken` cookie and tries
`POST /auth/login` to recover would be blocked BEFORE the login controller — a genuine lockout on
the one path that fixes the problem, worse than today's 500. Delegating to the entry point lets
`permitAll` routes proceed (login works) while `authenticated()` routes get a deterministic 401,
WITHOUT the filter re-implementing route matching.

**Body consistency**: the entry point is the SINGLE writer of security-layer 401 bodies, using the
same `ErrorResponse{error, message, path, status:401, timestamp}` shape and uniform message as
Decision 2. This eliminates the risk of a second, drifting JSON error shape between the filter
layer and the controller layer (the old design had the filter write its own body).

**Observable side effect (in scope — spec updated)**: the custom entry point REPLACES Spring's
default `Http403ForbiddenEntryPoint`, so it fires for ALL unauthenticated protected-route access —
not only the stale-principal path but also the pre-existing malformed/expired/absent-token path.
Those change **403 → 401**. This is semantically correct (401 = unauthenticated; the old 403 was
inaccurate for "no valid credentials") and desirable for cross-layer consistency, but it IS an
additional observable change, so the spec's "Preserves Existing Invalid-Token Handling" requirement
is revised to guarantee the MECHANISM (fail-open, continue chain, no filter-level write), not the
403 status. Authenticated-but-forbidden requests (wrong role / `@PreAuthorize` deny) go through
`accessDeniedHandler` → still **403**, so the R2 allow/deny matrix is UNCHANGED.

## Data Flow

    Valid JWT, users row gone (filter layer):
      request ─→ JwtAuthenticationFilter.loadUserByUsername → UsernameNotFoundException
                    └─→ catch: log + continue (unauthenticated), NO write, NO return
                 ─→ authorizeHttpRequests:
                      • permitAll route (POST /auth/login) → proceeds → controller (recovery works)
                      • authenticated() route → ExceptionTranslationFilter
                            → custom AuthenticationEntryPoint → 401 + ErrorResponse

    Valid JWT, Patient/Dentist child row gone (controller/service):
      request ─→ filter (auth OK) ─→ .findByEmail().orElseThrow(StalePrincipalException)
                    ─→ GlobalExceptionHandler → 401 + ErrorResponse

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `security/AuthorizationUtils.java` | Create | Static `hasRole` / `hasAnyRole`; null-safe |
| `exception/StalePrincipalException.java` | Create | `RuntimeException` marking valid-JWT / missing-backing-row |
| `security/StalePrincipalEntryPoint.java` | Create | `AuthenticationEntryPoint` writing 401 + `ErrorResponse` (uniform message, `ObjectMapper`) |
| `exception/GlobalExceptionHandler.java` | Modify | Add `@ExceptionHandler(StalePrincipalException)` → 401 `ErrorResponse` |
| `configuration/SecurityConfiguration.java` | Modify | Add `.exceptionHandling(h -> h.authenticationEntryPoint(...))` wiring the new bean |
| `controller/AppointmentController.java` | Modify | Remove private `hasRole()`; route 4 callers + `findAll()` inline to util; 4 sites (save, findById, update, updateStatus) throw `StalePrincipalException` — in `updateStatus()`, only the `findByEmail`-miss throw converts; the two sibling `IllegalArgumentException` validation throws stay 400 |
| `controller/PatientController.java` | Modify | `update()` + `findById()` inline → util (`findById` uses `hasAnyRole`); 2 sites `AccessDeniedException`→`StalePrincipalException` |
| `controller/DentistController.java` | Modify | `update()` inline → util; 1 site → `StalePrincipalException` |
| `service/impl/AppointmentServiceImpl.java` | Modify | `findAllForCurrentUser()` 2× `IllegalArgumentException`→`StalePrincipalException` (PATIENT + DENTIST branches) |
| `configuration/JwtAuthenticationFilter.java` | Modify | Add separate `UsernameNotFoundException` catch mirroring the sibling (log + continue, NO write, NO short-circuit). No `ObjectMapper` injection |

## Interfaces / Contracts

```java
public final class AuthorizationUtils {
  private AuthorizationUtils() {}
  public static boolean hasRole(Authentication auth, String role) {
    return auth != null
        && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(role));
  }
  public static boolean hasAnyRole(Authentication auth, String... roles) {
    for (String r : roles) if (hasRole(auth, r)) return true;
    return false;
  }
}
```

401 body (both layers, uniform message): `ErrorResponse{ error, message, path, status:401, timestamp }`.
The custom `AuthenticationEntryPoint` writes the response manually and MUST set
`response.setStatus(SC_UNAUTHORIZED)`, `response.setContentType(MediaType.APPLICATION_JSON_VALUE)`,
and `response.setCharacterEncoding("UTF-8")` before serializing `ErrorResponse` via `ObjectMapper`
— the controller-layer 401 gets these for free from `HttpMessageConverter`.

## Testing Strategy

Strict TDD. Runner: `./mvnw test` (Maven wrapper in `backend/`). MockMvc + full security filter
chain, mirroring `PatientControllerAuthzTest` (`authAs(email, role)` seeds a String-principal
`Authentication` that resolves to no backing row).

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Controller (7 sites) | `PatientController.update/findById`, `DentistController.update`, `AppointmentController.save/findById/update/updateStatus` with a forged principal having no backing row → **401** | MockMvc, seed no row, `authAs`, assert `isUnauthorized()` + `$.status==401` |
| Service-driven (2 sites) | `AppointmentController.findAll` PATIENT + DENTIST branches → `findAllForCurrentUser` miss → **401** | MockMvc `GET /appointments` with role but no row (assert each branch separately) |
| Filter — protected route | Real Bearer JWT (via `JwtService`) for an email with no `users` row hitting a protected route → **401** via entry point | `Authorization: Bearer <token>`, no seeded user, assert `isUnauthorized()` + `ErrorResponse` body |
| Filter — LOCKOUT GUARD | Stale token/cookie on `POST /auth/login` (permitAll) is NOT blocked — request reaches and is processed by the login handler | MockMvc `POST /auth/login` with a real seeded user's VALID email+password in the request body (an identity distinct from whatever principal the stale/dead JWT resolves to), while attaching the stale/dead JWT as the `Authorization` header or `authToken` cookie; assert `status().isOk()` (200). Asserting "not 401" is insufficient: `POST /auth/login` is `permitAll`, so the new entry point can never fire there regardless of whether the fix works, and `AuthenticationService.login()`'s `BadCredentialsException`→401 path produces the identical status/shape for an unrelated reason (wrong password) — only a 200 unambiguously proves the request reached and was processed by the login handler rather than being blocked by the filter |
| Entry-point regression | Unauthenticated / absent / malformed token on a protected route now returns **401** (was 403) — the in-scope observable change | MockMvc protected route with no or bad token, assert `isUnauthorized()` |
| Authz matrix (R2) | Authenticated-but-wrong-role denials stay **403** via `accessDeniedHandler`; existing `*AuthzTest` allow/deny matrix unchanged | Run existing suites unchanged |

## Migration / Rollout

No migration/schema change. Additive + refactor-only. R2 and R3 revert independently. Two
contract changes to confirm with product before apply (both effectively unreachable/benign today):
1. Missing-backing-row: **400/403 → 401** (Decisions 2 + 3).
2. Unauthenticated access to a protected route: **403 → 401** (Decision 3 entry-point side effect;
   authenticated-but-forbidden stays 403).

## Open Questions

- [ ] Product sign-off for **400/403 → 401** (missing-backing-row) and **403 → 401** (unauthenticated
  protected-route access) contract changes.
- [ ] Slice R2 and R3 into two review-friendly PRs, or ship as one commit? (tasks phase decides
  against the 400-line budget).
