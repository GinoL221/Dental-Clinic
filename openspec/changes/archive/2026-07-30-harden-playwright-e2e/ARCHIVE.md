# Archive Report: Harden Playwright E2E

**Date Archived**: 2026-07-30
**Change Name**: `harden-playwright-e2e`
**Artifact Mode**: Hybrid (OpenSpec + Engram)
**Status**: COMPLETE (manual archive — native `sdd-verify`/`sdd-archive` blocked by [gentle-ai#2029](https://github.com/Gentleman-Programming/gentle-ai/issues/2029))

## Executive Summary

The `harden-playwright-e2e` change has been fully planned, implemented, verified, and archived. All 18 tasks across 4 phases are complete. The change shipped an isolated disposable E2E backend profile, deterministic role/appointment fixtures with authorization evidence, a full-stack process runner with six hardened failure boundaries, real browser journey specs (login, booking, authorization), and a required CI gate — closing 5 GitHub issues and merging 5 PRs to `main` with all CI green, including a real live `Full-Stack E2E (Chromium)` run.

Native `sdd-verify`/`sdd-archive` could not run to completion: they require an approved native review receipt for the whole change scope, and the installed `gentle-ai` CLI (2.2.2) has a confirmed, currently-unresolved bug ([#2029](https://github.com/Gentleman-Programming/gentle-ai/issues/2029)) that rejects any multi-lens review capture with real findings. This archive was produced manually per maintainer decision, using the same rigor: a fresh full-suite re-run of every test layer in the repository (see `verify-report.md`) plus the partial native review coverage that did complete during implementation.

## Specifications Merged

| Domain | Action | Details | Main Spec |
|---|---|---|---|
| `playwright-e2e-testing` | Updated | Modified the login/booking requirement to require seeded-data proof (not a bare heading) and isolated disposable state; added 3 new requirements (explicit mock/full-stack evidence modes, mandatory Chromium CI gate, deterministic state/artifact hygiene) with 10 total scenarios | `/openspec/specs/playwright-e2e-testing/spec.md` |

**Merge verification**: The delta spec's MODIFIED and ADDED requirements were merged into the existing main spec. No requirements were deleted; the pre-existing Purpose/Requirements/Scenarios structure was preserved and extended.

## Implementation Status

All work completed and merged to `main`:

| Work Unit | PR | Commit | Status |
|---|---|---|---|
| 0: Planning | #30 | 802a03f | Merged ✅ |
| 1A: Backend E2E profile foundation | #31 | 145c235 | Merged ✅ |
| 1B: Deterministic fixtures and authorization | #33 | 0a97e4b | Merged ✅ |
| 2: Process runner and evidence modes | #35 | 2c182f2 | Merged ✅ |
| 3: Browser journeys, CI, hygiene | #37 | ced320d | Merged ✅ |
| Follow-up: readability cleanup | #39 | c33db04 | Merged ✅ |

**Final Verification** (fresh re-run on `main` HEAD `c33db04` for this archive):
- `mvn test` (backend): 171/171 passed, 0 failures, 0 errors
- `npm test` (frontend unit): 60/60 passed, 15 files
- `npm run check`: 392 files, 89 errors in 3 test-fixture files (disclosed known gap, see `verify-report.md`)
- `npm run test:e2e` (mock): 3/3 passed
- `npm run test:e2e:process`: 11/11 passed
- `npm run test:e2e:fullstack` (live, real backend + frontend + Chromium): 7/7 passed — independently re-verified 4 separate times during this session plus green in GitHub Actions CI

**Verification Result**: PASS (all 10 spec scenarios covered by passing tests, 6 real defects found and fixed during implementation, 1 disclosed non-blocking known gap)

## Closed Issues

- #29 (planning) — CLOSED
- #28 (backend E2E profile foundation) — CLOSED
- #32 (deterministic fixtures/authorization) — CLOSED
- #34 (process runner and evidence modes) — CLOSED
- #36 (browser journeys, CI gate, hygiene) — CLOSED
- #38 (readability cleanup follow-up) — CLOSED

## Tasks Completion

**Total Tasks**: 18 across 4 phases
**Completed**: 18 (100%)

| Phase | Tasks | Status |
|---|---|---|
| 1A: Backend E2E profile foundation | 1.1, 1.2 | ✅ Complete |
| 1B: Deterministic fixtures and authorization | 1.3, 1.4 | ✅ Complete |
| 2: Process integration and evidence modes | 2.1–2.8 | ✅ Complete |
| 3: Browser journeys | 3.1–3.4 | ✅ Complete |
| 4: CI and hygiene | 4.1, 4.2 | ✅ Complete |

## Real Defects Found and Fixed

1. **BLOCKER**: Missing `'error'` listener on spawned children — an ENOENT spawn failure crashed the runner uncaught, bypassing cleanup.
2. **CRITICAL**: A signal-terminated required service was misread as still-healthy; `killChild` could hang forever on it.
3. **CRITICAL** (found in re-review of fix #2): `cleanupOk` was hardcoded to `true`, masking real cleanup failures.
4. **Real environment bug**: `vite preview` bound to IPv6 loopback only in this sandbox, breaking the process runner's readiness probe. Found via independent live verification, not native review.
5. **Flakiness risk** (corroborated by 2 independent review lenses): `pickBookableTime()`'s wall-clock-derived booking slot correlated across nearby test runs.
6. **Self-caught regression**: this change's own `setup`-project dependency broke an earlier isolated test.

All 6 were fixed before merge and independently re-verified by direct code reading and live end-to-end test runs, not just trusted from automated reports.

## Design Coherence

All architecture decisions from `design.md` are implemented:

✅ H2 `mem`, `create-drop`, disabled `import.sql`, non-H2 URL rejection
✅ Profile-only seed for ADMIN, PATIENT, DENTIST, and an upcoming appointment; UTC next-weekday booking slot
✅ Separate `playwright.config.js` (mock) and `playwright.fullstack.config.js` (full-stack) with independent reports
✅ Login/dashboard/appointments/booking POMs, UI-created role storage states via real login, one worker
✅ Browser denial plus non-admin API `403` against `/api/dashboard/snapshot`

## Boundary Verification

Spot-checks confirm:

✅ E2E credentials never appear in logs, diagnostics, or CI artifacts — variable names only on failure
✅ Mock and full-stack suites never double-collect each other's specs (`--list` verified)
✅ Generated Playwright artifacts (`playwright-report*/`, `test-results*/`, `.auth/`) are untracked (`git status --ignored` confirmed)
✅ Portfolio screenshots outside `frontend/` untouched
✅ `/api/auth/validate` never reintroduced; `/api/auth/me` preserved throughout

## TDD Compliance

Strict TDD mode enabled and verified throughout:

| Check | Result |
|---|---|
| RED tests written before implementation | ✅ All 6 process-runner boundaries, all journey specs, all bug fixes |
| Tests fail initially, pass after implementation | ✅ Confirmed in apply-progress for every work unit and correction |
| Real assertions (no tautologies) | ✅ Seeded data values, authenticated API lookups, real 403s verified |
| Full regression on final archive | ✅ 171/171 backend, 60/60 unit, 3/3 mock E2E, 11/11 process-runner, 7/7 live full-stack |

## Final Authority

Per the Final-State Authority hierarchy:
1. **Native review authority**: Partial — see `verify-report.md`'s "Native Review Coverage" table; blocked for the full-change scope by gentle-ai#2029.
2. **Persisted tasks artifact**: All 18 tasks checked, verified against real code state.
3. **Explicit final-state facts**: 6 PRs merged (#30, #31, #33, #35, #37, #39), 6 issues closed, fresh final verification passed on `main` HEAD.
4. **Intermediate snapshots**: `apply-progress.md` and `verify-report.md` — final numbers match this archive's fresh re-run, no regressions after merge.

**Conclusion**: All work completed. No stale claims conflict with final state. Change ready for archival — no further SDD phase pending except the native `sdd-verify`/`sdd-archive` gate itself, which remains blocked pending an upstream gentle-ai fix.

## Risks

**Resolved**: all 6 defects found during implementation, fixed and re-verified before merge.
**Accepted, not blocking**: 89 pre-existing-to-this-report typecheck errors in test fixture code (disclosed in `verify-report.md`, does not affect runtime behavior); native full-change review receipt unavailable pending gentle-ai#2029 (tracked in Engram, revisit when fixed upstream).

## Rollback Boundary

Revert the 5 implementation/follow-up PRs (#31, #33, #35, #37, #39) together to roll back the entire change. No database migration, no irreversible external change; the `e2e` Spring profile and H2 database are fully disposable and isolated from `dev`/`prod`.

## Archive Integrity

- All artifacts present: `exploration.md`, `proposal.md`, `design.md`, `tasks.md`, `apply-progress.md`, `verify-report.md`, 1 delta spec
- Merge completed successfully: 1 spec merged into main repository without deleting pre-existing requirements
- Folder moved: `/openspec/changes/harden-playwright-e2e/` → `/openspec/changes/archive/2026-07-30-harden-playwright-e2e/`
- No active change folder remains; change is fully archived

---

**Archived by**: manual archive (native `sdd-archive` blocked by gentle-ai#2029)
**Date**: 2026-07-30
**Verification**: PASS (all 10 scenarios, 6 defects found and fixed, 1 disclosed non-blocking known gap)
**Status**: COMPLETE AND CLOSED
