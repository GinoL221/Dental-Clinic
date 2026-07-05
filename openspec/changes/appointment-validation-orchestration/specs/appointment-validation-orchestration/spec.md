# Delta for Appointment Validation & Orchestration

## Purpose

Bring Appointment write endpoints (`POST`/`PUT`) up to the validated-request-DTO
standard already used by Patient/Dentist, and close three business-rule gaps:
double-booking, unguarded status transitions, and backend-unenforced working
hours.

## Out of Scope (mirrors proposal Non-Goals)

- Patient/Dentist code changes.
- Frontend UX redesign (only request payload field-name alignment permitted).
- Changes to `@CacheEvict`/caching behavior on `AppointmentServiceImpl`.
- Appointment-duration data model changes; double-booking uses same-`date`+
  same-`time` matching, not interval overlap.
- Notification/reminder systems (none exist today).
- JWT/Spring Security model changes.

## ADDED Requirements

### Requirement: Validated Request DTO for Appointment Writes

The system MUST expose `AppointmentRequestDTO` carrying
`jakarta.validation.constraints.*` annotations with camelCase `dentistId`/
`patientId` fields, and `AppointmentController` MUST bind this DTO (with
`@Valid`) as the `@RequestBody` on both `save` (`POST`) and `update` (`PUT`)
instead of the unvalidated `AppointmentDTO`.

#### Scenario: Valid create request succeeds

- GIVEN a `POST` request body matching `AppointmentRequestDTO` with valid
  `dentistId`, `patientId`, date, time, and description
- WHEN the client calls the create endpoint
- THEN the request MUST be accepted and mapped to a persisted `Appointment`
  with status `SCHEDULED`.

#### Scenario: Update endpoint enforces validation

- GIVEN the `update` (`PUT`) endpoint for Appointment
- WHEN its controller method signature is inspected
- THEN it MUST bind `AppointmentRequestDTO` annotated with `@Valid`
  (previously `update` had no `@Valid` at all).

### Requirement: Request DTO Excludes Server-Owned Fields

`AppointmentRequestDTO` MUST NOT declare `id` or `status` fields, so these
values cannot be submitted or bound from client input on create.

#### Scenario: Submitted id/status are ignored on create

- GIVEN a create request body containing `id` and `status` keys alongside
  valid DTO fields
- WHEN the request is deserialized into `AppointmentRequestDTO`
- THEN the extra values MUST have no effect — `id` remains server-assigned
  and the persisted appointment's status MUST be `SCHEDULED`.

### Requirement: Bean Validation Rejects Malformed Input

`AppointmentRequestDTO` MUST reject: missing/non-positive `dentistId` or
`patientId`; malformed date (`YYYY-MM-DD`) or time (`HH:mm`); a past date or
a past time on today's date; and a description over 500 characters.

#### Scenario: Missing dentist id is rejected

- GIVEN a create request with `dentistId` null
- WHEN validated
- THEN it MUST fail with a validation error and MUST NOT be persisted.

#### Scenario: Malformed date is rejected

- GIVEN a create request with `date: "2026/07/03"`
- WHEN validated
- THEN it MUST fail with a validation error.

#### Scenario: Past date is rejected

- GIVEN a create request with a `date` before today
- WHEN validated
- THEN it MUST fail with a validation error.

#### Scenario: Over-length description is rejected

- GIVEN a create request with `description` longer than 500 characters
- WHEN validated
- THEN it MUST fail with a validation error.

### Requirement: Server-Side Working-Hours and Weekday Enforcement

The system MUST reject appointments with `time` outside `08:00`-`18:00`
inclusive, or with `date` falling on Saturday or Sunday, matching
`validation-manager.js` exactly.

#### Scenario: Exactly 08:00 is accepted

- GIVEN a create request with `time: "08:00"` on a weekday
- WHEN validated
- THEN it MUST be accepted (lower boundary inclusive).

#### Scenario: Exactly 18:00 is accepted

- GIVEN a create request with `time: "18:00"` on a weekday
- WHEN validated
- THEN it MUST be accepted (upper boundary inclusive).

#### Scenario: Saturday is rejected

- GIVEN a create request with `date` on a Saturday and a valid time
- WHEN validated
- THEN it MUST fail with a validation error.

### Requirement: Double-Booking Prevention

The system MUST reject a create or update when an active (non-`CANCELLED`)
appointment already exists for the same `dentistId` at the same `date` +
`time`.

#### Scenario: Same dentist, same slot is rejected

