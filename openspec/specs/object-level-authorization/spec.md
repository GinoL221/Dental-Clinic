# Object-Level (Record-Ownership) Authorization Specification

## Purpose

Defines record-ownership authorization for self-service update and read endpoints, replacing
authorization that currently checks a spoofable request-body field (`email`) while operating on a
different, also-attacker-controlled field (`id`). Requirements describe observable outcomes only —
implementation selects the exact resolution/validation mechanism.

## Requirements

### Requirement: Self-Service Update Can Only Mutate the Caller's Own Record

A self-service update (`PUT` on the Patient or Dentist update endpoint) MUST result in a mutation of
ONLY the authenticated caller's own record. It MUST NOT be possible for the caller to cause a
mutation of any other user's record, regardless of what `id` value appears in the request body.

**Enforcement mechanism:** imperative logic, in-method. The check requires loading/identifying the
target record (or resolving it from the principal) before the comparison can be made — this is the
case that requires either a custom Spring Security expression bean backed by a repository lookup, or
in-method resolution. `@PreAuthorize("hasAnyRole('ADMIN')")` MAY still gate the ADMIN-override branch
declaratively; the ownership branch needs imperative logic.

#### Scenario: PATIENT updates own record with own data — succeeds

- GIVEN an authenticated PATIENT whose own record has id `P1`
- WHEN they `PUT` an update with `id: P1` and their own data
- THEN their own record is updated
- AND the response reflects the updated record

#### Scenario: PATIENT attempts to update a different id — victim record is provably unchanged

- GIVEN an authenticated PATIENT (id `P1`) and another patient's record (id `P2`, the "victim")
- WHEN the PATIENT sends a body with `id: P2` and arbitrary data
- THEN after the request completes, the victim record (`P2`) is unchanged from its state before the
  request — byte-for-byte, including `email` and `role`
- AND the exact HTTP outcome (`403`, `404`, or `200` with the caller's own record updated instead and
  body `id` ignored) is a design decision; this requirement only constrains the victim's data, not the
  status code

#### Scenario: PATIENT attempts to set role to ADMIN in the update body — caller's role is never ADMIN

- GIVEN an authenticated PATIENT
- WHEN they send an update body containing `role: "ADMIN"` alongside their own `id`
- THEN after the request completes, the caller's own persisted role is NOT `Role.ADMIN`
- AND the exact mechanism (request rejected, or `role` field silently ignored/stripped) is a design
  decision; this requirement only constrains the persisted outcome

#### Scenario: ADMIN updates any patient's record by id — succeeds (override preserved)

- GIVEN an authenticated ADMIN caller
- WHEN they `PUT` an update targeting any patient's `id`
- THEN the targeted record is updated
- AND this requirement does not restrict ADMIN's existing override capability

#### Scenario: DENTIST update endpoint mirrors the same 4 scenarios

- GIVEN the same scenario structure (own-record success, cross-id victim-unchanged, role-to-ADMIN
  rejected, ADMIN override preserved)
- WHEN applied to `DentistController.update()` / the Dentist self-service update path
- THEN the same observable guarantees hold for Dentist records as for Patient records

### Requirement: Patient Read-By-Id Requires Ownership Or Elevated Role

`GET /patients/{id}` MUST only return data when the caller is `ADMIN`, `DENTIST`, or the PATIENT who
owns that record. A PATIENT caller requesting another patient's id MUST NOT receive that patient's
data.

**Enforcement mechanism:** declarative for the `ADMIN`/`DENTIST` branch (`@PreAuthorize` can check
role without loading the target). The PATIENT-self branch needs either a custom `@PreAuthorize`
expression that loads the target patient and compares owner to `authentication.name`, or in-method
imperative logic after the load — same category of constraint as the update requirement above.

#### Scenario: PATIENT requests own id — succeeds

- GIVEN an authenticated PATIENT whose record has id `P1`
- WHEN they `GET /patients/P1`
- THEN the response is `200` with their own patient data

#### Scenario: PATIENT requests a different id — no data leak

- GIVEN an authenticated PATIENT (id `P1`) and another patient's record (id `P2`)
- WHEN they `GET /patients/P2`
- THEN the response does NOT contain `P2`'s data
- AND the response is `403` (or an equivalent non-data-leaking denial); the exact status is a design
  decision but the body MUST NOT contain the other patient's PII

