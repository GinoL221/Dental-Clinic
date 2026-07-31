# Tasks: Mobile-Responsive List Pages

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~335–410 total across 2 PRs (PR 1 merged slices 1+2 ~205–250, PR 2 slice 3 ~130–160) |
| 400-line budget risk | Low (per PR, given the merge below) |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (overflow fix + card transform) → PR 2 (mobile E2E) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low

**Slice-merge decision — MERGE 1+2, forecast confirmed, not assumed**: slice 1 (`.table-container` overflow: 1 rule, ~5 lines; header CSS incl. its own media query, ~10–15 lines; 3×1-line `style`→`class` swaps, ~6 lines) ≈ 35–50 lines — matches design.md. Slice 2 (`@media` card block, ~40 CSS lines; `data-label`+`role`+`svelte-ignore` across dentists(5)/patients(6)/appointments(8) columns — each `<table>`/`<tbody>`/`<tr>` tag and every `<td>` counted as a remove+add diff line, plus 9 `svelte-ignore` comments; `cell-truncate` span; `responsive.css` comment) ≈ 170–200 lines — also matches design.md. Combined ≈ 205–250 lines, comfortably under 400 even at the high end, and slice 1's blast radius genuinely is small (design.md). **Decision: merge into PR 1.** Slice 3 stays separate per design.md's explicit mandate — the only slice touching shared `testIgnore` config, where replace-not-merge semantics mean a mistake breaks every other fullstack suite, independent of size. Result: **2 PRs, not 3.**

**TDD note**: no Svelte component-test infra exists (deliberate, per design.md Testing Strategy — "Not covered"). PR 1's CSS/markup tasks therefore have no unit-test RED to write; they are plain implementation tasks, verified manually, exactly like `register-page-redesign` PR2. The RED/GREEN proof of every PR 1 requirement scenario is deferred to PR 2's E2E spec (`responsive.spec.js`), written RED against the already-merged PR 1 code.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Overflow fix + header wrap + card transform (merged slices 1+2): `.table-container` scroll fallback, `.list-search-input`, `@media` card block, `data-label`/`role` across 3 pages | PR 1 | `npm run check` (no unit/component infra for CSS/markup; automated proof deferred to PR 2) | `npm run dev`, manual check at 375px and ≥768px | Revert `tables.css` (overflow + card block) and the 3 `+page.svelte` files; attributes are inert without the CSS, so a CSS-only revert is also safe |
| 2 | Mobile E2E: `mobile-fullstack-chromium` project + `responsive.spec.js` (+ optional `pages/lists.js`) | PR 2 | `npx playwright test --config=playwright.fullstack.config.js --project=mobile-fullstack-chromium` | `frontend/tests/fullstack/run-fullstack.js` (real backend + seeded data) | Revert the `playwright.fullstack.config.js` project/`testIgnore` edit and delete `responsive.spec.js` (+ `pages/lists.js`); CSS/markup stay intact |

## Phase 1: Overflow Fix + Header (PR 1, merged slice 1)

