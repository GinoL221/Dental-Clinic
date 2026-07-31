# Apply Progress: Enrich Dashboard Filters and Breakdowns — PR 1

Scope: Phase 1 (Slice 1 — Backend Aggregation), tasks 1.1–1.7 only.
Branch: `feat/dashboard-aggregation` (checked out from up-to-date `main`).

## Phase 1: Slice 1 — Backend Aggregation

### 1.1 RED

Created `backend/src/test/java/com/dh/dentalClinicMVC/service/impl/DashboardServiceImplTest.java`
(new file — no prior test existed for `DashboardServiceImpl`), with `@ExtendWith(MockitoExtension.class)`
mocking `IAppointmentRepository`/`IDentistRepository`/`IPatientRepository`, following the
`JwtAuthenticationFilterTest` Mockito idiom already used in the codebase. 7 tests written up front,
covering every scenario in `specs/dashboard-breakdowns/spec.md`:

- `shouldZeroFillMissingStatusesInEnumOrderWhenOnlyOneStatusHasActivity`
- `shouldReturnAllFourStatusesAtZeroWhenNoAppointmentsMatch`
- `shouldReturnAllActiveDentistsWhenEightHaveActivityAndNoOverflowOccurs`
- `shouldCapAtTop10AndAggregateOverflowIntoOtrosWhen14DentistsAreActive` (includes the
  `sum(dentistBreakdown) == totalAppointments` invariant assertion)
- `shouldBreakTiedCountsByNameAscending`
- `shouldReturnEmptyDentistBreakdownWhenNoAppointmentsMatch`
- `shouldPreserveCurrentMonthlyDefaultOutputAndCallOrder` (task 1.4's characterization test, bundled
  in the same file/compile unit)

Command: `mvn -Dtest=DashboardServiceImplTest test`

```
[ERROR] .../DashboardServiceImplTest.java:[43,31] cannot find symbol
  symbol:   method countGroupedByStatus(<nulltype>,<nulltype>,<nulltype>)
  location: variable appointmentRepository of type com.dh.dentalClinicMVC.repository.IAppointmentRepository
[ERROR] .../DashboardServiceImplTest.java:[46,30] cannot find symbol
  symbol:   class StatusCountDTO
  location: class com.dh.dentalClinicMVC.dto.DashboardSnapshotDTO
[ERROR] .../DashboardServiceImplTest.java:[46,63] cannot find symbol
  symbol:   method getAppointmentsByStatus()
  location: variable service of type com.dh.dentalClinicMVC.service.impl.DashboardServiceImpl
... (19 errors total: countGroupedByStatus/countGroupedByDentist, StatusCountDTO/DentistCountDTO,
     getAppointmentsByStatus()/getAppointmentsByDentist() — none exist yet)
[INFO] 19 errors
[INFO] BUILD FAILURE
```

Genuine RED: every failure references production symbols (repository query methods, DTO nested
classes, service methods) that did not exist yet — a compile failure guarantees the test cannot
pass by accident.

### 1.2 GREEN — repository queries

Added to `backend/.../repository/IAppointmentRepository.java`, matching the existing
`searchAppointmentsByDentistId`-style nullable-param idiom (`(:x IS NULL OR ...)`):

```java
@Query("SELECT a.status, COUNT(a) FROM Appointment a "
    + "WHERE (:fromDate IS NULL OR a.date >= :fromDate) "
    + "AND (:toDate IS NULL OR a.date <= :toDate) "
    + "AND (:dentistId IS NULL OR a.dentist.id = :dentistId) "
    + "GROUP BY a.status")
List<Object[]> countGroupedByStatus(LocalDate fromDate, LocalDate toDate, Long dentistId);

@Query("SELECT a.dentist.id, CONCAT(d.firstName, ' ', d.lastName), COUNT(a) FROM Appointment a "
    + "JOIN a.dentist d "
    + "WHERE (:fromDate IS NULL OR a.date >= :fromDate) "
    + "AND (:toDate IS NULL OR a.date <= :toDate) "
    + "AND (:dentistId IS NULL OR a.dentist.id = :dentistId) "
    + "GROUP BY a.dentist.id, d.firstName, d.lastName")
List<Object[]> countGroupedByDentist(LocalDate fromDate, LocalDate toDate, Long dentistId);
```

