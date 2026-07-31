# Tasks: Enrich Dashboard Filters and Breakdowns

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~1250–1600 total across 4 slices (Slice 1 ~280–350, Slice 2 ~380–480, Slice 3 ~380–450, Slice 4 ~220–300) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (backend aggregation) → PR 2 (backend filtering + cache) → PR 3 (frontend filter controls) → PR 4 (frontend breakdown charts) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

**Slice-merge decision**: Slices 3 and 4 do **not** merge. Forecast for slice 3 alone (~380–450 lines: validation module + tests, load wiring, filter-bar markup/CSS, POM selectors, E2E) already sits at or above the 400-line budget on its own; adding slice 4's ~220–300 lines would push a combined PR to ~600–750 lines — well past budget. Slices 1 and 2 also stay separate per design's explicit mandate (independent invariants: aggregation correctness vs. cache correctness). Stacked-to-main is suggested because the rollback plan already treats each slice as an atomic, independent revert with no rebase dependency on later slices — the natural fit for sequential main merges rather than a tracker branch. Flag for the maintainer: slices 2 and 3 individually approach/exceed 400 lines and may warrant their own internal split or an accepted size:exception — worth confirming before PR 2/3 open.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Backend aggregation (status/dentist breakdowns), endpoint stays param-less | PR 1 | `mvn -f backend/pom.xml -Dtest=DashboardServiceImplTest,DashboardSnapshotServiceTest test` | N/A — pure unit tests with mocked `IAppointmentRepository`, no DB/HTTP needed | Revert `IAppointmentRepository` group-by queries, `DashboardSnapshotDTO` breakdown fields, `IDashboardService`/-Impl aggregation methods, new apply-sections; DTO fields become harmlessly unread |
| 2 | Backend filtering + cache-condition rework | PR 2 | `mvn -f backend/pom.xml -Dtest=DashboardControllerTest,DashboardSnapshotServiceTest,DashboardSnapshotCacheBehaviourTest,AppointmentServiceCacheAnnotationsTest test` | `SPRING_PROFILES_ACTIVE=default mvn -f backend/pom.xml spring-boot:run`, then two `curl GET /api/dashboard/snapshot?dentistId=7` calls to confirm no cache reuse | Revert filtered repository queries, controller params/guard, cache `key`/`condition`, `IDashboardService` overloads; endpoint/cache revert to param-less/keyless (safe — slice 1 added no params) |
| 3 | Frontend filter controls (validation, load wiring, filter bar) | PR 3 | `npx vitest run frontend/src/lib/validation/dashboardFilters.test.js frontend/src/routes/dashboard/dashboard.server.test.js` | `npx playwright test` dashboard filter spec against the real backend (full-stack profile) | Revert `dashboardFilters.js`/`.test.js`, `+page.server.js` load wiring, filter-bar markup in `+page.svelte`, filter-bar CSS, `dashboard.js` POM selectors; page reverts to unfiltered view, PR 2's backend keeps accepting now-unused params |
| 4 | Frontend breakdown charts + reactive-refill fix | PR 4 | `npm run check` (JSDoc/checkJs) | `npx playwright test` dashboard spec, full breakdown + empty-state assertions | Revert `createBarChart` factory, two chart containers, reactive-refill fix, chart-grid CSS, chart POM selectors; charts disappear, DTO fields harmlessly unread again |

## Phase 1: Slice 1 — Backend Aggregation (PR 1)

