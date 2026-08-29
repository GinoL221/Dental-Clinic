# Tasks: Appointment Collection Mapping

Source: `design.md` (Strict TDD implementation order, `strict_tdd: true`).
Spec delta: none — pure internal refactor (see `spec.md`).

Ordering is authoritative. Task 4 (refactor) MUST NOT start before Task 3
(characterization tests) is green. Tasks 1–3's tests must survive Task 4
with **zero edits** — any required edit there invalidates the pure-refactor
claim and must be treated as a blocking finding, not silently patched.

## 1. RED — add failing `toDTOs` mapper tests

- [x] 1.1 In `backend/src/test/java/com/dh/dentalClinicMVC/dto/AppointmentResponseMapperTest.java`,
      add 4 test methods (plain JUnit 5, no Mockito, matching existing file style):
  - `toDTOs_returnsEmptyListForEmptyInput` — asserts non-null, `isEmpty()`
  - `toDTOs_preservesSourceOrderForMultipleElements` — 3 appointments → DTO ids in identical order
  - `toDTOs_appliesToDTOFormattingToEveryElement` — each element's `date`/`time`/`status`
    formatted exactly as `toDTO` does
  - `toDTOs_returnsMutableList` — `.add(...)` then `.remove(0)` succeed without
    `UnsupportedOperationException`
- [x] 1.2 Run `mvn test -Dtest=AppointmentResponseMapperTest` (backend) and confirm the
      4 new cases fail to compile/run (method `toDTOs` does not exist yet). This is the
      expected RED state — do not proceed to Task 2 without observing it.

**Satisfies**: design.md Interfaces/Contracts (`toDTOs` signature), Testing Strategy
(`AppointmentResponseMapperTest` table). No spec requirement (no spec delta).
**Parallel/Sequential**: Sequential — must complete and fail before Task 2.

## 2. GREEN — implement `toDTOs` on the mapper

- [x] 2.1 In `backend/src/main/java/com/dh/dentalClinicMVC/dto/AppointmentResponseMapper.java`,
      add:
      ```java
      public static List<AppointmentDTO> toDTOs(List<Appointment> appointments) {
        List<AppointmentDTO> dtos = new ArrayList<>();
        for (Appointment appointment : appointments) {
          dtos.add(toDTO(appointment));
        }
        return dtos;
      }
      ```
      Add imports `java.util.ArrayList` and `java.util.List` if not already present.
      Do not presize the `ArrayList` (Decision 2 — un-presized is intentional; a `null`
      argument must keep throwing `NullPointerException` exactly as today).
- [x] 2.2 Run `mvn test -Dtest=AppointmentResponseMapperTest` (backend) and confirm all
      4 new cases plus all pre-existing cases in that file pass.
- [x] 2.3 Confirm `AppointmentServiceImpl.java` is untouched at this point (no call-site
      changes yet — that is Task 4).

**Satisfies**: design.md Decision 1 (explicit `for` loop into `new ArrayList<>()`,
not a stream collector), Decision 2 (un-presized), Interfaces/Contracts.
**Parallel/Sequential**: Sequential — depends on Task 1's RED state; blocks nothing
downstream except Task 5 (verify).

## 3. CHARACTERIZATION — baseline tests against current (pre-refactor) service code