**Implementation decision (not fixed by design.md)**: both queries accept the full nullable
`(fromDate, toDate, dentistId)` filter triple *now*, even though slice 1's callers always pass
`(null, null, null)` — the endpoint stays completely param-less this slice. This means slice 2 can
wire real filter values through these two queries without touching this file again; only
`countFiltered` and the filtered `findUpcomingAppointments*` variants remain slice 2's job, per
design.md's File Changes table. No `ORDER BY` was added — sort/cap/tiebreak logic lives entirely in
the service (1.3), which is what the mocked-repository test in 1.1 actually exercises.

### 1.3 GREEN — service aggregation logic

`IDashboardService.java`: added `getAppointmentsByStatus()` → `List<DashboardSnapshotDTO.StatusCountDTO>`
and `getAppointmentsByDentist()` → `List<DashboardSnapshotDTO.DentistCountDTO>` (zero-arg, matching
the existing `getAppointmentsByMonth()`/`getUpcomingAppointments()` convention — filter-triple
overloads are explicitly slice 2's job per tasks.md 2.6).

`DashboardServiceImpl.java`:
- `getAppointmentsByStatus()`: seeds a `LinkedHashMap<AppointmentStatus, Long>` from
  `AppointmentStatus.values()` at `0L` (enum declaration order: `SCHEDULED, IN_PROGRESS, COMPLETED,
  CANCELLED`), then overlays repository rows.
- `getAppointmentsByDentist()`: maps raw rows to `DentistCountDTO`, sorts by
  `Comparator.comparing(count, reverseOrder()).thenComparing(dentistName)`, caps at
  `DENTIST_BREAKDOWN_TOP_N = 10`, and appends one `{dentistId: null, dentistName: "Otros", count:
  <sum of overflow>}` entry when more than 10 dentists are active.

Command: `mvn -Dtest=DashboardServiceImplTest test`

```
[INFO] Running com.dh.dentalClinicMVC.service.impl.DashboardServiceImplTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.345 s
[INFO] BUILD SUCCESS
```

### 1.4 SAFETY NET — characterization test

`shouldPreserveCurrentMonthlyDefaultOutputAndCallOrder` computes the same `months`/
`appointmentCounts`/`(firstDay,lastDay)` values `getAppointmentsByMonth()`'s current loop produces
(mirroring `for (i = 5; i >= 0; i--)` against `LocalDate.now()`), stubs `countByDateBetween` for each
exact date-range pair, then asserts both the returned lists **and** the exact call order via
`Mockito.inOrder(appointmentRepository)`. **No production code for `getAppointmentsByMonth()` was
touched** — this test passed on its very first execution once the file compiled (see 1.3's GREEN run
above, which included this test in the same 7/7 pass), proving it pins today's behavior rather than
describing new behavior. This is the byte-equivalence guard slice 2's range-resolver refactor must
not break.

### 1.5 GREEN — DTO additions

`DashboardSnapshotDTO.java`: added `statusBreakdown: List<StatusCountDTO>` and
`dentistBreakdown: List<DentistCountDTO>` fields with explicit getters/setters (matching the file's
existing `@Data` + explicit-accessor convention), plus nested `StatusCountDTO {status, count}` and
`DentistCountDTO {dentistId, dentistName, count}` classes (same convention: `@Data` +
`@NoArgsConstructor` + `@AllArgsConstructor` + explicit getters/setters, mirroring the existing
`UpcomingAppointmentDTO`). `withDefaults()` seeds both as empty `ArrayList<>()`.

### 1.6 GREEN — wiring into DashboardSnapshotService

Extended `backend/src/test/java/com/dh/dentalClinicMVC/service/DashboardSnapshotServiceTest.java`'s
`FakeDashboardService` to implement the two new interface methods (required for the file to compile
once `IDashboardService` gained new abstract methods), with a `failBreakdownSections` toggle
alongside the existing `failMonthlySection` toggle. Added two new tests:

- `shouldWireStatusAndDentistBreakdownsIntoSnapshot` — asserts the snapshot's
  `statusBreakdown`/`dentistBreakdown` reflect exactly what the fake service returns.
- `shouldKeepEmptyBreakdownDefaultsWhenBreakdownSectionsFail` — asserts a thrown `RuntimeException`
  in either breakdown section leaves `withDefaults()`'s empty lists in place, not a partially
  populated result.

RED run (wiring not yet implemented in production, `DashboardServiceImplTest` unaffected):

```
[INFO] Running com.dh.dentalClinicMVC.service.impl.DashboardServiceImplTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.345 s
[INFO] Running com.dh.dentalClinicMVC.service.DashboardSnapshotServiceTest
[ERROR] Tests run: 4, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 0.027 s <<< FAILURE!
[ERROR] DashboardSnapshotServiceTest.shouldWireStatusAndDentistBreakdownsIntoSnapshot -- Time elapsed: 0.012 s <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: <4> but was: <0>
	at ...DashboardSnapshotServiceTest.shouldWireStatusAndDentistBreakdownsIntoSnapshot(DashboardSnapshotServiceTest.java:51)
[INFO] Tests run: 11, Failures: 1, Errors: 0, Skipped: 0
[INFO] BUILD FAILURE
```

Genuine RED: `snapshot.getStatusBreakdown()` was still `withDefaults()`'s empty list (nothing wired
it yet), so `assertEquals(4, ...)` failed against an actual `0`.

