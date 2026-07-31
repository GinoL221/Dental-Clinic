# Proposal: Enrich Dashboard Filters and Breakdowns

## Intent

The ADMIN dashboard answers only one question today: "how many appointments per month, globally, over a fixed hardcoded last-6-months window." `DashboardServiceImpl.getAppointmentsByMonth()` hardcodes the 6-month loop, `GET /dashboard/snapshot` accepts no parameters, and the only page controls are Refrescar (`invalidateAll`) and Exportar CSV (upcoming list only). An admin cannot ask "how is Dr. X's workload," "how many appointments are stuck in `IN_PROGRESS`," or "what did last quarter look like" without leaving the dashboard for the appointments search page. The data to answer all three already exists in `Appointment` (date, dentist, status) and is already filterable elsewhere — `IAppointmentRepository.searchAppointments(patient, dentist, status, fromDate, toDate, pageable)` proves the query shape — it is simply never aggregated for the dashboard.

## Scope

### In Scope

- Backend aggregations: appointments grouped by `AppointmentStatus` and grouped by dentist, as new `IAppointmentRepository` `@Query` group-by methods and new `IDashboardService` methods, surfaced as new `DashboardSnapshotDTO` fields (`statusBreakdown`, `dentistBreakdown`).
- Backend filtering: optional `from`, `to`, `dentistId` request params on `GET /dashboard/snapshot`, threaded controller → `IDashboardSnapshotService` → `IDashboardService` → repository, applied to monthly stats and both new breakdowns.
- Cache-key correctness: replace the current keyless `@Cacheable(value = "dashboardSnapshot")` with an explicitly bounded strategy (see Approach) so no filter combination can serve another's cached result.
- Frontend filter controls: date-range inputs and a dentist `<select>` on `/dashboard`, wired through SvelteKit URL search params and read in `load({ url })`.
- Frontend breakdowns: two additional uPlot charts (appointments by status, appointments by dentist) alongside the existing monthly line chart.
- Test coverage: backend unit tests for the new repository/service/controller surface; `dashboard.server.test.js` for new load params and validation branches; extended Playwright page object + E2E for the new controls.

### Out of Scope

- Replacing uPlot. Maintainer-confirmed: it stays. `uPlot.paths.bars()` is verified present in the vendored build.
- Patient filter, status filter as an input control, chart-type toggles, series toggling, saved/shareable filter presets.
- Svelte component-test infrastructure — intentionally deferred by prior changes; new UI is covered by Vitest (load fn) + Playwright only.
- Changing the ADMIN-only boundary, the appointments search page, or the CSV export contents.
- Redesigning the *visual layout* of the existing stat cards or upcoming-appointments panel, or `dashboard.css` beyond styling the new controls/charts. (Their underlying *data* now honors the active filter per the resolved "Filter reach" question below — only the layout/markup is out of scope.)

## Capabilities

### New Capabilities

- `dashboard-filtering`: the `from`/`to`/`dentistId` contract — accepted values, defaults when absent, invalid/partial-range handling, which sections the filter applies to, the cache-key rule, and preservation of the ADMIN boundary on the parameterized endpoint.
- `dashboard-breakdowns`: appointments-by-status and appointments-by-dentist aggregation semantics (which statuses/dentists appear, zero-count and empty-result behavior, ordering, dentist labelling) and their rendering as bar charts.

### Modified Capabilities

- None. `object-level-authorization` and `dashboard-types` requirements are unchanged — this change must satisfy them, not alter them.

## Approach

Exploration Approach 3 (combined), delivered as chained PR slices per the 400-line review guard.

**Aggregation.** Two new `@Query` group-by methods on `IAppointmentRepository` following the existing nullable-param idiom already used by `searchAppointments` (`:param IS NULL OR ...`), so filtered and unfiltered aggregation share one query each rather than branching in the service.

**Caching.** Recommended: keep `@Cacheable` for the unparameterized default view only, via `condition = "#from == null && #to == null && #dentistId == null"`. Spring evaluates `condition` before invocation, so any filtered request bypasses the cache entirely. This is bounded (one cache entry, as today), preserves the existing performance win for the common case, and makes stale-cross-filter data structurally impossible. The alternative — a composite `key` derived from all three params — is rejected as the default because arbitrary date ranges give the key space no natural bound. Spec/design must also confirm whether existing appointment-mutation cache eviction still covers this cache.

