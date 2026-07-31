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

Phase 2 (tasks 2.1–2.10): 10/10 complete. Full `mvn test`: 188/188 green. Not yet committed to
`feat/dashboard-filtering-cache` — ready for the maintainer to review the diff before commit, per
instructions. Ready for PR 3 (Slice 3 — Frontend Filter Controls) to begin on a new branch stacked
on this one once this PR merges, or for `sdd-verify` on this slice now.
