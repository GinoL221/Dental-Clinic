# Exploration: appointment-collection-mapping

## Current State

`AppointmentServiceImpl.java` (246 lines, `backend/src/main/java/com/dh/dentalClinicMVC/service/impl/AppointmentServiceImpl.java`), lines 199-232:

```java
@Override
public List<AppointmentDTO> findAll() {
  List<Appointment> appointments = appointmentRepository.findAll();
  List<AppointmentDTO> appointmentDTOs = new ArrayList<>();
  for (Appointment appointment : appointments) {
    appointmentDTOs.add(AppointmentResponseMapper.toDTO(appointment));
  }
  return appointmentDTOs;
}

@Override
public List<AppointmentDTO> findAllForCurrentUser(String email, Role role) {
  List<Appointment> appointments;
  if (role == Role.PATIENT) {
    Patient patient = patientRepository.findByEmail(email).orElseThrow(StalePrincipalException::new);
    appointments = appointmentRepository.findByPatient_Id(patient.getId());
  } else if (role == Role.DENTIST) {
    Dentist dentist = dentistRepository.findByEmail(email).orElseThrow(StalePrincipalException::new);
    appointments = appointmentRepository.findByDentist_Id(dentist.getId());
  } else {
    // ADMIN: returns all
    appointments = appointmentRepository.findAll();
  }
  List<AppointmentDTO> result = new ArrayList<>();
  for (Appointment appointment : appointments) {
    result.add(AppointmentResponseMapper.toDTO(appointment));
  }
  return result;
}
```

- Public signatures (declared on `IAppointmentService`): `List<AppointmentDTO> findAll()`, `List<AppointmentDTO> findAllForCurrentUser(String email, Role role)`. `findAll()` is also called internally by `findAllForCurrentUser()`'s ADMIN branch (line 224).
- Neither method carries method-level annotations beyond `@Override` (no `@Transactional`/`@CacheEvict`/`@PreAuthorize`). Authorization for the collection is enforced one layer up, on `AppointmentController.findAll()` (`@PreAuthorize("hasAnyRole('ADMIN','DENTIST','PATIENT')")`, line 143) — out of scope for this change.
- Both loops build a mutable `new ArrayList<>()` and populate it via `AppointmentResponseMapper.toDTO(appointment)` per element, preserving repository iteration order (no sort applied).
- Exceptions: `StalePrincipalException` (unchecked) from the PATIENT/DENTIST `orElseThrow` sites only; `findAll()` throws nothing beyond repository-level failures.
- `AppointmentResponseMapper.java` (`backend/src/main/java/com/dh/dentalClinicMVC/dto/AppointmentResponseMapper.java`) exposes exactly one method today: `public static AppointmentDTO toDTO(Appointment appointment)`, mapping `id`, `patient_id`, `dentist_id`, `date` (`toString()`), `time` (`HH:mm`), `description`, `status` (`.name()`). No list-mapping method exists yet. `searchAppointments()` (lines 242-245) already uses `AppointmentResponseMapper::toDTO` as a `Page.map` method reference, confirming the mapper is the established single point of truth for entity-to-DTO conversion.

## Test Coverage

- `AppointmentResponseMapperTest` has 2 tests, both against `toDTO(Appointment)` only (`toDTO_mapsAllFieldsWithResponseFormats`, `toDTO_preservesNullDescription`). No list-mapping test exists.
- No `AppointmentServiceImplTest.java` exists (confirmed via glob — zero matches). CodeGraph independently flags `findAll` and `findAllForCurrentUser` (impl) as having no covering unit tests.
- `AppointmentServiceCacheAnnotationsTest` only reflection-checks `@CacheEvict` on `save`/`update`/`delete`/`updateStatus` — unaffected by this refactor.
- Indirect coverage exists only through `AppointmentControllerTest` (MockMvc integration tests), including an `@Order(27)` test (`patientWithNoBackingRecordListingAppointments_then401Unauthorized`) exercising the PATIENT `orElseThrow(StalePrincipalException::new)` path end-to-end for the stale-principal 401 contract. No integration test currently exercises the ADMIN or DENTIST branches, nor a null/unrecognized role.
- **Gap for proposal/tasks phase**: no unit coverage exists for a future `AppointmentResponseMapper.toDTOs(List)`, nor for `findAll()`/`findAllForCurrentUser()` ADMIN/PATIENT/DENTIST branches at the service-unit level.

## Affected Areas