- [x] 3.1 Create `backend/src/test/java/com/dh/dentalClinicMVC/service/impl/AppointmentServiceImplTest.java`
      (new file — package `com.dh.dentalClinicMVC.service.impl`, matching Decision 3;
      do not use the proposal's originally-cited `service/` package).
- [x] 3.2 Wire test setup per Decision 4: `@ExtendWith(MockitoExtension.class)`,
      `@Mock` fields for all 5 constructor collaborators (the 3 repositories plus
      `AppointmentSearchQuery` and `AppointmentScheduleValidator`), a `@BeforeEach`
      calling the real 5-arg constructor, no `@InjectMocks`, no Spring context, no
      `null` passed for the two unused collaborators. Add a private `Appointment`
      fixture helper as needed. Remember `MockitoExtension` is strict-stubs — each
      test method stubs only the repository its branch reaches.
- [x] 3.3 Add the 8 test methods against the **current, still loop-based**
      `AppointmentServiceImpl`:
  - `findAll_returnsDTOsInRepositoryOrder`
  - `findAll_returnsEmptyListWhenNoAppointments`
  - `findAll_returnsMutableList`
  - `findAllForCurrentUser_returnsAllAppointmentsForAdmin`
    (+ `verifyNoInteractions(patientRepository, dentistRepository)`)
  - `findAllForCurrentUser_returnsOnlyPatientAppointmentsForPatient`
  - `findAllForCurrentUser_returnsOnlyDentistAppointmentsForDentist`
  - `findAllForCurrentUser_throwsStalePrincipalExceptionWhenPatientRowMissing`
  - `findAllForCurrentUser_throwsStalePrincipalExceptionWhenDentistRowMissing`
- [x] 3.4 Run `mvn test -Dtest=AppointmentServiceImplTest` (backend) and confirm all
      8 cases pass **immediately**, unmodified, against current production code. A
      failure here means the baseline test was written incorrectly, not that
      production code is missing — fix the test, not the (still untouched) service.
      Do not proceed to Task 4 until this is green.

**Satisfies**: design.md Decision 3, Decision 4, Testing Strategy
(`AppointmentServiceImplTest` table), Implementation Order step 3 (safety net for
step 4). No spec requirement (no spec delta) — this is a regression net, not new
observable behavior.
**Parallel/Sequential**: Sequential — hard gate before Task 4. Must be green before
any refactor edit lands.

## 4. REFACTOR — replace duplicated loops with `toDTOs(...)`

- [x] 4.1 In `backend/src/main/java/com/dh/dentalClinicMVC/service/impl/AppointmentServiceImpl.java`,
      replace the loop in `findAll()` (current L201-207) with:
      `return AppointmentResponseMapper.toDTOs(appointments);`
- [x] 4.2 Replace the loop in `findAllForCurrentUser()` (current L227-231) with the
      same one-line delegation. Leave the role dispatch block (current L212-225)
      completely untouched.
- [x] 4.3 Remove the now-unused `import java.util.ArrayList;` (current L19) from
      `AppointmentServiceImpl.java`. Confirm no other usage of `ArrayList` remains in
      the file before removing the import.
- [x] 4.4 Re-run Task 1's 4 mapper tests and Task 3's 8 service tests **without editing
      any of them**. All 12 must stay green. Any required test edit is a stop condition
      — it means the change is not a pure refactor and must be flagged, not patched
      silently.

**Satisfies**: design.md Interfaces/Contracts (call-site BEFORE/AFTER), File Changes
table (`AppointmentServiceImpl.java` — modify). No spec requirement (no spec delta —
observable behavior is explicitly preserved, not changed).
**Parallel/Sequential**: Sequential — depends on Task 3 green; must not start earlier.

## 5. VERIFY — full suite and build cleanliness

- [x] 5.1 Run the full backend suite: `mvn test` (backend root). Confirm no regressions
      outside the two touched files/their tests (e.g. `AppointmentControllerTest`
      MockMvc coverage, which remains the HTTP-layer regression net and is not
      modified by this change).
- [x] 5.2 Confirm formatter/build clean (no unused-import warnings, no compiler
      warnings introduced).
- [x] 5.3 Diff review: confirm the total changed-lines footprint matches the design
      forecast (~+25/-15 authored production lines, ~150 test lines) and stays a
      single PR under the 400-line review budget (see Review Workload Forecast below).

**Satisfies**: design.md Implementation Order step 5, Migration/Rollout (single PR,
under budget). No spec requirement (no spec delta).
**Parallel/Sequential**: Sequential — final gate, depends on Task 4.

## Explicitly out of scope

- No task implements D2 (null/unrecognized-`Role` hardening → 401). This is
  deferred to a future change's own spec delta, per `proposal.md` and `spec.md`'s
  "No Spec Delta" determination. Do not add defensive `Role` branches, `default`
  cases, or exception handling for unrecognized roles as part of this change.

## Review Workload Forecast

- Estimated diff: ~+25/-15 authored production lines (mapper method + 2 call-site
  replacements + 1 import removal) plus ~150 test lines (4 mapper cases + new
  8-case service test file with Mockito setup).
- Total estimated changed lines: ~190, against the cached `review_budget_lines: 400`.
- Budget risk: **Low**. Estimated total is under 50% of budget with no chained work
  implied by the design (no migration, no follow-up phases referenced).
- Chained PRs: **not recommended** — single PR is sufficient and matches
  design.md's Migration/Rollout section.
- Decision needed before apply: **no** — this forecast does not require invoking
  the `ask-on-risk` fallback; the cached delivery_strategy can proceed with a
  single-PR, no-extra-approval path unless the orchestrator's own review workload
  guard determines otherwise from repository-wide state this phase does not have
  visibility into.
