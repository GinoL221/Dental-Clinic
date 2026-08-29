# Design: appointment-role-null-hardening

## D3 Verification (the phase's primary job)

Resolved dependency: **spring-security-core 6.2.1** (Spring Boot 3.2.1 parent BOM), present at
`~/.m2/repository/org/springframework/security/spring-security-core/6.2.1/`.

**Evidence limitation, stated plainly.** This session has no Bash/unzip and no web tool. The
`-sources.jar` is DEFLATE-compressed: ripgrep matched `InternalAuthenticationServiceException`
twice (ZIP local header + central directory *filename* entries only), while content-only
identifiers (`prepareTimingAttackProtection`, `mitigateAgainstTimingAttack`) returned **0** hits —
proving entry bodies are not readable as plaintext. Vendor source was **not** read.

### Claim B — CONFIRMED (proof by contract + in-project code)

Provable without vendor source:

1. `AuthenticationManager.authenticate()` must return an `Authentication` whose authorities are the
   principal's granted authorities — that is the published contract and what authorization consumes.
2. For `DaoAuthenticationProvider` the sole source of those authorities is `UserDetails.getAuthorities()`.
3. `User.getAuthorities()` (`User.java:44-46`) unconditionally dereferences `role.name()`.
4. ⇒ A *successful* `authenticate()` on a null-role row **must** NPE before any statement after
   `AuthenticationService.login():132-133` runs.
5. `NullPointerException` is not an `AuthenticationException`, so `ProviderManager` does not translate
   it; it reaches `GlobalExceptionHandler.handleGenericException` (:146-160) → **500, not 401**.

**⇒ The login guard MUST run before `authenticationManager.authenticate()`.** Binding.

### Claim A — UNVERIFIED IN SESSION, and design-irrelevant

Could not be confirmed by source inspection. It is also **moot**: Claim B alone forbids the shared-lambda
placement for the login path, so the design never depends on A being true. A is nonetheless made
*testable* — see `DaoAuthenticationProviderWrappingCharacterizationTest` below, which settles it
empirically against the real 6.2.1 jar at apply time. The JWT-filter path calls
`this.userDetailsService.loadUserByUsername()` **directly** (`JwtAuthenticationFilter.java:68`), with no
`DaoAuthenticationProvider` in the stack — unaffected by any provider wrapping either way.

## Architecture Decisions

| # | Decision | Alternatives rejected | Rationale |
|---|---|---|---|
| A1 | Guard at the **two call sites**, not in `ApplicationConfig.userDetailsService()` (:24-32) | Guard inside the shared lambda | Claim B: the lambda runs *inside* `authenticate()`, too late/wrapped. Confirms proposal D3. |
| A2 | Login guard = pre-`authenticate()` `findByEmail` + null-role check | Post-`authenticate()` guard | Claim B — post-guard is unreachable, NPE fires first. |
| A3 | Absent row falls through the guard untouched | Throw on absent row | Preserves existing `BadCredentialsException` → 401 behaviour; avoids user enumeration. Keeps `AuthenticationServiceLoginRaceTest` green (its `Optional.empty()` stub no-ops the guard). |
| A4 | Second `findByEmail` on login rather than reusing the pre-fetch | Reuse one fetch | The post-`authenticate()` re-fetch is a *deliberate, tested* race detector (`login():135-154`). One extra indexed lookup is cheaper than destroying that semantic. |
| A5 | `InvalidPrincipalRoleException extends RuntimeException`; handler returns the **byte-identical** body to `handleStalePrincipal` | Widen `StalePrincipalException`; new entry point | D2. Distinct in code/logs, uniform on the wire (no info-disclosure about which fault fired). |
| A6 | Filter guard uses Java 21 `instanceof` pattern on `User` | Reflectively probe `UserDetails` | The filter's static type is `UserDetails`; only our `User` carries `role`. |
| A7 | New test file `GlobalExceptionHandlerInvalidRoleTest` | Extend `...StalePrincipalTest` | Project convention is one focused handler-test file per concern (`...AppointmentSlotTest`, `...StalePrincipalTest`), and the latter's class comment scopes it to R3. |