- [x] 1.1 `frontend/static/css/components/tables.css`: `.table-container` (lines 38-43) `overflow: hidden` → `overflow-x: auto; overflow-y: hidden` with the escape-hatch comment
- [x] 1.2 `tables.css`: add `.patient-list-header { flex-wrap: wrap }`, descendant-qualified `.patient-list-header .list-search-input { width: 250px }`, and the `@media (max-width: 767.98px)` header rules (`gap`, `> .d-flex { width:100%; flex-wrap:wrap }`, `.list-search-input { width:auto; flex:1 1 12rem; min-width:0 }`)
- [x] 1.3 `frontend/src/routes/patients/+page.svelte`: replace the search `<input>`'s `style="width: 250px"` with `class="form-control list-search-input"`
- [x] 1.4 `frontend/src/routes/dentists/+page.svelte`: same swap
- [x] 1.5 `frontend/src/routes/appointments/+page.svelte`: same swap
- [x] 1.6 Manual verification (no automated coverage yet): confirm `.table-container` border-radius corner clipping is preserved at ≥768px under `overflow-x: auto` before this PR merges (design.md's stated non-risk)

## Phase 2: Card Transform (PR 1, merged slice 2)

- [x] 2.1 `tables.css`: append the `@media (max-width: 767.98px)` card-transform block — `table`/`tbody`/`tr`/`td` → `display: block`/`flex`; `thead` hidden; `td::before { content: attr(data-label) }`; `td[data-label="#"]` hidden; `td[data-label="Acciones"]` footer treatment + `.btn { min-height/min-width: 44px }`; `.cell-truncate` ellipsis rule — exact block per design.md Interfaces/Contracts
- [x] 2.2 `patients/+page.svelte`: `role="table"` on `<table>`, `role="rowgroup"` on `<tbody>`, `role="row"` on `<tr>`, `data-label` + `role="cell"` on all 6 `<td>` (labels `#`, `DNI`, `Nombre Completo`, `Email`, `Fecha Admisión`, `Acciones`, byte-identical to `<th>`); 3 `<!-- svelte-ignore a11y-no-redundant-roles -->` comments
- [x] 2.3 `dentists/+page.svelte`: same pattern, 5 columns (`#`, `Matrícula`, `Nombre Completo`, `Email`, `Acciones`)
- [x] 2.4 `appointments/+page.svelte`: same pattern, 8 columns (`#`, `Fecha`, `Hora`, `Paciente`, `Odontólogo`, `Descripción`, `Estado`, `Acciones`); wrap the `Descripción` value in `<span class="cell-truncate">`
- [x] 2.5 `frontend/static/css/utilities/responsive.css`: add a cross-reference comment under the header block (lines 1-10) pointing to `tables.css`; no rule changes
- [x] 2.6 `npm run check`: confirm all 9 `a11y-no-redundant-roles` warnings are suppressed, zero new warnings
- [x] 2.7 No RED/GREEN here by design (no CSS/markup test infra); every scenario this phase implements is proven retroactively by Phase 3's E2E spec, not by this phase

## Phase 3: Mobile E2E (PR 2, slice 3)

- [ ] 3.1 SETUP — `frontend/playwright.fullstack.config.js`: add `mobile-fullstack-chromium` project (`use: {...devices['Pixel 5']}`, `dependencies: ['setup']`, `testMatch: /responsive\.spec\.js/`) and restate **both** `testIgnore` patterns (`**/process-runner.spec.js`, `**/responsive.spec.js`) on `fullstack-chromium` — `testIgnore` replaces, not merges
- [ ] 3.2 (optional) `frontend/tests/fullstack/pages/lists.js`: shared page object for patients/dentists/appointments (table container, header, search input, rows, cells by `data-label`, empty-state), following the `pages/` convention
- [ ] 3.3 RED — `frontend/tests/fullstack/responsive.spec.js` (new): failing assertions for the **page-overflow check** (`document.documentElement.scrollWidth <= window.innerWidth + 1`, all 3 routes), the **thead-hidden / `#`-hidden checks** (`thead` and `td[data-label="#"]` hidden, every other `td` visible), and the **`::before` content-via-evaluate check** (label text read via `page.evaluate`, since pseudo-content is not in `textContent`)
- [ ] 3.4 GREEN — run 3.3 against `mobile-fullstack-chromium`; confirm Phase 1–2 CSS/markup satisfies every assertion; fix any gap
- [ ] 3.5 RED — extend the spec: **label-parity DOM comparison** (`td[i].dataset.label === th[i].textContent.trim()` for every column, all 3 pages) and **ARIA role-based locator checks** (`getByRole('table'|'rowgroup'|'row'|'cell')` counts match row/cell counts)
- [ ] 3.6 GREEN — verify 3.5; fix any gap
- [ ] 3.7 RED — extend the spec: **44×44 touch-target `boundingBox()` checks** on the edit link and delete button, the **delete-dialog-dismiss safety check** (`page.once('dialog', d => d.dismiss())`, assert it fired and the row survives), and the **empty-state check** (no-match search, message visible, no overflow)
- [ ] 3.8 GREEN — verify 3.7; fix any gap (adjust `.btn` min-height/min-width in `tables.css` if a touch target fails)
- [ ] 3.9 RED — extend the spec: **desktop-reset-context checks** (`browser.newContext({...devices['Desktop Chrome'], storageState: ADMIN_STORAGE_STATE})`: `overflowX === 'auto'`, no page overflow, `thead` visible, no `::before` label rendered)
- [ ] 3.10 GREEN — verify 3.9; fix any gap
- [ ] 3.11 VERIFY — **full-suite regression gate**: run `auth`, `authorization`, `booking`, `register`, `dashboard` specs; confirm each runs exactly once and stays green; confirm `pages/appointments.js`'s `td` index reads are unaffected

## Phase 4: Cross-Slice Verification

- [ ] 4.1 `npm run check` clean across both PRs (final gate on the 9 suppressed warnings)
- [ ] 4.2 `npx playwright test --config=playwright.fullstack.config.js` full suite green (`fullstack-chromium` + `mobile-fullstack-chromium`)
- [ ] 4.3 Spot-check every `proposal.md` Success Criteria item against implemented behavior before requesting `sdd-apply`

## Out of Scope (per proposal/design)

- Landing, login, register, dashboard, and error routes — already covered by `responsive.css`/`dashboard.css`
- Add/edit forms (`*/add`, `*/edit/[id]`)
- Bootstrap version/CDN sourcing, or reordering the Bootstrap `<link>` in `+layout.svelte` (design.md: a real latent hazard, but its own change)
- Visual-regression/screenshot-diff tooling
- Svelte component-test infrastructure (deferred, unchanged from prior changes)
- Sorting, per-card collapse/expand, tap-to-expand on `Descripción`, promoted card titles, or any change to search/filter/delete logic
- Deleting dead `.dentist-list-header`/`.dentist-list-title`/`.btn-add-dentist` CSS (`tables.css:12-36`) — separate cleanup
- `.content-card` padding tightness at 375px — not overflowing, not fixed here
