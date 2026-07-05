# Design: Appointment Validation & Orchestration

## Overview

Bring the Appointment write path up to the validated-request-DTO standard established by `patient-dentist-request-dtos`, and close three business-rule gaps: double-booking (G1), unguarded status transitions (G2), and backend-unenforced working hours (G3). A new `AppointmentRequestDTO` bound with `@Valid` becomes the HTTP write contract; a static mapper converts it to the existing service-level `AppointmentDTO` so `IAppointmentService` signatures stay unchanged; all temporal/business rules collapse into one shared service path (G4).

## Current State Findings

- `AppointmentController.save` (L48-67) / `update` (L94-120) bind raw `AppointmentDTO` with no `@Valid`; `AppointmentDTO` has zero constraints, snake_case `dentist_id`/`patient_id`, raw `String` date/time.
- Date/time parsing + past checks duplicated between `AppointmentServiceImpl.save` (L58-83) and `update` (L136-164); `update` has an extra "allow if datetime unchanged" branch (drift).
- Dentist/patient existence checked 4x: controller (save L58-63, update L112-118) AND service (save L48-52, update L119-129).
- No conflict query anywhere; `updateStatus` (L203-209) sets any status.
- `AppointmentStatus` has FOUR values: `SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED` — the proposal's D4 matrix covered only three and delegated reconciliation to design.
- `GlobalExceptionHandler` already maps `MethodArgumentNotValidException` → 400 and `DuplicateResourceException` → 409 (reuse both, create neither).
- Frontend `appointment-api.js` create/update already map HTTP 409 → "Ya existe una cita en esa fecha y hora" — the 409 conflict contract already exists client-side, unbacked by the server.
- Frontend rules to replicate (`validation-manager.js`): date `^\d{4}-\d{2}-\d{2}$`, time `^([01]\d|2[0-3]):([0-5]\d)$`, hours 08:00–18:00 inclusive, Mon–Fri, description ≤ 500 (matches entity `@Column(length = 500)`).

## Design Decisions

### 1. DTO keeps `String` date/time with `@Pattern`; parsing stays in the service (finalizes D5 field shape)

**Choice**: `dentistId`/`patientId` as `@NotNull Long`; `date`/`time` as `@NotBlank @Pattern` `String` (regexes mirror the frontend verbatim); `description` optional `@Size(max = 500)`. No `id`, no `status` field. Lombok `@Data @NoArgsConstructor @AllArgsConstructor`, Spanish `message=` strings — per `PatientRequestDTO` convention.
**Alternatives considered**: `LocalDate`/`LocalTime` fields (Patient uses `LocalDate admissionDate`).
**Rationale**: a malformed `LocalDate` in the body fails inside Jackson as `HttpMessageNotReadableException`, which no handler covers → falls to the generic `Exception` handler → **500**. `String + @Pattern` yields a proper 400 with the Spanish field message, and the service must parse to `LocalDate`/`LocalTime` anyway for the not-past/working-hours/conflict checks. The proposal scope explicitly said "date/time `@Pattern` + not-past". No status field means `PUT` can no longer flip status — status changes only via the guarded `PATCH /{id}/status` (intentional; otherwise PUT bypasses the D4 matrix). Create defaults to `SCHEDULED` server-side (existing behavior).

### 2. Static `AppointmentRequestMapper` → service-level `AppointmentDTO`; service signatures unchanged (confirms D2)

**Choice**: `dto/AppointmentRequestMapper.java`, `public static AppointmentDTO toServiceDTO(AppointmentRequestDTO dto, Long id)` (id `null` on create, path id on update; `status` left `null`).
**Alternatives considered**: changing `IAppointmentService` to accept the request DTO (wider blast radius, touches cache-annotated methods); MapStruct (rejected in the prior change).
**Rationale**: mirrors `PatientRequestMapper` — DTO boundary at the controller, service keeps its type. Camelcase→snake_case bridging is contained in one testable class.

### 3. `PUT /appointments/{id}` — target id moves to the path

**Choice**: `@PutMapping("/{id}")` with `@Valid @RequestBody AppointmentRequestDTO`; request DTO structurally excludes `id`.
**Alternatives considered**: keeping `PUT /appointments` with id in body — rejected: contradicts the convention just established by Patient/Dentist decision 3 and keeps a body-id vector.
**Rationale**: consistency with the archived change; the DENTIST ownership check reads the path id instead of `dto.getId()`. Frontend `appointment-api.js update()` changes URL in lockstep.

### 4. Double-booking: application-level check via derived `exists` queries, surfaced as existing 409 (finalizes D3)

