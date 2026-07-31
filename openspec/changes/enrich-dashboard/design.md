# Design: Enrich Dashboard Filters and Breakdowns

## Technical Approach

One filter triple (`from`, `to`, `dentistId`) is resolved once per request and threaded down a single path: `DashboardController` → `IDashboardSnapshotService` → `IDashboardService` → `IAppointmentRepository`. Every panel section reads from that one resolved filter, so "whole panel honours the filter" is structural, not four coincidences. Aggregation lands first (slice 1) with the endpoint still param-less; filtering + cache land isolated (slice 2); the frontend follows (slices 3–4).

## Verified Facts (read, not assumed)

| Claim | Verified |
|---|---|
| `@Cacheable(value = "dashboardSnapshot", unless = "#result == null")` — no `key`, no `condition` | `DashboardSnapshotService.java:23` |
| Eviction is `@CacheEvict(cacheNames = "dashboardSnapshot", allEntries = true)` on `save` (:46), `update` (:105), `delete` (:203), `updateStatus` (:217) | `AppointmentServiceImpl.java` |
| `AppointmentServiceCacheAnnotationsTest` asserts only `updateStatus`, and only annotation *presence* (`allEntries()`, `cacheNames()[0]`) — never runtime behaviour | `AppointmentServiceCacheAnnotationsTest.java:16-25` |
| `AppointmentStatus` = `SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED` (4, no `CANCELED`) | `AppointmentStatus.java:3-7` |
| Cache is a single Caffeine cache named `dashboardSnapshot` | `CacheConfig.java:17` |
| Nullable-param idiom `(:x IS NULL OR ...)` already proven with `LocalDate` and `Long` | `IAppointmentRepository.searchAppointmentsByDentistId` |
| Pure-validation-module convention exists | `frontend/src/lib/validation/registerForm.js` |
| `chartLabelMap` is one shared component-level map consumed by the monthly axis formatter closure | `+page.svelte:15,138-141,161` |

## Architecture Decisions

### Decision: Cache the default view only, via `condition` — eviction needs no change

**Choice**:

```java
@Cacheable(
    value = "dashboardSnapshot",
    key = "'default'",
    condition = "#from == null && #to == null && #dentistId == null",
    unless = "#result == null")
public DashboardSnapshotDTO getDashboardSnapshot(LocalDate from, LocalDate to, Long dentistId)
```

**Alternatives rejected**: composite `key = "T(java.util.Objects).hash(#from,#to,#dentistId)"` (unbounded key space — arbitrary date ranges); dropping `@Cacheable` (loses the existing win for the common case).

**Rationale**: Spring evaluates `condition` before *both* lookup and put, so a filtered call neither reads nor writes the cache — cross-filter contamination becomes structurally impossible, not merely unlikely. `key = "'default'"` is belt-and-braces: it pins the cache to exactly one entry even if a fourth param is added later and someone forgets the condition.

**Eviction verdict — no gap**: `allEntries = true` clears the whole cache irrespective of key or condition, so all four mutation methods still correctly evict the single `'default'` entry. The gap is in *coverage*, not correctness: three of the four `@CacheEvict` methods are untested, and the existing reflection test cannot detect a broken SpEL condition. Slice 2 closes both — extend the reflection test to `save`/`update`/`delete`, and add one runtime test.

**Load-bearing gotcha**: Spring Framework 6.1 (Boot 3.2.1) removed `LocalVariableTableParameterNameDiscoverer`, so named SpEL (`#from`) depends on `-parameters` reaching javac. `backend/pom.xml:96-103` redeclares `maven-compiler-plugin` with only `<release>21</release>`; the `<parameters>true</parameters>` from the parent's `pluginManagement` merges in, but this is inherited, not explicit. The runtime cache test below is the guard — if names are not retained it fails loudly. Fallback if it does: `#p0 == null && #p1 == null && #p2 == null`.

### Decision: Per-DTO-field filter semantics

| Field | Under filter | Rule |
|---|---|---|
| `totalAppointments` | Narrows | `countFiltered(from, to, dentistId)` |
| `todayAppointments` | Narrows | Count over the *filtered set* restricted to `today`. If `today` falls outside `[from, to]`, the answer is `0` — not a silent global fallback |
| `upcomingAppointments` | Narrows | `date >= max(today, from)`, `date <= to`, `dentist.id = dentistId` |
| `statusBreakdown`, `dentistBreakdown`, `monthlyStats` | Narrow | Same filter triple |
| `totalDentists` | **Global** | `dentistRepository.count()` — unchanged |
| `totalPatients` | **Global** | `patientRepository.count()` — unchanged |

