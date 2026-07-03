# Proposal: Patient/Dentist Request DTOs

## Intent

Introduce dedicated, validated request DTOs for the Patient and Dentist write
endpoints so the controllers stop binding JPA entities (`Patient`, `Dentist`)
directly as request bodies. Today `@Valid @RequestBody Patient` is a no-op
(the entities carry zero `jakarta.validation` constraints), `update` has no
`@Valid` at all, and validation logic is duplicated ad hoc in the controller
and again in frontend JS. This change gives Patient/Dentist a real, enforced,
single-source request contract at the HTTP boundary — matching the split
request/response DTO shape they already half-have (response DTOs exist;
request DTOs do not).

## Problem Statement

- The write API accepts the raw persistence entity as its input contract, so
  the entity's mutable shape (including `id`, `role`, and the full `User`
  parent graph) is the public request surface. The controller has to
  defensively strip `id`/`role` for non-admin self-updates — a structural
  IDOR/privilege-escalation risk that is currently mitigated by imperative
  guard code rather than by the contract itself.
- `@Valid` gives false confidence: it validates nothing because the entities
  have no constraints. Malformed data (bad emails, blank names, negative
  `cardIdentity`) is accepted silently and only fails later, if at all.
- Validation rules live in three places (controller checks, JS
  `validatePatientData`, and implicit DB constraints) and drift. The frontend
  even sends `address.city` while the entity field is `address.location` — a
  latent contract mismatch (see decision D2).

## Goals

- Add `PatientRequestDTO` and `DentistRequestDTO` (split from the existing
  response DTOs) with real Bean Validation constraints as the single source
  of truth for write-request validity.
- Bind those DTOs (with `@Valid`) on both `POST` (save) and `PUT` (update)
  for Patient and Dentist, replacing direct entity binding.
- Fix the `address.city` / `address.location` field-name mismatch as part of
  this change, aligning frontend and backend on one canonical name.
- Make the request contract structurally exclude `id`/`role`, hardening the
  existing IDOR protections as a natural side effect.
- Give the team visibility, via a one-time audit/report, into which existing
  DB rows would fail the new validation rules before rollout.

## Non-Goals

- Full frontend API-module boundary rework (separate future SDD candidate).
  The frontend touch here is limited to making the request payload match the
  new contract shape — nothing more.
- Data migration or cleanup of existing invalid rows. The audit REPORTS only;
  it never mutates or migrates data (decision D4).
- Any change to `Appointment` validation or orchestration (separate future
  SDD candidate).
- No JWT/Spring Security model changes and no authentication surface changes.
- No redesign of the response DTOs (`PatientResponseDTO`, `DentistResponseDTO`).

## Scope

In scope (backend):

- New: `dto/PatientRequestDTO.java`, `dto/DentistRequestDTO.java` (and a
  nested/shared `AddressRequestDTO` for the embedded address).
- `controller/PatientController.java`, `controller/DentistController.java`:
  bind the new request DTOs on save + update, add `@Valid` to update, map
  DTO → entity before delegating to the service.
- DTO → entity mapping (manual mapping in the controller/a small mapper; see
  decision D5). `IPatientService`/`IDentistService` signatures stay
  entity-based to keep blast radius contained.
- One-time validation audit: a runnable report (test or small script) that
  loads existing Patient/Dentist rows and lists which would violate the new
  DTO constraints. Read-only; no mutation.
- Tests: rework `PatientControllerTest`, `PatientControllerAuthzTest`,
  `DentistControllerTest`, `DentistControllerNegativeTest`,
  `DentistControllerAuthzTest` to send the new DTO shape (dropping raw
  `id`/`role` map bodies), plus new validation-rejection tests.

In scope (frontend, minimal):

- `frontend/public/js/api/patient-api.js`,
  `frontend/public/js/api/dentist-api.js`: adjust the request body they build
  so it matches the new DTO shape, including renaming `address.city` →
  `address.location`.

Out of scope:

- Broader frontend API-module refactor, `Appointment`, auth, CI config,
  persistence schema changes, service-signature redesign.

## Key Decisions

### D1 — Full-replace UPDATE semantics (binding, user decision)

`PUT` update is full-replace, not partial-merge. The update DTO requires all
editable fields; any field absent from the request is treated as empty/blank,
not "leave unchanged." Rationale: it keeps the request contract explicit and
validatable, avoids partial-merge ambiguity, and matches the current
`update(Patient)` signature that already takes a complete object.
Consequence: clients (including our own frontend) must always send the
complete editable field set on update.

### D2 — Canonical address field is `location` (bug fix direction, binding)

The `Address` JPA entity uses `private String location` (confirmed
`entity/Address.java:26`); the frontend erroneously sends `address.city`. We
align on the ENTITY as canonical: the request DTO field is `location`, and the
frontend is updated to send `location`. Rationale: the entity/DB column is the
persisted source of truth and renaming it would be a wider, riskier change;
fixing the frontend is the minimal, correct direction and is already in scope.

### D3 — Split request/response DTOs, not dual-purpose