**Choice**: two derived repository methods — `existsByDentist_IdAndDateAndTimeAndStatusNot(dentistId, date, time, CANCELLED)` (create) and `...AndIdNot(..., id)` (update, excludes self). Checked in `AppointmentServiceImpl.save`/`update` after schedule validation; on conflict throw `DuplicateResourceException("El odontólogo ya tiene un turno en esa fecha y hora")` → existing 409 handler → frontend's existing 409 message.
**Alternatives considered**: (a) DB unique constraint on `(dentist_id, date, time)` as race backstop — rejected for v1: a `CANCELLED` row would block the slot forever, and partial/filtered unique indexes are not portable across H2 (tests) and the production dialect via JPA annotations; (b) `@Query` JPQL — derived methods are shorter and index-backed (`idx_appointment_dentist`, `idx_appointment_date` exist).
**Rationale**: exact-slot equality is the confirmed v1 rule (no duration column exists). Check-then-save has a small race window between concurrent requests; accepted for a clinic-scale app with no existing `@Transactional`/locking patterns in this service — recorded as a risk, with the (status-aware) constraint flagged as future hardening if duration/slots are ever modeled.

### 5. Status transitions: exhaustive `switch` method on the enum, illegal move → 409 (finalizes D4, extended for `IN_PROGRESS`)

