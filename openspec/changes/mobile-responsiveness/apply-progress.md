# Apply Progress: Mobile-Responsive List Pages — PR 1

Scope: Phase 1 (Overflow Fix + Header, tasks 1.1–1.6) and Phase 2 (Card
Transform, tasks 2.1–2.7) — the merged slices 1+2 per tasks.md's "MERGE 1+2"
decision. Phase 3 (mobile E2E, tasks 3.1–3.11) is explicitly out of scope for
this PR — it is PR 2, on a separate branch, per the `stacked-to-main` chain
strategy.

Branch: `feat/mobile-list-responsive` (checked out from up-to-date `main`).

**TDD note (no deviation, matches design.md's Testing Strategy verbatim)**: no
Svelte component-test infrastructure exists in this repo (deliberate,
unchanged since `enrich-dashboard`/`register-page-redesign`). Every task in
this PR is plain CSS/markup implementation — there is no unit/component RED
to write. The RED/GREEN proof of every requirement scenario in
`specs/mobile-list-layout/spec.md` is deferred to PR 2's
`responsive.spec.js`, written RED against this PR's already-merged CSS/markup.
This matches the established `register-page-redesign` PR2 precedent
explicitly named in tasks.md 2.7.

## Phase 1: Overflow Fix + Header

### 1.1 — `.table-container` overflow fallback

`frontend/static/css/components/tables.css` (lines 38-43 before): changed
`overflow: hidden` to `overflow-x: auto; overflow-y: hidden`, with the
escape-hatch comment verbatim from design.md's Architecture Decision.

### 1.2 — Header wrap + `.list-search-input`

Same file: added `.patient-list-header { flex-wrap: wrap; }`, the
descendant-qualified `.patient-list-header .list-search-input { width: 250px; }`
rule (confirmed via design.md's Verified Facts that Bootstrap CDN loads
*after* local CSS in `+layout.svelte`, so the bare class alone would tie and
lose against `.form-control { width: 100% }` — the descendant qualifier at
(0,2,0) beats it), and the `@media (max-width: 767.98px)` block (`gap: 1rem`,
`> .d-flex { width: 100%; flex-wrap: wrap }`,
`.list-search-input { width: auto; flex: 1 1 12rem; min-width: 0 }`) —
byte-identical to design.md's Interfaces/Contracts Slice 1 snippet.

### 1.3, 1.4, 1.5 — search input class swap

In `patients/+page.svelte`, `dentists/+page.svelte`, `appointments/+page.svelte`:
replaced the search `<input>`'s inline `style="width: 250px"` with
`class="form-control list-search-input"` (existing `form-control` class kept,
`list-search-input` appended, inline style attribute dropped). One-line edit
per file, 3 files.

### 1.6 — Manual verification (border-radius corner clipping)

No automated coverage exists for this yet (deferred to PR 2's E2E spec).
Standing up the full authenticated app (login + seeded backend) purely to
eyeball one CSS property felt disproportionate for a single computed-style
fact, so verification was done via an isolated, minimal reproduction of the
*exact* `.table-container` rule (before/after) rendered with Playwright/
Chromium at 900×400, using a table wider than its 300px container in both
cases:

```
old border-radius: 8px | new border-radius: 8px
new overflow-x: auto | new overflow-y: hidden
```

Screenshot comparison (both panels side by side) confirms the rounded
top-left/bottom-left corners clip the overflowing red table content
identically in both the `overflow: hidden` and the
`overflow-x: auto; overflow-y: hidden` cases — visually indistinguishable.
This is exactly the non-risk design.md's Architecture Decision predicted: any
non-`visible` overflow computed value clips to the rounded padding edge the
same way; `auto` and `hidden` do not differ in this respect. No repository
file was created for this check — it was a throwaway static HTML file in the
session scratchpad, not committed.

**Observed**: border-radius clipping preserved, confirmed both via
`getComputedStyle` (`border-radius: 8px` unchanged) and visually
(screenshot). No corner-clipping regression from this PR's `.table-container`
change.

## Phase 2: Card Transform

### 2.1 — Card-transform CSS block

Appended to `tables.css` the `@media (max-width: 767.98px)` block from
design.md's Interfaces/Contracts Slice 2 snippet, reproduced verbatim:
`table`/`tbody`/`tr` → `display: block` with card border/border-radius/
shadow/margin-bottom; `thead { display: none }`; `td` → `display: flex;
justify-content: space-between; align-items: baseline; gap: 1rem` with
`td::before { content: attr(data-label) }`; `td[data-label="#"] { display:
none }`; `td[data-label="Acciones"]` footer treatment with
`.btn { min-height: 44px; min-width: 44px }` (WCAG 2.5.5 AAA touch target);
`.cell-truncate { min-width: 0; overflow: hidden; text-overflow: ellipsis;
white-space: nowrap }`.

### 2.2, 2.3, 2.4 — roles, `data-label`, `.cell-truncate`

Read each file's actual `<th>` text before hardcoding `data-label` values
(not assumed) — confirmed byte-identical to design.md's parity table:

| Page | Confirmed labels, in DOM order |
|---|---|
| patients (6) | `#`, `DNI`, `Nombre Completo`, `Email`, `Fecha Admisión`, `Acciones` |
| dentists (5) | `#`, `Matrícula`, `Nombre Completo`, `Email`, `Acciones` |
| appointments (8) | `#`, `Fecha`, `Hora`, `Paciente`, `Odontólogo`, `Descripción`, `Estado`, `Acciones` |

Added `role="table"` on `<table>`, `role="rowgroup"` on `<tbody>`, `role="row"`
on each tbody `<tr>` (not the thead's `<tr>`), `data-label` + `role="cell"` on
every `<td>` inside tbody, in all three files. `<thead>`/its `<tr>`/`<th>`
left completely untouched per design.md's explicit rule (`thead` is
`display: none` on mobile, native above it).

`appointments/+page.svelte` only: wrapped the `Descripción` value in
`<span class="cell-truncate">{appointment.description || ''}</span>` — the
anonymous-flex-item problem design.md calls out (a bare text node inside a
flex `<td>` cannot be targeted by `text-overflow: ellipsis`).

Placed `<!-- svelte-ignore a11y-no-redundant-roles -->` immediately before
each of `<table>`, `<tbody>`, and each tbody `<tr>` — 3 comments per file, 9
total. Verified via `npm run check` (see 2.6 below) rather than assumed: the
compiler emitted **zero** `a11y-no-redundant-roles` warnings after these
comments were added, confirming 3-per-file placement (not per-`<td>`) is
correct and sufficient — matching design.md's stated expectation exactly, no
adjustment needed.

### 2.5 — `responsive.css` cross-reference comment

Added a comment under the existing header block (no rule changes) noting
that list-page table responsiveness now lives in `components/tables.css`.

### 2.6 — `npm run check` verification

Ran before and understood the baseline is `89 ERRORS, 0 WARNINGS, 3
FILES_WITH_PROBLEMS` (all three pre-existing E2E-harness TypeScript-in-JS
files: `tests/fullstack/run-fullstack.js`,
`tests/fullstack/fixtures/process-runner-fixtures.js`,
`tests/fullstack/process-runner.spec.js` — none touched by this PR).

Exact output after this PR's changes:

```
1785516175464 COMPLETED 399 FILES 89 ERRORS 0 WARNINGS 3 FILES_WITH_PROBLEMS
```

**89 errors / 3 files with problems — unchanged from baseline. 0 warnings —
confirming all 9 `a11y-no-redundant-roles` warnings this change would
otherwise introduce are fully suppressed by the svelte-ignore comments, with
zero new unsuppressed warnings.**

### 2.7 — No RED/GREEN cycle

Confirmed: no test-writing task in this phase. Per tasks.md's explicit note
and design.md's Testing Strategy ("Not covered" for Svelte component tests),
this phase's CSS/markup changes have no automated RED/GREEN cycle in this
PR — exactly the same pattern as `register-page-redesign` PR2. The automated
proof of every scenario in `specs/mobile-list-layout/spec.md` is deferred to
PR 2's `responsive.spec.js`, run against a real mobile device profile
(`mobile-fullstack-chromium`).

## Changed files (`git diff --numstat`)

| File | Action | Additions | Deletions | Changed lines |
|---|---|---|---|---|
| `frontend/static/css/components/tables.css` | Modified | 121 | 1 | 122 |
| `frontend/static/css/utilities/responsive.css` | Modified | 6 | 0 | 6 |
| `frontend/src/routes/patients/+page.svelte` | Modified | 15 | 11 | 26 |
| `frontend/src/routes/dentists/+page.svelte` | Modified | 14 | 10 | 24 |
| `frontend/src/routes/appointments/+page.svelte` | Modified | 17 | 13 | 30 |
| **Total** | | **173** | **35** | **208** |

**208 changed lines** — within the ~205–250 forecast in tasks.md's
Review Workload Forecast for the merged slice-1+2 unit, comfortably under the
400-line budget. No exception needed.

## Constraints honored

- No backend file touched (`git status --porcelain -- backend/` — empty).
- No landing/login/register/dashboard/error route or its CSS touched.
- `playwright.fullstack.config.js` untouched; no `spec.js` file created —
  that is PR 2's scope.
- Dead `.dentist-list-header`/`.dentist-list-title`/`.btn-add-dentist` CSS
  (`tables.css:12-36`) left untouched — explicitly out of scope, separate
  future cleanup.
- No test code written in this PR, per the explicit instruction and
  tasks.md's TDD note — the RED/GREEN proof is deferred to PR 2.

## Deviations from design.md

None — implementation matches design.md's Interfaces/Contracts snippets
verbatim (both the header rules and the card-transform block), and the
`svelte-ignore` placement (3 per file, on `table`/`tbody`/`tr`, not on
`thead` or per-`td`) matches design.md's stated rationale exactly, confirmed
by the `npm run check` 0-warnings result rather than assumed.

## Issues Found

None.

## Status

Phase 1 (tasks 1.1–1.6): 6/6 complete. Phase 2 (tasks 2.1–2.7): 7/7
complete. 13/13 tasks assigned to this PR complete. Ready for `sdd-verify` on
this slice, or for PR 2 (Phase 3 — Mobile E2E) to begin on a new branch
stacked on this one once this PR merges.

---

# Apply Progress: Mobile-Responsive List Pages — PR 2 (final)

Scope: Phase 3 (Mobile E2E, tasks 3.1–3.11) and Phase 4 (Cross-Slice
Verification, tasks 4.1–4.3) — slice 3 per tasks.md's `stacked-to-main` chain
strategy. PR1 (merged, `c883905`) already implements every CSS/markup
requirement; this PR proves it with a real E2E spec against the merged code,
never touching `tables.css`, `responsive.css`, or the three `+page.svelte`
files.

Branch: `feat/mobile-e2e-verification` (checked out from up-to-date `main`,
which already contains PR1's `c883905` merge).

## Environment

Ran the real full-stack stack locally: OpenJDK 21.0.12, Maven (`mvn`),
Node v24.15.0, Playwright 1.61.1 with Chromium already installed
(`~/.cache/ms-playwright`). Generated a fresh `JWT_SECRET` via
`openssl rand -base64 32` (never reused across sessions, never logged) and
used explicit `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`/`E2E_NON_ADMIN_EMAIL`/
`E2E_NON_ADMIN_PASSWORD` values consumed by both the backend's
`E2eSeedProperties` (seeds the admin/patient with these exact credentials)
and the frontend's `auth.setup.js` login — the two sides agree by
construction because they read the same env vars.

## Task 3.1 — `mobile-fullstack-chromium` project + `testIgnore` trap

Read the CURRENT `frontend/playwright.fullstack.config.js` first (per the
instruction), confirmed the existing `fullstack-chromium` project had no
`testIgnore` of its own (inheriting the top-level `'**/process-runner.spec.js'`
only). Verified the `takeFirst` (replace-not-merge) semantics directly in
`node_modules/playwright/lib/common/index.js:654-657` before editing:

```
testIgnore: takeFirst(projectConfig.testIgnore, config.testIgnore, []),
testMatch: takeFirst(projectConfig.testMatch, config.testMatch, "**/*.@(spec|test).?(c|m)[jt]s?(x)"),
```

Added the `mobile-fullstack-chromium` project (`use: {...devices['Pixel 5']}`,
`dependencies: ['setup']`, `testMatch: /responsive\.spec\.js/`) and restated
**both** patterns on `fullstack-chromium`'s own `testIgnore`
(`['**/process-runner.spec.js', '**/responsive.spec.js']`) — confirmed by
task 3.11's full-suite run that `process-runner.spec.js` never got collected
and `responsive.spec.js` ran exactly once, on the mobile project only.
+12 lines, 0 deletions.

## Task 3.2 — `pages/lists.js` shared page object

Read `pages/dashboard.js` and `pages/register.js` first to match the
established convention (plain class wrapping `page`, method-per-locator, JSDoc
param types). Created `ListPage` (61 lines) — one class for all three list
pages since design.md verified they share the identical
table-container/table/thead/tbody/tr/td shape and differ only in route and
column count: `tableContainer()`, `table()`, `thead()`, `headerCells()`,
`searchInput()`, `rows()`, `row(i)`, `cellByLabel(rowIndex, label)`,
`emptyState()`.

## Wave 1 (tasks 3.3/3.4) — overflow, thead/`#`-hidden, `::before` content

**RED #1 (genuine, naive-approach failure)**: wrote the `::before` label
check first with a naive `cell.textContent()` assertion (assuming the label
text would appear in the DOM text), ran it against `mobile-fullstack-chromium`:

```
Error: expect(received).toBe(expected)
Expected: true
Received: false
  73 |     expect(textContent.trim().startsWith(firstLabel)).toBe(true);
3 failed (patients, dentists, appointments)
2 passed (setup)
```

This is a real failure for a real reason: pseudo-element `content` is never
part of `textContent` in any browser — not a tautology, not a mock. Fixed to
the correct approach (`cell.evaluate(el => getComputedStyle(el, '::before').content)`),
confirmed the label text is `"DNI"`/`"Matrícula"`/`"Fecha"` etc. (quoted
per the CSS `content` computed-value serialization) and that plain
`textContent` does **not** start with the label — both assertions green.

**RED #2 (genuine, mutation-tested against real CSS, reverted before commit)**:
temporarily changed `tables.css`'s `.table-container .table thead { display: none }`
to `display: table-header-group` and `td[data-label="#"] { display: none }`
to `display: flex`, rebuilt, reran:

```
Error: expect(locator).toBeHidden() failed
Locator:  locator('.table-container').locator('table').locator('thead')
Expected: hidden
Received: visible
3 failed (patients, dentists, appointments), 2 passed (setup)
```

Reverted both lines (`git diff --stat -- static/css/components/tables.css`
confirmed byte-identical to PR1's merged state before proceeding), rebuilt,
reran: **11/11 passed** (2 setup + 9 assertions × 3 routes).

A third mutation attempt (disabling the header-wrap CSS to probe the
page-overflow assertion) did **not** produce a failure — Bootstrap's default
flex-shrink absorbed the unwrapped header at 393px without triggering a
document-level horizontal scrollbar. This is a genuine, useful finding (not a
methodology failure): the mobile page-overflow assertion is real and
non-trivial (it reads a live computed DOM property, not a hardcoded value),
but its sensitivity in this suite comes from the card-transform/overflow
mechanics proven by RED #2, not from the header-wrap rule in isolation. Noted
here rather than silently discarded.

**GREEN**: 11/11 (`page does not overflow` × 3, `thead hidden / # hidden /
others visible` × 3, `::before renders the label` × 3, + 2 setup).

## Wave 2 (tasks 3.5/3.6) — label parity + ARIA role counts

Wrote the label-parity DOM comparison (`td[i].dataset.label === th[i].textContent.trim()`)
and the ARIA role-count assertions. The label-parity test passed immediately
(genuinely — it's a two-independent-source DOM comparison, sensitive to any
drift, not tautological).

**RED #3 (genuine, unplanned — a real off-by-one, not a fabricated mutation)**:
first attempt at the role-count assertion expected
`getByRole('cell')` to equal `rowCount * route.labels.length` (i.e. every
`<td>` including `"#"`). Ran it:

```
Error: expect(locator).toHaveCount(expected) failed
Locator: getByRole('cell')
dentists — Expected: 5, Received: 4
appointments — Expected: 8, Received: 7
3 failed, 5 passed
```

Real finding: the `"#"` cell carries `role="cell"` in the markup, but is
`display: none` on mobile — and an element removed from layout by
`display:none` is also pruned from the accessibility tree, role attribute or
not. Fixed the expected count to `rowCount * (route.labels.length - 1)`.
**GREEN**: 8/8 (label-parity × 3, ARIA roles × 3, + 2 setup).

## Wave 3 (tasks 3.7/3.8) — touch targets, delete-dialog safety, empty state

All three assertion families passed on first run (11/11: touch-target × 3,
delete-dialog-dismiss × 3, empty-state × 3, + 2 setup) — PR1's follow-up fix
(`18b288d`, centering icons + tinting backgrounds inside `min-height/min-width: 44px`)
already satisfies WCAG 2.5.5 AAA.

**RED #4 (genuine, mutation-tested against real CSS, reverted before commit)**:
temporarily reduced `.btn { min-height/min-width }` inside the `Acciones`
mobile rule from `44px` to `30px`, rebuilt, reran:

```
Error: expect(received).toBeGreaterThanOrEqual(expected)
Expected: >= 44
Received:    36
3 failed (patients, dentists, appointments), 2 passed (setup)
```

Reverted (confirmed byte-identical via `git diff --stat`), rebuilt, reran:
**26/26 passed** (all of Waves 1–3 combined).

The delete-dialog test never risks real seeded data: `page.once('dialog', d
=> d.dismiss())` is registered before the click, the dialog firing is
asserted (`dialogFired === true`), and the row count is asserted unchanged
afterward — the delete `<form>` never actually submits when the dialog is
dismissed.

## Wave 4 (tasks 3.9/3.10) — desktop-reset-context checks

Added, in the same spec file, a `browser.newContext({ ...devices['Desktop Chrome'],
storageState: ADMIN_STORAGE_STATE })` block per design.md's exact snippet.
First run: 5/5 passed immediately (overflowX `auto`, no page overflow, thead
visible, no `::before` label rendered).

**RED #5 (genuine, mutation-tested against real CSS, reverted before commit)**:
widened the card-transform media query from `max-width: 767.98px` to
`max-width: 9999px` (leaking mobile-only rules into the desktop context),
rebuilt, reran:

```
Error: expect(received).toBe(expected)
Expected: "auto"
Received: "visible"
3 failed (patients, dentists, appointments), 2 passed (setup)
```

Reverted (confirmed byte-identical), rebuilt, reran: **29/29 passed**
(all of Waves 1–4).

**RED #6 (genuine, unplanned — a real ARIA-semantics finding, discovered
during the 4.3 success-criteria spot-check)**: `spec.md`'s "Table
Accessibility Semantics Are Preserved At Every Width" requirement explicitly
covers **both** widths, but the desktop test as first written only checked
overflow/thead/`::before`. Added `getByRole` count assertions to the desktop
test, matching Wave 2's mobile pattern. First run:

```
Error: expect(locator).toHaveCount(expected) failed
Locator: getByRole('rowgroup')
Expected: 1, Received: 2
3 failed, 43 passed
```

Real, previously-undocumented finding: at desktop, `<thead>` is visible
(not `display:none`), and native `<thead>`/`<tr>` elements carry **implicit**
ARIA roles (`rowgroup`, `row`) per the HTML-ARIA mapping — even though only
`<tbody>`/its rows carry the *explicit* `role="rowgroup"`/`role="row"`
attributes design.md specifies. At mobile, `display:none` prunes thead from
the accessibility tree so only the explicit tbody roles are counted; at
desktop, both the implicit thead roles and the explicit tbody roles count.
Fixed the desktop assertion to `rowgroup` count `2` and `row` count
`rowCount + 1` (header `<th>` cells map to `columnheader`, not `cell`, so the
cell count is unaffected). **GREEN**: full 46-test suite green (see below).

## Task 3.11 — full-suite regression gate

Ran the full config with **no** `--project` filter (`npx playwright test
--config=playwright.fullstack.config.js`), matching exactly how
`run-fullstack.js:208-211` invokes Playwright (verified: no `--project` flag
in `spawnTest`). Result: **46 passed**, single run, zero duplicates:

| Spec | Tests | Ran |
|---|---|---|
| `auth.spec.js` | 2 | exactly once |
| `authorization.spec.js` | 2 | exactly once |
| `booking.spec.js` | 1 | exactly once |
| `dashboard.spec.js` | 8 | exactly once |
| `register.spec.js` | 4 | exactly once |
| `responsive.spec.js` (new) | 27 | exactly once (mobile project only) |
| `process-runner.spec.js` | — | **never collected** (confirms testIgnore restatement worked) |

`booking.spec.js` exercises `pages/appointments.js`'s existing `readRow()`
(`cells.nth(1)`, `.nth(2)`, `.nth(5)` — plain `td` index reads) and passed
unaffected by the new `data-label`/`role` attributes PR1 added, confirming
design.md's "no markup added or removed" guarantee holds for the one
existing page object that indexes `<td>`s directly.

## Phase 4: Cross-Slice Verification

### 4.1 — `npm run check`

```
1785518612929 COMPLETED 401 FILES 89 ERRORS 0 WARNINGS 3 FILES_WITH_PROBLEMS
```

Same baseline as PR1 (`89 ERRORS 0 WARNINGS 3 FILES_WITH_PROBLEMS` —
`tests/fullstack/run-fullstack.js`, `process-runner.spec.js`,
`fixtures/process-runner-fixtures.js`, all pre-existing, none touched by
either PR). File count rose from 399 (PR1) to 401 (the two new PR2 test
files) with zero new errors or warnings.

### 4.2 — Full Playwright suite via the real orchestrator

Ran the actual consumer path, `npm run test:e2e:fullstack`
(`node tests/fullstack/run-fullstack.js`), not just the direct `npx
playwright test` invocation, to prove the real preflight → build → backend
(`e2e` profile) → frontend (build+preview) → test → cleanup cycle works
end-to-end with the new project in place:

- **First orchestrated run**: 45/46 passed; one transient
  `[mobile-fullstack-chromium] appointments: the first non-"#" column label...`
  failure with `Error: locator.evaluate: Target page, context or browser has
  been closed` after a 30s timeout — an infrastructure-level flake (not an
  assertion failure), most likely resource contention on this dev machine
  from the many back-to-back Maven/Playwright/Chromium invocations run
  during this same verification session (confirmed several unrelated
  background processes — Discord, Zed's Copilot LSP, CodeGraph — were also
  running). Not reproduced on immediate retry.
- **Second orchestrated run** (clean environment, ports freed, fresh
  backend/frontend per the runner's own lifecycle): **46/46 passed**,
  `exitCode: 0`, full preflight → readiness → test → cleanup cycle
  completed correctly.

Also ran `npm run test` (Vitest, 17 files / 105 tests) — **all pass**,
confirming zero regression in the unit-tested modules (none of which this PR
or PR1 touches).

### 4.3 — Success Criteria spot-check (both PRs, full change)

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | 375px: no horizontal page overflow on all 3 routes | Satisfied (note below) | `responsive.spec.js` "page does not overflow horizontally at mobile width" × 3 — PASS. Note: asserted at Pixel 5's 393px viewport (the mandated device preset per design.md, not literally 375px via `setViewportSize`) — the design explicitly rejected `setViewportSize` because it doesn't supply `isMobile`/`hasTouch`; 393px is narrower than the 768px breakpoint by the same margin the requirement cares about |
| 2 | Below 768px: stacked cards, visible labels, `#` suppressed | Satisfied | `thead hidden / # hidden / others visible` + `::before` content tests × 3 pages — PASS, mutation-tested (RED #2) |
| 3 | Edit/delete visible+tappable; delete confirmation fires | Satisfied | 44×44 touch-target test (mutation-tested, RED #4) + delete-dialog-dismiss test (dialog fires, row survives) × 3 — PASS |
| 4 | ARIA roles present at mobile AND desktop widths | Satisfied | Mobile: ARIA role-count test × 3 (RED #3 found the `#`-cell pruning). Desktop: role-count test × 3 (RED #6 found the implicit-thead-role doubling) — both green with counts that correctly differ per width for a documented reason |
| 5 | ≥768px: wide table scrolls instead of clipping | Satisfied | Desktop-context test asserts `overflowX === 'auto'` (mutation-tested, RED #5) + PR1 apply-progress's manual border-radius clipping check |
| 6 | Empty state renders correctly at mobile widths | Satisfied | "a no-match search shows the empty state with no page overflow" × 3 — PASS |
| 7 | Desktop ≥768px rendering byte-identical to pre-change | Satisfied, with a precise scope note | Columns/header/layout are unchanged (design.md's specificity analysis + PR1's "no-ops on the rendered result" claim for the header rules, confirmed by the desktop-context test's thead-visible/no-`::before`-leak assertions). The one deliberate exception is `.table-container`'s `overflow-x` computed value (`hidden` → `auto`), which is an intentional, invisible-unless-a-table-actually-overflows escape hatch (only the 8-column appointments table triggers it) — not a visual regression, but not literally byte-identical either; flagging this precisely rather than checking the box blindly |
| 8 | Landing/login/register/dashboard/error routes untouched | Satisfied | Both PRs' diffs touch only `tables.css`, `responsive.css` (comment only), the 3 list `+page.svelte` files, `playwright.fullstack.config.js`, and 2 new test files — `git diff --stat` across both PRs confirms no dashboard/landing/login/register/error file appears |
| 9 | `npm run test`, `npm run check`, full-stack suite all pass on every slice | Satisfied | This session: Vitest 105/105, `npm run check` 89/0/3 (baseline), full-stack suite 46/46 (via the real `npm run test:e2e:fullstack` orchestrator). PR1's own apply-progress independently recorded its `npm run check` baseline too |
| 10 | No slice exceeds 400 lines without an accepted exception | Satisfied, with an honest overrun flagged | PR1: 208 changed lines (its own apply-progress). PR2: **304 changed lines** (see below) — both comfortably under 400, no exception needed, but PR2 is materially above its own ~130–160 forecast; flagged per the maintainer's pre-agreed tolerance for honest overruns |

## Changed files (PR2)

| File | Action | Additions | Deletions | Changed lines |
|---|---|---|---|---|
| `frontend/playwright.fullstack.config.js` | Modified | 12 | 0 | 12 |
| `frontend/tests/fullstack/pages/lists.js` | Created | 61 | 0 | 61 |
| `frontend/tests/fullstack/responsive.spec.js` | Created | 231 | 0 | 231 |
| **Total** | | **304** | **0** | **304** |

**304 changed lines** vs. the ~130–160 forecast in tasks.md — a real
overrun (roughly 144–174 lines above forecast), driven by: (a) the spec
covering 4 full waves × 3 routes with descriptive test names and comments
documenting each genuine finding, per the strict-TDD assertion-quality rules
this repo enforces; (b) the desktop-reset-context block duplicating role
assertions for the "both widths" requirement found during the 4.3 spot-check.
Still 96 lines under the 400-line budget — no exception needed, but noted
per the maintainer's stated tolerance for honest, case-by-case overruns.

## Constraints honored

- No backend file touched (`git status --porcelain -- backend/` — empty).
- `tables.css`, `responsive.css`, and the three `+page.svelte` files are
  **untouched** in the final diff (`git diff --stat` shows only
  `playwright.fullstack.config.js` + 2 new test files) — every mutation used
  for genuine RED evidence (RED #2, #4, #5) was reverted and confirmed
  byte-identical (`git diff --stat -- static/css/components/tables.css`
  empty) before the corresponding GREEN run.
- No genuine PR1 implementation gap was found — all 6 mutation/RED probes
  confirmed PR1's CSS/markup already satisfies every scenario in
  `specs/mobile-list-layout/spec.md`. RED #3 and RED #6 were gaps in *this
  PR's own test assertions* (not in PR1's production code), fixed in this
  same PR since `responsive.spec.js` is entirely PR2 scope.
- Delete-dialog test never mutates seeded data (dialog dismissed, row count
  asserted unchanged).
- Did not push or open a PR — commit only, on `feat/mobile-e2e-verification`.

## Deviations from design.md

None in the final implementation. Two genuine, documented gaps were found
and fixed during the RED/GREEN cycle, both in this PR's own test code (not
in design.md or PR1's production code):
1. RED #3 — the ARIA cell-count assertion needed to exclude the `"#"` cell
   (pruned from the accessibility tree by `display:none`, despite carrying
   `role="cell"`).
2. RED #6 — the desktop ARIA assertion needed to account for `<thead>`'s
   native implicit `rowgroup`/`row` roles, absent from design.md's Testing
   Strategy table (which only specifies overflow/thead-visible/`::before`
   for the desktop check) but required by `spec.md`'s "preserved at every
   width" scenario. Closed this gap since it was found during the mandatory
   4.3 success-criteria spot-check, before declaring the change complete.

## Issues Found

One transient infrastructure flake during the first `npm run
test:e2e:fullstack` orchestrated run (see 4.2) — a Playwright "target page,
context or browser has been closed" error on a 30s timeout, most likely
caused by resource contention from other processes running on this
development machine during the same session. Not reproduced on immediate
retry (second orchestrated run: 46/46 clean). No code change was made in
response to this — it is not attributable to `responsive.spec.js`,
`lists.js`, or the config change.

## Status

Phase 3 (tasks 3.1–3.11): 11/11 complete. Phase 4 (tasks 4.1–4.3): 3/3
complete. 14/14 tasks assigned to this PR complete.

**Both PRs of the `mobile-responsiveness` change are now complete.**
PR1 (`feat/mobile-list-responsive`, merged to `main` as `c883905`, plus the
`c30cedd` touch-target follow-up fix) implemented Phases 1–2. PR2
(`feat/mobile-e2e-verification`, this branch) implements Phases 3–4 and
proves every scenario in `specs/mobile-list-layout/spec.md` with a real,
mutation-tested E2E spec against a real backend. The change is ready for
`sdd-verify` and, once this PR is reviewed and merged, for manual archive of
the `mobile-responsiveness` change.
