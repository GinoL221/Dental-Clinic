# Archive Report: Register Page Redesign

**Date Archived**: 2026-07-31
**Change Name**: `register-page-redesign`
**Artifact Mode**: Hybrid (OpenSpec + Engram)
**Status**: COMPLETE (manual archive — native `sdd-verify`/`sdd-archive` blocked by [gentle-ai#2028](https://github.com/Gentleman-Programming/gentle-ai/issues/2028))

## Executive Summary

The `register-page-redesign` change has been fully planned, implemented, verified, and archived. All 20 tasks across 6 phases are complete. The change replaced the register page's generic HTML5-only validation with real inline, accessible client-side validation (blur + live retry after first failure + submit-time block), applied the maintainer-approved OpenPencil mockup redesign (gradient bar, icon+title header, 3-section 2-column grid, restyled inputs, privacy-notice card), and added full-stack Playwright E2E coverage proving it all end-to-end against the real backend — closing 3 GitHub issues and merging 3 PRs to `main` with all CI green, including the live `Full-Stack E2E (Chromium)` job.

Native `sdd-verify`/`sdd-archive` could not run to completion: they require an approved native review receipt, and the installed `gentle-ai` CLI (2.2.2) has a confirmed, still-unresolved upstream bug ([#2028](https://github.com/Gentleman-Programming/gentle-ai/issues/2028)) that leaves the review lineage permanently stuck after any reviewer result with real findings is rejected, with no recovery or terminal transition. Re-checked immediately before this archive: still open, and unresolved even against the newest available pre-release (`v2.2.3-rc.4`) per a firsthand report on the issue itself. This archive was produced manually per maintainer decision, using the same rigor as the prior `harden-playwright-e2e` manual archive: a fresh full-suite re-run of every test layer in the repository (see `verify-report.md`).

## Specifications Merged

| Domain | Action | Details | Main Spec |
|---|---|---|---|
| `register-form-validation` | Added (new) | 10 requirements, 19 scenarios covering required/format/length/numeric/match field validation, blur/submit/live-retry timing, the server action's error contract, the confirm-password server guard, and accessible error announcement | `/openspec/specs/register-form-validation/spec.md` |
| `register-form-presentation` | Added (new) | 7 requirements, 11 scenarios covering the gradient bar, icon+title header, 2-column section grid, restyled inputs, unsuppressed password validation styling, submit button styling, and the privacy-notice card | `/openspec/specs/register-form-presentation/spec.md` |

**Merge verification**: Both are net-new spec domains (no pre-existing main spec to merge into); moved as-is into `openspec/specs/`.

## Implementation Status

All work completed and merged to `main`:

| Work Unit | Issue | PR | Status |
|---|---|---|---|
| PR1: Validation module + server action contract | #44 | #45 | Merged ✅ |
| Unplanned fix: pre-existing weekend-date test bug (found investigating PR1's CI) | #46 | #47 | Merged ✅ |
| PR2: Svelte template wiring + CSS redesign | #48 | #49 | Merged ✅ |
| PR3: Full-stack E2E coverage | #50 | #51 | Merged ✅ |

**Final Verification** (fresh re-run on `main` HEAD `ebb56f3` for this archive):
- `mvn test` (backend): 170/170 passed, 0 failures, 0 errors
- `npm test` (frontend unit): 94/94 passed, 16 files
- `npm run check`: 396 files, 89 errors in 3 pre-existing test-fixture files (disclosed known gap, see `verify-report.md`), zero in any file touched by this change
- `npm run test:e2e` (mock): 3/3 passed
- `npm run test:e2e:process`: 11/11 passed
- `npm run test:e2e:fullstack` (live, real backend + frontend + Chromium): 11/11 passed (7 pre-existing + 4 new register journeys) — independently re-verified 4 times during this session, plus green in CI on every PR

**Verification Result**: PASS (all 30 spec scenarios covered by passing tests/manual checks, 1 pre-existing unrelated defect found and fixed in a separate PR, 1 review-budget overrun explicitly accepted, 1 disclosed non-blocking known gap)

## Closed Issues

- #44 (validation module + server action contract) — CLOSED
- #46 (pre-existing weekend-date test bug) — CLOSED
- #48 (Svelte template wiring + CSS redesign) — CLOSED
- #50 (full-stack E2E coverage) — CLOSED

## Tasks Completion

**Total Tasks**: 20 across 6 phases
**Completed**: 20 (100%)

| Phase | Tasks | Status |
|---|---|---|
| 1: Validation Rules Module | 1.1–1.3 | ✅ Complete |
| 2: Server Action Contract | 2.1–2.2 | ✅ Complete |
| 3: Client Wiring | 3.1–3.4 | ✅ Complete |
| 4: Presentation CSS | 4.1–4.3 | ✅ Complete |
| 5: E2E Coverage | 5.1–5.3 | ✅ Complete |
| 6: Verification | 6.1–6.3 | ✅ Complete |

## Real Issues Found and Fixed

1. **Pre-existing, unrelated bug** (found investigating PR1's unexpected CI failure): backend appointment tests hardcoded `LocalDate.now().plusDays(1)` as "tomorrow," failing whenever "today" is a Friday or Saturday since `AppointmentServiceImpl` rejects weekend appointments. Confirmed via a throwaway git worktree that it reproduced identically on `main` alone, before this change touched anything. Fixed in a separate PR (#47) per explicit maintainer decision, before continuing this change.
2. **PR2 review-budget overrun** (self-reported by `sdd-apply`, independently confirmed via `git diff --numstat`): 424 changed lines vs. the 400-line ask-on-risk budget, from unavoidable repetition wiring 10 near-identical form fields. Maintainer explicitly accepted the overrun rather than force a premature `Field`-component abstraction.
3. **Caught a false "all green" sub-agent self-report**: independent re-verification of PR3 found 1 flaky E2E timeout the sub-agent's report didn't mention; 3 subsequent clean re-runs attributed it to environmental CPU load, not a real defect. Reinforces why every phase in this change was independently re-verified (diffs read directly, commands re-run personally) rather than trusting agent reports at face value.

## Design Coherence

All architecture decisions from `design.md` are implemented:

✅ Validation timing: blur always validates; live re-validation only after a field's first failure; submit blocks via `use:enhance`'s `cancel()` and focuses the first invalid field
✅ Accessible error wiring: `aria-invalid`/`aria-describedby` per field; `role="alert"` general banner focused via `tick()` after render
✅ CSS responsibility split: `forms.css` owns geometry only; `auth.css` owns all `.is-invalid` visual styling — login page's shared `.auth-card`/`.auth-input` independently confirmed unaffected
✅ Server action: `confirmPassword` guard short-circuits before `apiFetch`; backend message passthrough with a synthetic-`HTTP error!` filter, replacing the old 409/400 status-code branching
✅ E2E POM convention: `RegisterPage` follows the exact shape of the existing `LoginPage` (`pages/login.js`)

## Boundary Verification

Spot-checks confirm:

✅ Login page (`/login`) renders unaffected — plain `.auth-card`, no `.password-input`/`.auth-card--wide` (confirmed via `curl` diff, not assumed)
✅ No backend files modified across all 3 PRs (register-page-redesign is frontend-only; the one backend fix was tracked and shipped as its own separate, unrelated PR)
✅ No Svelte component-test infrastructure added — explicitly deferred as a documented future idea (Engram: `dental-clinic/future-svelte-component-test-infra`), per maintainer's explicit scope decision
✅ Redirect target (`/login?registered=true`) and duplicate-email message (`"El email ya está registrado"`) verified by reading the actual server/backend source, not assumed

## TDD Compliance

Strict TDD mode enabled and verified throughout:

| Check | Result |
|---|---|
| RED tests written before implementation | ✅ `registerForm.test.js` (32 cases), `register.server.test.js` additions, `register.spec.js` (genuine import-failure RED) |
| Tests fail initially, pass after implementation | ✅ Confirmed in `apply-progress.md` for PR1 and PR3 with real failing-then-passing output |
| Real assertions (no tautologies) | ✅ Real backend duplicate-email message, real redirect target, real DOM-rendered `aria-invalid`/error elements |
| Full regression on final archive | ✅ 170/170 backend, 94/94 unit, 3/3 mock E2E, 11/11 process-runner, 11/11 live full-stack |

Note: PR2 (Svelte template/CSS wiring) has no automated component-test layer — this repo has no Svelte component-test infrastructure (confirmed, intentionally deferred). Its verification was `npm run check` + manual `npm run dev`/curl checks; full behavioral coverage (blur/focus/aria in a real browser) came from PR3's E2E suite, as planned in `tasks.md`'s harness column for that work unit.

## Final Authority

Per the Final-State Authority hierarchy:
1. **Native review authority**: None — blocked by gentle-ai#2028 for the full change scope; re-confirmed open (including against pre-release 2.2.3-rc.4) immediately before this archive.
2. **Persisted tasks artifact**: All 20 tasks checked, verified against real code state.
3. **Explicit final-state facts**: 3 PRs merged (#45, #49, #51) plus 1 unrelated fix PR (#47), 4 issues closed, fresh final verification passed on `main` HEAD `ebb56f3`.
4. **Intermediate snapshots**: `apply-progress.md` and `verify-report.md` — final numbers match this archive's fresh re-run, no regressions after merge.

**Conclusion**: All work completed. No stale claims conflict with final state. Change ready for archival — no further SDD phase pending except the native `sdd-verify`/`sdd-archive` gate itself, which remains blocked pending an upstream gentle-ai fix.

## Risks

**Resolved**: pre-existing weekend-date bug found and fixed in its own PR before continuing; PR2's budget overrun explicitly reviewed and accepted; one flaky E2E run investigated to a load-related, non-code root cause.
**Accepted, not blocking**: 89 pre-existing-to-this-change typecheck errors in unrelated E2E harness code (disclosed in `verify-report.md`); native review receipt unavailable pending gentle-ai#2028 (tracked in Engram, revisit when fixed upstream); pixel-level visual fidelity to the OpenPencil mockup not automated-verified (no visual regression tooling in this repo) — recommend a human spot-check.

## Rollback Boundary

Revert the 3 implementation PRs (#45, #49, #51) together to roll back the entire change. No database migration, no irreversible external change, no backend files touched by this change (the unrelated weekend-date fix, #47, is independent and does not need to be reverted alongside it).

## Archive Integrity

- All artifacts present: `proposal.md`, `design.md`, `tasks.md`, `apply-progress.md`, `verify-report.md`, 2 delta specs
- Merge completed successfully: 2 net-new specs added to `openspec/specs/` without conflicting with any pre-existing requirements
- Folder moved: `/openspec/changes/register-page-redesign/` → `/openspec/changes/archive/2026-07-31-register-page-redesign/`
- No active change folder remains; change is fully archived

---

**Archived by**: manual archive (native `sdd-archive` blocked by gentle-ai#2028)
**Date**: 2026-07-31
**Verification**: PASS (all 30 scenarios, 1 pre-existing unrelated defect found and fixed, 1 budget overrun accepted, 1 disclosed non-blocking known gap)
**Status**: COMPLETE AND CLOSED