- [x] 1.1 RED — `DashboardServiceImplTest`: failing tests for `getAppointmentsByStatus()` (4-status zero-fill in enum order) and `getAppointmentsByDentist()` (top-10 + `"Otros"`, `COUNT DESC`/name-`ASC` tiebreak, `sum(dentistBreakdown) == totalAppointments`) against a mocked `IAppointmentRepository`.
- [x] 1.2 GREEN — `IAppointmentRepository.java`: add `countGroupedByStatus`/`countGroupedByDentist` `@Query` group-by methods (`List<Object[]>`, nullable-param idiom) matching 1.1's mock shape.
- [x] 1.3 GREEN — `IDashboardService.java` + `DashboardServiceImpl.java`: implement the two aggregation methods (`LinkedHashMap` zero-fill seeded from `AppointmentStatus.values()`; top-10 sort + `"Otros"` overflow) to pass 1.1.
- [x] 1.4 SAFETY NET — `DashboardServiceImplTest`: add the characterization test pinning current `getAppointmentsByMonth()` output (`months`/`appointmentCounts`) and the exact `countByDateBetween(firstDay,lastDay)` call order via Mockito `InOrder`; passes unmodified today — this is the byte-equivalence guard slice 2 must not break.
- [x] 1.5 GREEN — `DashboardSnapshotDTO.java`: add `statusBreakdown`/`dentistBreakdown` + nested `StatusCountDTO`/`DentistCountDTO`; `withDefaults()` seeds both empty.
- [x] 1.6 GREEN — `IDashboardSnapshotService.java` + impl: two new apply-sections wiring the aggregations into the DTO, preserving the existing `catch (RuntimeException ignored)` idiom.
- [x] 1.7 REFACTOR/VERIFY — `mvn -f backend/pom.xml -Dtest=DashboardServiceImplTest,DashboardSnapshotServiceTest test` green; confirm the endpoint stays param-less and `@Cacheable` untouched.

## Phase 2: Slice 2 — Backend Filtering + Cache (PR 2)

- [x] 2.1 RED — `DashboardControllerTest`: failing tests for `from > to` → `400` and `from`/`to`/`dentistId` bound and forwarded to the service.
- [x] 2.2 RED — `DashboardSnapshotServiceTest`: failing tests — `totalDentists`/`totalPatients` stay global under `dentistId`; `todayAppointments == 0` when today ∉ `[from,to]`.
- [x] 2.3 RED — `DashboardSnapshotCacheBehaviourTest` (new): failing runtime test — 2 unfiltered calls → 1 delegate invocation (cached); 2 filtered calls → 2 invocations, cache never populated.
- [x] 2.4 GREEN — `AppointmentServiceCacheAnnotationsTest`: extend reflection assertions to `save`/`update`/`delete` (annotations already present in production code — closes coverage, not a behavior change).
- [x] 2.5 GREEN — `IAppointmentRepository.java`: add `countFiltered` + filtered `findUpcomingAppointments*` query methods.
- [x] 2.6 GREEN — `IDashboardService.java`: add filter-triple overloads; keep zero-arg `getAppointmentsByMonth()` as a `default` delegating to `(null,null,null)`.
- [x] 2.7 GREEN — `DashboardServiceImpl.java`: implement the range resolver (`from`-only → `from..today`; `to`-only → `(to−5mo)..to`; both → `from..to` clamped to the last 24 buckets) and filtered counts/aggregation to pass 2.2.
- [x] 2.8 GREEN — `IDashboardSnapshotService.java` + impl: add `from`/`to`/`dentistId` params to `getDashboardSnapshot()`; add `@Cacheable(key = "'default'", condition = "all three null")` to pass 2.3.
- [x] 2.9 GREEN — `DashboardController.java`: add three `@RequestParam(required = false)` with `@DateTimeFormat(iso = ISO.DATE)` and the inverted-range `400` guard to pass 2.1.
- [x] 2.10 REFACTOR/VERIFY — `mvn -f backend/pom.xml -Dtest=DashboardControllerTest,DashboardSnapshotServiceTest,DashboardSnapshotCacheBehaviourTest,AppointmentServiceCacheAnnotationsTest,DashboardServiceImplTest test` green; confirm 1.4's characterization test is unchanged (default output proven byte-equivalent, not assumed).

## Phase 3: Slice 3 — Frontend Filter Controls (PR 3)