## Data Flow

    LOGIN            login() ─[GUARD A2]→ authenticationManager.authenticate() → re-fetch → JWT
                          └─ null role ──→ InvalidPrincipalRoleException ──┐
    JWT FILTER   loadUserByUsername(:68) ─[GUARD]→ isTokenValid(:71) → getAuthorities(:77)
                          └─ null role ──→ InvalidPrincipalRoleException ──→ caught, log,
                                             fall through unauthenticated → StalePrincipalEntryPoint → 401
    SERVICE      findAllForCurrentUser ─ PATIENT | DENTIST | ADMIN | else ──┤
                                                                            └→ GlobalExceptionHandler → 401

## File Changes

| File | Action | Description |
|---|---|---|
| `exception/InvalidPrincipalRoleException.java` | Create | Marker unchecked exception (~11 lines) |
| `exception/GlobalExceptionHandler.java` | Modify | New `@ExceptionHandler` → 401, mirrors `handleStalePrincipal` |
| `configuration/JwtAuthenticationFilter.java` | Modify | Guard after :68 + new catch clause |
| `authentication/AuthenticationService.java` | Modify | Pre-`authenticate()` guard in `login()` |
| `service/impl/AppointmentServiceImpl.java` | Modify | `else` → explicit `Role.ADMIN`, else throw |
| `entity/User.java` | Modify | `@Column(nullable = false)` on `role` |
| `resources/db/migration/V2__enforce_user_role_not_null.sql` | Create | Backfill then `NOT NULL` |
| 4 test files + 2 new test files | Create/Modify | See Testing Strategy |

## Interfaces / Contracts

```java
// exception/InvalidPrincipalRoleException.java
package com.dh.dentalClinicMVC.exception;

// Marks an EXISTING users row whose `role` column is null — distinct from
// StalePrincipalException ("no backing row"). Same uniform 401 on the wire; the
// separate type exists for code clarity and operator logs. See design.md A5.
public class InvalidPrincipalRoleException extends RuntimeException {
  public InvalidPrincipalRoleException() {
    super();
  }
}
```

```java
// GlobalExceptionHandler.java — append after handleStalePrincipal (:231-244)
// 401 - Fila users existente con `role` nulo (fallo de integridad de datos). Mismo
// cuerpo que handleStalePrincipal: el cliente no debe distinguir QUÉ falló.
@ExceptionHandler(InvalidPrincipalRoleException.class)
public ResponseEntity<ErrorResponse> handleInvalidPrincipalRole(
    InvalidPrincipalRoleException e, WebRequest request) {
  ErrorResponse error =
      ErrorResponse.builder()
          .error("No autenticado")
          .message("La sesión ya no es válida. Iniciá sesión nuevamente.")
          .path(request.getDescription(false).replace("uri=", ""))
          .status(HttpStatus.UNAUTHORIZED.value())
          .timestamp(LocalDateTime.now())
          .build();

  return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
}
```

```java
// JwtAuthenticationFilter.java — insert immediately after line 68
// Fila users existente pero con `role` nulo: getAuthorities() (User.java:45)
// haría NPE en role.name() más abajo (línea 77), fuera de ambos catches y antes
// del DispatcherServlet => 500 crudo. Se rechaza acá, antes de isTokenValid.
if (userDetails instanceof User user && user.getRole() == null) {
  throw new InvalidPrincipalRoleException();
}

// ...and a new catch clause, placed between the two existing catches:
} catch (InvalidPrincipalRoleException ex) {
  // Sibling of the UsernameNotFoundException catch above, byte-for-byte same
  // policy: log, do NOT write a response, do NOT short-circuit. StalePrincipalEntryPoint
  // (SecurityConfiguration:64) emits the 401; permitAll routes stay open (no lockout).
  log.warn("Rejected request with invalid principal role (users row has null role)");
}
```

