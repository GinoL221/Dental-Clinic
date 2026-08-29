# Proposal: Appointment Collection Mapping

## Intent

`AppointmentServiceImpl.findAll()` (L199-208) and `findAllForCurrentUser()`
(L210-232) each build their own `new ArrayList<>()` and loop calling
`AppointmentResponseMapper.toDTO(...)`. This is the last duplicated
collection-mapping logic left in the class after the `AppointmentSearchQuery` /
`AppointmentScheduleValidator` / `AppointmentResponseMapper` extractions
(09e2077). Centralizing it removes the drift risk between the two copies and
gives the mapper its first list-level coverage — both service methods have zero
direct unit tests today (only indirect MockMvc coverage).

## Scope

### In Scope

- Add `AppointmentResponseMapper.toDTOs(List<Appointment>)` returning a mutable
  `ArrayList<AppointmentDTO>` in source order.
- Replace ONLY the two loops in `findAll()` and `findAllForCurrentUser()`.
- New `AppointmentServiceImplTest`: ADMIN, PATIENT, DENTIST, and
  stale-principal scenarios.
- New `AppointmentResponseMapperTest` cases: empty list, multiple elements,
  order preservation, mutability of the returned list.

### Out of Scope

- Every other `AppointmentServiceImpl` method (`save`, `update`,
  `searchAppointments`, `updateStatus`, `findById`, `delete`).
- Frontend. Flyway migrations (`V1__create_initial_schema.sql` may be cited as
  evidence, never modified).
- **Null/unrecognized `Role` hardening.** `users.role` is DB-nullable and the
  `else` branch of `findAllForCurrentUser()` grants ADMIN-equivalent global
  access to any null or future `Role`. Verified and real, but deliberately
  deferred — see D2. A separate change must be proposed to implement it.

## Capabilities

### New Capabilities

None — internal refactor, no new observable behavior.

### Modified Capabilities

None — observable behavior is preserved exactly.

## Approach

Add a `static toDTOs` helper to the existing final utility class
`AppointmentResponseMapper` (private constructor + static `toDTO`), then call it
from both sites. No signature changes to `IAppointmentService`,
`AppointmentServiceImpl`, or the existing `toDTO`.

## Key Decisions

### D1 — Mutable `ArrayList`, not a stream collector (binding)

`toDTOs` uses an explicit `new ArrayList<>()` + loop. `Collectors.toList()`
gives no mutability guarantee; both call sites return a mutable list today and
must keep doing so. Iteration order stays repository order.

### D2 — Future null/unrecognized-role response: `401 Unauthorized` (recommended direction, NOT implemented here)

User-confirmed target for the follow-up change: `401 Unauthorized`, aligned with
`openspec/specs/stale-principal-resolution/spec.md` ("valid JWT but principal
resolution fails" → 401). Mechanics belong to that change's own design phase.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/main/java/com/dh/dentalClinicMVC/dto/AppointmentResponseMapper.java` | Modified | New `toDTOs(List<Appointment>)` |
| `backend/src/main/java/com/dh/dentalClinicMVC/service/impl/AppointmentServiceImpl.java` | Modified | Two loops replaced |
| `backend/src/test/java/com/dh/dentalClinicMVC/service/AppointmentServiceImplTest.java` | New | Role + stale-principal coverage |
| `backend/src/test/java/com/dh/dentalClinicMVC/dto/AppointmentResponseMapperTest.java` | Modified | List-mapping cases |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Return type becomes immutable, breaking a caller that mutates | Low | D1 pins mutable `ArrayList`; explicit mutability test |
| Order or DTO fields drift | Low | Order-preservation test; `toDTO` untouched |
| Scope creep into the D2 role bug | Medium | Explicitly out of scope; deferred to its own change |
| Refactor masks the absent baseline coverage | Medium | Strict TDD: tests land before the loop replacement |

## Rollback Plan

Single-commit `git revert`. No schema, API, config, or dependency change; the
two call sites are self-contained.

## Dependencies

None.

## Success Criteria

- [ ] `AppointmentResponseMapper.toDTOs` is the only collection-mapping path for
      both methods; no manual loop remains in either.
- [ ] Returned list is a mutable `ArrayList` in repository order with identical
      DTO fields.
- [ ] `AppointmentServiceImplTest` covers ADMIN, PATIENT, DENTIST, and
      `StalePrincipalException`; role-based repository selection unchanged.
- [ ] Slice stays well under the 400-line review budget (~+15-25/-15 plus tests).
- [ ] `mvn test` passes (or the focused slice passes and any unrun suite is reported).

## Proposal Question Round

The scoping questions were asked and answered by the user before this phase.
Binding outcomes: mapper-level centralization only (both loops, nothing else);
mutable `ArrayList` and exact behavior preservation (D1); new
`AppointmentServiceImplTest` in scope; backend-only; and the null/unrecognized-role
hardening deferred with `401 Unauthorized` as its recommended target (D2).