Follow the existing `PatientResponseDTO`/`DentistResponseDTO` precedent rather
than the `SpecialtyDTO` dual-purpose pattern. Introduce dedicated
`*RequestDTO` types. Rationale: response DTOs already exist separately, so a
matching split request DTO is the consistent choice; it also lets the request
type omit `id`/`role`/server-owned fields that a response legitimately
exposes, which is exactly the IDOR-hardening benefit.

### D4 — Validation rollout + one-time audit report (binding, user decision)

All new incoming Patient/Dentist requests are validated against the DTO's Bean
Validation rules. Separately, a one-time audit step enumerates existing DB
rows that would violate those rules and reports them (script or test output),
giving the team pre/post-rollout visibility. The audit does not migrate or
mutate anything.

### D5 — Lombok POJO DTOs (resolve java-21 records vs codebase convention)

Recommendation: implement the new request DTOs as Lombok
`@Data @NoArgsConstructor @AllArgsConstructor` POJOs with
`jakarta.validation.constraints.*` annotations, matching the ONLY existing
validated-DTO precedent (`SpecialtyDTO`) and every other DTO in the codebase
(`PatientResponseDTO`, `DentistResponseDTO`). Rationale: the `java-21` skill
advises records for immutable DTOs, but consistency with the established
codebase idiom wins here — introducing records for two classes would create a
mixed convention with no functional benefit and would complicate
Jackson/Lombok expectations across the DTO package. Deviating from the skill
is a deliberate, scoped consistency call, not an oversight. (If the design
phase wants to adopt records project-wide, that is a separate convention
decision.)

### D6 — Manual DTO → entity mapping, no new dependency

Keep `IPatientService`/`IDentistService` taking entities and map DTO → entity
in the controller (or a tiny hand-written mapper). Do NOT introduce MapStruct.
Rationale: MapStruct is not currently a project dependency; adding it for two
mappings is disproportionate blast radius. Manual mapping keeps the change
small and reviewable. Validation `message=` strings follow the existing
Spanish-language convention seen in `SpecialtyDTO`.

### D7 — Admin role-setting via these endpoints is removed, no replacement (binding, user decision — escalated by design-phase gatekeeper review)

The design phase surfaced that excluding `role` from the request DTO (D3) has
a real consequence beyond IDOR-hardening: today ADMIN callers can set `role`
via `PUT /patients`/`PUT /dentists`, and this change removes that capability
entirely, with no replacement endpoint. The gatekeeper review flagged this as
an unapproved functional regression rather than a pure refactor, since it
changes what an existing admin role can do. The user confirmed explicitly:
remove it, no replacement — changing a user's `role` is a distinct concern
from updating a patient/dentist's own record, and conflating them was the
root cause of the IDOR risk in the first place. If a real need for
admin-driven role changes emerges later, it should be a dedicated,
purpose-built endpoint (separate change), not a side effect of this DTO.

## Risks and Tradeoffs

- Surfacing previously-silent invalid data: because `@Valid` is currently a
  no-op, real validation will start rejecting payloads that used to pass. The
  D4 audit is the mitigation — it quantifies exposure before rollout. Still, a
  client flow relying on lax input could break; validation rules must match
  actual legitimate data ranges.
- Full-replace update (D1) means a client that omits a field will blank it.
  This must be clearly communicated and the frontend must send complete
  payloads on update.
- Test rework is non-trivial: several controller/authz tests build raw maps
  with `id`/`role`. They must move to the DTO shape while preserving the IDOR
  assertions (now enforced structurally, not by controller stripping).
- Frontend/backend coupling: the `city → location` rename (D2) breaks the
  frontend unless updated in lockstep — which is why the minimal frontend
  change is deliberately in scope.
- Delivery: combined backend + frontend + test rework may approach the
  review-size budget. The later Review Workload Forecast (tasks phase) will
  decide whether to slice; `delivery_strategy` is `ask-on-risk`.

## Proposal Question Round

The user has already made the four binding product decisions above (update
semantics, address bug direction, minimal frontend scope, validate + audit).
Given that, this proposal proceeds on these assumptions for review rather than
blocking on a fresh question round:

- The business goal is a trustworthy, single-source write contract for
  Patient/Dentist that enforces validity at the boundary and removes silent
  bad-data acceptance.
- Split request DTOs (D3), Lombok POJOs (D5), and manual mapping (D6) are the
  recommended technical directions, chosen for codebase consistency and
  minimal blast radius; the design phase may revisit D5/D6 if it sees a strong
  reason.
- `id`/`role` hardening is treated as a beneficial side effect of the DTO
  contract, not as new explicit security scope.

If any assumption is wrong, correct it before spec/design.

## Success Criteria

- `PatientController` and `DentistController` bind validated request DTOs on
  both save and update; no endpoint binds `Patient`/`Dentist` entities as the
  request body, and update carries `@Valid`.
- The request DTO contract structurally excludes `id`/`role`.
- `address.location` is the single field name across DTO, entity, and
  frontend payloads; `address.city` no longer appears in the frontend request
  body.
- Invalid Patient/Dentist requests are rejected with validation errors; new
  and reworked tests cover acceptance, rejection, and the IDOR boundary.
- The one-time audit reports existing violating rows without mutating data.
- Backend Maven tests pass (or the focused slice command passes and any unrun
  suite is reported); frontend request bodies match the new contract.