**Charts.** Both breakdowns are single-series categorical bar charts via `uPlot.paths.bars()`, reusing the index-based x-scale plus `chartLabelMap` axis-formatter pattern the monthly chart already uses. No stacking is proposed: uPlot has no native stacking API, and stacked bars would require userland cumulative sums plus bands. Grouped/stacked variants are explicitly out of scope.

**Filter state.** URL search params are the single source of truth (`?from=&to=&dentistId=`), which keeps the filter server-rendered, shareable, back-button-correct, and compatible with the existing `invalidateAll` Refrescar button.

**Dentist list.** The dentist `<select>` sources from the existing `GET /dentists` endpoint rather than a new one. Whether the load function fetches it separately or the snapshot DTO carries it is a design-phase decision.

## Delivery Slices

Chained PRs, each independently verifiable and revertible:

| # | Slice | Content |
|---|-------|---------|
| 1 | Backend aggregation | New repository group-by queries, service methods, `DashboardSnapshotDTO` fields. Endpoint stays param-less; cache untouched. |
| 2 | Backend filtering + cache | `from`/`to`/`dentistId` params through all layers, param validation, cache-condition rework, controller tests. |
| 3 | Frontend filter controls | Filter UI, URL-param wiring in `load({ url })`, `dashboard.server.test.js`, Playwright coverage. |
| 4 | Frontend breakdown charts | Two uPlot bar charts + `dashboard.css` styling. |