```java
// AuthenticationService.login() — FIRST statement, before authenticate() (:132)
// Guarda de integridad de datos. DEBE correr ANTES de authenticate(): un
// authenticate() exitoso construye la Authentication a partir de
// UserDetails.getAuthorities(), que desreferencia role.name() y haría NPE (500
// crudo) antes de cualquier guarda posterior. Ver design.md, Claim B.
// Una fila ausente NO se rechaza acá: cae al flujo normal de credenciales.
userRepository
    .findByEmail(request.getEmail())
    .ifPresent(
        candidate -> {
          if (candidate.getRole() == null) {
            log.error("Login rejected: users row for {} has a null role", request.getEmail());
            throw new InvalidPrincipalRoleException();
          }
        });
```

```java
// AppointmentServiceImpl.findAllForCurrentUser() — replace the terminal else (:216-219)
} else if (role == Role.ADMIN) {
  appointments = appointmentRepository.findAll();
} else {
  // Fail-safe: un rol nulo/desconocido NO hereda el alcance global de ADMIN.
  throw new InvalidPrincipalRoleException();
}
```

```sql
-- V2__enforce_user_role_not_null.sql
-- Backfill BEFORE the constraint: una sola fila con role NULL abortaría el ALTER.
-- MySQL-only por diseño: Flyway corre exclusivamente en el perfil `prod`
-- (application-prod.properties:8). test/dev/e2e usan H2 con flyway.enabled=false.
UPDATE users SET role = 'PATIENT' WHERE role IS NULL;

-- MODIFY COLUMN exige repetir la definición completa. Restatear el ENUM también
-- converge el linaje `baseline-on-migrate` (donde V1 se marcó sin ejecutarse y la
-- columna puede ser VARCHAR generada por Hibernate) al tipo que V1 pretendía.
ALTER TABLE users
    MODIFY COLUMN role ENUM('ADMIN', 'DENTIST', 'PATIENT') NOT NULL;
```

## Testing Strategy

| File | Test | Assertion |
|---|---|---|
| `GlobalExceptionHandlerInvalidRoleTest` (new) | `handleInvalidPrincipalRole_returns401WithUniformMessage` | 401; `error="No autenticado"`; message/path/timestamp identical to the StalePrincipal test |
| `JwtAuthenticationFilterTest` | `nullRoleUserViaHeaderIsCaughtAndChainContinuesUnauthenticated` | context `null`; status 200; empty body; `filterChain.doFilter` called; `verify(jwtService, never()).isTokenValid(...)` |
| `JwtAuthenticationFilterTest` | `nullRoleUserViaCookieIsCaughtAndChainContinuesUnauthenticated` | same, cookie source |
| `AuthenticationServiceLoginRaceTest` | `login_whenUserHasNullRole_thenThrowsInvalidPrincipalRoleBeforeAuthenticating` | `assertThrows(InvalidPrincipalRoleException.class)`; **`verify(authenticationManager, never()).authenticate(any())`** ← the load-bearing assertion for Claim B |
| `AppointmentServiceImplTest` | `findAllForCurrentUser_throwsInvalidPrincipalRoleWhenRoleIsNull` | throws; `verifyNoInteractions(appointmentRepository)` (proves no ADMIN fallthrough) |
| `DaoAuthenticationProviderWrappingCharacterizationTest` (new) | `wrapsForeignExceptionFromUserDetailsServiceIntoInternalAuthenticationServiceException` | Real `DaoAuthenticationProvider` + stub `UserDetailsService` throwing `InvalidPrincipalRoleException`; asserts the thrown type. **Settles Claim A empirically against the real 6.2.1 jar and pins the reason A1 exists.** Characterization test — expected GREEN on first run. |

