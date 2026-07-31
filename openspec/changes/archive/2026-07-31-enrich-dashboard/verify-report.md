# Verify Report: Enrich Dashboard Filters and Breakdowns

## Verification Method

Native `sdd-verify` is blocked for the same class of reason documented for `harden-playwright-e2e` and `register-page-redesign`: it requires an approved native review receipt, and the installed `gentle-ai` CLI (2.2.2) has a confirmed, still-open upstream bug — this time [gentle-ai#2028](https://github.com/Gentleman-Programming/gentle-ai/issues/2028) ("provide recovery path for rejected reviewer results"). Re-checked before this archive: still OPEN, and a firsthand comment on the issue confirms it reproduces even against the newest pre-release `v2.2.3-rc.4`. No stable release newer than the installed 2.2.2 exists.

In place of the native gate, this report documents a manual final verification: every test layer in the repository re-run fresh, on `main` HEAD (`f1dc069`) after all 4 chained PRs merged.

## Final Full-Suite Verification (run fresh for this report)

| Suite | Command | Result |
|---|---|---|
| Backend (all tests) | `mvn clean test` (backend/) | **188/188 passed**, 0 failures, 0 errors |
| Frontend unit tests | `npm test` (frontend/) | **105/105 passed** (17 test files) |
| Frontend typecheck | `npm run check` | 399 files, **89 errors in 3 pre-existing files** (unrelated E2E harness code — see Known Gap below) — zero in any file touched by this change |
| Frontend mock E2E | `npm run test:e2e` | **3/3 passed** |
| Frontend process-runner tests | `npm run test:e2e:process` | **11/11 passed** |
| Frontend full-stack E2E (live) | `npm run test:e2e:fullstack` — real backend + real SvelteKit preview + real Chromium | **19/19 passed** (11 pre-existing journeys + 8 new dashboard journeys), clean shutdown |

The full-stack run was independently re-verified multiple times across PR1–PR4 implementation and review, plus once more fresh for this report — all green, plus green in GitHub Actions CI on every PR (#55, #57, #59, #61).

## Known Gap (honest disclosure, not hidden)

Same disclosed gap as prior archives: 89 `svelte-check` errors in `frontend/tests/fullstack/{run-fullstack.js,process-runner.spec.js,fixtures/process-runner-fixtures.js}` — pre-existing to this change, untyped-`any`/`undefined`-vs-`number` JSDoc mismatches in E2E harness test code, not runtime defects. This change touched none of those files and introduced zero new typecheck errors in its own files (confirmed at every PR, including one regression caught and fixed mid-review — see below).

## Native Review Coverage

No native review lens completed for this change's scope — `gentle-ai#2028` blocks capture for any lens producing real findings. Verification here is entirely manual/independent, per the same maintainer-approved fallback used for the two prior changes.

## Real Issues Found and Fixed During Implementation

1. **Highest-risk decision, verified correct**: the previously keyless `@Cacheable(value = "dashboardSnapshot", unless = "#result == null")` was reworked (PR2) into `@Cacheable(key = "'default'", condition = "#from == null && #to == null && #dentistId == null")`. Proven correct by a dedicated full-Spring-context test (`DashboardSnapshotCacheBehaviourTest`): 2 unfiltered calls produce 1 delegate invocation (cached), 2 filtered calls produce 2 invocations (never cached). The named-SpEL `-parameters` dependency design.md flagged as a load-bearing gotcha was independently confirmed present (via `mvn help:effective-pom`, inherited from `spring-boot-starter-parent`) — no fallback needed.
2. **PR1 characterization test integrity, verified explicitly**: PR1's `shouldPreserveCurrentMonthlyDefaultOutputAndCallOrder` test (pinning the pre-existing last-6-months default output and exact `countByDateBetween` call order) has **zero diff** across PR2, PR3, and PR4 — confirmed via `git diff --stat` returning empty for that file at every subsequent slice. The default (unfiltered) dashboard view is provably byte-equivalent to pre-change behavior, not merely assumed.
3. **PR3 svelte-check regression caught by independent re-verification, not by the implementing sub-agent**: the PR3 implementation report never ran/mentioned `npm run check`. My own independent run found 95 errors / 5 files — 6 new beyond the 89/3 baseline (an implicit-`any` param, and 2 new tests doing property access on a `void`-inclusive inferred `load()` return type). Fixed both before merging PR3 (see PR3's own commit `18b288d`). Documented in Engram as a reinforcement of "always personally run the check command, don't just trust a sub-agent's pass/fail summary."
4. **Latent defect identified at design time, fixed in PR4**: the dashboard's reactive chart-update block was gated on the chart instance already existing (`$: if (snapshot && chart) {...}`), so filtering a breakdown to empty (destroying its chart) and then widening the filter again left the chart permanently absent — unreachable before this change (no filters existed), newly reachable once filters were added. Fixed by gating on the container element instead of the chart instance, and proven by a dedicated E2E test (`widening a filter that emptied the dentist chart brings it back (reactive-refill fix)`).
5. **PR2 stat-card semantics ambiguity, resolved explicitly**: the proposal's "filter reach = whole panel" decision left `totalDentists`/`totalPatients` semantics under a dentist filter undefined. Design and spec both settled on: appointment-derived counts (`totalAppointments`, `todayAppointments`, `upcomingAppointments`, both breakdowns) narrow to the active filter; `totalDentists`/`totalPatients` are entity-existence counts and stay global. Implemented and unit-tested in PR2 (`DashboardSnapshotServiceTest`).

## Task Completion

**Total tasks**: 41 across 6 phases (5 implementation phases + 1 cross-slice verification phase). **Completed**: 41 (100%).

| Phase | Tasks | PR | Status |
|---|---|---|---|
| 1: Backend Aggregation | 1.1–1.7 | #55 | ✅ Complete |
| 2: Backend Filtering + Cache | 2.1–2.10 | #57 | ✅ Complete |
| 3: Frontend Filter Controls | 3.1–3.10 | #59 | ✅ Complete |
| 4: Frontend Breakdown Charts | 4.1–4.9 | #61 | ✅ Complete |
| 5: Cross-Slice Verification | 5.1–5.5 | #61 + this report | ✅ Complete |

## Spec Compliance Summary

### `dashboard-filtering` (7 requirements, 13 scenarios)

| Requirement | Covered by | Status |
|---|---|---|
| Optional Filter Parameters | `DashboardControllerTest`, `dashboardFilters.test.js` | ✅ PASS |
| Default Window Unchanged When No Filter Is Applied | `DashboardServiceImplTest`'s characterization test (zero diff since PR1) | ✅ PASS |
| Invalid Or Inverted Date Range Is Rejected | `DashboardControllerTest` (400), `dashboardFilters.test.js`, `dashboard.spec.js` (`#filter-error` E2E) | ✅ PASS |
| Filter Reach Spans The Entire Snapshot | `DashboardSnapshotServiceTest`, `dashboard.spec.js` (URL round trip narrows every section) | ✅ PASS |
| Per-Stat-Card Semantics Under An Active Filter | `DashboardSnapshotServiceTest` (`totalDentists`/`totalPatients` global; `todayAppointments == 0` outside range) | ✅ PASS |
| Cache Applies Only To The Fully Unparameterized Request | `DashboardSnapshotCacheBehaviourTest` (real Spring context, proven not assumed) | ✅ PASS |
| ADMIN-Only Boundary Is Preserved | `authorization.spec.js`/`auth.spec.js` — zero diff across all 4 PRs, green at every slice | ✅ PASS |

### `dashboard-breakdowns` (6 requirements, 11 scenarios)

| Requirement | Covered by | Status |
|---|---|---|
| Status Breakdown Always Includes All Four Statuses | `DashboardServiceImplTest` (zero-fill, enum order) | ✅ PASS |
| Dentist Breakdown Excludes Zero-Activity Dentists | `DashboardServiceImplTest` | ✅ PASS |
| Dentist Breakdown Is Capped At Top 10 With An "Otros" Overflow Bar | `DashboardServiceImplTest` (8-active, 14-active-overflow, tiebreak, sum invariant) | ✅ PASS |
| Breakdowns Honor The Active Filter | `DashboardSnapshotServiceTest`, `dashboard.spec.js` | ✅ PASS |
| Empty Breakdown Renders Without Error | `dashboard.spec.js` (`an empty breakdown renders the empty state without an uncaught JS error`) | ✅ PASS |
| Dentist Bars Are Labelled By Display Name | `dashboard.spec.js` (`dentist breakdown chart renders when data exists`) | ✅ PASS |

## Final Authority

Per the Final-State Authority hierarchy:
1. **Native review authority**: None obtained — blocked by gentle-ai#2028, re-confirmed open (including against the 2.2.3-rc.4 pre-release) before this archive.
2. **Persisted tasks artifact**: All 41 tasks checked, verified against real code state.
3. **Explicit final-state facts**: 4 PRs merged to `main` — #55 (aggregation), #57 (filtering+cache), #59 (filter controls), #61 (breakdown charts). All CI green on every PR, including the live `Full-Stack E2E (Chromium)` job.
4. **Fresh full-suite re-run for this report**: 188/188 backend, 105/105 frontend unit, 3/3 mock E2E, 11/11 process-runner, 19/19 live full-stack — all passing on `main` HEAD `f1dc069`.

**Conclusion**: All work completed and verified. The one known gap (89 pre-existing typecheck errors in unrelated E2E harness code) is disclosed, not hidden, and untouched by this change.

## Risks

**Resolved**: the cache-condition rework (highest-risk decision in the whole change) proven correct by a dedicated runtime test; the reactive chart-refill defect found at design time and fixed with a dedicated regression test; a svelte-check regression caught by independent re-verification and fixed before merge.
**Accepted, not blocking**: the 89 pre-existing typecheck errors (see Known Gap); native review receipt unavailable pending gentle-ai#2028; pixel-level visual review of chart legibility (bar width/spacing at various data volumes) not automated — no visual regression tooling in this repo.

## Rollback Boundary

Revert the 4 merged PRs (#55, #57, #59, #61) together, in reverse order, to roll back the entire change — each slice's rollback plan (documented in design.md and each PR) confirms independent revertibility: reverting PR4 removes the new charts (DTO fields harmlessly unread); reverting PR3 restores the unfiltered page (backend keeps accepting now-unused params); reverting PR2 restores the keyless cache and param-less endpoint (safe, since PR1 added no params); reverting PR1 restores the original DTO. No database migration, no irreversible external change, no backend files touched outside this change's own scope.