**Rationale**: the invariant is "every appointment-derived number counts the same filtered appointment set". `totalDentists`/`totalPatients` are entity-existence counts sourced from `IDentistRepository`/`IPatientRepository` (`DashboardServiceImpl:47-48`) — they never touched `Appointment`. Narrowing `totalDentists` under `dentistId` would make it the constant `1`, a card that displays nothing. Redefining `totalPatients` as "distinct patients with an appointment in range" is a *different metric*, not a filtered one, and is out of scope. This matches the default `sdd-spec` is writing — **no divergence**.

**Rejected**: a `filtersApplied` badge per card. Deferred: the UI can indicate globality with a card sub-label, cheap to add later.

### Decision: Default window is byte-equivalent by construction, not by assertion

**Choice**: `IDashboardService` keeps the zero-arg `getAppointmentsByMonth()` as a `default` method delegating to `getAppointmentsByMonth(null, null, null)`. Both null → resolver returns `[today.minusMonths(5).withDayOfMonth(1), today.withDayOfMonth(lengthOfMonth)]`, and the bucket loop walks month-by-month over that range — arithmetically identical to today's `for (i = 5; i >= 0; i--)`.

**Proof mechanism** (not assertion): slice 1 adds a characterization test that pins the *current* output — both the returned `months`/`appointmentCounts` lists **and** the exact ordered `countByDateBetween(firstDay, lastDay)` call sequence via Mockito `InOrder`, which pins the bucket boundaries too. Slice 2 refactors underneath a test that never changes. The surviving zero-arg entry point means the existing call site and test keep exercising the original signature verbatim.

**Partial/odd ranges**: `from` only → `from..today`; `to` only → `(to − 5 months)..to`; both → `from..to`, clamped to the last **24** buckets ending at `to` so a decade-wide range cannot produce an unbounded loop or an unreadable axis.

### Decision: Dentist cap N = 10 with an `"Otros"` aggregate, computed backend-side

**Choice**: order `COUNT DESC, firstName ASC, lastName ASC` (deterministic tiebreak — required for a stable test); take top 10; if a remainder exists, append one final `{ dentistId: null, dentistName: "Otros", count: <sum of rest> }`.

**Alternatives rejected**: silent drop (breaks the invariant `sum(dentistBreakdown) == totalAppointments` — the chart would lie); N = 5 (too coarse for a growing clinic); frontend-side capping (splits one rule across two languages and two test suites).

**Rationale**: N = 10 keeps ~40–50px per bar inside a `col-lg-6` card at 350px height — legible without label rotation. `"Otros"` is always last regardless of its count, so the chart shape stays stable. The sum invariant is itself a unit test.

### Decision: Status breakdown zero-filled in the service, in enum declaration order

**Choice**: `applyStatusSection` seeds a `LinkedHashMap` from `AppointmentStatus.values()` at `0L`, then overlays query rows. Always exactly 4 entries, always the same order.

**Rationale**: stable chart shape and stable bar colours across every query; the frontend's existing `getStatusLabel()` map (`+page.svelte:39-49`) already covers all four and is reused as the axis formatter, so no new label table. Note: the existing `catch (RuntimeException ignored)` resilience idiom means a *failed* section keeps `withDefaults()`' empty list, not four zeros — the frontend must therefore map whatever arrives rather than index positionally.

### Decision: Validation is a pure module, and the error is a distinct banner

**Choice**: `frontend/src/lib/validation/dashboardFilters.js`, consumed by `load({ url })`.

```js
/** @typedef {{ from: string|null, to: string|null, dentistId: number|null }} AppliedFilters */
/** @typedef {{ valid: boolean, error: string, applied: AppliedFilters, raw: {from:string,to:string,dentistId:string} }} FilterParseResult */

/** @param {URLSearchParams} searchParams @returns {FilterParseResult} */
export function parseDashboardFilters(searchParams) {}
```

Invalid (`from > to`, unparsable date, non-numeric `dentistId`) → `load` fetches the **unfiltered** snapshot and returns `{ snapshot, filters: raw, filterError }`. The page renders normally plus a `role="alert"` banner with `id="filter-error"` above the filter bar, with `aria-invalid` / `aria-describedby` on the offending inputs — the exact pattern established by `register-page-redesign`. `raw` is echoed back so the user's typed values survive the round trip.