Slices 3 and 4 MAY merge if the `sdd-tasks` forecast puts the combined frontend work under the 400-line budget. Slices 1 and 2 MUST NOT merge — slice 2 is where the cache regression risk lives and it deserves an isolated diff.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/.../repository/IAppointmentRepository.java` | Modified | New group-by-status and group-by-dentist `@Query` methods |
| `backend/.../service/IDashboardService.java` + `impl/DashboardServiceImpl.java` | Modified | New aggregation methods; `getAppointmentsByMonth()` gains a date range instead of the hardcoded 6-month loop |
| `backend/.../service/IDashboardSnapshotService.java` + `impl/DashboardSnapshotService.java` | Modified | Params on `getDashboardSnapshot()`, new apply-sections, cache condition |
| `backend/.../dto/DashboardSnapshotDTO.java` | Modified | `statusBreakdown`, `dentistBreakdown` fields + nested DTOs, `withDefaults()` |
| `backend/.../controller/DashboardController.java` | Modified | `@RequestParam` params; `@PreAuthorize("hasRole('ADMIN')")` unchanged |
| `backend/src/test/.../DashboardSnapshotServiceTest.java`, `DashboardControllerTest.java` | Modified | New sections, params, cache-condition coverage |
| `frontend/src/routes/dashboard/+page.server.js` | Modified | Read/validate search params, forward to snapshot fetch |
| `frontend/src/routes/dashboard/+page.svelte` | Modified | Filter controls, two new chart containers and render functions |
| `frontend/src/routes/dashboard/dashboard.server.test.js` | Modified | New param/validation branches; existing auth branches must not regress |
| `frontend/tests/fullstack/pages/dashboard.js` + `authorization.spec.js` | Modified | Page-object selectors for new controls; ADMIN-boundary assertions unchanged |
| `frontend/static/css/views/dashboard.css` | Modified | Filter-bar and chart-grid styling, using `base/tokens.css` |
| `frontend/static/js/lib/uPlot.min.js` | Unchanged | Vendored; `paths.bars()` already available |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Keyless `@Cacheable` silently serves one filter's data to another | High (certain if unaddressed) | Cache only the unparameterized view via `condition`; isolate in slice 2; add an explicit test that a filtered call is not cache-served |
| ADMIN-only boundary weakened by new params/route | Low | `@PreAuthorize` and the SvelteKit guard are untouched; `authorization.spec.js` assertions must stay green as a gate on every slice |
| Combined scope exceeds the 400-line review budget | High | Four chained slices; `sdd-tasks` must forecast per slice |
| Dentist breakdown unbounded as the clinic grows | Medium | Spec must define ordering and a cap/"otros" rule; chart height must not grow without limit |
| Invalid or inverted date range (`from > to`, unparsable) | Medium | Spec must define behavior explicitly — reject with a visible message or fall back to default window; do not 500 |
| Existing appointment-mutation cache eviction may not match the new cache condition | Medium | Design phase must confirm against `AppointmentServiceCacheAnnotationsTest` |
| Removing the hardcoded 6-month loop changes the default view | Low | Default (no params) must reproduce today's exact last-6-months output; assert it in slice 1 |
| Empty breakdowns (no appointments in range) render broken charts | Medium | The existing `if (!labels.length) return` guard pattern must extend to both new charts; cover the empty state in E2E |
| Stat-card semantics under a dentist filter are ambiguous (e.g. does `totalDentists` become 0-or-1, or stay a global denominator?) | Medium | Design phase must define exact per-card semantics for every filter combination before implementation; cover with explicit unit tests, not left to implicit behavior |

## Rollback Plan

Each slice is an independent revert. Reverting slice 4 removes the new charts but leaves the DTO fields harmlessly unread. Reverting slice 3 restores the unfiltered dashboard while the backend keeps accepting (now unused) optional params. Reverting slice 2 restores the keyless `@Cacheable` and the param-less endpoint. Reverting slice 1 restores the original DTO. No schema migration, no data migration, no persisted state — every change is additive and query-level, so rollback is atomic and stateless at any depth.

## Dependencies

- None external. No new npm or Maven dependency; uPlot stays vendored and `GET /dentists` already exists with a role set that includes ADMIN.

## Success Criteria

- [ ] An admin can restrict the dashboard to a date range and/or a single dentist, and every chart, the monthly series, the four stat cards, and the upcoming-appointments panel all honour the active filter.
- [ ] Appointments-by-status and appointments-by-dentist render as uPlot bar charts (no zero-count dentists, top-N cap with an overflow rule, all 4 statuses always present), including a correct empty state.
- [ ] An invalid or inverted date range (`from > to`, unparsable) shows a visible validation error and does not apply the filter.
- [ ] Filter state lives in the URL: reloading, sharing, or using the back button reproduces the same view; Refrescar preserves the active filter.
- [ ] Requesting the dashboard with no params returns byte-equivalent monthly stats to today's behavior.
- [ ] A filtered request never returns another filter combination's cached snapshot, proven by test.
- [ ] `authorization.spec.js` and `auth.spec.js` still prove non-admin and unauthenticated users are blocked at both layers.
- [ ] `mvn test`, `npm run test`, and `npm run check` pass on every slice.
- [ ] No slice exceeds the 400-line review budget without an explicitly accepted exception.

## Proposal Question Round — Resolved

The maintainer confirmed full scope (filters + breakdowns), keeping uPlot, and chained delivery. These product questions were open and are now resolved:

1. **Default window** — with no filter applied, the dashboard keeps showing the last 6 months (unchanged). Not re-confirmed explicitly, treated as a safe, low-risk assumption.
2. **Filter reach — RESOLVED: whole panel.** `from`/`to`/`dentistId` filter the four stat cards and the upcoming-appointments panel, not just the charts and monthly series. **This changes the original assumption and widens scope**: `totalAppointments`, `totalDentists`, `totalPatients`, `todayAppointments` currently read as global counts; under a dentist filter, `totalDentists`/`totalPatients` need a defined meaning (e.g. does `totalDentists` become 0-or-1 when `dentistId` is set, or does it stay global as a denominator while `totalAppointments`/`todayAppointments` narrow?). **Design phase must define the exact semantics per stat card under each filter combination** — this is now a first-class design decision, not an afterthought.
3. **Dentist breakdown scope — RESOLVED**: only dentists with activity in the active range appear (no zero-count entries); a cap (top N by count) applies before the chart becomes unreadable. Design phase must pick the exact N and the "overflow" treatment (drop silently vs. an "Otros" aggregate bar).
4. **Status breakdown scope — RESOLVED**: always render all four `AppointmentStatus` values, including zero-height bars, so the chart shape is stable across queries.
5. **Invalid range handling — RESOLVED**: `from > to` (or an unparsable value) is a visible validation error on the page; the filter is not silently coerced to the default window.

An exploration claim is also corrected here: the exploration flagged that stacked bars might be poorly supported. `uPlot.paths.bars()` is confirmed present in the vendored build with the full upstream option set (`size`, `align`, `gap`, `radius`, `disp`, `each`). Simple categorical bars are fully supported; only *stacking* lacks a native API, and this proposal does not use stacking.