#### Scenario: ADMIN or DENTIST requests any id — succeeds

- GIVEN an authenticated ADMIN or DENTIST caller
- WHEN they `GET /patients/{id}` for any existing patient id
- THEN the response is `200` with that patient's data
- AND this mirrors the existing role policy already used by `findAll` (which allows `ADMIN,DENTIST`)

### Requirement: Appointment Read-By-Id Is Scoped To The Owning Dentist

`GET /appointments/{id}` MUST only succeed for a `DENTIST` caller when the appointment belongs to
that dentist. `ADMIN` remains unrestricted. The existing role-level exclusion of `PATIENT` from this
endpoint is unchanged by this requirement.

**Enforcement mechanism:** imperative, in-method — load the appointment, compare ownership to the
caller's dentist id. `@PreAuthorize("hasAnyRole('ADMIN','DENTIST')")` continues to gate at the role
level before the method runs; the ownership comparison happens after the entity is loaded.

#### Scenario: DENTIST requests their own appointment — succeeds

- GIVEN an authenticated DENTIST whose id is `D1`, and an appointment owned by `D1`
- WHEN they `GET /appointments/{id}` for that appointment
- THEN the response is `200` with the appointment data

#### Scenario: DENTIST requests another dentist's appointment — denied

- GIVEN an authenticated DENTIST whose id is `D1`, and an appointment owned by a different dentist `D2`
- WHEN they `GET /appointments/{id}` for that appointment
- THEN the response is `403`
- AND the appointment data is not returned

#### Scenario: ADMIN requests any appointment — succeeds

- GIVEN an authenticated ADMIN caller
- WHEN they `GET /appointments/{id}` for any existing appointment
- THEN the response is `200` with the appointment data

#### Scenario: PATIENT remains excluded from this endpoint (unchanged baseline)

- GIVEN an authenticated PATIENT caller
- WHEN they `GET /appointments/{id}` for any appointment, including one tied to their own care
- THEN the response is denied at the role level (`403`), unchanged from current behavior
- AND this requirement does not grant PATIENT new access to this endpoint

### Requirement: Dead Endpoint Removed

`PUT /auth/update-names/{email}` MUST NOT exist as a route. This is route removal, not access
restriction: a request to this path and method MUST return a route-not-found response, not an
authorization denial.

**Enforcement mechanism:** N/A (deletion, not an authorization check). Verified by absence of the
mapping.

#### Scenario: Request to the removed route returns 404, not 401/403

- GIVEN the endpoint has been deleted
- WHEN any caller (authenticated or anonymous) sends `PUT /auth/update-names/{any-email}`
- THEN the response is `404 Not Found` (route does not exist)
- AND the response is NOT `401` or `403` (which would imply the route still exists but is now guarded)

### Requirement: JWT Signing Secret Has No Hardcoded Fallback Under Dev Profile

The `dev` Spring profile MUST NOT silently use a hardcoded JWT signing secret. If `JWT_SECRET` is
unset, the application MUST fail fast (fail to start, or fail to construct the JWT signing key) under
the `dev` profile, matching existing `prod` profile behavior.

**Enforcement mechanism:** N/A (configuration removal, not an authorization rule). Verification is a
static-config assertion rather than a full Spring context integration test, since deliberately
unsetting `JWT_SECRET` and asserting context-load failure is the only way to exercise this at runtime;
if that proves impractical, verification instead asserts `application-dev.properties` contains no
fallback literal (e.g. `${JWT_SECRET:<value>}` pattern) for `app.jwt.secret`.

#### Scenario: Missing JWT_SECRET fails fast under dev profile

- GIVEN the `dev` Spring profile is active and the `JWT_SECRET` environment variable is unset
- WHEN the application attempts to start (or the JWT signing key is constructed)
- THEN startup fails (or key construction throws), with no silently-used hardcoded value
- AND this mirrors the existing `prod` profile's fail-fast behavior

#### Scenario: Properties file contains no fallback literal (static fallback verification)

- GIVEN `application-dev.properties` after this change
- WHEN inspecting the `app.jwt.secret` property line
- THEN it reads `app.jwt.secret=${JWT_SECRET}` with no `:`-delimited default value
- AND no hardcoded secret literal is present anywhere in the file
