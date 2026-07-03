# Delta for Patient/Dentist Request DTOs

## Purpose

Give Patient/Dentist write endpoints (`POST`/`PUT`) a dedicated, Bean-Validation-enforced
request contract, replacing direct binding of the `Patient`/`Dentist` JPA entities.

## Out of Scope (mirrors proposal Non-Goals)

- Full frontend API-module boundary rework — only request payload shape changes.
- Data migration or cleanup of existing invalid DB rows.
- Any change to `Appointment` validation or orchestration.
- JWT/Spring Security model or authentication surface changes.
- Redesign of `PatientResponseDTO`/`DentistResponseDTO`.

## ADDED Requirements

### Requirement: Validated Request DTOs for Patient/Dentist Writes

The system MUST expose `PatientRequestDTO`, `DentistRequestDTO`, and a shared
`AddressRequestDTO` carrying `jakarta.validation.constraints.*` annotations, and
`PatientController`/`DentistController` MUST bind these DTOs (with `@Valid`) as
the `@RequestBody` on both `save` (`POST`) and `update` (`PUT`) instead of the
`Patient`/`Dentist` entities.

#### Scenario: Valid create request succeeds

- GIVEN a `POST` request body matching `PatientRequestDTO` with all required
  fields valid (non-blank name, valid email, positive `cardIdentity`, complete
  `AddressRequestDTO`)
- WHEN the client calls the create endpoint
- THEN the request MUST be accepted and mapped to a persisted `Patient`
- AND no raw `Patient`/`Dentist` entity type MUST appear as the controller
  method's `@RequestBody` parameter type.

#### Scenario: Update endpoint enforces validation

- GIVEN the `update` (`PUT`) endpoint for Patient or Dentist
- WHEN its controller method signature is inspected
- THEN it MUST bind a `*RequestDTO` type annotated with `@Valid`
  (previously `update` had no `@Valid` at all).

### Requirement: Request DTO Structurally Excludes Server-Owned Fields

`PatientRequestDTO` and `DentistRequestDTO` MUST NOT declare `id` or `role`
fields, so these values cannot be submitted or bound from client input.

#### Scenario: Submitted id/role are ignored, not bound

- GIVEN a client sends a create or update request body containing `id` and
  `role` keys alongside valid DTO fields
- WHEN the request is deserialized into the request DTO
- THEN the extra `id`/`role` values MUST have no effect on the resulting
  entity — `id` remains server-assigned and `role` remains whatever the
  service/controller layer already enforces
- AND this MUST hold structurally (DTO has no such field), not via
  controller-side stripping logic.

### Requirement: Update Uses Full-Replace Semantics

`PUT` update MUST be full-replace: every editable field is validated as
required on the update DTO, and any field omitted from the request body MUST
be treated as absent/blank input for that field, never as "leave existing
value unchanged."

#### Scenario: Full payload update succeeds

- GIVEN an existing Patient and a `PUT` request with a complete, valid
  `PatientRequestDTO` body (all editable fields present)
- WHEN the update endpoint processes the request
- THEN the Patient MUST be updated with exactly the submitted values.

#### Scenario: Partial payload blanks omitted fields

- GIVEN an existing Patient and a `PUT` request that omits one required
  editable field (e.g. `lastName`)
- WHEN the update endpoint processes the request
- THEN the request MUST fail Bean Validation for that missing required field
- AND the existing persisted value MUST NOT be silently preserved as a
  fallback.

### Requirement: Canonical Address Field Name Is `location`

`AddressRequestDTO` MUST use `location` as the field name (matching
`Address.location`, `entity/Address.java:26`), and the frontend request
payload MUST send `location`, not `city`.

#### Scenario: Frontend payload matches backend field name

- GIVEN `patient-api.js`/`dentist-api.js` build a create or update request
  body
- WHEN the address object is serialized
- THEN it MUST use the key `location`
- AND `city` MUST NOT appear anywhere in the request payload.

### Requirement: Bean Validation Rejects Malformed Input

Request DTO fields MUST carry constraints (`@NotBlank`, `@Email`,
`@NotNull`/`@Positive` or equivalent) sufficient to reject blank required
fields, malformed email addresses, and invalid numeric fields (e.g. negative
or missing `cardIdentity`), returning a validation error response instead of
persisting the data.

#### Scenario: Invalid email is rejected

- GIVEN a create request with `email: "not-an-email"`
- WHEN the request is validated
- THEN it MUST fail with a validation error and MUST NOT be persisted.

#### Scenario: Missing required field is rejected

- GIVEN a create request omitting `firstName`
- WHEN the request is validated
- THEN it MUST fail with a validation error identifying the missing field.

#### Scenario: Invalid numeric field is rejected

- GIVEN a Patient create request with a negative `cardIdentity`
- WHEN the request is validated
- THEN it MUST fail with a validation error and MUST NOT be persisted.

### Requirement: One-Time Read-Only Validation Audit

The system MUST provide a one-time, read-only audit (test or script) that
loads existing Patient/Dentist rows and reports which ones would violate the
new DTO validation constraints, without mutating or migrating any data.

#### Scenario: Audit reports violations without mutation

- GIVEN existing Patient/Dentist rows in the database, some of which would
  fail the new validation constraints
- WHEN the audit is run
- THEN it MUST output a report identifying the violating rows and the
  violated constraint(s)
- AND it MUST NOT modify, delete, or migrate any row.