**Choice**: `AppointmentStatus.canTransitionTo(target)` using an exhaustive Java 21 `switch`; same-status is an allowed idempotent no-op. Extended matrix (proposal's three-state matrix reconciled with the real enum):

| From \ To    | SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED |
|--------------|-----------|-------------|-----------|-----------|
| SCHEDULED    | no-op     | yes         | yes       | yes       |
| IN_PROGRESS  | no        | no-op       | yes       | yes       |
| COMPLETED    | no        | no          | no-op     | no        |
| CANCELLED    | no        | no          | no        | no-op     |

`AppointmentServiceImpl.updateStatus` guards with it; illegal → new `InvalidStatusTransitionException` → new `GlobalExceptionHandler` 409 entry (same `ErrorResponse` shape as `DuplicateResourceException`).
**Alternatives considered**: `Map<Status,Set<Status>>` static table (no compile-time exhaustiveness — adding an enum value silently allows/denies nothing); guard in the controller (policy belongs with the domain type + service); returning 400 via `IllegalArgumentException` — rejected: the request is well-formed, it conflicts with current resource state → 409 per RFC 9110.
**Rationale**: `switch` over a sealed value set is exhaustive — a future enum value fails compilation until the matrix is decided. The `IN_PROGRESS` rows are a design-added extension flagged for business sign-off (proposal explicitly delegated enum reconciliation here).

### 6. Working hours/weekday: service-layer, inside the shared schedule helper (finalizes D5 placement)

**Choice**: constants in `AppointmentServiceImpl` (`WORK_START = 08:00`, `WORK_END = 18:00` inclusive, `DayOfWeek.MONDAY..FRIDAY`), enforced in the shared validation path (Decision 7); violations → `IllegalArgumentException` (Spanish message) → existing 400.
**Alternatives considered**: custom Bean Validation constraints (`@WorkingDay`/`@WorkingHours` on the String fields) — rejected: requires parsing inside validators (duplicate parse), adds 4+ annotation/validator classes for two checks, and splits temporal policy across two layers while not-past checks must stay in the service anyway (they compare against "now", and update's unchanged-datetime branch needs the persisted entity).
**Rationale**: ONE place owns all temporal business rules; Bean Validation owns presence/format only. Clean layering: format → 400 at binding; business schedule rules → 400/409 at service.

### 7. Shared schedule validation path (implements G4)

**Choice**: private `record ValidatedSchedule(LocalDate date, LocalTime time)` (java-21 pattern) + `private ValidatedSchedule validateSchedule(String dateStr, String timeStr, Appointment existing)` in `AppointmentServiceImpl`: parse (Spanish parse errors), not-past-date, not-past-time-today (with the "unchanged datetime allowed" branch applied uniformly — `existing == null` on create makes it strict, resolving today's save/update drift), weekday, working hours. Controller drops its `dentistService`/`patientService` existence lookups; the service's repository lookups (which already throw) become the single check — 4 lookups → 2.
**Rationale**: single source of truth ends the observed drift; the update-only leniency branch is preserved exactly where it exists today.
**Behavior change (visible)**: `update` with nonexistent dentist/patient returned a bare 400 from the controller; it now returns the service's `ResourceNotFoundException` → **404** with an error body (more correct REST semantics).

## Contracts

```java
// dto/AppointmentRequestDTO.java — Spanish messages per convention
@Data @NoArgsConstructor @AllArgsConstructor
public class AppointmentRequestDTO {
    @NotNull(message = "El odontólogo es requerido")            private Long dentistId;
    @NotNull(message = "El paciente es requerido")              private Long patientId;
    @NotBlank(message = "La fecha es requerida")
    @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "Formato de fecha inválido (yyyy-MM-dd)")
    private String date;
    @NotBlank(message = "La hora es requerida")
    @Pattern(regexp = "([01]\\d|2[0-3]):[0-5]\\d", message = "Formato de hora inválido (HH:mm)")
    private String time;
    @Size(max = 500, message = "La descripción no puede exceder 500 caracteres")
    private String description;   // optional
}
```

Controller signatures after the change:

```java
@PostMapping
@PreAuthorize("hasAnyRole('ADMIN','DENTIST','PATIENT')")
public ResponseEntity<?> save(@Valid @RequestBody AppointmentRequestDTO dto, Authentication auth)
// PATIENT self-scoping preserved: override patientId with own id before mapping

@PutMapping("/{id}")
@PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
public ResponseEntity<AppointmentDTO> update(@PathVariable Long id,
        @Valid @RequestBody AppointmentRequestDTO dto, Authentication auth)
// DENTIST ownership check now keys on path id
```

`AppointmentStatus` gains `canTransitionTo(AppointmentStatus target)` (exhaustive switch, self → true). `PATCH /{id}/status` endpoint shape is unchanged. Response DTO (`AppointmentDTO`) is untouched — GET responses keep `dentist_id`/`patient_id`, so frontend read paths (enricher, ui-manager, their tests) are unaffected.

## Runtime Data Flow

    Client JSON ──> @Valid AppointmentRequestDTO ──400──> field errors (ids/format/size)
        │ (valid)
        ▼
    AppointmentController: role/ownership checks (unchanged) ── AppointmentRequestMapper.toServiceDTO(dto, id)
        ▼
    AppointmentServiceImpl.save/update
        ├─ patient/dentist lookup (single check; 400/404)
        ├─ validateSchedule(): parse, not-past, weekday, 08:00-18:00 ──400──> IllegalArgumentException
        ├─ existsByDentist_IdAndDateAndTime...Not(CANCELLED)[AndIdNot] ──409──> DuplicateResourceException
        ▼
    Repository / DB          PATCH /{id}/status ──> canTransitionTo? ──409──> InvalidStatusTransitionException

## Planned File Changes

### Production (backend)

| File | Action | Description |
|------|--------|-------------|
| `backend/src/main/java/com/dh/dentalClinicMVC/dto/AppointmentRequestDTO.java` | Create | Validated request contract (fields above) |
| `backend/src/main/java/com/dh/dentalClinicMVC/dto/AppointmentRequestMapper.java` | Create | Static `toServiceDTO(dto, id)` |
| `backend/src/main/java/com/dh/dentalClinicMVC/controller/AppointmentController.java` | Modify | `@Valid` DTO on save; `@PutMapping("/{id}")`; drop duplicated existence checks; map via mapper |
| `backend/src/main/java/com/dh/dentalClinicMVC/service/impl/AppointmentServiceImpl.java` | Modify | `validateSchedule` shared path + working hours; conflict checks; transition guard in `updateStatus` |
| `backend/src/main/java/com/dh/dentalClinicMVC/repository/IAppointmentRepository.java` | Modify | Two derived `exists...` conflict queries |
| `backend/src/main/java/com/dh/dentalClinicMVC/entity/AppointmentStatus.java` | Modify | `canTransitionTo` exhaustive switch |
| `backend/src/main/java/com/dh/dentalClinicMVC/exception/InvalidStatusTransitionException.java` | Create | Runtime exception for illegal transitions |
| `backend/src/main/java/com/dh/dentalClinicMVC/exception/GlobalExceptionHandler.java` | Modify | 409 handler for `InvalidStatusTransitionException` (mirror `DuplicateResourceException` block) |

Entities (other than the enum), security, caching annotations: **no changes**.

### Frontend (minimal, lockstep with Slice A)

| File | Change |
|------|--------|
| `frontend/public/js/appointment/modules/form-manager.js` | Payload keys `dentist_id`/`patient_id` → `dentistId`/`patientId` (getFormData L47/66/81 and its own validations L118/125/219-225) |
| `frontend/public/js/appointment/modules/validation-manager.js` | Read camelCase ids in `validateAppointmentData` (L141/146) |
| `frontend/public/js/api/appointment-api.js` | `update()` → `PUT ${API_BASE_URL}/api/appointments/${appointment.id}` (id out of body); `validateAppointmentData` reads camelCase ids (L240-244); keep existing 409 messages |
| `frontend/API-DOCS.md` | Document new request shape (`dentistId`/`patientId`, `PUT /{id}`, 409 semantics) |

Read paths (`appointment-enricher.js`, `ui-manager.js`, `index.js`) keep consuming response snake_case — untouched.

## Test Design Details

- `AppointmentControllerTest` (rework): bodies → camelCase DTO shape; `put("/appointments")` → `put("/appointments/{id}", id)`; role-scoping assertions preserved; new 400 assertions for missing/malformed each field.
- `AppointmentValidationTest` (rework + extend): existing past-date/past-time cases moved to the DTO shape; new working-hours boundaries (07:59 → 400, 08:00 → 200, 18:00 → 200, 18:01 → 400), Saturday/Sunday → 400, description of 501 chars → 400, 500 chars → 200.
- New double-booking tests: same dentist+date+time create → 409; `CANCELLED` appointment frees the slot → 200; update colliding with another appointment → 409; update keeping its own slot → 200.
- New status-transition tests: each legal move → 200; `COMPLETED→SCHEDULED`, `CANCELLED→SCHEDULED`, `COMPLETED→IN_PROGRESS` → 409; same-status → 200 (no-op); plus a plain-JUnit exhaustive matrix test on `canTransitionTo`.
- New mapper unit test (plain JUnit, no Spring context).
- `AppointmentServiceCacheAnnotationsTest`: **unaffected** — it reflects on `@CacheEvict` presence and `IAppointmentService` method names/signatures, none of which change (proposal non-goal honored).
- Frontend: run `frontend` test suite; `appointment-ui-manager-xss.test.js` / `appointment-srp-split.test.js` assert response-path snake_case → unaffected; fix any payload-shape assertions if present.

## Validation Commands

```bash
cd backend && mvn test -Dtest='AppointmentControllerTest,AppointmentValidationTest'
cd backend && mvn test -Dtest='AppointmentServiceCacheAnnotationsTest'   # non-regression guard
cd backend && mvn test                                                    # full suite before completion
cd frontend && npm test                                                   # payload-shape non-regression
```

Strict TDD applies: failing tests first per slice, minimal implementation, re-run focused command until green.

## Rollout and Work Unit Plan

Combined estimate clearly exceeds the 400-line review budget → chained PRs (proposal anticipated this). Slicing minimizes cross-slice coupling; each slice is independently green and revertable:

1. **Slice A — Request contract vertical (G0, ~350-400 lines)**: `AppointmentRequestDTO` + mapper + controller (`@Valid`, `PUT /{id}`, drop duplicate existence checks) + all four frontend files (lockstep: payload rename + PUT URL) + reworked `AppointmentControllerTest` bodies + DTO field-validation tests + mapper test. Closest to budget — if it overruns, split test rework into its own child PR.
2. **Slice B — Shared schedule path + working hours (G3+G4 service part, ~250 lines)**: `validateSchedule` record/helper unifying save/update, weekday + 08:00–18:00 enforcement, boundary tests. Depends on A only for test body shape.
3. **Slice C — Double-booking (G1, ~200 lines)**: repository `exists` queries, conflict checks in save/update (reuses B's parsed schedule), `DuplicateResourceException` wiring, conflict tests. Depends on B.
4. **Slice D — Status-transition matrix (G2, ~220 lines)**: `canTransitionTo`, `InvalidStatusTransitionException` + handler, `updateStatus` guard, transition tests. Independent of B/C — can land in parallel after A.

Rollback: A reverts to raw `AppointmentDTO` binding (frontend must revert with it — single deployable); B/C/D each revert independently without touching the contract.

## Risks and Tradeoffs

- **Double-booking race window**: check-then-save is not atomic; two truly simultaneous requests can both pass the `exists` check. Accepted for clinic-scale traffic; a status-aware DB constraint is future hardening (blocked today by CANCELLED-row semantics and portable-index limits) — must be revisited if slots/duration are modeled.
- **Matrix extension needs sign-off**: the `IN_PROGRESS` rows and the "terminal states are frozen" rule are design-added (proposal delegated enum reconciliation); surface in the Slice D PR description for business confirmation.
- **Behavior changes (intentional, visible in PR descriptions)**: (a) `PUT` moves to `/appointments/{id}`; (b) `PUT` can no longer change `status` (only `PATCH /{id}/status` can); (c) update with nonexistent dentist/patient now 404 instead of bare 400; (d) previously-accepted off-hours/weekend/duplicate-slot requests now rejected.
- **Existing data**: rows already violating new rules (weekend appointments, duplicate slots) remain readable/deletable; they only fail on write-through. No migration required.
- **Frontend/backend lockstep**: Slice A's payload rename and PUT URL break the frontend unless deployed together — single repo/deployable, keep the vertical atomic.

## Future Apply Constraints

- No `IAppointmentService` signature changes, no MapStruct, no response-DTO changes, no auth/caching/schema changes beyond the enum method.
- Spanish validation/error `message=` strings per convention; new identifiers and comments in English.
- Keep each slice under the 400 changed-line budget; strict TDD per slice.