**Alternatives rejected**: inline in `+page.server.js` (not unit-testable in isolation; `src/lib/validation/` is the established home); `throw error(400)` (destroys the whole dashboard for a typo); backend-only validation (a network round trip for a rule the UI must enforce anyway).

**Do not touch** the existing `#error-message` banner — it means "snapshot fetch failed" and current E2E depends on it. Two distinct errors, two distinct elements.

**Defence in depth**: `DashboardController` also returns `400` when `from != null && to != null && from.isAfter(to)`; unparsable dates are rejected by `@DateTimeFormat(iso = ISO.DATE)` binding. JPQL params are bound, never concatenated — no injection surface.

### Decision: Bar charts get per-chart label closures; the monthly chart is untouched

**Choice**: a local factory `createBarChart(container, labels, values, color)` whose axis formatter closes over its **own** `labelMap`. The shared component-level `chartLabelMap` stays exclusive to the monthly line chart.

**Rationale**: three charts writing one shared mutable map would cross-label each other — a real bug this design prevents rather than discovers in review.

**Non-obvious config**:

```js
paths: uPlot.paths.bars({ size: [0.6, 60], align: 0, gap: 4, radius: 0.1 })
// x scale range must be [0.5, n + 0.5] — the monthly chart's [1, n] would clip
// the first and last bar in half.
```

**Latent defect this feature exposes**: `renderChart()` returns early on empty data (`+page.svelte:135`) and the reactive updater is gated on `chart` being non-null (`:195`). Today that is unreachable; with filters, "filter to empty, then widen" leaves the chart permanently absent. Slice 4 changes the reactive block to re-invoke the render path when `chart` is null. `onDestroy` and the resize handler extend to all three instances.

## Data Flow

    URL ?from&to&dentistId
      │
      ▼
    parseDashboardFilters()  ──invalid──→ filterError + unfiltered fetch ──→ #filter-error banner
      │ valid
      ▼
    load({url}) ─┬─ GET /api/dashboard/snapshot?from&to&dentistId
                 └─ GET /api/dentists  (Promise.all, .catch(() => []))
                       │
                       ▼
      DashboardController  @PreAuthorize("hasRole('ADMIN')")   ← unchanged
                       │
                       ▼
      DashboardSnapshotService  @Cacheable(condition: all three null)
                       │
          ┌────────────┼─────────────┬──────────────┬───────────────┐
          ▼            ▼             ▼              ▼               ▼
        stats       monthly       upcoming       status         dentist
          │            │             │              │               │
          └────────────┴─── IAppointmentRepository (one filter triple) ┘
                                     │
                       totalDentists / totalPatients ← IDentist/IPatientRepository (GLOBAL)

## File Changes

| File | Slice | Action | Description |
|---|---|---|---|
| `backend/.../repository/IAppointmentRepository.java` | 1, 2 | Modify | `countGroupedByStatus`, `countGroupedByDentist` (1); `countFiltered`, filtered `findUpcomingAppointments*` (2) — all `List<Object[]>`, matching the existing projection idiom |
| `backend/.../dto/DashboardSnapshotDTO.java` | 1 | Modify | `statusBreakdown`, `dentistBreakdown` + nested `StatusCountDTO` / `DentistCountDTO`; `withDefaults()` seeds both empty |
| `backend/.../service/IDashboardService.java` | 1, 2 | Modify | New aggregation methods (1); overloads taking the filter triple, zero-arg kept as `default` delegate (2) |
| `backend/.../service/impl/DashboardServiceImpl.java` | 1, 2 | Modify | Zero-fill + top-N/"Otros" logic (1); range resolver, 24-bucket clamp, filtered counts (2) |
| `backend/.../service/IDashboardSnapshotService.java` + `impl/` | 1, 2 | Modify | Two new apply-sections (1); params + cache `key`/`condition` (2) |
| `backend/.../controller/DashboardController.java` | 2 | Modify | Three `@RequestParam(required = false)`, `@DateTimeFormat`, inverted-range 400 guard; `@PreAuthorize` unchanged |
| `backend/src/test/.../DashboardServiceImplTest.java` | 1 | Modify/Create | Characterization test pinning today's monthly output + `InOrder` bucket boundaries |
| `backend/src/test/.../AppointmentServiceCacheAnnotationsTest.java` | 2 | Modify | Extend to `save`/`update`/`delete` |
| `backend/src/test/.../DashboardSnapshotCacheBehaviourTest.java` | 2 | Create | Runtime: 2 unfiltered calls → 1 delegate invocation; 2 filtered calls → 2 invocations |
| `frontend/src/lib/validation/dashboardFilters.js` (+ `.test.js`) | 3 | Create | Pure parse/validate |
| `frontend/src/routes/dashboard/+page.server.js` | 3 | Modify | `load({ url, locals })`, forward params, parallel `/api/dentists` |
| `frontend/src/routes/dashboard/+page.svelte` | 3, 4 | Modify | Filter bar + `#filter-error` (3); two bar charts, factory, lifecycle fix (4) |
| `frontend/src/routes/dashboard/dashboard.server.test.js` | 3 | Modify | New param/validation branches; four existing auth tests must not regress |
| `frontend/tests/fullstack/pages/dashboard.js` | 3, 4 | Modify | Selectors for filter controls and both charts |
| `frontend/static/css/views/dashboard.css` | 3, 4 | Modify | Filter bar, chart grid, `.chart-empty` — via `base/tokens.css` |

