# Design: Appointment Collection Mapping

## Technical Approach

Add one static list-mapping method to the existing `AppointmentResponseMapper`
utility class and make the two duplicated loops in `AppointmentServiceImpl`
delegate to it. No signatures, annotations, ordering, mutability, exception
behavior, or role routing change. Spec phase determined **no spec delta**
(`spec.md`), so this is a behavior-preserving internal refactor guarded by new
unit tests.

## Architecture Decisions

### Decision 1: Explicit loop into `new ArrayList<>()` (not a stream collector)

| Option | Tradeoff | Decision |
|---|---|---|
| `for` loop into `new ArrayList<>()` | Verbatim shape of both current call sites; mutability is a language guarantee, not a collector contract | **Chosen** |
| `.stream().collect(Collectors.toCollection(ArrayList::new))` | Mutable, but adds a stream dependency the mapper class does not use today | Rejected |
| `Collectors.toList()` / `Stream.toList()` | Violates binding D1 — no mutability guarantee / explicitly immutable | Rejected |

**Rationale**: D1 is binding. `AppointmentResponseMapper` currently contains no
streams; the loop keeps the diff semantically identical to the code it replaces,
which is what makes this reviewable as a pure refactor.

### Decision 2: Un-presized `new ArrayList<>()`

Chosen over `new ArrayList<>(appointments.size())`. Presizing is a behavior-neutral
micro-optimization that changes the failure point for a `null` argument and adds
review surface for zero functional gain. Null input keeps throwing `NullPointerException`
exactly as the current loops do — no null guard is added.

### Decision 3: New test lives in `service/impl/`, not `service/`

The proposal cited `service/AppointmentServiceImplTest.java`. Package convention wins:
`AppointmentServiceImpl` is in `com.dh.dentalClinicMVC.service.impl`, and its siblings
`DashboardServiceImplTest`, `AppointmentSearchQueryTest`, and `AppointmentScheduleValidatorTest`
all live under `service/impl/`. Final path: `backend/src/test/java/com/dh/dentalClinicMVC/service/impl/AppointmentServiceImplTest.java`.

### Decision 4: `@ExtendWith(MockitoExtension.class)` + explicit constructor

Matches `DashboardServiceImplTest` exactly: `@Mock` fields, a `@BeforeEach` that calls the
real constructor, no `@InjectMocks`, no Spring context. All five collaborators are mocked
(`AppointmentSearchQuery` and `AppointmentScheduleValidator` are `final`; Mockito 5's default
inline mock maker handles that). Rejected: passing `null` for the two unused collaborators —
brittle if `findAll` ever gains one. `MockitoExtension` is strict-stubs, so each test stubs
only the repository its branch reaches.

## Interfaces / Contracts

```java
// backend/src/main/java/com/dh/dentalClinicMVC/dto/AppointmentResponseMapper.java
public static List<AppointmentDTO> toDTOs(List<Appointment> appointments) {
  List<AppointmentDTO> dtos = new ArrayList<>();
  for (Appointment appointment : appointments) {
    dtos.add(toDTO(appointment));
  }
  return dtos;
}
```

New imports in the mapper: `java.util.ArrayList`, `java.util.List`.

**Call site change** (both methods, `AppointmentServiceImpl`):

```java
// BEFORE (L201-207 findAll; L227-231 findAllForCurrentUser)
List<AppointmentDTO> result = new ArrayList<>();
for (Appointment appointment : appointments) {
  result.add(AppointmentResponseMapper.toDTO(appointment));
}
return result;

// AFTER
return AppointmentResponseMapper.toDTOs(appointments);
```

`findAllForCurrentUser()`'s role dispatch (L212-225) is untouched. After both
replacements, `import java.util.ArrayList;` (L19) is unused in `AppointmentServiceImpl`
and must be removed.

