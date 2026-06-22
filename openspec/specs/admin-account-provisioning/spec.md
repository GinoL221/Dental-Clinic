# Admin Account Provisioning Specification

## Purpose

Defines the privileged-creation boundary for `Role.ADMIN` accounts: the public registration path
MUST NOT be a route to ADMIN, regardless of which exact mechanism is used to close that path
(reject vs. silently downgrade vs. restrict the public `role` enum).

## Requirements

### Requirement: Public Registration Cannot Produce an ADMIN Account

The system MUST NOT allow `POST /auth/register` (anonymous, `permitAll()`) to result in the creation
of a user with `Role.ADMIN`, regardless of the value of the request body's `role` field. This is an
observable-outcome requirement: it does not mandate whether the request is rejected (e.g. `400`) or
the role is silently downgraded/ignored — only that no ADMIN account is ever created via this path.

**Enforcement mechanism:** imperative logic inside `AuthenticationService.register()` (or equivalent
service-layer code), evaluated BEFORE persistence. Not expressible as `@PreAuthorize` — this is an
anonymous endpoint with no authenticated principal to check; the constraint is on the requested
payload's outcome, not on caller identity.

#### Scenario: Registering with role PATIENT succeeds as PATIENT

- GIVEN an anonymous caller
- WHEN they `POST /auth/register` with `{"role": "PATIENT", ...valid fields}`
- THEN a user is created with `Role.PATIENT`
- AND the response indicates success (issues a token or confirms creation)

#### Scenario: Registering with role DENTIST succeeds as DENTIST

- GIVEN an anonymous caller
- WHEN they `POST /auth/register` with `{"role": "DENTIST", ...valid fields}`
- THEN a user is created with `Role.DENTIST`
- AND the response indicates success

#### Scenario: Registering with role ADMIN never creates an ADMIN account

- GIVEN an anonymous caller
- WHEN they `POST /auth/register` with `{"role": "ADMIN", ...valid fields}`
- THEN no user with `Role.ADMIN` is created as a result of this request
- AND the observable outcome is either a rejection (e.g. `400 Bad Request`) or a non-admin account
  (e.g. downgraded to `PATIENT`) — the exact mechanism is a design decision, but ADMIN MUST NOT exist
  in the persisted result

#### Scenario: Registering with no role field does not default to ADMIN

- GIVEN an anonymous caller
- WHEN they `POST /auth/register` with no `role` field present in the body
- THEN the resulting account, if created, has a non-privileged role (`PATIENT` or `DENTIST`)
- AND `Role.ADMIN` is never the default when `role` is absent

### Requirement: Admin Accounts Originate Only From Sanctioned Sources

The system MUST restrict ADMIN account creation to sanctioned, authorization-gated sources: the
existing idempotent seed (`DataInitializer`) and, optionally, a future authenticated admin-only
creation route. The public, anonymous registration endpoint MUST NOT be a sanctioned source.

**Enforcement mechanism:** declarative (`@PreAuthorize("hasRole('ADMIN')")`) for any future admin-only
creation endpoint, since the caller's authenticated identity is known before the method body runs and
no target-entity lookup is required to make that decision.

#### Scenario: Seed-created admin account is unaffected

- GIVEN the application starts with no existing `admin@dentalclinic.com` user
- WHEN `DataInitializer` runs its idempotent seed logic
- THEN an ADMIN account is created exactly as before this change
- AND this requirement does not alter or gate the seed itself

#### Scenario: An authenticated non-admin cannot create an admin via any route in scope

- GIVEN an authenticated PATIENT or DENTIST caller
- WHEN they attempt to create or promote an account to `Role.ADMIN` through any endpoint covered by
  this change (registration or self-service update — see the Object-Level Authorization spec for the
  update path)
- THEN the request does not result in an ADMIN account
- AND the caller's own role is unaffected by the attempt