- `backend/src/main/java/com/dh/dentalClinicMVC/service/impl/AppointmentServiceImpl.java` — `findAll()` (199-208) and `findAllForCurrentUser()` (210-232) each contain a duplicated manual loop; both call sites collapse to a single `AppointmentResponseMapper.toDTOs(appointments)` call.
- `backend/src/main/java/com/dh/dentalClinicMVC/dto/AppointmentResponseMapper.java` — needs a new `toDTOs(List<Appointment>)` (or equivalent) static method returning a mutable `ArrayList<AppointmentDTO>` in source order.
- `backend/src/test/java/com/dh/dentalClinicMVC/dto/AppointmentResponseMapperTest.java` — needs new tests for the list-mapping method (empty list, order preservation, multiple elements, mutability of the returned list).
- New/expanded service-level tests for `findAll()`/`findAllForCurrentUser()` (ADMIN/PATIENT/DENTIST branches) — no home file exists yet; creating `AppointmentServiceImplTest.java` is itself an explicit scope decision for the proposal phase.

## Approaches

1. **Add `AppointmentResponseMapper.toDTOs(List<Appointment>)`, call it from both methods.** Consistent with the existing `Page.map(AppointmentResponseMapper::toDTO)` pattern already used in `searchAppointments()`. Removes ~15 duplicated lines; must explicitly return a mutable `ArrayList` (not `List.of()`/`Collectors.toUnmodifiableList()`) to preserve the current mutability contract. Effort: low.
2. **Inline `Stream`/`Collectors.toCollection(ArrayList::new)` in each method** — rejected: still duplicates the same one-liner twice and does not centralize collection-mapping logic in the mapper class the way the single-entity case already is.

## Recommendation

Approach 1: add `AppointmentResponseMapper.toDTOs(List<Appointment>)` returning a `new ArrayList<>()` populated in source order, and replace both loops in `AppointmentServiceImpl` with a call to it. Estimated slice size (+~15-25/-~15 lines for the mapper and call sites, plus new tests) stays well under the 400-line review budget.

## Risks

1. Zero existing unit coverage for `findAll()`/`findAllForCurrentUser()` — correctness for ADMIN/PATIENT/DENTIST branches currently relies only on slower MockMvc integration tests. Recommend adding `AppointmentServiceImplTest` unit coverage as part of this change.
2. `AppointmentResponseMapper.toDTOs` must explicitly build a mutable `ArrayList`, not an immutable stream collector, to preserve the current caller contract; must be tested explicitly.
3. **Named hardening finding — separate from this refactor's scope, requires an explicit proposal-time decision:**
   - `users.role` is nullable at the DB level: `V1__create_initial_schema.sql` line 10 — `role ENUM('ADMIN', 'DENTIST', 'PATIENT')` with no `NOT NULL` constraint; no later migration tightens it. `User.java` (lines 39-40, `@Enumerated(EnumType.STRING) private Role role;`) has no `nullable = false` either.
   - `User.getAuthorities()` (`User.java` lines 44-46: `List.of(new SimpleGrantedAuthority("ROLE_" + role.name()))`) throws an uncaught `NullPointerException` when `role` is null. `JwtAuthenticationFilter.doFilterInternal()` (line 77) invokes `userDetails.getAuthorities()` inside its `try` block but the resulting NPE is not covered by either existing `catch (UsernameNotFoundException)` or `catch (JwtException | IllegalArgumentException)` — it propagates as an untranslated 500 for every authenticated request by a user with a null role, not only appointment listing.
   - Independently, `AppointmentServiceImpl.findAllForCurrentUser()` (lines 214-225) has its own gap: `if (role == Role.PATIENT) ... else if (role == Role.DENTIST) ... else { /* ADMIN */ }` means a null role — or any future `Role` enum value beyond the current closed set — falls through to the `else` branch and receives **global appointment access**, the same as ADMIN, rather than a denial.
   - The project already has an established convention for principal/role edge cases: `openspec/specs/stale-principal-resolution/spec.md` mandates `401 Unauthorized` for "valid JWT but principal resolution fails" cases, including `findAllForCurrentUser()`'s PATIENT/DENTIST `findByEmail`-miss sites specifically. A null/unrecognized-role case is a distinct condition (principal resolves, but role is absent/unknown) — the proposal phase must explicitly decide whether to extend the 401 convention, use 403, or something else, rather than inventing a new response ad hoc.

## Ready for Proposal

Yes. Scope is confirmed narrow (backend-only: `AppointmentResponseMapper` plus two `AppointmentServiceImpl` call sites and their tests), well under the 400-line review budget, and consistent with the established extraction pattern already used for `AppointmentSearchQuery`, `AppointmentScheduleValidator`, and the existing single-entity `AppointmentResponseMapper.toDTO`. The null/unrecognized-role hardening finding must be presented as a separate, explicit decision point during `sdd-propose` — it must not silently expand this refactor's scope.