## Data Flow

    Controller ──→ AppointmentServiceImpl.findAll()/findAllForCurrentUser()
                        │ (role dispatch unchanged)
                        ▼
                   IAppointmentRepository ──→ List<Appointment>
                        │
                        ▼
       AppointmentResponseMapper.toDTOs() ──→ mutable ArrayList<AppointmentDTO>

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/src/main/java/com/dh/dentalClinicMVC/dto/AppointmentResponseMapper.java` | Modify | Add static `toDTOs(List<Appointment>)` + 2 imports |
| `backend/src/main/java/com/dh/dentalClinicMVC/service/impl/AppointmentServiceImpl.java` | Modify | Replace both loops with `toDTOs(...)`; drop unused `ArrayList` import |
| `backend/src/test/java/com/dh/dentalClinicMVC/dto/AppointmentResponseMapperTest.java` | Modify | Add 4 `toDTOs` cases |
| `backend/src/test/java/com/dh/dentalClinicMVC/service/impl/AppointmentServiceImplTest.java` | Create | 8 cases covering both methods |

## Testing Strategy

**`AppointmentResponseMapperTest`** (JUnit 5 only, no Mockito — matches existing file):

| Test method | Asserts |
|---|---|
| `toDTOs_returnsEmptyListForEmptyInput` | Non-null, `isEmpty()` |
| `toDTOs_preservesSourceOrderForMultipleElements` | 3 appointments → DTO ids in identical order |
| `toDTOs_appliesToDTOFormattingToEveryElement` | Each element's `date`/`time`/`status` formatted as `toDTO` does |
| `toDTOs_returnsMutableList` | `.add(...)` then `.remove(0)` succeed without `UnsupportedOperationException` |

**`AppointmentServiceImplTest`** (new; private `Appointment` fixture helper):

| Test method | Asserts |
|---|---|
| `findAll_returnsDTOsInRepositoryOrder` | `appointmentRepository.findAll()` stubbed with 2 entities → 2 DTOs, ids in order |
| `findAll_returnsEmptyListWhenNoAppointments` | Empty repository → empty, non-null result |
| `findAll_returnsMutableList` | `.add(...)` on the result succeeds |
| `findAllForCurrentUser_returnsAllAppointmentsForAdmin` | `Role.ADMIN` → `appointmentRepository.findAll()`; `verifyNoInteractions(patientRepository, dentistRepository)` |
| `findAllForCurrentUser_returnsOnlyPatientAppointmentsForPatient` | `findByEmail` → patient; `findByPatient_Id(id)` used; `findAll()` never called |
| `findAllForCurrentUser_returnsOnlyDentistAppointmentsForDentist` | `findByEmail` → dentist; `findByDentist_Id(id)` used; `findAll()` never called |
| `findAllForCurrentUser_throwsStalePrincipalExceptionWhenPatientRowMissing` | `Optional.empty()` → `StalePrincipalException`; no appointment query issued |
| `findAllForCurrentUser_throwsStalePrincipalExceptionWhenDentistRowMissing` | Same for the DENTIST branch |

Integration/E2E: none added. Existing `AppointmentControllerTest` MockMvc coverage stays the
regression net at the HTTP layer. Command: `mvn test` (backend).

## Implementation Order (Strict TDD — `strict_tdd: true`)

1. **RED** — add the 4 `toDTOs` cases to `AppointmentResponseMapperTest`. Fails (method absent / compile error).
2. **GREEN** — add `toDTOs` to `AppointmentResponseMapper`. `mvn test` passes. Service untouched.
3. **CHARACTERIZATION** — create `AppointmentServiceImplTest` with all 8 cases against the *current* loop-based code. These must pass immediately; a failure here means the baseline was misunderstood, not that production code is missing. This is the safety net that makes step 4 provable.
4. **REFACTOR** — replace both loops with `toDTOs(...)` and remove the unused `ArrayList` import. Steps 1-3 tests must stay green **with zero test edits**; any required test edit invalidates the "pure refactor" claim.
5. **VERIFY** — full `mvn test`; confirm formatter/build clean.

Steps must land in this order. Step 4 may not precede step 3.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. Single PR, ~+25/-15 authored lines plus ~150 test lines — well under the 400-line review budget.

## Open Questions

None.