- [x] 3.1 RED — `dashboardFilters.test.js`: failing cases — valid filters, `from > to` inverted, unparsable date, partial (`from`-only/`to`-only), non-numeric `dentistId`.
- [x] 3.2 GREEN — `frontend/src/lib/validation/dashboardFilters.js`: implement `parseDashboardFilters(searchParams)` → `{valid, error, applied, raw}` to pass 3.1.
- [x] 3.3 RED — `dashboard.server.test.js`: failing cases — `load({url})` forwards valid params; invalid input falls back to an unfiltered fetch + `filterError` + echoed `raw`; the 4 existing auth branches must stay green.
- [x] 3.4 GREEN — `frontend/src/routes/dashboard/+page.server.js`: `load({url, locals})` calls `parseDashboardFilters`, forwards valid params to the snapshot fetch, runs `GET /api/dentists` in parallel via `Promise.all(...).catch(() => [])` to pass 3.3.
- [x] 3.5 GREEN — `frontend/src/routes/dashboard/+page.svelte`: add date-range inputs + dentist `<select>`, and a distinct `#filter-error` `role="alert"` banner with `aria-invalid`/`aria-describedby` (does not touch the existing `#error-message` banner).
- [x] 3.6 GREEN — `frontend/static/css/views/dashboard.css`: filter-bar styling via `base/tokens.css`.
- [x] 3.7 GREEN — `frontend/tests/fullstack/pages/dashboard.js`: add page-object selectors for filter inputs, dentist select, and `#filter-error`.
- [x] 3.8 RED — extend the dashboard Playwright spec: failing E2E for filter round trip via URL, back-button correctness, Refrescar preserving the active filter, and `#filter-error` visibility on invalid input.
- [x] 3.9 GREEN — verify 3.4–3.7 satisfy 3.8; fix any gap.
- [x] 3.10 VERIFY — run `authorization.spec.js`/`auth.spec.js` unchanged as a green gate: ADMIN boundary unaffected by the new params/controls (`dashboard.js` selectors may be reused, but pass/fail assertions stay untouched).

## Phase 4: Slice 4 — Frontend Breakdown Charts (PR 4)

- [ ] 4.1 GREEN — `+page.svelte`: implement `createBarChart(container, labels, values, color)` with its own label-closure (never the shared `chartLabelMap`), `uPlot.paths.bars({size:[0.6,60], align:0, gap:4, radius:0.1})`, x-scale range `[0.5, n+0.5]`.
- [ ] 4.2 GREEN — `+page.svelte`: add two chart containers (status, dentist) fed by `statusBreakdown`/`dentistBreakdown`; reuse the existing `getStatusLabel()` map for the status axis.
- [ ] 4.3 GREEN — `+page.svelte`: fix the reactive-chart-empty-then-refill defect — the reactive block must re-invoke the render path when `chart` is `null` instead of gating permanently; extend to all three chart instances.
- [ ] 4.4 GREEN — `+page.svelte`: extend `onDestroy` and the resize handler to all three chart instances.
- [ ] 4.5 GREEN — `frontend/static/css/views/dashboard.css`: chart-grid and `.chart-empty` styling.
- [ ] 4.6 GREEN — `frontend/tests/fullstack/pages/dashboard.js`: add selectors for both new chart containers and the empty state.
- [ ] 4.7 RED — extend the dashboard Playwright spec: failing E2E for status/dentist breakdown rendering, the empty-breakdown state (no uncaught error), and filter-to-empty-then-widen chart refill.
- [ ] 4.8 GREEN — verify 4.1–4.6 satisfy 4.7; fix any gap.
- [ ] 4.9 VERIFY — re-run `authorization.spec.js`/`auth.spec.js` as the final-slice ADMIN-boundary gate.

## Phase 5: Cross-Slice Verification

- [ ] 5.1 `mvn test` (backend, full suite) green across all 4 slices.
- [ ] 5.2 `npx vitest run` (frontend unit) green, including `dashboardFilters.test.js` and `dashboard.server.test.js`.
- [ ] 5.3 `npm run check` clean (JSDoc + `checkJs`).
- [ ] 5.4 `npx playwright test` (full fullstack suite: auth, authorization, dashboard specs) green.
- [ ] 5.5 Spot-check every `proposal.md` Success Criteria item against implemented behavior before requesting `sdd-apply`.

## Out of Scope (per proposal/design)

- Replacing uPlot — stays vendored; `paths.bars()` confirmed present.
- Patient filter, status-filter as an input control, chart-type toggles, series toggling, saved/shareable filter presets.
- Svelte component-test infrastructure (deferred; Vitest load-fn + Playwright only).
- Changing the ADMIN-only boundary, the appointments search page, or CSV export contents.
- Redesigning the visual layout of existing stat cards/upcoming panel, or `dashboard.css` beyond the new controls/charts.
