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
