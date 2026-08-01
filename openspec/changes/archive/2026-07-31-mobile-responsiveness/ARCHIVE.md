# Archive Report: Mobile-Responsive List Pages

**Date Archived**: 2026-07-31
**Change Name**: `mobile-responsiveness`
**Artifact Mode**: Hybrid (OpenSpec + Engram)
**Status**: COMPLETE (manual archive — native `sdd-verify`/`sdd-archive` blocked by [gentle-ai#2028](https://github.com/Gentleman-Programming/gentle-ai/issues/2028))

## Executive Summary

The `mobile-responsiveness` change has been fully planned, implemented, verified, and archived. All 27 tasks across 4 phases are complete. This closes the last of the 3 SDD changes agreed with the maintainer from the README's "Pendientes / Mejoras Futuras" list — register page (done, archived), dashboard (done, archived), and mobile responsiveness (this one).

The change fixed two concrete overflow bugs on the three data-list pages (`.table-container`'s silent clipping and an unwrapped, fixed-width list header) and transformed table rows into stacked cards below 767.98px via a CSS-only, `data-label`-driven transform — no markup duplication, no viewport-detection JS. Delivered as 2 chained PRs, closing 2 GitHub issues and merging to `main` with all CI green, including the live `Full-Stack E2E (Chromium)` job on both PRs.

Native `sdd-verify`/`sdd-archive` could not run to completion, for the same class of reason as the two prior changes in this project: the installed `gentle-ai` CLI (2.2.2) has a confirmed, still-unresolved upstream bug ([#2028](https://github.com/Gentleman-Programming/gentle-ai/issues/2028)). Re-checked immediately before this archive: still open, unresolved even against the newest pre-release (`v2.2.3-rc.4`). This archive was produced manually per maintainer decision, using the same rigor as the two prior manual archives: a fresh full-suite re-run of every test layer (see `verify-report.md`).

## Specifications Merged

| Domain | Action | Details | Main Spec |
|---|---|---|---|
| `mobile-list-layout` | Added (new) | 9 requirements, 15 scenarios covering the scroll fallback, header wrapping, the card-transform breakpoint, card content/label rules, preserved actions, accessibility semantics at every width, the empty state, desktop non-regression, and the scope boundary | `/openspec/specs/mobile-list-layout/spec.md` |

**Merge verification**: Net-new spec domain (no pre-existing main spec to merge into); moved as-is into `openspec/specs/`.

## Implementation Status

All work completed and merged to `main`:

| Work Unit | Issue | PR | Status |
|---|---|---|---|
| PR1: Overflow fix + card transform (+ button-styling follow-up) | #64 | #65 | Merged ✅ |
| PR2: Mobile E2E (Playwright project + spec) | #66 | #67 | Merged ✅ |

**Final Verification** (fresh re-run on `main` HEAD `82d5a34` for this archive):
- `mvn clean test` (backend): 188/188 passed, 0 failures, 0 errors (unaffected — frontend-only change)
- `npm test` (frontend unit): 105/105 passed, 17 files
- `npm run check`: 401 files, 89 errors in 3 pre-existing test-fixture files (disclosed known gap, see `verify-report.md`), 0 warnings, zero in any file touched by this change
- `npm run test:e2e` (mock): 3/3 passed
- `npm run test:e2e:process`: 11/11 passed
- `npm run test:e2e:fullstack` (live, real backend + frontend + Chromium, both projects): 46/46 passed (19 pre-existing + 27 new mobile-responsive tests) — independently re-verified multiple times during this session, plus green in CI on both PRs

**Verification Result**: PASS (all 15 spec scenarios covered by passing tests/manual checks, 1 proposal error corrected at design time, 1 real Playwright config trap caught before it could break the suite, 1 real UX issue caught from a rendered screenshot and fixed pre-merge, 2 real ARIA-counting subtleties resolved during the E2E RED/GREEN cycle)

## Closed Issues

- #64 (overflow fix + card transform) — CLOSED
- #66 (mobile E2E) — CLOSED

## Tasks Completion

**Total Tasks**: 27 across 4 phases
**Completed**: 27 (100%)

| Phase | Tasks | Status |
|---|---|---|
| 1: Overflow Fix + Header | 1.1–1.6 | ✅ Complete |
| 2: Card Transform | 2.1–2.7 | ✅ Complete |
| 3: Mobile E2E | 3.1–3.11 | ✅ Complete |
| 4: Cross-Slice Verification | 4.1–4.3 | ✅ Complete |

## Real Issues Found and Fixed

1. **Proposal was factually wrong about CSS cascade order** — assumed Bootstrap's CDN stylesheet loaded before local CSS; direct verification of `+layout.svelte` found the opposite (Bootstrap loads last), meaning every local override had to win purely on specificity. Corrected at design time before any code was written, with the exact selector strategy (descendant-qualified `.list-search-input`, `td`-level striping neutralization) designed around the real cascade.
2. **A real Playwright config trap, caught before it broke anything**: project-level `testIgnore`/`testMatch` use replace-not-merge semantics (`takeFirst`), confirmed against the installed library's source. The naive fix would have silently dropped the pre-existing `process-runner.spec.js` exclusion. Fixed by restating both patterns; proven correct by confirming every pre-existing spec ran exactly once in the final 46-test run.
3. **A real UX issue caught from an actual rendered screenshot**: after independently rendering the real markup + real CSS in a headless browser and sharing the screenshot, the maintainer flagged that icon-only action buttons weren't vertically centered in their 44px touch target and didn't stand out against the card footer. Fixed and re-confirmed with a second screenshot before merging — this is exactly the kind of defect byte-for-byte design compliance cannot catch on its own.
4. **Two real ARIA-counting subtleties**, found and correctly resolved during the E2E RED/GREEN cycle rather than assumed: `display:none` prunes an element from the accessibility tree even with an explicit `role`; native `<thead>`/`<tr>` carry implicit roles that only surface once no longer hidden (i.e. at desktop widths).

## Design Coherence

All architecture decisions from `design.md` are implemented:

✅ Every mobile CSS override wins on specificity `(0,2,3)`, never on assumed source order — verified against the real, corrected cascade
✅ `overflow-x: auto` / `overflow-y: hidden` preserves the `.table-container` border-radius corner clipping (any non-`visible` overflow value clips identically)
✅ CSS-only `display:block` card transform driven by `data-label`, no Svelte dual-render, no markup duplication
✅ Explicit `role="table"/rowgroup"/row"/cell"` with `svelte-ignore` comments compensate for `display:block`'s implicit-role loss, scoped to `tbody` only (`thead` stays untouched, `display:none` on mobile)
✅ `Descripción` truncation via a dedicated `<span class="cell-truncate">` (anonymous flex items from bare text nodes cannot be styled)
✅ `data-label` attribute selectors (not positional `:first-child`/`:last-child`) for the `"#"`-hidden and `"Acciones"`-footer rules — survives future column reordering
✅ Mobile Playwright project via a device preset (`Pixel 5`), not `setViewportSize`, so `isMobile`/`hasTouch` are genuinely exercised
✅ 44×44px minimum touch targets on action buttons (WCAG 2.5.5 AAA), centered and visually distinct after the maintainer's screenshot feedback

## Boundary Verification

Spot-checks confirm:

✅ Landing, login, register, dashboard, and error routes have zero diff across both PRs — already adequately covered by `utilities/responsive.css` and `views/dashboard.css`
✅ No backend file touched (frontend-only change, confirmed via `git diff --stat`)
✅ No Svelte component-test infrastructure added — consistent with the scope decision made in the two prior changes
✅ `pages/appointments.js`'s existing `td`-index-based reads (used by `booking.spec.js`) are unaffected by the new `data-label`/`role` attributes

## TDD Compliance

Strict TDD mode enabled and verified throughout:

| Check | Result |
|---|---|
| RED tests written before implementation | ✅ PR2's 4-wave E2E cycle: each wave's failing assertions written and confirmed failing for a real reason (a naive `textContent` check, deliberately mutated CSS/config) before the corresponding GREEN |
| Tests fail initially, pass after implementation | ✅ Confirmed in `apply-progress.md` with exact RED/GREEN output for all 4 waves |
| Real assertions (no tautologies) | ✅ Real DOM structure, real computed styles, real ARIA role counts, real touch-target dimensions — not placeholder checks |
| Full regression on final archive | ✅ 188/188 backend, 105/105 unit, 3/3 mock E2E, 11/11 process-runner, 46/46 live full-stack |

Note: PR1 (CSS/markup) has no automated coverage of its own — this repo has no Svelte component-test infrastructure (confirmed, intentionally deferred, same as the two prior changes). Its verification was `npm run check` plus manual/screenshot visual checks; full behavioral coverage came from PR2's E2E suite, exactly as `tasks.md` planned for this work unit.

## Final Authority

Per the Final-State Authority hierarchy:
1. **Native review authority**: None — blocked by gentle-ai#2028 for the full change scope; re-confirmed open (including against pre-release 2.2.3-rc.4) immediately before this archive.
2. **Persisted tasks artifact**: All 27 tasks checked, verified against real code state.
3. **Explicit final-state facts**: 2 PRs merged (#65, #67), 2 issues closed, fresh final verification passed on `main` HEAD `82d5a34`.
4. **Intermediate snapshots**: `apply-progress.md` and `verify-report.md` — final numbers match this archive's fresh re-run, no regressions after merge.

**Conclusion**: All work completed. No stale claims conflict with final state. Change ready for archival — no further SDD phase pending except the native `sdd-verify`/`sdd-archive` gate itself, which remains blocked pending an upstream gentle-ai fix.

## Risks

**Resolved**: the CSS cascade-order correction; the Playwright `testIgnore` trap; the button centering/contrast UX issue caught from a real screenshot; two ARIA-counting subtleties in the E2E assertions.
**Accepted, not blocking**: 89 pre-existing-to-this-change typecheck errors in unrelated E2E harness code (disclosed in `verify-report.md`); native review receipt unavailable pending gentle-ai#2028 (tracked in Engram, revisit when fixed upstream); no automated visual-regression tooling in this repo — verification relies on structural E2E assertions plus manual/screenshot spot-checks.

## Rollback Boundary

Revert the 2 implementation PRs (#65, #67) together, in reverse order, to roll back the entire change. No database migration, no irreversible external change, no backend files touched by this change.

## Archive Integrity

- All artifacts present: `proposal.md`, `design.md`, `tasks.md`, `apply-progress.md`, `verify-report.md`, 1 delta spec
- Merge completed successfully: 1 net-new spec added to `openspec/specs/` without conflicting with any pre-existing requirements
- Folder moved: `/openspec/changes/mobile-responsiveness/` → `/openspec/changes/archive/2026-07-31-mobile-responsiveness/`
- No active change folder remains; change is fully archived

---

**Archived by**: manual archive (native `sdd-archive` blocked by gentle-ai#2028)
**Date**: 2026-07-31
**Verification**: PASS (all 15 scenarios, 1 proposal error corrected at design time, 1 config trap caught pre-merge, 1 real UX issue caught from a screenshot and fixed, 2 ARIA-counting subtleties resolved)
**Status**: COMPLETE AND CLOSED

---

## Project Milestone

This archive closes out all 3 SDD changes agreed with the maintainer from the README's original "Pendientes / Mejoras Futuras" list:
1. **Register page redesign** — archived `2026-07-31` (`openspec/changes/archive/2026-07-31-register-page-redesign/`)
2. **Enrich dashboard** — archived `2026-07-31` (`openspec/changes/archive/2026-07-31-enrich-dashboard/`)
3. **Mobile responsiveness** — archived `2026-07-31` (this report)

All 3 are fully implemented, tested, and merged to `main`.
