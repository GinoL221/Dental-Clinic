# Proposal: Appointment Validation & Orchestration

## Confirmed Scope Decisions

The four scope decisions below were first taken tentatively by the
orchestrator under Auto Mode while the user was away from keyboard, then
explicitly re-asked and **confirmed by the user** in a second proposal
question round. They are now binding product decisions, not defaults.

| # | Decision | Status |
|---|--------------------|--------|
| 1 | Double-booking prevention (same dentist, overlapping time window) | IN SCOPE — confirmed |
| 2 | Status-transition guarding (block e.g. `CANCELLED`/`COMPLETED` → `SCHEDULED`) | IN SCOPE — confirmed |
| 3 | Working-hours + weekday validation replicated server-side | IN SCOPE — confirmed |
| 4 | New `AppointmentRequestDTO`: split from response, camelCase `dentistId`/`patientId` | Chosen shape — confirmed |

Decisions 1–3 meaningfully expand scope beyond the baseline validated-DTO
work (from "just DTO validation" to "validation + double-booking + state
machine + backend working-hours enforcement"). This is a materially larger
change than `patient-dentist-request-dtos` — expect the tasks phase to
recommend chained-PR delivery. See Engram
`sdd/appointment-validation-orchestration/proposal-decisions` (#1369) for the
original tentative-decision record and rationale.

## Intent

Bring the Appointment write endpoints up to the same validated-request-DTO
standard the Patient and Dentist endpoints just adopted, and close the three
concrete business-rule gaps the exploration found in the appointment flow:
double-booking, unguarded status transitions, and backend-unenforced working
hours. Today the appointment write path binds an unvalidated `AppointmentDTO`,
duplicates parsing/existence logic across `save`/`update`, and enforces
scheduling policy only in the browser — bypassable by any direct API call.

## Problem Statement

- `AppointmentController.save()` and `update()` bind raw `AppointmentDTO` via
  `@RequestBody` with **no `@Valid` anywhere** in the controller (grep
  confirmed zero matches). `AppointmentDTO` is a plain Lombok `@Data` class
  with **zero `jakarta.validation` constraints**; `date`/`time` are raw
  `String`. Even adding `@Valid` today would be a no-op — exactly the
  pre-DTO state Patient/Dentist just fixed.
- Date/time parsing + past-date/past-time validation is **duplicated
  near-identically** between `save()` (L58-83) and `update()` (L136-164) in
  `AppointmentServiceImpl`, and has already drifted (`update` carries an
  "allow if datetime unchanged" branch `save` lacks) — a live DRY/drift bug.
- Dentist/patient existence is checked **four times**: controller re-checks in
  `save` and `update`, and the service re-checks again via repositories in
  both paths.
- **No double-booking / scheduling-conflict check exists** anywhere in the
  service, repository, or tests. The same dentist can be booked for the same
  slot repeatedly.
- `updateStatus()` sets **any** `AppointmentStatus` enum value with no
  state-machine guard — e.g. `COMPLETED → SCHEDULED` is silently accepted.
- The frontend `validation-manager.js` enforces working-hours (08:00–18:00),
  weekday-only (Mon–Fri), and a 500-char description limit **client-side
  only**; the backend enforces none of these, so a direct API call can create
  weekend / off-hours appointments.
- Tests cover only past-date and past-time-today rejection
  (`AppointmentValidationTest`) and CRUD/role scoping
  (`AppointmentControllerTest`). There is **no** coverage for double-booking,
  status transitions, or DTO field validation.

## Goals

- **G0 (baseline):** Introduce a validated `AppointmentRequestDTO` bound with
  `@Valid` on both `POST` (save) and `PUT` (update), replacing raw
  `AppointmentDTO` binding — real Bean Validation as the single source of
  request-format truth.
- **G1:** Prevent double-booking — reject a create/update that overlaps an
  existing appointment for the same dentist.
- **G2:** Guard status transitions — reject illegal `AppointmentStatus`
  moves via an explicit allowed-transition matrix.
- **G3:** Enforce working-hours and weekday-only rules server-side, reusing
  the exact rule the frontend already encodes.
- **G4:** Remove the duplicated date/time parsing (single validation path
  shared by save/update) and collapse the redundant dentist/patient existence
  lookups.

## Non-Goals

- **No changes to Patient/Dentist code** — that contract was just delivered by
  `patient-dentist-request-dtos` and is out of scope here.
- **No UI/UX redesign** of the frontend appointment flow. The only permitted
  frontend touch is aligning the request payload field names with the new DTO
  (`dentist_id`/`patient_id` → `dentistId`/`patientId`) if decision D1 is
  confirmed. No new screens, no reworked validation UX.
- **No changes to the caching annotations** already covered by
  `AppointmentServiceCacheAnnotationsTest` (`@CacheEvict`/cache behavior stays
  as-is).
- **No new notification/reminder system** — none exists in the appointment
  flow today (verified: exploration found only validation, enrichment, and
  CRUD modules), and this change does not introduce one.
- **No JWT/Spring Security model change.** Existing role/ownership
  authorization behavior is preserved; extracting it into a policy layer is a
  possible design refinement, not a scope commitment here.
- **No new business hours invented** — server-side rules mirror the frontend's
  existing constants exactly (see D5).

## Scope

In scope (backend):

- New: `dto/AppointmentRequestDTO.java` with Bean Validation constraints
  (`@NotNull` ids, date/time `@Pattern` + not-past, `@Size` description).
- `controller/AppointmentController.java`: bind `AppointmentRequestDTO` with
  `@Valid` on save + update; map DTO → the service input; drop the duplicated
  controller-side existence checks where the service already covers them.
- `service/impl/AppointmentServiceImpl.java`: single shared date/time
  validation path; new double-booking conflict check (G1); status-transition
  guard in `updateStatus` (G2); working-hours/weekday enforcement (G3).
- Repository: a query to detect same-dentist overlapping appointments (G1).
- Tests: rework `AppointmentControllerTest`, `AppointmentValidationTest`,
  and add coverage for double-booking, status transitions, working-hours, and
  DTO field validation. `AppointmentServiceCacheAnnotationsTest` stays as-is.

In scope (frontend, minimal — only if D1 confirmed):

- Align the appointment request payload field names with the new DTO shape.

Out of scope:

- Patient/Dentist code, auth model, caching behavior, notifications, frontend
  redesign, persistence schema changes beyond what G1's conflict query needs.

## Key Decisions

### D1 — Split request DTO with camelCase ids (binding, user-confirmed)

Introduce `AppointmentRequestDTO` split from the response DTO, with camelCase
`dentistId`/`patientId` replacing the current snake_case `dentist_id`/
`patient_id`, matching the `PatientRequestDTO`/`DentistRequestDTO` pattern.
Rationale: consistency with the just-archived DTO convention and Java naming
norms. **Consequence:** the frontend request payload (currently snake_case)
must be updated in lockstep, hence the minimal frontend scope.

### D2 — Lombok POJO DTO, manual DTO → input mapping (mirrors prior change)

Implement `AppointmentRequestDTO` as a Lombok `@Data` POJO with
`jakarta.validation.constraints.*`, and map DTO → service input manually in
the controller — matching D5/D6 of the archived Patient/Dentist change (no
records, no MapStruct). Rationale: codebase consistency and minimal blast
radius. Validation `message=` strings follow the existing Spanish convention.

### D3 — Double-booking overlap rule (in scope, user-confirmed; exact rule is a design-phase starting proposal)

The user confirmed double-booking prevention is IN SCOPE. The specific
overlap rule below is this proposal's concrete starting point for the design
phase to finalize, not something the user was asked to approve field-by-field.
Two appointments for the **same dentist** conflict if
they share the **same date and the same time slot**. The current model stores
a single `time` (start) with no duration, so a true interval-overlap check has
no end time to compare. **Proposed concrete rule for v1:** reject a create/
update when an active (non-`CANCELLED`) appointment already exists for that
dentist at the same `date` + `time`. If the business wants real duration-based
overlap (e.g. 30-min slots), that requires adding appointment duration —
flagged as a design/business decision, not assumed here.

### D4 — Status-transition matrix (in scope, user-confirmed, matrix binding)

The user confirmed status-transition guarding is IN SCOPE. The real
`AppointmentStatus` enum has **four** values (`SCHEDULED`, `IN_PROGRESS`,
`COMPLETED`, `CANCELLED`) — the first draft of this matrix only covered three
and omitted `IN_PROGRESS` entirely, a real gap caught during spec-writing.
Re-asked and confirmed: the flow is linear
(`SCHEDULED → IN_PROGRESS → COMPLETED/CANCELLED`), with `COMPLETED` and
`CANCELLED` also reachable directly from `SCHEDULED` (preserving the
already-confirmed direct paths — a same-day cancellation or a completion
logged without an explicit "start" step are legitimate real flows, not
removed by adding `IN_PROGRESS`).

Confirmed allowed transitions:

| From \ To     | SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED |
|---------------|-----------|-------------|-----------|-----------|
| SCHEDULED     | —         | ✅          | ✅        | ✅        |
| IN_PROGRESS   | ❌        | —           | ✅        | ✅        |
| COMPLETED     | ❌        | ❌          | —         | ❌        |
| CANCELLED     | ❌        | ❌          | ❌        | —         |

That is: `SCHEDULED` may move to `IN_PROGRESS`, `COMPLETED`, or `CANCELLED`;
`IN_PROGRESS` may move to `COMPLETED` or `CANCELLED` but never back to
`SCHEDULED`; the terminal states `COMPLETED`/`CANCELLED` never transition
anywhere. This matrix is now binding.

### D5 — Working-hours source of truth: reuse frontend constants (binding direction)

The server-side working-hours rule reuses **exactly** what
`validation-manager.js` already encodes — **08:00–18:00 inclusive**,
**Monday–Friday only**, description **≤ 500 chars**, date `YYYY-MM-DD`, time
`HH:mm`. No new business hours are invented. Rationale: the frontend is the
current de-facto spec; replicating it verbatim guarantees consistency and
avoids introducing a second, conflicting policy.

## Risks and Tradeoffs

- **Scope size:** this is materially larger than the Patient/Dentist change —
  four goals plus test rework across three test classes. Expect the tasks
  phase to recommend chained-PR delivery.
- **Test rework:** `AppointmentControllerTest`, `AppointmentValidationTest`,
  and `AppointmentServiceCacheAnnotationsTest` all touch the appointment path;
  the first two need updates to the new DTO shape and new assertions for
  double-booking / status / working-hours.
- **Business rules are placeholders:** the overlap rule (D3) and transition
  matrix (D4) are concrete proposals but need explicit business sign-off; the
  no-duration data model limits how strict overlap can be without a schema
  change.
- **Frontend/backend coupling:** the snake_case → camelCase rename (D1) breaks
  the frontend unless updated in lockstep — the reason the minimal frontend
  change is in scope.
- **Delivery size:** the combined DTO + three business rules + test rework may
  exceed the review-size budget and need chained/stacked PRs. The forecast is
  **not computed here** — it is flagged for the tasks phase to decide.

## Proposal Question Round

The four scoping questions were first asked while the user was AFK (Auto Mode
proceeded with the recommended defaults as a placeholder), then explicitly
re-asked and answered by the user in a second round. All four confirmed the
recommended option — see the Confirmed Scope Decisions table above. These are
now binding.

## Success Criteria

- `AppointmentController` binds a validated `AppointmentRequestDTO` with
  `@Valid` on both save and update; no endpoint binds the unvalidated
  `AppointmentDTO` as the request body.
- Invalid appointment requests (bad/missing ids, malformed or past date/time,
  over-length description, off-hours, weekend) are rejected server-side with
  validation errors, matching the frontend rules.
- A create/update that double-books the same dentist for the same slot is
  rejected (per the confirmed D3 rule).
- Illegal status transitions are rejected per the confirmed D4 matrix; legal
  ones succeed.
- Date/time parsing exists in a single shared path (no save/update
  duplication); redundant dentist/patient existence lookups are collapsed.
- New and reworked tests cover DTO validation, double-booking, status
  transitions, and working-hours; backend Maven tests pass (or the focused
  slice passes and any unrun suite is reported).
