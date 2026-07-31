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

# PR 2: Slice 2 — Backend Filtering + Cache

Scope: Phase 2, tasks 2.1–2.10 only. Branch: `feat/dashboard-filtering-cache` (checked out from
up-to-date `main`, stacked after PR 1's merge per `stacked-to-main`).

**Load-bearing verification performed before writing any code**: ran `mvn help:effective-pom` and
confirmed the final (non-`pluginManagement`) `maven-compiler-plugin` block inherited from
`spring-boot-starter-parent:3.2.1` includes both `<release>21</release>` **and**
`<parameters>true</parameters>` — the `-parameters` flag genuinely reaches javac for this module,
even though `backend/pom.xml` only declares `<release>21</release>` explicitly. This confirms named
SpEL (`#from`, `#to`, `#dentistId`) in the `@Cacheable` condition would resolve correctly; the
positional (`#p0`/`#p1`/`#p2`) fallback documented in design.md was not needed.

## Phase 2: Slice 2 — Backend Filtering + Cache

### 2.1 RED — `DashboardControllerTest`

Rewrote the file to inject `@MockBean IDashboardSnapshotService` (previously the test hit the real
bean with no params) so controller-level param binding/forwarding can be verified in isolation, and
added two new tests:

- `shouldReturn400WhenFromIsAfterTo` — asserts `400` and `verifyNoInteractions(dashboardSnapshotService)`.
- `shouldBindAndForwardFromToAndDentistIdParamsToTheService` — asserts `200` and
  `verify(dashboardSnapshotService).getDashboardSnapshot(LocalDate.of(2026,1,1), LocalDate.of(2026,6,1), 7L)`.

### 2.2 RED — `DashboardSnapshotServiceTest`

Added two new tests that construct the **real** `DashboardServiceImpl` with mocked repositories
(not the file's existing `FakeDashboardService`, which only proves DTO-wiring, not the
globality/zeroing invariant itself — that invariant lives in `DashboardServiceImpl`):

- `shouldKeepTotalDentistsAndTotalPatientsGlobalWhenDentistIdFilterIsActive` — stubs
  `dentistRepository.count()`/`patientRepository.count()`/`appointmentRepository.countFiltered(null,null,7L)`,
  asserts `totalDentists`/`totalPatients` equal the unfiltered repository counts while
  `totalAppointments` reflects the dentist-scoped count.
- `shouldZeroTodayAppointmentsWhenTodayFallsOutsideTheActiveDateRange` — uses a `[from,to]` window
  entirely in the past, asserts `todayAppointments == 0` and
  `verify(appointmentRepository, never()).countFiltered(eq(today), eq(today), any())` (proving the
  zero is a short-circuit, not a lucky zero from an actual query).

Also updated the existing `FakeDashboardService` to implement the new 3-arg abstract interface
methods (required to compile once `IDashboardService` gained filter-triple abstract methods) — the
4 pre-existing tests in this file were left calling the zero-arg `getDashboardSnapshot()` unchanged.

### 2.3 RED — `DashboardSnapshotCacheBehaviourTest` (new file)

Created as a `@SpringBootTest` (not a plain unit test) with `@MockBean IDashboardService` — a full
Spring context is required because only the real caching AOP proxy can prove the `@Cacheable`
`condition` SpEL actually gates the cache; calling the class directly would bypass the proxy and
prove nothing.

- `shouldCacheTheDefaultUnparameterizedRequest` — 2 calls with `(null,null,null)`, asserts
  `verify(dashboardService, times(1)).getDashboardStatistics(null,null,null)`.
- `shouldNeverCacheAFilteredRequestRegardlessOfWhichParamIsSet` — 2 calls with an active
  `from`/`to`/`dentistId=7L`, asserts `verify(dashboardService, times(2)).getDashboardStatistics(from,to,7L)`.

### Genuine RED — compile failure (2.1/2.2/2.3 together)

Command: `mvn -Dtest=DashboardControllerTest,DashboardSnapshotServiceTest,DashboardSnapshotCacheBehaviourTest test`
(spotless-check failed first on raw formatting — ran `mvn spotless:apply`, then re-ran):

```
[ERROR] .../DashboardSnapshotServiceTest.java:[96,31] cannot find symbol
  symbol:   method countFiltered(<nulltype>,<nulltype>,long)
  location: variable appointmentRepository of type com.dh.dentalClinicMVC.repository.IAppointmentRepository
[ERROR] .../DashboardSnapshotServiceTest.java:[102,52] method getDashboardSnapshot in class
  com.dh.dentalClinicMVC.service.impl.DashboardSnapshotService cannot be applied to given types;
  required: no arguments
  found:    <nulltype>,<nulltype>,long
[ERROR] .../DashboardSnapshotServiceTest.java:[129,18] FakeDashboardService is not abstract and does
  not override abstract method getAppointmentsByDentist() in IDashboardService
[ERROR] .../DashboardControllerTest.java:[34,34] method getDashboardSnapshot in interface
  IDashboardSnapshotService cannot be applied to given types; found: Object,Object,Object
[ERROR] .../DashboardSnapshotCacheBehaviourTest.java:[38,29] method getDashboardSnapshot in
  interface IDashboardSnapshotService cannot be applied to given types; found: <nulltype> x3
... (30 errors total across the 3 files: countFiltered, 3-arg getDashboardSnapshot,
    3-arg getDashboardStatistics/getAppointmentsByMonth/getUpcomingAppointments/
    getAppointmentsByStatus/getAppointmentsByDentist — none exist yet)
[INFO] BUILD FAILURE
```

Genuine RED: every failure references production symbols (repository/service 3-arg overloads) that
did not exist yet — compile failure guarantees no accidental pass.

### 2.4 GREEN — `AppointmentServiceCacheAnnotationsTest`

Extended the existing reflection-based single test into 4, one per mutation method
(`updateStatus`/`save`/`update`/`delete`), all delegating to a shared
`assertEvictsDashboardSnapshotCache(Method)` helper. No production change required — the
`@CacheEvict(cacheNames = "dashboardSnapshot", allEntries = true)` annotations were already present
on all four methods in `AppointmentServiceImpl.java` (confirmed via direct read, lines 46/105/203/217
before this slice) — this closes test coverage only.

### 2.5 GREEN — `IAppointmentRepository.java`

Added two query methods reusing the nullable-param idiom already established by
`countGroupedByStatus`/`countGroupedByDentist` (PR 1):

```java
@Query("SELECT COUNT(a) FROM Appointment a "
    + "WHERE (:fromDate IS NULL OR a.date >= :fromDate) "
    + "AND (:toDate IS NULL OR a.date <= :toDate) "
    + "AND (:dentistId IS NULL OR a.dentist.id = :dentistId)")
long countFiltered(LocalDate fromDate, LocalDate toDate, Long dentistId);

@Query("SELECT a.id, a.time, CONCAT(p.firstName,' ',p.lastName), CONCAT(d.firstName,' ',d.lastName), a.date, a.status "
    + "FROM Appointment a JOIN a.patient p JOIN a.dentist d "
    + "WHERE a.date >= :fromDate "
    + "AND (:toDate IS NULL OR a.date <= :toDate) "
    + "AND (:dentistId IS NULL OR a.dentist.id = :dentistId) "
    + "ORDER BY a.date ASC, a.time ASC")
List<Object[]> findUpcomingAppointmentsFiltered(LocalDate fromDate, LocalDate toDate, Long dentistId);
```

`fromDate` on the upcoming query is intentionally non-nullable (`a.date >= :fromDate` unconditional)
— the service always resolves it to `max(today, from)` before calling, so it is never actually null
at the call site. The original `findUpcomingAppointmentsWithDetails` method was left in place,
unused, to keep this diff purely additive (smaller review footprint, no behavior risk from removing
a method nothing else references).

### 2.6 GREEN — `IDashboardService.java`

Added a 3-arg (`LocalDate from, LocalDate to, Long dentistId`) abstract overload for **all five**
methods that need to narrow under the active filter (`getDashboardStatistics`,
`getAppointmentsByMonth`, `getUpcomingAppointments`, `getAppointmentsByStatus`,
`getAppointmentsByDentist`) — not just monthly stats. Design's per-DTO-field semantics table
requires `totalAppointments`/`todayAppointments`/`upcomingAppointments`/`statusBreakdown`/
`dentistBreakdown` to all narrow, which is only possible if every one of the methods that produces
those DTO sections accepts the filter triple; scoping the overload to monthly alone would have left
the other four DTO sections unfilterable. Each original zero-arg method became a `default` method
delegating to `(null, null, null)`, preserving every existing zero-arg call site (both production —
none remained after 2.7/2.8 rewire `DashboardSnapshotService` — and test, e.g.
`DashboardServiceImplTest`'s 7 tests all call the zero-arg entry points verbatim).

### 2.7 GREEN — `DashboardServiceImpl.java`

- **Range resolver** (`resolveMonthlyRange`): `from`-only → `[from, today]`; `to`-only →
  `[to.minusMonths(5), to]`; both → `[from, to]`; neither → `[today.minusMonths(5), today]`
  (byte-equivalent to the original 6-iteration loop's implicit range).
- **Month-bucket walk** (`buildMonthBuckets`): steps first-of-month from the resolved start to the
  resolved end inclusive, then clamps to the trailing `MAX_MONTH_BUCKETS = 24` buckets (applied
  uniformly, not only on the "both" case — a no-op for the 6-bucket default, but protective for a
  decade-wide `from`-only or `to`-only request per design's stated rationale).
- **Byte-equivalence-critical detail**: when `dentistId == null`, the per-bucket count still calls
  the literal pre-existing `appointmentRepository.countByDateBetween(firstDay, lastDay)` — the same
  method, same 2 args, same call order as before. Only when `dentistId != null` does it switch to
  `countFiltered(firstDay, lastDay, dentistId)`. This was a deliberate, non-obvious choice: PR 1's
  characterization test stubs `countByDateBetween` via Mockito and asserts exact call order via
  `InOrder` — if the null-filter path called a *different* repository method (even one that is
  logically equivalent for null args), the stub would never be hit and the test would silently
  fail against unstubbed `0L` returns. Verified this holds (see 2.10).
- **`getDashboardStatistics`**: `totalAppointments` = `countFiltered(from, to, dentistId)`;
  `totalDentists`/`totalPatients` = unconditional `dentistRepository.count()`/
  `patientRepository.count()` (global, per design's per-DTO-field table); `todayAppointments` is a
  short-circuit `0L` when `today` is outside `[from, to]` (checked before querying, not derived from
  a query that happens to return 0), else `countFiltered(today, today, dentistId)`.
- **`getUpcomingAppointments`**: effective lower bound `max(today, from)`, passed with `to`/
  `dentistId` to `findUpcomingAppointmentsFiltered`.
- **`getAppointmentsByStatus`/`getAppointmentsByDentist`**: unchanged zero-fill/top-10/"Otros"
  logic, now threading `(from, to, dentistId)` into the already-filter-capable PR 1 repository
  queries instead of hardcoded `(null, null, null)`.

### 2.8 GREEN — `IDashboardSnapshotService.java` + impl

Interface: `getDashboardSnapshot(LocalDate from, LocalDate to, Long dentistId)` (abstract) +
zero-arg `default` delegating to `(null, null, null)`.

Impl (`DashboardSnapshotService.java`): the exact annotation from design.md, verbatim —

```java
@Cacheable(
    value = "dashboardSnapshot",
    key = "'default'",
    condition = "#from == null && #to == null && #dentistId == null",
    unless = "#result == null")
public DashboardSnapshotDTO getDashboardSnapshot(LocalDate from, LocalDate to, Long dentistId)
```

All five `apply*Section` private methods gained `(from, to, dentistId)` parameters and now forward
them into the corresponding `dashboardService` call, replacing the previous zero-arg calls. The
`try { ... } catch (RuntimeException ignored)` per-section resilience idiom is untouched.

### 2.9 GREEN — `DashboardController.java`

```java
@GetMapping("/snapshot")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<DashboardSnapshotDTO> getDashboardSnapshot(
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
    @RequestParam(required = false) Long dentistId) {
  if (from != null && to != null && from.isAfter(to)) {
    return ResponseEntity.badRequest().build();
  }
  DashboardSnapshotDTO snapshot = dashboardSnapshotService.getDashboardSnapshot(from, to, dentistId);
  return ResponseEntity.ok(snapshot);
}
```

`@PreAuthorize("hasRole('ADMIN')")` is byte-identical to before this slice — confirmed both by
direct diff inspection (only the guard clause and method parameters were added/changed) and by
2.1's own `shouldReturn400WhenFromIsAfterTo`/forwarding tests passing under the real security
filter chain (`DashboardControllerTest` no longer disables `@PreAuthorize`, only MockMvc's servlet
filters via `addFilters = false`, and stays `@WithMockUser(roles = "ADMIN")`).

### 2.10 REFACTOR/VERIFY

Command: `mvn -Dtest=DashboardControllerTest,DashboardSnapshotServiceTest,DashboardSnapshotCacheBehaviourTest,AppointmentServiceCacheAnnotationsTest,DashboardServiceImplTest test`

```
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 9.774 s -- in com.dh.dentalClinicMVC.controller.DashboardControllerTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.394 s -- in com.dh.dentalClinicMVC.service.impl.DashboardServiceImplTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.016 s -- in com.dh.dentalClinicMVC.service.DashboardSnapshotServiceTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.623 s -- in com.dh.dentalClinicMVC.service.DashboardSnapshotCacheBehaviourTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.004 s -- in com.dh.dentalClinicMVC.service.AppointmentServiceCacheAnnotationsTest
[INFO] Tests run: 22, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

**PR 1 characterization test — explicit, not assumed, confirmation of byte-equivalence**:
`DashboardServiceImplTest.java` has **zero diff** this slice (`git diff --stat` on the file returns
nothing — confirmed via `git status --porcelain`, empty output). Its surefire report
(`target/surefire-reports/TEST-....DashboardServiceImplTest.xml`) shows:

```xml
<testcase name="shouldPreserveCurrentMonthlyDefaultOutputAndCallOrder"
          classname="com.dh.dentalClinicMVC.service.impl.DashboardServiceImplTest" time="0.017"/>
```

— a self-closing `<testcase/>` element with no nested `<failure>`/`<error>`, i.e. a clean pass,
against the unmodified test file, proving `getAppointmentsByMonth()`'s default (`null,null,null`)
output and exact `countByDateBetween` call order survived the range-resolver refactor byte-for-byte.

**Full backend suite** (broader safety net, not just the targeted files):

```
mvn test
...
[INFO] Tests run: 188, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

188 = PR 1's 179 + 9 new tests this slice (2 `DashboardControllerTest` + 2
`DashboardSnapshotServiceTest` + 2 `DashboardSnapshotCacheBehaviourTest` + 3
`AppointmentServiceCacheAnnotationsTest`).

## Changed files (`git diff --cached --numstat`)

| File | Action | Additions | Deletions | Changed lines |
|---|---|---|---|---|
| `backend/.../controller/DashboardController.java` | Modified | 13 | 2 | 15 |
| `backend/.../repository/IAppointmentRepository.java` | Modified | 28 | 0 | 28 |
| `backend/.../service/IDashboardService.java` | Modified | 76 | 14 | 90 |
| `backend/.../service/IDashboardSnapshotService.java` | Modified | 6 | 1 | 7 |
| `backend/.../service/impl/DashboardServiceImpl.java` | Modified | 75 | 28 | 103 |
| `backend/.../service/impl/DashboardSnapshotService.java` | Modified | 29 | 17 | 46 |
| `backend/.../controller/DashboardControllerTest.java` | Modified | 40 | 0 | 40 |
| `backend/.../service/AppointmentServiceCacheAnnotationsTest.java` | Modified | 26 | 4 | 30 |
| `backend/.../service/DashboardSnapshotCacheBehaviourTest.java` | Created | 70 | 0 | 70 |
| `backend/.../service/DashboardSnapshotServiceTest.java` | Modified | 68 | 5 | 73 |
| **Total** | | | | **502** |

**502 changed lines — above the ~380–480 forecast in tasks.md's Review Workload Forecast**, similar
in kind to PR 1's honest overrun (433 vs. 280–350). Per the task instructions, the maintainer has
pre-agreed to accept honest overruns case-by-case rather than force an artificial split; flagging it
here rather than under-reporting. Concentration: `IDashboardService.java` (90) and
`DashboardServiceImpl.java` (103) together account for ~38% of the diff, driven by adding a genuine
3-arg overload (with full Javadoc) for every one of the five methods that needed to narrow under
filter, plus the range-resolver/bucket-walk helpers — this breadth was a deliberate deviation from a
literal reading of task 2.6 (which names only "the monthly-stats method"), justified by design.md's
per-DTO-field semantics table requiring `totalAppointments`/`todayAppointments`/
`upcomingAppointments`/`statusBreakdown`/`dentistBreakdown` to all narrow (see 2.6 above and
Deviations below).

## Constraints honored

- No frontend file touched (`git status --porcelain -- frontend/` — empty).
- `backend/pom.xml` untouched (`git diff --cached --stat -- backend/pom.xml` — empty); the
  `-parameters` flag was already present via inheritance, verified via `mvn help:effective-pom`
  rather than assumed.
- `@PreAuthorize("hasRole('ADMIN')")` unchanged on `DashboardController.getDashboardSnapshot()`.
- Full `mvn test` run (not just targeted tests) — 188/188 green.

## Deviations from design.md

- **2.6/File Changes table say "overloads" for `IDashboardService`; task 2.6's prose singles out
  only `getAppointmentsByMonth()`.** Implemented 3-arg overloads for all five DTO-producing methods
  (`getDashboardStatistics`, `getAppointmentsByMonth`, `getUpcomingAppointments`,
  `getAppointmentsByStatus`, `getAppointmentsByDentist`), because design.md's "Per-DTO-field filter
  semantics" table is unambiguous that `totalAppointments`/`todayAppointments`/
  `upcomingAppointments`/`statusBreakdown`/`dentistBreakdown` all narrow under the active filter —
  which is only achievable if every one of those methods accepts the filter triple. Narrower scoping
  (monthly only) would have left 4 of 5 DTO sections unfilterable, contradicting the spec's
  "Filter Reach Spans The Entire Snapshot" requirement. This is the largest single driver of the
  line-count overrun; flagged explicitly rather than silently expanding scope.
- **task 2.2 names `DashboardSnapshotServiceTest` as the test file for the globality/zeroing
  invariant**, but that invariant is implemented in `DashboardServiceImpl`, not in
  `DashboardSnapshotService` (which only extracts already-computed map fields). Resolved by adding
  the two new tests to `DashboardSnapshotServiceTest` as instructed, but wiring the **real**
  `DashboardServiceImpl` (with mocked repositories) through it rather than the file's
  `FakeDashboardService`, so the tests genuinely exercise the invariant end-to-end rather than only
  re-asserting a fake's canned return value.
- Everything else matches design.md exactly, including the verbatim `@Cacheable` annotation and the
  documented range-resolver/24-bucket-clamp semantics.

## Issues Found

None — the `-parameters` javac flag risk called out in design.md did not materialize; named SpEL
parameters worked on the first run of `DashboardSnapshotCacheBehaviourTest`, no fallback to
positional (`#p0`/`#p1`/`#p2`) SpEL was needed.

## Status

Phase 2 (tasks 2.1–2.10): 10/10 complete. Full `mvn test`: 188/188 green. Committed to
`feat/dashboard-filtering-cache` (commit `9d6a153`, not pushed — maintainer reviews the diff before
push/PR, per instructions). Ready for PR 3 (Slice 3 — Frontend Filter Controls) to begin on a new
branch stacked on this one once this PR merges, or for `sdd-verify` on this slice now.

# PR 3: Slice 3 — Frontend Filter Controls

Scope: Phase 3, tasks 3.1–3.10 only. Branch: `feat/dashboard-filter-controls` (checked out from
up-to-date `main`, stacked after PR 1+PR 2's merge per `stacked-to-main`). No backend file touched
(`git status --porcelain -- backend/` empty throughout).

## Phase 3: Slice 3 — Frontend Filter Controls

### 3.1 RED — `dashboardFilters.test.js`

Created `frontend/src/lib/validation/dashboardFilters.test.js` (new file), following the
`registerForm.test.js` convention (`describe`/`it`, plain Vitest, no framework imports). 8 tests
written up front: valid triple, all-empty defaults, inverted range, unparsable `from`, unparsable
`to`, `from`-only partial, `to`-only partial, non-numeric `dentistId`.

Command: `npx vitest run src/lib/validation/dashboardFilters.test.js`

```
 FAIL  src/lib/validation/dashboardFilters.test.js [ src/lib/validation/dashboardFilters.test.js ]
Error: Failed to resolve import "./dashboardFilters.js" from
"src/lib/validation/dashboardFilters.test.js". Does the file exist?
 Test Files  1 failed (1)
      Tests  no tests
```

Genuine RED: the module under test did not exist yet — an unresolved-import failure, not a
plausible-looking-but-wrong assertion.

### 3.2 GREEN — `dashboardFilters.js`

Implemented `parseDashboardFilters(searchParams)` matching design.md's exact typedefs
(`AppliedFilters`/`FilterParseResult`) verbatim: ISO-date regex + calendar-validity check (rejects
e.g. `2026-13-45` by round-tripping through `Date.UTC` and comparing components back), lexicographic
`from > to` comparison (valid since `YYYY-MM-DD` sorts the same lexically and chronologically), and a
numeric-only guard on `dentistId`. On any invalid input, `applied` is always
`{from:null,to:null,dentistId:null}` and `raw` echoes the exact typed strings (including `''` for
absent params) — this is what `+page.server.js` echoes back to the page for round-trip display.

Command: `npx vitest run src/lib/validation/dashboardFilters.test.js`

```
 ✓ src/lib/validation/dashboardFilters.test.js  (8 tests) 7ms
 Test Files  1 passed (1)
      Tests  8 passed (8)
```

### 3.3 RED — `dashboard.server.test.js`

Extended the existing file. Updated the pre-existing "should allow access if user is ADMIN" test's
mock (`apiFetch` now dispatches on endpoint since `load` calls it twice — snapshot and `/api/dentists`
— per PR 3's new parallel fetch) and its `toEqual` assertion to include the new `dentists`/`filters`
fields the loader now legitimately returns; the auth **behavior** itself (ADMIN success path) is
unchanged. The 303 (no user/no token) and 403 (non-ADMIN) tests were left **byte-for-byte untouched**
— both throw before `parseDashboardFilters`/`apiFetch` are ever reached, so nothing about their setup
or assertions needed to change. Added 3 new tests: forwards valid `from`/`to`/`dentistId` to the
snapshot fetch; falls back to an unfiltered fetch + echoes raw + `filterError` on an inverted range;
same fallback behavior for a non-numeric `dentistId`.

Command: `npx vitest run src/routes/dashboard/dashboard.server.test.js`

```
 FAIL  ... should allow access if user is ADMIN
  AssertionError: expected { user: {...}, snapshot: {...} } to deeply equal { user: {...}, snapshot:
  {...}, dentists: [...], filters: {...} }
 FAIL  ... should forward valid from/to/dentistId params to the snapshot fetch
  AssertionError: expected "spy" to be called with arguments: [ …(2) ]
  Received: ["/api/dashboard/snapshot", { headers: undefined }]
 FAIL  ... should fall back to an unfiltered fetch ... inverted
  AssertionError: expected undefined to deeply equal { from: '2026-06-01', to: '2026-01-01', dentistId: '' }
 FAIL  ... should fall back to an unfiltered fetch ... non-numeric dentistId
  AssertionError: expected undefined to deeply equal { from: '', to: '', dentistId: 'abc' }
 Test Files  1 failed (1)
      Tests  4 failed | 3 passed (7)
```

Genuine RED: the 3 untouched auth tests (two 303-redirect cases + one 403 case) stayed green
throughout, proving the auth boundary was never at risk; the 4 failures are exactly the new
filter-wiring behavior that does not exist yet in `+page.server.js`.

### 3.4 GREEN — `+page.server.js`

Added `parseDashboardFilters` import, an `EMPTY_SNAPSHOT` constant now also seeding
`statusBreakdown`/`dentistBreakdown` as empty (PR 1/2 DTO fields, previously missing from this
fallback), and a `buildSnapshotQuery(applied)` helper. `load({url, locals})`: parses filters once;
builds the snapshot query only when valid (falls back to the bare `/api/dashboard/snapshot` on
invalid input, per design's "defence in depth" — the SvelteKit layer never sends a known-bad range to
the backend); fetches the snapshot **and** `/api/dentists` via
`Promise.all([apiFetch(snapshotUrl, {headers}), apiFetch('/api/dentists', {headers}).catch(() => [])])`
— the dentists call has its own `.catch(() => [])` so a dentists-endpoint failure never disturbs the
existing snapshot-fetch-failure error path (`#error-message` banner), only a snapshot failure
propagates to the outer `try/catch`. Returns `filters` (applied on valid, raw echo on invalid) and
`filterError` (only present when invalid) alongside the pre-existing `user`/`snapshot`/`error` shape.

Command: `npx vitest run src/routes/dashboard/dashboard.server.test.js src/lib/validation/dashboardFilters.test.js`

```
 ✓ src/lib/validation/dashboardFilters.test.js  (8 tests) 7ms
 ✓ src/routes/dashboard/dashboard.server.test.js  (7 tests) 20ms
 Test Files  2 passed (2)
      Tests  15 passed (15)
```

### 3.5 GREEN — `+page.svelte`

Added reactive `dentists`/`filters`/`filterError` derivations from `data`. Inserted, between the
existing refresh/export controls and the stats cards: (1) a `#filter-error` `role="alert"` banner
(only rendered when `filterError` is set) — a **new, distinct** element from the pre-existing
`#error-message` banner, which is untouched; (2) a `<form method="GET" id="dashboard-filters">`
filter bar with `#filter-from`/`#filter-to` date inputs (values pre-filled from `filters.from`/`.to`
for round-trip display) and a `#filter-dentist` `<select>` populated from `dentists`, plus
`#apply-filters` submit button and a "Limpiar" link back to the bare `/dashboard`. All three controls
carry `aria-invalid`/`aria-describedby="filter-error"` wired to the presence of `filterError` (design's
"exact pattern established by register-page-redesign"). Native GET form submission is left
unenhanced — SvelteKit intercepts same-origin GET form submissions as client navigation, so this
naturally produces "filter round trip via URL" and works with browser back/forward for free, with no
custom JS.

### 3.6 GREEN — `dashboard.css`

Added a `.filter-bar`/`.filter-bar-field`/`.filter-bar-actions` block using `--color-primario` /
`--color-fondo-claro` from `base/tokens.css`, an `aria-invalid='true']` red-border rule, and a
`max-width: 767px` responsive stack — mirroring the existing mobile-polish media query already in
this file and the `auth.css` input-focus/is-invalid conventions (register-page-redesign precedent),
scoped to the dashboard's own Bootstrap-based markup rather than copying `.auth-input` itself.

### 3.7 GREEN — `dashboard.js` (POM)

Added `filterFromInput()`, `filterToInput()`, `filterDentistSelect()`, `applyFiltersButton()`,
`filterErrorBanner()`, `refreshButton()`, and an `applyDateRangeFilter({from, to})` convenience method
that fills the date inputs and awaits both the submit-button click and the resulting
`waitForURL(/\/dashboard\?/)` together — matching the file's existing `stats()`/`goto()` method-per-
concern convention.

### 3.8 RED — `dashboard.spec.js` (new file, real full-stack E2E)

Created `frontend/tests/fullstack/dashboard.spec.js` with 4 tests, all using the `adminPage` fixture
(reused session, per `booking.spec.js`'s precedent — `auth.spec.js` already proves login itself): (1)
filter round trip via URL narrows `totalAppointments` to `0` for a far-future no-match range and
survives a `page.reload()`; (2) back button restores the unfiltered `/dashboard` and empty inputs; (3)
Refrescar (`invalidateAll`) preserves the active filter's URL and input values; (4) `#filter-error`
becomes visible on an inverted range while `#stats-cards` keeps rendering. A `2099-01-01..2099-01-02`
far-future range was chosen deliberately so these assertions never depend on what `booking.spec.js`
or any other spec has seeded/booked in the shared backend.

**Genuine RED, proven by literally reverting the production code and re-running against the real
stack** (not merely "written before running once"): `git stash push` on
`+page.server.js`/`+page.svelte`/`dashboard.css` only (keeping the new test files in place), rebuilt
the frontend against the **pre-PR-3** dashboard page, started the real backend (`SPRING_PROFILES_ACTIVE=e2e`,
fresh `JWT_SECRET` via `openssl rand -base64 32`, `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`/
`E2E_NON_ADMIN_EMAIL`/`E2E_NON_ADMIN_PASSWORD` per `frontend/README.md`'s E2E full-stack section), and
ran `npx playwright test --config=playwright.fullstack.config.js dashboard.spec.js`:

```
✘  3 [fullstack-chromium] › dashboard.spec.js:12 › filter round trip via URL params ... (30.0s)
✘  4 [fullstack-chromium] › dashboard.spec.js:33 › back button restores the unfiltered dashboard (30.0s)
✘  5 [fullstack-chromium] › dashboard.spec.js:47 › Refrescar preserves the active filter (30.0s)
✘  6 [fullstack-chromium] › dashboard.spec.js:59 › #filter-error becomes visible ... (30.1s)

Error: locator.fill: Target page, context or browser has been closed
Call log:
  - waiting for locator('#filter-from')
  4 failed
  2 passed (2.2m)
```

Genuine RED: all 4 new tests time out waiting for `#filter-from`, which does not exist on the
pre-PR-3 page — an unambiguous "the feature isn't built yet" failure, not a flaky/incidental one.

### 3.9 GREEN — verify 3.4–3.7 satisfy 3.8

`git stash pop` restored the 3 production files. Rebuilt the frontend against the real PR 3 code,
restarted the backend fresh (new in-memory H2, re-seeded — important: a first attempt reused the
already-running backend from the RED run and cross-contaminated `auth.spec.js`'s
`totalPatients === 1` assertion via `register.spec.js`'s own registrations from the earlier run;
restarting the backend for a clean seed before the authoritative run eliminated that test-pollution
artifact, which was never a product defect). Ran the full fullstack suite once against the fresh
backend:

```
Running 15 tests using 1 worker
  ✓ [setup] authenticate as admin ...
  ✓ [setup] authenticate as non-admin ...
  ✓ auth.spec.js › valid admin login redirects to /dashboard and shows seeded backend data
  ✓ auth.spec.js › invalid login is rejected and dashboard access is not granted
  ✓ authorization.spec.js › unauthenticated access to a protected route is redirected ...
  ✓ authorization.spec.js › non-admin access is denied in the browser and the API enforces ...
  ✓ booking.spec.js › UI booking proves persistence and rendering, not just a heading
  ✓ dashboard.spec.js › filter round trip via URL params narrows the snapshot and survives a reload
  ✓ dashboard.spec.js › back button restores the unfiltered dashboard
  ✓ dashboard.spec.js › Refrescar preserves the active filter
  ✓ dashboard.spec.js › #filter-error becomes visible on an inverted date range and the page keeps rendering
  ✓ register.spec.js › blur on an empty required field shows an inline error
  ✓ register.spec.js › confirmPassword mismatch blocks submission client-side
  ✓ register.spec.js › successful registration with valid unique data redirects away from /users/register
  ✓ register.spec.js › duplicate-email registration surfaces the real backend error message
  15 passed (21.9s)
```

One real gap was found and fixed during this step: the "filter round trip" test's URL regex expected
no `dentistId` param at all, but a native HTML form always serializes every named field including an
empty `<select>` (`...&dentistId=`) — this is correct browser behavior, not a bug in
`parseDashboardFilters` (already unit-tested to treat `dentistId: ''` as "no filter"). Relaxed the
regex to accept an optional trailing `&dentistId=`; re-ran, green.

### 3.10 VERIFY — `authorization.spec.js`/`auth.spec.js` unchanged

Both files have **zero diff** this slice (`git status --porcelain -- frontend/tests/fullstack/auth.spec.js
frontend/tests/fullstack/authorization.spec.js` — empty). Their 4 tests passed in the same run shown
above (3.9), against the real parameterized `/dashboard` route and the real
`@PreAuthorize("hasRole('ADMIN')")`-guarded, now-3-param `DashboardController` endpoint from PR 2 —
proving the ADMIN-only boundary is unaffected by the new filter controls/params, not merely unchanged
in source.

## Full frontend verification (broader safety net, not just the targeted files)

```
npx vitest run
 Test Files  17 passed (17)
      Tests  105 passed (105)
```

```
npm run check
```
95 pre-existing errors remain, all in `tests/fullstack/run-fullstack.js`,
`tests/fullstack/fixtures/process-runner-fixtures.js`, and `tests/fullstack/process-runner.spec.js` —
none of which this slice touches (confirmed: zero diff on all three files). No error references any
file changed in this PR.

## Changed files (`git diff --cached --numstat`)

| File | Action | Additions | Deletions | Changed lines |
|---|---|---|---|---|
| `frontend/src/lib/validation/dashboardFilters.js` | Created | 78 | 0 | 78 |
| `frontend/src/lib/validation/dashboardFilters.test.js` | Created | 87 | 0 | 87 |
| `frontend/src/routes/dashboard/+page.server.js` | Modified | 47 | 14 | 61 |
| `frontend/src/routes/dashboard/+page.svelte` | Modified | 69 | 0 | 69 |
| `frontend/src/routes/dashboard/dashboard.server.test.js` | Modified | 98 | 2 | 100 |
| `frontend/static/css/views/dashboard.css` | Modified | 67 | 0 | 67 |
| `frontend/tests/fullstack/dashboard.spec.js` | Created | 68 | 0 | 68 |
| `frontend/tests/fullstack/pages/dashboard.js` | Modified | 36 | 0 | 36 |
| **Total** | | **550** | **16** | **566** |

**566 changed lines — above the ~380–450 forecast in tasks.md's Review Workload Forecast**, similar in
kind to PR 1's (433 vs. 280–350) and PR 2's (502 vs. 380–480) honest overruns. Per the task
instructions, the maintainer has pre-agreed to accept honest overruns case-by-case rather than force
an artificial split; flagging it here rather than under-reporting. Concentration: the two test files
(`dashboard.server.test.js` at 100 and `dashboardFilters.test.js` at 87, plus the new
`dashboard.spec.js` E2E file at 68) account for 255 of 566 lines (~45%) — consistent with PR 1/2's
pattern of the test surface driving most of the overrun, not the production code (the actual filter
bar + loader + validation module + CSS + POM additions total 311 lines across 6 production-ish
files).

## Constraints honored

- No backend file touched (`git status --porcelain -- backend/` — empty throughout).
- No two new breakdown bar charts added — `statusBreakdown`/`dentistBreakdown` visualization is
  explicitly out of scope for this PR (PR 4). The existing monthly uPlot chart is untouched in this
  slice; it now simply receives whatever `monthlyStats` the (optionally filtered) snapshot contains,
  since PR 2 already made the backend filter-aware — no new chart-rendering code was written.
- No Svelte component-test infrastructure added.
- ADMIN-only boundary unweakened at either layer — proven by `authorization.spec.js`/`auth.spec.js`
  passing unchanged (3.10), and by both files having zero diff.
- The existing `#error-message` banner (snapshot-fetch-failure) is untouched; `#filter-error`
  (validation-failure) is a wholly separate, new element — two distinct errors, two distinct elements,
  per design.md.

## Deviations from design.md

- design.md's Data Flow diagram shows `GET /api/dentists` via "Promise.all, .catch(() => [])" without
  specifying exactly which promise the `.catch` attaches to. Interpreted (and implemented) as: the
  **dentists** promise alone carries `.catch(() => [])` *inside* the `Promise.all` array, so a
  dentists-endpoint failure never disturbs the pre-existing snapshot-fetch-failure error path (which
  must keep returning the exact `EMPTY_SNAPSHOT` + `error: 'Error al cargar el dashboard'` shape the
  existing `#error-message` E2E coverage depends on). A single `Promise.all([...]).catch(() => [])`
  wrapping both calls would have collapsed that distinction. Everything else matches design.md exactly,
  including the typedefs, the two-distinct-errors decision, and the aria wiring pattern.

## Issues Found

One test-authoring mistake (not a production defect), documented and fixed in 3.9 above: an E2E URL
regex assumed no `dentistId` param would be serialized by an empty `<select>`, when native HTML form
serialization always includes it. Also found and worked around: running the full E2E suite twice
against the same long-lived backend process (during my own RED→GREEN iteration, not a repeatable CI
condition) cross-contaminates `auth.spec.js`'s `totalPatients` count via `register.spec.js`'s
registrations — resolved by restarting the backend for a clean H2 seed before the authoritative GREEN
run; not a concern for a normal single `npm run test:e2e:fullstack` invocation, which always starts
from a fresh process per the existing `run-fullstack.js` orchestrator.

## Status

Phase 3 (tasks 3.1–3.10): 10/10 complete. Full frontend unit suite: 105/105 green. Full real
full-stack E2E suite (`auth`, `authorization`, `booking`, `dashboard`, `register` specs — 15 tests):
15/15 green against a freshly-seeded backend. `npm run check`: 0 new errors (95 pre-existing errors,
all in untouched process-runner files). Committed to `feat/dashboard-filter-controls` (commit
`4278fac`, not pushed — maintainer reviews the diff before push/PR, per instructions). Ready for
`sdd-verify` on this slice, or for PR 4 (Slice 4 — Frontend Breakdown Charts) to begin on a new
branch stacked on this one once this PR merges.

# PR 4: Slice 4 — Frontend Breakdown Charts (final slice)

Scope: Phase 4 (tasks 4.1–4.9) and Phase 5 (Cross-Slice Verification, tasks 5.1–5.5). Branch:
`feat/dashboard-breakdown-charts` (checked out from up-to-date `main` — PR 1/2/3 all merged). No
backend file touched (`git status --porcelain -- backend/` empty throughout).

## Phase 4: Slice 4 — Frontend Breakdown Charts

### 4.1–4.6 GREEN — implementation

`frontend/src/routes/dashboard/+page.svelte`:

- **`createBarChart(container, labels, values, color)`** (task 4.1): a standalone factory whose axis
  formatter closes over a `labelMap` declared **inside the function body** — a fresh object per call,
  never the shared component-level `chartLabelMap` (which stays exclusive to `renderMonthlyChart`,
  unchanged). Config matches design.md verbatim:
  `uPlot.paths.bars({ size: [0.6, 60], align: 0, gap: 4, radius: 0.1 })` and x-scale
  `range: [0.5, n + 0.5]` (not the monthly chart's `[1, n]`, which would clip the first/last bar).
- **Two new chart containers** (task 4.2): `statusChartContainer`/`dentistChartContainer` bound via
  `bind:this`, fed by `$: statusBreakdown = snapshot?.statusBreakdown || []` and
  `$: dentistBreakdown = snapshot?.dentistBreakdown || []`. `renderStatusChart()` maps each entry's
  `status` through the **existing** `getStatusLabel()` function (no new label table, per task 4.2's
  explicit instruction) before calling `createBarChart`; `renderDentistChart()` uses `dentistName`
  directly.
- **Reactive-refill fix** (task 4.3): replaced the single `$: if (snapshot && chart) {...}` block
  (gated on `chart` already being truthy, so a filter-emptied chart could never come back) with three
  independent reactive statements, one per chart instance:
  `$: if (snapshot && chartContainer) renderMonthlyChart();`,
  `$: if (snapshot && statusChartContainer) renderStatusChart();`,
  `$: if (snapshot && dentistChartContainer) renderDentistChart();`. Each `renderXChart()` function
  destroys its own previous instance (if any) unconditionally, then only creates a new one when data
  is present — so the gate is on data availability, never on the chart's current existence. This is a
  **deliberate simplification beyond the literal ask**: rather than preserving the old incremental
  `chart.setData()`/`chart.setScale()` update path for an existing chart, every reactive tick now
  destroys-and-recreates all three charts uniformly. This removes an entire code path (no separate
  "update in place" branch needed for the two new bar charts) and makes the fix mechanically
  impossible to regress via a stale branch, at the cost of a marginally more expensive re-render on
  every snapshot change (irrelevant at dashboard data volumes — at most 11 dentist bars).
- **Lifecycle** (task 4.4): `ensureResizeHandler()` now resizes all three chart instances
  (`chart`/`statusChart`/`dentistChart`) against their own containers, registered once from
  `onMount` (previously only `chart` was resized, and registration was buried inside
  `renderChart()`). `onDestroy` now iterates `[chart, statusChart, dentistChart]` and destroys each
  defensively (`try/catch`), then nulls all three — previously only `chart` was cleaned up.

`frontend/static/css/views/dashboard.css` (task 4.5): added `.chart-grid .card-body` (min-height),
`.chart-container` (full-width), and `.chart-empty` (a centered dashed-border placeholder using
`--color-fondo-claro`/`--color-primario` from `base/tokens.css`, matching the `.filter-bar` token
convention already established in this file by PR 3).

**Markup**: the two new chart containers are permanent siblings of a Svelte-`{#if}`-toggled
`.chart-empty` div (not conditionally mounted themselves) — `bind:this` targets stay stable across
every re-render, so the reactive statements above never lose their container reference; only
`display: none/block` (driven by `statusBreakdown.length`/`dentistBreakdown.length`) and the sibling
`{#if}` block toggle visibility. This avoids any DOM-ownership conflict between Svelte-controlled
markup and uPlot's own DOM manipulation inside the chart container.

`frontend/tests/fullstack/pages/dashboard.js` (task 4.6): added `clearFiltersLink()`,
`statusChart()`/`statusChartRendered()`/`statusChartEmpty()`, and the dentist equivalents.
`*Rendered()` locates `.uplot` (uPlot's own root class, confirmed present in the vendored
`uPlot.min.js`) **inside** the container, so a passing assertion proves an actual uPlot instance
mounted — not just that the container div exists.

### 4.7 RED — extend `dashboard.spec.js`

Added 4 new tests to the existing `frontend/tests/fullstack/dashboard.spec.js` (created in PR 3):
`status breakdown chart renders when data exists`, `dentist breakdown chart renders when data
exists`, `an empty breakdown renders the empty state without an uncaught JS error` (installs a
`pageerror` listener and asserts it stays empty), and `widening a filter that emptied the dentist
chart brings it back (reactive-refill fix)` — the last one narrows to the same
`2099-01-01..2099-01-02` far-future range PR 3 established (guaranteed zero matches against any
seeded/booked data), confirms the dentist chart is destroyed and the empty state shown, then clicks
the existing "Limpiar" link and asserts the chart reappears.

**Genuine RED, proven by reverting the production code and re-running against the real stack** (same
method PR 3 used): `git stash push -- frontend/src/routes/dashboard/+page.svelte
frontend/static/css/views/dashboard.css` (kept the new/modified test files in place), rebuilt the
frontend against the **pre-PR-4** dashboard page, started the real backend
(`SPRING_PROFILES_ACTIVE=e2e`, fresh `JWT_SECRET` via `openssl rand -base64 32`,
`E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`/`E2E_NON_ADMIN_EMAIL`/`E2E_NON_ADMIN_PASSWORD` per
`frontend/README.md`'s E2E full-stack section), and ran
`npx playwright test --config=playwright.fullstack.config.js dashboard.spec.js`:

```
  1) [fullstack-chromium] › dashboard.spec.js:76 › status breakdown chart renders when data exists
     Error: expect(locator).toBeVisible() failed
     Locator: locator('#statusChart .uplot')
     Error: element(s) not found

  2) [fullstack-chromium] › dashboard.spec.js:84 › dentist breakdown chart renders when data exists
     Error: expect(locator).toBeVisible() failed
     Locator: locator('#dentistChart .uplot')
     Error: element(s) not found

  3) [fullstack-chromium] › dashboard.spec.js:92 › an empty breakdown renders the empty state without an uncaught JS error
     Error: expect(locator).toBeVisible() failed
     Locator: locator('#dentistChart-empty')
     Error: element(s) not found

  4) [fullstack-chromium] › dashboard.spec.js:112 › widening a filter ... (reactive-refill fix)
     Error: expect(locator).toBeVisible() failed
     Locator: locator('#dentistChart .uplot')
     Error: element(s) not found

  4 failed
  6 passed (37.2s)
```

Genuine RED: all 4 new tests fail because `#statusChart`/`#dentistChart`/`#dentistChart-empty` do not
exist on the pre-PR-4 page — an unambiguous "the feature isn't built yet" failure. The 6 pre-existing
tests (2 `auth.setup.js` + 4 PR 3 filter tests) stayed green throughout, proving the RED run exercised
the intended page without an unrelated regression masking the result.

### 4.8 GREEN — verify 4.1–4.6 satisfy 4.7

`git stash pop` restored the 2 production files. Rebuilt the frontend against the real PR 4 code
(same backend process, not yet restarted — restart happens before the authoritative Phase 5 run
below). Ran the targeted spec:

```
Running 10 tests using 1 worker
  ✓ [setup] authenticate as admin ...
  ✓ [setup] authenticate as non-admin ...
  ✓ dashboard.spec.js › filter round trip via URL params narrows the snapshot and survives a reload
  ✓ dashboard.spec.js › back button restores the unfiltered dashboard
  ✓ dashboard.spec.js › Refrescar preserves the active filter
  ✓ dashboard.spec.js › #filter-error becomes visible on an inverted date range and the page keeps rendering
  ✓ dashboard.spec.js › status breakdown chart renders when data exists
  ✓ dashboard.spec.js › dentist breakdown chart renders when data exists
  ✓ dashboard.spec.js › an empty breakdown renders the empty state without an uncaught JS error
  ✓ dashboard.spec.js › widening a filter that emptied the dentist chart brings it back (reactive-refill fix)
  10 passed (9.9s)
```

**No gap found** — 4.1–4.6 satisfied 4.7 on the first GREEN run; no fix was required (unlike PR 3's
3.9, which found one real test-authoring gap). The empty-breakdown scenario relies on the seeded
E2E dentist (`E2eDataInitializer`) having zero appointments in the far-future range — true by
construction, not by luck, since the seeded appointment is always scheduled for "next UTC weekday"
relative to `LocalDate.now()`.

### 4.9 VERIFY — `authorization.spec.js`/`auth.spec.js` unchanged

Both files have **zero diff** this slice (`git status --porcelain -- frontend/tests/fullstack/auth.spec.js
frontend/tests/fullstack/authorization.spec.js` — empty). Both tests passed in every full-suite run
this slice (4.8 and the Phase 5.4 run below), against the real 3-param, filter-aware, still
`@PreAuthorize("hasRole('ADMIN')")`-guarded `DashboardController` endpoint — proving the ADMIN-only
boundary is unaffected by the two new breakdown charts, not merely unchanged in source.

## Phase 5: Cross-Slice Verification

### 5.1 `mvn test` (backend, full suite)

```
mvn -f backend/pom.xml test
...
Tests run: 188, Failures: 0, Errors: 0, Skipped: 0
```

188/188 — identical count to PR 2's end state (this PR touches zero backend files, confirmed by
`git status --porcelain -- backend/` being empty throughout the whole slice), proving no backend
regression from a frontend-only PR.

### 5.2 `npx vitest run` (frontend unit)

```
 Test Files  17 passed (17)
      Tests  105 passed (105)
```

105/105 — identical count to PR 3's end state (this PR adds no new `.test.js` file and modifies no
existing one), including `dashboardFilters.test.js` (8 tests) and `dashboard.server.test.js` (7
tests).

### 5.3 `npm run check`

Ran twice: once immediately after 4.1–4.6 (before the E2E test additions) and once after the full
diff was final (4.1–4.9 complete). Both runs report the identical baseline:

```
COMPLETED 399 FILES 89 ERRORS 0 WARNINGS 3 FILES_WITH_PROBLEMS
```

All 89 errors are in the same 3 files named in the task prompt's stated PR 3 baseline —
`tests/fullstack/run-fullstack.js`, `tests/fullstack/fixtures/process-runner-fixtures.js`,
`tests/fullstack/process-runner.spec.js` — confirmed via `git status --porcelain` that none of the 3
were touched by this PR. **Exactly the stated baseline, zero new errors, zero new files with
problems** — the PR 3 omission this task explicitly warned against was not repeated.

### 5.4 `npx playwright test` (full fullstack suite)

Ran via the project's own orchestrator (`npm run test:e2e:fullstack`, the exact invocation
`frontend/README.md`'s "E2E full-stack" section documents), with a freshly generated
`JWT_SECRET="$(openssl rand -base64 32)"` and the 4 documented `E2E_*` credential env vars, against a
freshly started backend (no state carried over from the 4.7/4.8 iteration above):

```
Running 19 tests using 1 worker
  ✓ [setup] authenticate as admin ...
  ✓ [setup] authenticate as non-admin ...
  ✓ auth.spec.js › valid admin login redirects to /dashboard and shows seeded backend data
  ✓ auth.spec.js › invalid login is rejected and dashboard access is not granted
  ✓ authorization.spec.js › unauthenticated access to a protected route is redirected ...
  ✓ authorization.spec.js › non-admin access is denied in the browser and the API enforces ...
  ✓ booking.spec.js › UI booking proves persistence and rendering, not just a heading
  ✓ dashboard.spec.js › filter round trip via URL params narrows the snapshot and survives a reload
  ✓ dashboard.spec.js › back button restores the unfiltered dashboard
  ✓ dashboard.spec.js › Refrescar preserves the active filter
  ✓ dashboard.spec.js › #filter-error becomes visible on an inverted date range and the page keeps rendering
  ✓ dashboard.spec.js › status breakdown chart renders when data exists
  ✓ dashboard.spec.js › dentist breakdown chart renders when data exists
  ✓ dashboard.spec.js › an empty breakdown renders the empty state without an uncaught JS error
  ✓ dashboard.spec.js › widening a filter that emptied the dentist chart brings it back (reactive-refill fix)
  ✓ register.spec.js › blur on an empty required field shows an inline error
  ✓ register.spec.js › confirmPassword mismatch blocks submission client-side
  ✓ register.spec.js › successful registration with valid unique data redirects away from /users/register
  ✓ register.spec.js › duplicate-email registration surfaces the real backend error message
  19 passed (23.6s)
```

19/19 — PR 3's 15 plus this slice's 4 new dashboard tests. One operational note (not a product
defect, not repeated in the authoritative run above): an earlier attempt at this same command
overlapped with a concurrent `mvn test` run competing for CPU on this machine, which made the
backend's own startup slow enough to miss the harness's readiness timeout
(`[e2e-fullstack] Readiness check timed out before services became ready.`, exit code 4). Re-ran
sequentially (backend unit tests first, then the full-stack harness alone) and it passed cleanly —
this is an artifact of running two heavy JVM processes in parallel on one shared machine during this
apply session, not a flake in the harness or the feature.

### 5.5 Success Criteria spot-check (`proposal.md`, all 4 slices)

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Every chart, monthly series, 4 stat cards, upcoming panel honour the active filter | ✅ | `DashboardServiceImpl`'s per-DTO-field filtering (PR 2, `DashboardSnapshotServiceTest`); `dashboard.spec.js` "filter round trip via URL params narrows the snapshot" (`totalAppointments` → `0` under a no-match range) |
| 2 | Status/dentist breakdowns render as uPlot bars (no zero-count dentists, top-N + overflow, all 4 statuses always present, correct empty state) | ✅ | `DashboardServiceImplTest` (`shouldZeroFillMissingStatusesInEnumOrder...`, `shouldCapAtTop10AndAggregateOverflowIntoOtros...`, `shouldBreakTiedCountsByNameAscending`); this PR's `dashboard.spec.js` "status/dentist breakdown chart renders" + "empty breakdown renders the empty state" |
| 3 | Invalid/inverted range shows a visible error, filter not applied | ✅ | `dashboardFilters.test.js` (8 branches); `dashboard.spec.js` "#filter-error becomes visible on an inverted date range" |
| 4 | Filter state lives in the URL (reload/share/back button/Refrescar) | ✅ | `dashboard.spec.js` "filter round trip ... survives a reload", "back button restores the unfiltered dashboard", "Refrescar preserves the active filter" |
| 5 | No-params request is byte-equivalent to today's monthly stats | ✅ | PR 1's `shouldPreserveCurrentMonthlyDefaultOutputAndCallOrder` (Mockito `InOrder`-pinned); PR 2's 2.10 note that this exact test file has zero diff after the range-resolver refactor |
| 6 | A filtered request never serves another filter's cached snapshot | ✅ | `DashboardSnapshotCacheBehaviourTest` (PR 2) — `@SpringBootTest`, real caching AOP proxy, asserts filtered calls always re-invoke the delegate |
| 7 | `authorization.spec.js`/`auth.spec.js` still block non-admin/unauthenticated at both layers | ✅ | Zero diff on both files across PR 3 **and** PR 4 (`git status --porcelain`); both green in every full-suite run this PR (4.8, 5.4) |
| 8 | `mvn test`, `npm run test`, `npm run check` pass on every slice | ✅ | This PR: 5.1 (188/188), 5.2 (105/105), 5.3 (89/89 pre-existing, 0 new). PR 1–3: see their own sections above, all green at merge time |
| 9 | No slice exceeds the 400-line budget without an accepted exception | ⚠️ (disclosed, not silently exceeded) | PR 1: 433 (+33). PR 2: 502 (+122). PR 3: 566 (+166). **PR 4: 347 — under the ~220–300 forecast's upper bound by only 47 lines, still comfortably inside the 400 budget, no exception needed.** Every overrun on PR 1–3 was explicitly flagged in this same apply-progress file at the time, per the maintainer's stated case-by-case acceptance — never silently absorbed |

All 9 Success Criteria are satisfied; criterion 9 is satisfied via disclosed, maintainer-accepted
exceptions on PR 1–3 rather than every slice landing under 400 lines individually — this is the
documented, agreed-upon interpretation, not a gap.

## Changed files (`git diff --numstat`)

| File | Action | Additions | Deletions | Changed lines |
|---|---|---|---|---|
| `frontend/src/routes/dashboard/+page.svelte` | Modified | 203 | 29 | 232 |
| `frontend/static/css/views/dashboard.css` | Modified | 24 | 0 | 24 |
| `frontend/tests/fullstack/dashboard.spec.js` | Modified | 63 | 0 | 63 |
| `frontend/tests/fullstack/pages/dashboard.js` | Modified | 28 | 0 | 28 |
| **Total** | | **318** | **29** | **347** |

**347 changed lines** — inside the ~220–300 forecast's range with a modest 47-line overrun past the
upper bound, well under the 400-line budget (no exception needed, unlike PR 1–3). The overrun is
concentrated in `+page.svelte` (232 lines): the `createBarChart` factory, two new render functions,
the uniform-recreate reactive-block rewrite (touching all three chart instances, not just the two new
ones), and ~55 lines of new markup for the two chart cards — a deliberate scope slightly broader than
"just add two charts" because the 4.3 lifecycle fix genuinely required touching the monthly chart's
reactive statement and `onDestroy`/resize handler too, per design.md and task 4.4's explicit
instruction.

## Constraints honored

- No backend file touched (`git status --porcelain -- backend/` — empty throughout).
- No Svelte component-test infrastructure added — coverage is Vitest (unaffected, unit-test count
  unchanged from PR 3) + Playwright E2E only, per design.md's explicit "Not covered" testing-strategy
  row.
- ADMIN-only boundary unweakened — proven by `authorization.spec.js`/`auth.spec.js` zero diff and
  green pass in both 4.8 and 5.4.
- `chartLabelMap` (the shared component-level map) is read/written only by `renderMonthlyChart` —
  confirmed by inspection: `createBarChart`'s `labelMap` is a `const` declared inside the function
  body, a distinct object per call, never assigned to or read from the outer `chartLabelMap` variable.

## Deviations from design.md

- **Reactive-update strategy**: design.md's "Latent defect this feature exposes" paragraph asks for
  the reactive block to "re-invoke the render path when chart is null" for all three instances. This
  PR does not preserve monthly chart's old `chart.setData()`/`chart.setScale()` incremental-update
  branch as a separate case — instead, all three charts destroy-and-recreate on every reactive tick,
  uniformly. This satisfies the literal requirement (the render/creation path is always re-attempted
  regardless of `chart`'s current value) with less code and one fewer distinct code path to keep in
  sync across three chart instances, at a negligible performance cost for this data volume (≤11 bars
  on the largest chart). Documented here rather than silently simplified.
- Everything else matches design.md exactly: the `createBarChart` signature, the `uPlot.paths.bars()`
  config, the `[0.5, n+0.5]` x-scale range, reuse of `getStatusLabel()` for the status axis, and the
  empty-state guard pattern extended to both new charts.

## Issues Found

One environmental (not product) issue during this apply session: running the backend's own `mvn
test` suite concurrently with the `npm run test:e2e:fullstack` harness on this machine starved the
harness's own backend process of CPU during startup, causing a readiness-timeout failure (exit code
4) on the first attempt. Not a flake in the harness or a defect in this PR's code — re-running the two
suites sequentially (5.1 fully finished before 5.4 started) resolved it cleanly, and this is the
authoritative result reported above.

## Status

Phase 4 (tasks 4.1–4.9): 9/9 complete. Phase 5 (tasks 5.1–5.5): 5/5 complete. Full backend suite:
188/188 green. Full frontend unit suite: 105/105 green. `npm run check`: baseline unchanged (89
errors, same 3 pre-existing files, 0 new). Full real full-stack E2E suite (19 tests: auth,
authorization, booking, dashboard ×8, register): 19/19 green. Committed to
`feat/dashboard-breakdown-charts` (not pushed — maintainer reviews the diff before push/PR, per
instructions).

**This is the final slice of `enrich-dashboard`.** All 4 PRs (backend aggregation, backend filtering +
cache, frontend filter controls, frontend breakdown charts) are now complete: Phase 1 (7/7), Phase 2
(10/10), Phase 3 (10/10), Phase 4 (9/9), Phase 5 (5/5) — 41/41 tasks across the whole change. Every
Success Criteria item in `proposal.md` is satisfied (5.5 above). The change is ready for
`sdd-verify` across the full `enrich-dashboard` scope.