- GIVEN an active `SCHEDULED` appointment for dentist X at 2026-07-10 10:00
- WHEN a new create request targets dentist X at 2026-07-10 10:00
- THEN it MUST be rejected.

#### Scenario: Same dentist, different slot is allowed

- GIVEN an active appointment for dentist X at 2026-07-10 10:00
- WHEN a new create request targets dentist X at 2026-07-10 11:00
- THEN it MUST be accepted.

#### Scenario: Different dentist, same slot is allowed

- GIVEN an active appointment for dentist X at 2026-07-10 10:00
- WHEN a new create request targets dentist Y at 2026-07-10 10:00
- THEN it MUST be accepted.

#### Scenario: Cancelled appointment does not block the slot

- GIVEN a `CANCELLED` appointment for dentist X at 2026-07-10 10:00
- WHEN a new create request targets dentist X at 2026-07-10 10:00
- THEN it MUST be accepted.

### Requirement: Status-Transition Guarding

`updateStatus` MUST enforce an allowed-transition matrix covering all four
`AppointmentStatus` values: from `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, or
`CANCELLED` are allowed; from `IN_PROGRESS`, only `COMPLETED` or `CANCELLED`
are allowed (never back to `SCHEDULED`); `COMPLETED` and `CANCELLED` are
terminal and MUST reject any transition to a DIFFERENT status. Setting a
status to its OWN current value (e.g. `SCHEDULED` → `SCHEDULED`) is not a
transition and MUST be accepted as an idempotent no-op for all four states,
including the two terminal ones — it changes nothing and re-triggers no
side effects.

#### Scenario: Same-status update is an idempotent no-op for every status

- GIVEN an appointment with status `SCHEDULED` (respectively `IN_PROGRESS`,
  `COMPLETED`, `CANCELLED`)
- WHEN `updateStatus` is called with that SAME status
- THEN the call MUST succeed and the status MUST remain unchanged.

#### Scenario: SCHEDULED to IN_PROGRESS is allowed

- GIVEN an appointment with status `SCHEDULED`
- WHEN `updateStatus` is called with `IN_PROGRESS`
- THEN the transition MUST succeed.

#### Scenario: SCHEDULED to COMPLETED is allowed

- GIVEN an appointment with status `SCHEDULED`
- WHEN `updateStatus` is called with `COMPLETED`
- THEN the transition MUST succeed.

#### Scenario: SCHEDULED to CANCELLED is allowed

- GIVEN an appointment with status `SCHEDULED`
- WHEN `updateStatus` is called with `CANCELLED`
- THEN the transition MUST succeed.

#### Scenario: IN_PROGRESS to COMPLETED is allowed

- GIVEN an appointment with status `IN_PROGRESS`
- WHEN `updateStatus` is called with `COMPLETED`
- THEN the transition MUST succeed.

#### Scenario: IN_PROGRESS to CANCELLED is allowed

- GIVEN an appointment with status `IN_PROGRESS`
- WHEN `updateStatus` is called with `CANCELLED`
- THEN the transition MUST succeed.

#### Scenario: IN_PROGRESS to SCHEDULED is rejected

- GIVEN an appointment with status `IN_PROGRESS`
- WHEN `updateStatus` is called with `SCHEDULED`
- THEN the transition MUST be rejected and status MUST remain `IN_PROGRESS`.

#### Scenario: COMPLETED to any other status is rejected

- GIVEN an appointment with status `COMPLETED`
- WHEN `updateStatus` is called with `SCHEDULED`, `IN_PROGRESS`, or `CANCELLED`
- THEN the transition MUST be rejected and status MUST remain `COMPLETED`.

#### Scenario: CANCELLED to any other status is rejected

- GIVEN an appointment with status `CANCELLED`
- WHEN `updateStatus` is called with `SCHEDULED`, `IN_PROGRESS`, or `COMPLETED`
- THEN the transition MUST be rejected and status MUST remain `CANCELLED`.

### Requirement: Single Shared Validation Path

Date/time parsing and dentist/patient existence checks MUST be implemented in
one shared code path invoked by both create and update, not duplicated per
endpoint. This is verifiable by code inspection (one parsing method, one
existence-check method, each called from both flows) and by identical
rejection behavior for identical invalid input.

#### Scenario: Save and update reject the same invalid input identically

- GIVEN a malformed date value
- WHEN submitted to both the create endpoint and the update endpoint
- THEN both MUST reject with equivalent validation errors, proving no
  divergent duplicated logic exists between the two flows.