## Interfaces / Contracts

```java
public interface IDashboardSnapshotService {
  DashboardSnapshotDTO getDashboardSnapshot(LocalDate from, LocalDate to, Long dentistId);
  default DashboardSnapshotDTO getDashboardSnapshot() { return getDashboardSnapshot(null, null, null); }
}
```

```jsonc
// DashboardSnapshotDTO additions
"statusBreakdown":  [{ "status": "SCHEDULED", "count": 12 }, /* always 4, enum order */],
"dentistBreakdown": [{ "dentistId": 3, "dentistName": "Ana Gómez", "count": 40 },
                     { "dentistId": null, "dentistName": "Otros", "count": 7 }]  // ≤ 11 entries
```

## Testing Strategy

Strict TDD is on (`config.yaml: strict_tdd: true`) — every row is RED first.

| Layer | What | Approach |
|---|---|---|
| Unit (BE) | Monthly default byte-equivalence + bucket boundaries | Mockito `InOrder` on `countByDateBetween`; test written in slice 1, unchanged in slice 2 |
| Unit (BE) | Zero-fill = 4 statuses in enum order; top-10 + `"Otros"`; `sum(dentistBreakdown) == totalAppointments`; deterministic tiebreak | `DashboardServiceImplTest` with a mocked repository |
| Unit (BE) | `totalDentists`/`totalPatients` stay global under `dentistId`; `todayAppointments == 0` when today ∉ `[from,to]` | `DashboardSnapshotServiceTest` |
| Integration (BE) | Cache condition actually evaluates and bounds to one entry; all four `@CacheEvict` methods present | New `DashboardSnapshotCacheBehaviourTest` + extended reflection test |
| Unit (BE) | Inverted range → 400; params bound and forwarded | `DashboardControllerTest` |
| Unit (FE) | Every validation branch: valid, inverted, unparsable, partial, non-numeric `dentistId` | `dashboardFilters.test.js` |
| Unit (FE) | `load` forwards params; invalid → unfiltered + `filterError`; 4 existing auth branches green | `dashboard.server.test.js` |
| Component | — | **Not covered.** No `.svelte` test infra (`vite.config.js` `test.include` excludes `.svelte`) — deliberate, unchanged |
| E2E | Filter round trip via URL, back button, Refrescar preserves filter, `#filter-error` visible, empty-breakdown state | Extended page object + spec |
| E2E | ADMIN boundary | `authorization.spec.js` / `auth.spec.js` unchanged — a green gate on **every** slice |
| Static | `npm run check` clean | Existing script |

## Threat Matrix

N/A — no routing dispatch, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. Two adjacent surfaces, handled inline above: the ADMIN boundary is untouched at both layers and gated by unchanged E2E on every slice; the three new user-controlled params are bound JPQL parameters and typed converters, never string concatenation.

## Migration / Rollout

No schema change, no data migration, no persisted state. Four chained PRs, each independently revertible: revert 4 → charts gone, DTO fields harmlessly unread; revert 3 → unfiltered page, backend still accepts unused params; revert 2 → keyless `@Cacheable` and param-less endpoint restored (safe, because slice 1 added no params); revert 1 → original DTO. Slices 1 and 2 MUST NOT merge — slice 2 owns the cache regression risk and deserves an isolated diff.

## Open Questions

- [ ] None blocking. Two follow-ups outside this change: `openspec/config.yaml` says "Svelte 4" (stale, actually 5.56.6); `findUpcomingAppointmentsWithDetails` has no `LIMIT` and is only bounded by the panel's CSS scroll box — pre-existing, not touched here.