Regression: full `mvn test`. All 8 test files that persist users already call `setRole(...)` (verified),
so `@Column(nullable = false)` produces **zero** fixture fallout under H2 `create-drop`.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or
process-integration boundary. Security-relevant surface (authn/authz) is covered by A1–A7.

## Migration / Rollout

**The proposal's feared H2/MySQL divergence does not exist.** Verified: `spring.flyway.enabled=false` in
`src/test/resources/application.properties:8`, `application-dev.properties:8`, and
`application-e2e.properties:5`; all three use H2 with `ddl-auto=create-drop`. Flyway is enabled **only**
in `application-prod.properties:8` against MySQL (`ddl-auto=validate`). MySQL-specific V2 SQL is never
executed against H2.

The real, previously-unanticipated consequence is the inverse: **V2 has zero automated coverage** and is
first exercised on the initial prod deploy. Mitigations: keep V2 to two statements; backfill first;
manual staging run before merge.

Prod also sets `baseline-on-migrate=true`, so V1 may have been marked applied without running. Restating
the full `ENUM(...)` in `MODIFY COLUMN` (rather than a bare nullability change) makes V2 correct for both
lineages. Hibernate `validate` checks column existence/type, not nullability — `@Column(nullable = false)`
adds no prod-validation risk.

**Rollback**: app code is a clean `git revert`. V2 is not — reverting the file does not drop an applied
`NOT NULL`; that needs a compensating `V3__relax_user_role_not_null.sql`.

## Slice Boundary Recommendation

**Single PR.** Revised estimate with exact code in hand: ~**77** production + ~**153** test ≈ **230
changed lines** vs. the 400 budget. Lower than the proposal's 250-350 because the fixture fallout it
budgeted for is zero and V2 is 10 lines, not a cascade.

- `Decision needed before apply: No`
- `Chained PRs recommended: No`
- `400-line budget risk: Low`

Mitigate the rollback asymmetry *without* a second review cycle: commit V2 + `@Column(nullable = false)`
as the **final, isolated commit** on the branch, so it is independently revertible pre-merge.

## Implementation Order (strict_tdd: true — genuine TDD, not characterization)

Unlike the predecessor change (a pure refactor), this adds real new behavior. In Java the RED signal for
a not-yet-existing type is a **compile failure**; that is the accepted RED here.

1. **RED** `GlobalExceptionHandlerInvalidRoleTest` (compile failure) → **GREEN** add
   `InvalidPrincipalRoleException` + `handleInvalidPrincipalRole`.
2. `DaoAuthenticationProviderWrappingCharacterizationTest` — characterization only, **exempt from RED**;
   expected green immediately. Records the vendor invariant behind A1.
3. **RED** both `JwtAuthenticationFilterTest` null-role tests (fail with NPE from `getAuthorities`) →
   **GREEN** guard after :68 + new catch clause.
4. **RED** `login_whenUserHasNullRole_...` (no exception thrown; `never()` verify fails) → **GREEN**
   pre-`authenticate()` guard.
5. **RED** `findAllForCurrentUser_throwsInvalidPrincipalRoleWhenRoleIsNull` (currently returns `findAll()`)
   → **GREEN** explicit `Role.ADMIN` branch.
6. V2 SQL + `@Column(nullable = false)` — no RED possible (Flyway is prod-only). Verification is full
   `mvn test` regression plus a manual staging migration run.

## Open Questions

- [ ] **Login-path enumeration residual (accepted, needs user ack).** A null-role login returns
      `"No autenticado"` while a bad password returns `"Credenciales inválidas"`, so an unauthenticated
      probe can distinguish "this email exists and is corrupt". Real exposure ≈ zero (no application path
      can create a null-role row). Alternative — throw `BadCredentialsException` instead — was rejected
      because it would hide a data-integrity fault from operators. Flag only.
- [ ] **Claim A remains formally unverified in this session.** Step 2's characterization test resolves it
      at apply time. If it comes back refuted, nothing in this design changes (A1 stands on Claim B) — but
      update the comment rationale in `ApplicationConfig`/design.