Implemented `DashboardSnapshotService.java` (the actual impl class — tasks.md's "impl" for
`IDashboardSnapshotService`; `IDashboardSnapshotService.java` itself needed no change since its
`getDashboardSnapshot()` signature is unchanged in this slice): added `applyStatusSection(snapshot)`
and `applyDentistSection(snapshot)`, each calling the corresponding `dashboardService` method inside
a `try { ... } catch (RuntimeException ignored) { /* Keep safe defaults for this section */ }` block
— the exact idiom already used by `applyStatsSection`/`applyMonthlySection`/`applyUpcomingSection`.
Both are invoked from `getDashboardSnapshot()` after the existing three sections.

### 1.7 REFACTOR/VERIFY

Command: `mvn -Dtest=DashboardServiceImplTest,DashboardSnapshotServiceTest test`

```
[INFO] Running com.dh.dentalClinicMVC.service.impl.DashboardServiceImplTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.208 s
[INFO] Running com.dh.dentalClinicMVC.service.DashboardSnapshotServiceTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.009 s
[INFO] Tests run: 11, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

Full backend suite (broader safety net, not just the two target files):

```
mvn test
...
[INFO] Tests run: 179, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

`git diff` confirms zero changes to `DashboardController.java` (0 lines in the diff — the endpoint
remains exactly `getDashboardSnapshot()` with no `@RequestParam`s) and `@Cacheable(value =
"dashboardSnapshot", unless = "#result == null")` in `DashboardSnapshotService.java` is byte-identical
to before this PR (no `key`/`condition` added — that is explicitly PR 2's job).

## Changed files (`git diff --numstat` / new-file line counts)

| File | Action | Additions | Deletions | Changed lines |
|---|---|---|---|---|
| `backend/.../dto/DashboardSnapshotDTO.java` | Modified | 77 | 0 | 77 |
| `backend/.../repository/IAppointmentRepository.java` | Modified | 29 | 0 | 29 |
| `backend/.../service/IDashboardService.java` | Modified | 20 | 0 | 20 |
| `backend/.../service/impl/DashboardServiceImpl.java` | Modified | 58 | 0 | 58 |
| `backend/.../service/impl/DashboardSnapshotService.java` | Modified | 18 | 0 | 18 |
| `backend/.../service/DashboardSnapshotServiceTest.java` | Modified | 54 | 3 | 57 |
| `backend/.../service/impl/DashboardServiceImplTest.java` | Created | 174 | 0 | 174 |
| **Total** | | | | **433** |

**433 changed lines — 33 over the 400-line review budget**, and above the ~280–350 forecast in
tasks.md's Review Workload Forecast. Per the task instructions, the maintainer has pre-agreed to
accept honest overruns case-by-case rather than force an artificial split; flagging it here rather
than under-reporting. The overrun is concentrated in the two test files (231 of 433 lines): 7
`DashboardServiceImplTest` scenarios plus the characterization test, and the `FakeDashboardService`
extension plus 2 new `DashboardSnapshotServiceTest` cases. No production file individually exceeds 77
lines; the aggregation logic itself (`DashboardServiceImpl`, 58 lines for both methods combined) is
close to the original per-method estimate.

## Constraints honored

- `DashboardController.java` — zero diff. Endpoint remains `GET /dashboard/snapshot`, param-less.
- `@Cacheable` on `DashboardSnapshotService.getDashboardSnapshot()` — byte-identical, no `key`/
  `condition` added (PR 2 scope).
- No frontend file touched.
- `getDashboardSnapshot()` signature unchanged (no request params added); PR 2 adds the filter-triple
  overload per design.md's `default` delegation pattern.
- `IDashboardSnapshotService.java` (the interface file) left untouched — no signature change needed
  for this slice.

## Status

Phase 1 (tasks 1.1–1.7): 7/7 complete. Ready for `sdd-verify` on this slice, or for PR 2 (Slice 2 —
Backend Filtering + Cache) to begin on a new branch stacked on this one.
