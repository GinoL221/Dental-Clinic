# Archive Report: Enrich Dashboard Filters and Breakdowns

**Date Archived**: 2026-07-31
**Change Name**: `enrich-dashboard`
**Artifact Mode**: Hybrid (OpenSpec + Engram)
**Status**: COMPLETE (manual archive — native `sdd-verify`/`sdd-archive` blocked by [gentle-ai#2028](https://github.com/Gentleman-Programming/gentle-ai/issues/2028))

## Executive Summary

The `enrich-dashboard` change has been fully planned, implemented, verified, and archived. All 41 tasks across 5 implementation phases plus cross-slice verification are complete. The change replaced the dashboard's single hardcoded last-6-months view with a fully filterable panel (date range + dentist) spanning every section — stat cards, upcoming appointments, the monthly chart, and two new breakdown charts (by status, by dentist) — while fixing a pre-existing, previously-undetected cache correctness bug and a latent chart-refill defect the new filters would otherwise have exposed. Delivered as 4 chained PRs, closing 4 GitHub issues and merging to `main` with all CI green, including the live `Full-Stack E2E (Chromium)` job on every PR.

Native `sdd-verify`/`sdd-archive` could not run to completion, for the same class of reason as the two prior changes in this project: the installed `gentle-ai` CLI (2.2.2) has a confirmed, still-unresolved upstream bug ([#2028](https://github.com/Gentleman-Programming/gentle-ai/issues/2028)) that leaves the review lineage permanently stuck after any reviewer result with real findings is rejected. Re-checked immediately before this archive: still open, unresolved even against the newest pre-release (`v2.2.3-rc.4`) per a firsthand report on the issue itself. This archive was produced manually per maintainer decision, using the same rigor as the two prior manual archives: a fresh full-suite re-run of every test layer (see `verify-report.md`).

## Specifications Merged

| Domain | Action | Details | Main Spec |
|---|---|---|---|
| `dashboard-filtering` | Added (new) | 7 requirements, 13 scenarios covering optional from/to/dentistId params, byte-equivalent default window, invalid-range rejection, whole-panel filter reach, explicit per-stat-card semantics, condition-gated caching, and the preserved ADMIN boundary | `/openspec/specs/dashboard-filtering/spec.md` |
| `dashboard-breakdowns` | Added (new) | 6 requirements, 11 scenarios covering the always-4-statuses rule, zero-activity dentist exclusion, the top-10 + "Otros" overflow cap, filter-honoring breakdowns, the empty-state guard, and dentist display-name labelling | `/openspec/specs/dashboard-breakdowns/spec.md` |

**Merge verification**: Both are net-new spec domains (no pre-existing main spec to merge into); moved as-is into `openspec/specs/`.

## Implementation Status

All work completed and merged to `main`:

| Work Unit | Issue | PR | Status |
|---|---|---|---|
| PR1: Backend aggregation (status/dentist breakdowns) | #54 | #55 | Merged ✅ |
| PR2: Backend filtering + condition-gated cache | #56 | #57 | Merged ✅ |
| PR3: Frontend filter controls | #58 | #59 | Merged ✅ |
| PR4: Frontend breakdown charts + chart-refill fix | #60 | #61 | Merged ✅ |

**Final Verification** (fresh re-run on `main` HEAD `f1dc069` for this archive):
- `mvn clean test` (backend): 188/188 passed, 0 failures, 0 errors
- `npm test` (frontend unit): 105/105 passed, 17 files
- `npm run check`: 399 files, 89 errors in 3 pre-existing test-fixture files (disclosed known gap, see `verify-report.md`), zero in any file touched by this change
- `npm run test:e2e` (mock): 3/3 passed
- `npm run test:e2e:process`: 11/11 passed
- `npm run test:e2e:fullstack` (live, real backend + frontend + Chromium): 19/19 passed (11 pre-existing + 8 new dashboard journeys) — independently re-verified multiple times during this session, plus green in CI on every PR

**Verification Result**: PASS (all 24 spec scenarios covered by passing tests, 1 highest-risk cache correctness rework proven via a dedicated runtime test, 1 latent defect found at design time and fixed with a regression test, 1 svelte-check regression caught by independent re-verification and fixed before merge)

## Closed Issues

- #54 (backend aggregation) — CLOSED
- #56 (backend filtering + cache) — CLOSED
- #58 (frontend filter controls) — CLOSED
- #60 (frontend breakdown charts + chart-refill fix) — CLOSED

## Tasks Completion

**Total Tasks**: 41 across 6 phases
**Completed**: 41 (100%)

| Phase | Tasks | Status |
|---|---|---|
| 1: Backend Aggregation | 1.1–1.7 | ✅ Complete |
| 2: Backend Filtering + Cache | 2.1–2.10 | ✅ Complete |
| 3: Frontend Filter Controls | 3.1–3.10 | ✅ Complete |
| 4: Frontend Breakdown Charts | 4.1–4.9 | ✅ Complete |
| 5: Cross-Slice Verification | 5.1–5.5 | ✅ Complete |

## Real Issues Found and Fixed

1. **Highest-risk decision in the whole change, verified correct**: reworked a previously keyless `@Cacheable(value = "dashboardSnapshot")` — confirmed via direct file read to have no `key`/`condition` before this change — into `@Cacheable(key = "'default'", condition = "#from == null && #to == null && #dentistId == null")`. Proven correct by a dedicated full-Spring-context test proving unfiltered requests are cached and filtered requests never are, not merely asserted. The design's flagged `-parameters`/named-SpEL dependency was independently verified present before relying on it.
2. **Latent defect found at design time, fixed in PR4**: the dashboard's reactive chart-update logic was gated on the chart instance already existing, so a filter narrowing a breakdown to empty (destroying its chart) followed by widening the filter again would leave the chart permanently absent. This was unreachable before this change (no filters existed) and newly reachable once filters shipped. Fixed and covered by a dedicated E2E regression test before it could ever reach production.
3. **svelte-check regression caught by independent re-verification, not by the implementing agent**: PR3's own implementation report never ran `npm run check`. Independent re-verification found 6 new type errors beyond the established baseline (an implicit-`any` parameter and 2 tests exercising a `void`-inclusive inferred return type). Fixed before merge, restoring the 89-error/3-file baseline exactly.
4. **Stat-card semantics ambiguity, resolved explicitly rather than left implicit**: "filter reach = whole panel" (a mid-proposal scope decision) left `totalDentists`/`totalPatients` behavior under a dentist filter undefined. Resolved as: appointment-derived counts narrow to the filter; entity-existence counts (`totalDentists`, `totalPatients`) stay global — implemented and unit-tested.

## Design Coherence

All architecture decisions from `design.md` are implemented:

✅ One filter triple resolved once per request, threaded through a single controller → snapshot-service → dashboard-service → repository path — whole-panel filtering is structural, not four coincidences
✅ Cache condition-gated to the unparameterized view only, `key = "'default'"` as a belt-and-braces bound
✅ Per-DTO-field semantics: appointment-derived counts narrow, entity-existence counts stay global, `todayAppointments == 0` when today falls outside the range
✅ Default window byte-equivalent by construction (zero-arg `default` method delegating to the 3-arg form), proven via a characterization test with zero diff across 3 subsequent PRs
✅ Dentist cap N = 10 with a deterministic `COUNT DESC, name ASC` tiebreak and an "Otros" overflow bar preserving the `sum == total` invariant
✅ Status breakdown always 4 entries, zero-filled in enum order
✅ Distinct `#filter-error` banner, never touching the pre-existing snapshot-fetch-failure banner
✅ Per-chart label closures (`createBarChart` factory) preventing the 3-chart shared-label-map collision the design explicitly flagged
✅ Bar chart x-scale `[0.5, n+0.5]`, not the monthly chart's `[1,n]` (which would clip the first/last bar)

## Boundary Verification

Spot-checks confirm:

✅ `authorization.spec.js`/`auth.spec.js` have zero diff across all 4 PRs — ADMIN-only boundary (SvelteKit guard + `@PreAuthorize("hasRole('ADMIN')")`) unaffected by any new param/control
✅ No backend file touched in PR3/PR4 (frontend-only, confirmed via empty `git status --porcelain -- backend/`)
✅ No Svelte component-test infrastructure added — consistent with the same scope decision made in `register-page-redesign`
✅ Inverted/unparsable date ranges rejected with a visible error, never silently coerced or a raw 500

## TDD Compliance

Strict TDD mode enabled and verified throughout:

| Check | Result |
|---|---|
| RED tests written before implementation | ✅ Every phase (1–4) has a documented genuine RED failure in `apply-progress.md`, including a real Spring-context RED for the cache behavior test and a git-stash-based RED proof for the E2E chart tests (no component-test infra available) |
| Tests fail initially, pass after implementation | ✅ Confirmed in `apply-progress.md` for all 4 PRs with real failing-then-passing output |
| Real assertions (no tautologies) | ✅ Real cache-hit-count assertions via Mockito `verify(times(n))`, real DOM `.uplot` class presence, real backend aggregation query results |
| Full regression on final archive | ✅ 188/188 backend, 105/105 unit, 3/3 mock E2E, 11/11 process-runner, 19/19 live full-stack |

## Final Authority

Per the Final-State Authority hierarchy:
1. **Native review authority**: None — blocked by gentle-ai#2028 for the full change scope; re-confirmed open (including against pre-release 2.2.3-rc.4) immediately before this archive.
2. **Persisted tasks artifact**: All 41 tasks checked, verified against real code state.
3. **Explicit final-state facts**: 4 PRs merged (#55, #57, #59, #61), 4 issues closed, fresh final verification passed on `main` HEAD `f1dc069`.
4. **Intermediate snapshots**: `apply-progress.md` and `verify-report.md` — final numbers match this archive's fresh re-run, no regressions after merge.

**Conclusion**: All work completed. No stale claims conflict with final state. Change ready for archival — no further SDD phase pending except the native `sdd-verify`/`sdd-archive` gate itself, which remains blocked pending an upstream gentle-ai fix.

## Risks

**Resolved**: the cache-condition rework (highest-risk item) proven correct by dedicated runtime test; the reactive chart-refill defect found and fixed before it could reach users; a svelte-check regression caught and fixed before merge.
**Accepted, not blocking**: 89 pre-existing-to-this-change typecheck errors in unrelated E2E harness code (disclosed in `verify-report.md`); native review receipt unavailable pending gentle-ai#2028 (tracked in Engram, revisit when fixed upstream); chart legibility at extreme data volumes not automated-verified (no visual regression tooling in this repo).

## Rollback Boundary

Revert the 4 implementation PRs (#55, #57, #59, #61) together, in reverse order, to roll back the entire change. No database migration, no irreversible external change. Each slice was independently revertible per its own PR's rollback plan.

## Archive Integrity

- All artifacts present: `proposal.md`, `design.md`, `tasks.md`, `apply-progress.md`, `verify-report.md`, 2 delta specs
- Merge completed successfully: 2 net-new specs added to `openspec/specs/` without conflicting with any pre-existing requirements
- Folder moved: `/openspec/changes/enrich-dashboard/` → `/openspec/changes/archive/2026-07-31-enrich-dashboard/`
- No active change folder remains; change is fully archived

---

**Archived by**: manual archive (native `sdd-archive` blocked by gentle-ai#2028)
**Date**: 2026-07-31
**Verification**: PASS (all 24 scenarios, 1 highest-risk cache rework proven, 1 latent defect found and fixed, 1 review-caught regression fixed before merge)
**Status**: COMPLETE AND CLOSED
