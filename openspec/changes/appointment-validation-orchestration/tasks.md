# Tasks: Appointment Validation & Orchestration

## Review Workload Forecast

| Slice | Scope | Est. lines | Budget risk (slice) |
|-------|-------|-----------:|----------------------|
| A1 | Request contract (DTO+mapper+controller+frontend) | ~210 | Low |
| A2 | Contract test rework (controller/validation tests + mapper test) | ~215 | Low |
| B | Shared schedule path + working hours (G3/G4) | ~230 | Low |
| C | Double-booking (G1, depends on B) | ~180 | Low |
| D | Status-transition matrix (G2, independent after A1) | ~245 | Low |
| **Combined** | all 5 units in one PR | **~1080** | **High** |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

Design's original Slice A (~350-400 lines) is split here into A1 (contract) + A2 (test rework) — the design's own stated fallback — because A alone sat near the budget edge. B, C, D stay as designed. Suggested order: A1 → A2 → B → (C, D can proceed in parallel with each other, D independent of B/C; C depends on B).

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| A1 | Contract vertical: DTO, mapper, controller, frontend lockstep | PR 1 | Base = tracker/main; must ship with frontend atomically |
| A2 | Rework existing tests to new DTO shape + new field-validation tests | PR 2 | Depends on A1 |
| B | Shared `validateSchedule` + working-hours/weekday | PR 3 | Depends on A2 (test shape) |
| C | Double-booking conflict checks | PR 4 | Depends on B |
| D | Status-transition matrix | PR 5 | Depends on A1 only; can run parallel to B/C |

## Slice A1: Request Contract Vertical (G0)

- [x] A1.1 RED: Add `AppointmentRequestMapperTest` in `backend/src/test/java/com/dh/dentalClinicMVC/dto/AppointmentRequestMapperTest.java` asserting `toServiceDTO(dto, id)` field mapping (fails: no mapper yet).
- [x] A1.2 GREEN: Create `dto/AppointmentRequestDTO.java` (fields per design Contracts section) and `dto/AppointmentRequestMapper.java`.
- [x] A1.3 GREEN: Modify `controller/AppointmentController.java` — `@Valid` DTO on `save`, `@PutMapping("/{id}")` on `update`, map via mapper, drop duplicated dentist/patient existence checks, PATIENT self-scoping override, DENTIST ownership check on path id.
- [x] A1.4 GREEN: Update `frontend/public/js/appointment/modules/form-manager.js` payload keys to `dentistId`/`patientId`.
- [x] A1.5 GREEN: Update `frontend/public/js/appointment/modules/validation-manager.js` to read camelCase ids.
- [x] A1.6 GREEN: Update `frontend/public/js/api/appointment-api.js` — `update()` targets `PUT /api/appointments/{id}`, camelCase ids, keep 409 messages.
- [x] A1.7 Docs: Update `frontend/API-DOCS.md` with new request shape and `PUT /{id}`.
- [x] A1.8 Verify: `cd backend && mvn test -Dtest=AppointmentRequestMapperTest`; `cd frontend && npm test`.

## Slice A2: Contract Test Rework (G0)

- [x] A2.1 RED→GREEN: Rework `controller/AppointmentControllerTest.java` — camelCase bodies, `put("/appointments/{id}", id)`, preserve role-scoping assertions, add 400 cases for missing/malformed each field.
- [x] A2.2 RED→GREEN: Rework `controller/AppointmentValidationTest.java` — move existing past-date/past-time cases to new DTO shape; add over-length (501) and boundary (500) description assertions.
- [x] A2.3 Verify: `cd backend && mvn test -Dtest=AppointmentControllerTest,AppointmentValidationTest,AppointmentServiceCacheAnnotationsTest` (non-regression on cache test, unaffected by design).

## Slice B: Shared Schedule Path + Working Hours (G3/G4)

- [x] B.1 RED: Add working-hours boundary tests to `AppointmentValidationTest.java` (07:59→400, 08:00→200, 18:00→200, 18:01→400, Saturday/Sunday→400).
- [x] B.2 GREEN: In `service/impl/AppointmentServiceImpl.java` add `private record ValidatedSchedule(...)` + `validateSchedule(dateStr, timeStr, existing)` unifying parse/not-past/weekday/hours; wire into `save`/`update`, replacing duplicated logic.
- [x] B.3 Verify: `cd backend && mvn test -Dtest=AppointmentValidationTest,AppointmentControllerTest`.

## Slice C: Double-Booking Prevention (G1, depends on B)

- [x] C.1 RED: Create `controller/AppointmentConflictTest.java` — same dentist+date+time create→409; different slot/different dentist→200; `CANCELLED` frees slot→200; update collision→409; update own slot→200.
- [x] C.2 GREEN: Add `existsByDentist_IdAndDateAndTimeAndStatusNot` and `...AndIdNot` to `repository/IAppointmentRepository.java`.
- [x] C.3 GREEN: Wire conflict checks into `AppointmentServiceImpl.save`/`update` after `validateSchedule`, throwing existing `DuplicateResourceException`.
- [x] C.4 Verify: `cd backend && mvn test -Dtest=AppointmentConflictTest`.

## Slice D: Status-Transition Matrix (G2, independent after A1)

- [x] D.1 RED: Create `entity/AppointmentStatusTest.java` (plain JUnit) — exhaustive matrix incl. same-status no-op for all 4 states per design's confirmed table.
- [x] D.2 GREEN: Add `canTransitionTo(target)` exhaustive switch to `entity/AppointmentStatus.java`.
- [x] D.3 RED: Create `controller/AppointmentStatusTransitionControllerTest.java` — every legal move→200 (incl. same-status no-op); `IN_PROGRESS→SCHEDULED`, `COMPLETED→*`, `CANCELLED→*`→409.
- [x] D.4 GREEN: Create `exception/InvalidStatusTransitionException.java`; add 409 block to `exception/GlobalExceptionHandler.java` (mirror `DuplicateResourceException`).
- [x] D.5 GREEN: Guard `AppointmentServiceImpl.updateStatus` with `canTransitionTo`.
- [x] D.6 Verify: `cd backend && mvn test -Dtest=AppointmentStatusTest,AppointmentStatusTransitionControllerTest`.
- [x] D.7 PR description note: explicitly disclose that the `IN_PROGRESS` matrix rows and the same-status no-op behavior (including both terminal states) are design-added/reconciled beyond the proposal's original 3-state draft — flag for business visibility, not a merge blocker.

## Final Cross-Slice Verification

- [x] F.1 `cd backend && mvn test` (full suite, all slices merged).
- [x] F.2 `cd frontend && npm test` (payload-shape non-regression, incl. `appointment-ui-manager-xss.test.js`, `appointment-srp-split.test.js`).
