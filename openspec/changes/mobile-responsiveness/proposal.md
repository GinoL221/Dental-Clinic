# Proposal: Mobile-Responsive List Pages

## Intent

The three data-list pages (`/patients`, `/dentists`, `/appointments`) are the only routes with no mobile treatment at all, and both of their layout regions break on a phone viewport:

- **Table clipping.** `frontend/static/css/components/tables.css` — the single stylesheet all three pages rely on for their tables — contains **zero `@media` queries** and sets `.table-container { overflow: hidden }` (line 41). There is no horizontal-scroll escape hatch, so a 5-, 6-, or 8-column table on a ~375px viewport is silently clipped: content is not merely cramped, it is unreachable.
- **Header overflow.** All three pages carry a byte-identical header block: `<div class="patient-list-header d-flex justify-content-between align-items-center mb-4">` with **no `flex-wrap`**, containing a title plus a search `<input>` with a hardcoded inline `style="width: 250px"`, a clear button, and an "Agregar" button. At 375px that unwrapped row overflows the container horizontally.

Everything else is already covered and must not be re-touched: Bootstrap 5.3.3 (CDN, `+layout.svelte`) already reflows the dashboard and all form grids; the viewport meta tag in `app.html` is correct; the navbar already uses a working `navbar-expand-lg` + `navbar-toggler` hamburger; `utilities/responsive.css` already handles landing, auth, and error pages; `views/dashboard.css` already has its own two `@media (max-width: 767px)` blocks including the just-merged `.filter-bar`.

Maintainer-confirmed scope: fix the overflow bugs **and** transform table rows into stacked cards below a mobile breakpoint — not just add horizontal scroll.

## Scope

### In Scope

- `.table-container` gains a horizontal-scroll fallback (tablet/desktop safety net for the 8-column appointments table).
- A mobile card transform for the list-page tables: below the phone breakpoint, rows render as stacked label/value cards instead of a scrollable grid.
- A responsive list-page header: wrapping flex row, and the hardcoded `width: 250px` search input replaced by a fluid, class-driven width.
- `data-label` and explicit ARIA `role` attributes on the table markup of the three list pages (the only markup change the card transform requires).
- A mobile-viewport Playwright project and a new E2E spec asserting the breakpoint behavior.

### Out of Scope

- **Landing, login, register, dashboard, and error routes.** Already covered by `utilities/responsive.css` and `views/dashboard.css`; re-touching them re-opens two just-archived changes for no gain.
- Add/edit forms (`*/add`, `*/edit/[id]`) — they reuse `.auth-card`/`.row`/`.col-md-6` and inherit the existing auth treatment.
- Bootstrap version, CDN-vs-npm sourcing, or replacing Bootstrap's grid.
- Visual-regression / screenshot-diff tooling — does not exist in this repo and is not introduced here (same disclosed gap as `register-page-redesign` and `enrich-dashboard`).
- Svelte component-test infrastructure — intentionally deferred by prior changes; new UI is covered by Playwright only.
- Promoting one column to a card title, sorting, per-card collapse/expand, or any behavioral change to search/filter/delete logic.

## Capabilities

### New Capabilities

- `mobile-list-layout`: the responsive contract for `/patients`, `/dentists`, `/appointments` — breakpoint thresholds, the table→card transform (which columns appear, how labels derive, how actions render, what happens to `#` and `table-striped`), horizontal-scroll fallback above the card breakpoint, list-header wrapping and search-input sizing, empty-state behavior, and preserved table accessibility semantics.

### Modified Capabilities

- None. `css-architecture` and `playwright-e2e-testing` requirements are unchanged — this change must satisfy them, not alter them. `css-architecture` constrains *file structure*, not media-query placement; `playwright-e2e-testing` explicitly does not forbid additional Chromium projects.

## Approach

**Breakpoints — reuse the repo convention.** `768px` and `576px` are already the established thresholds (`utilities/responsive.css` uses 768/576/400; `views/dashboard.css` uses 767px). No new custom breakpoint is invented. Horizontal scroll applies at all widths as a safety net; the card transform triggers at `max-width: 767.98px` (matching Bootstrap's `md` boundary and the existing dashboard blocks).

**Card transform — CSS-only, driven by `data-label`.** Verified against the actual markup of all three pages: every data `<td>` holds plain text (the only exceptions are the appointments status `<span class="badge">` and the actions `<td>`, which is a `d-flex` of an edit link and a delete `<form>`). Column counts differ (dentists 5, patients 6, appointments 8) but the *shape* is identical, so one CSS rule set covers all three. The mechanism:

- `@media (max-width: 767.98px)`: `table`/`tbody`/`tr`/`td` → `display: block`; `thead` hidden; each `tr` becomes a bordered, shadowed card; each `td` becomes a `flex` label/value row whose label comes from `td::before { content: attr(data-label) }`.
- The `#` index column is suppressed on mobile — positional noise with no value in a stacked card.
- The actions cell suppresses its label and renders as a full-width card footer; both edit and delete stay visible and tappable.
- `table-striped`'s alternating row background is neutralized on mobile so cards share one uniform surface.

**Rejected alternative:** a `{#if mobile}` dual render in Svelte. It would duplicate ~30 lines of markup per file, double the DOM, require viewport detection that is unsafe during SSR, and break every existing selector. The CSS-only path keeps one DOM, so the `filteredPatients`/`filteredDentists`/`filteredAppointments` reactive logic and all current selectors keep working untouched.

**Accessibility.** Setting `display: block` on table elements drops their implicit ARIA roles. Mitigation: declare `role="table"`, `rowgroup`, `row`, `columnheader`, `cell` explicitly in the markup — inert on desktop, semantics-preserving on mobile. This is a first-class requirement of the new capability, not a nice-to-have.

**CSS placement.** New rules go in `components/tables.css`, co-located with the base rules they override — matching the precedent already set by `views/dashboard.css`'s two local `@media` blocks (including the just-merged PR3 `.filter-bar`). `utilities/responsive.css`'s "all @media queries centralized" header is a historical extraction note from the original `style.css` split, already superseded in practice; a cross-reference comment there will point to `tables.css`.

**Header fix.** `flex-wrap` on the header row and a `.list-search-input` class replacing the three inline `style="width: 250px"` attributes, with a fluid width below the breakpoint. The `.patient-list-header` / `.patient-list-title` class names are currently *unstyled* (pure Bootstrap utilities, no custom CSS defines them) — this change gives them real rules for the first time; names are kept verbatim to avoid touching selectors that E2E or future specs may reference.

**Verification — a new Playwright project, not `setViewportSize` calls.** A project preset (`devices['Pixel 5']`) supplies the full device profile: viewport, device-scale-factor, `isMobile: true`, and `hasTouch: true`. `page.setViewportSize()` changes width/height only and leaves `isMobile`/`hasTouch` false, so touch-target and pointer behavior would never be exercised. The project is `testMatch`-scoped to the new responsive spec so it does not double-run the existing suite.

**Which config.** Verified: `frontend/tests/mock-backend.js` has **no** patients/dentists/appointments endpoints (zero matches), so mock-mode coverage would require inventing three new mock endpoints purely to assert CSS. The full-stack suite already has a `setup` project producing admin storage state plus real seeded list data. Therefore the new project lands in `playwright.fullstack.config.js` as `mobile-fullstack-chromium` (`dependencies: ['setup']`, `testMatch: /responsive\.spec\.js/`), with the existing `fullstack-chromium` given a matching `testIgnore` so the spec runs once. Assertions are structural (element visible/hidden/reflowed at a defined width), never pixel diffs.

## Delivery Slices

Chained PRs, stacked to main, `ask-on-risk`. Each is independently verifiable and revertible.

| # | Slice | Content | Est. authored lines |
|---|-------|---------|---------------------|
| 1 | Overflow bug fix | `.table-container` scroll fallback; `.patient-list-header` wrap + `.list-search-input`; remove the three inline `width: 250px` attributes | ~60–80 |
| 2 | Card transform | `@media` card block in `components/tables.css`; `data-label` + `role` attributes across the three `+page.svelte` files | ~150–180 |
| 3 | Mobile E2E | `mobile-fullstack-chromium` project + `tests/fullstack/responsive.spec.js` | ~120–150 |

`400-line budget risk: Medium` for the change as a whole (~350–410 combined), `Low` per slice. Slices 1 and 2 MAY merge if the `sdd-tasks` forecast keeps the pair under 400 — but slice 1 alone already fixes a real user-facing bug and is worth shipping first. Slice 3 MUST stay separate: it is the only slice that touches shared test configuration, and a config regression there would block every other suite.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/static/css/components/tables.css` | Modified | `.table-container` overflow; new `@media` card-transform block; header/search rules |
| `frontend/static/css/utilities/responsive.css` | Modified | Cross-reference comment only (no rules) |
| `frontend/src/routes/patients/+page.svelte` | Modified | Header markup; `data-label` + `role` on 6-column table |
| `frontend/src/routes/dentists/+page.svelte` | Modified | Header markup; `data-label` + `role` on 5-column table |
| `frontend/src/routes/appointments/+page.svelte` | Modified | Header markup; `data-label` + `role` on 8-column table (incl. status badge cell) |
| `frontend/playwright.fullstack.config.js` | Modified | New `mobile-fullstack-chromium` project; `testIgnore` on `fullstack-chromium` |
| `frontend/tests/fullstack/responsive.spec.js` | New | Breakpoint assertions for header, scroll fallback, and card transform |
| `frontend/playwright.config.js` | Unchanged | Mock mode has no list endpoints; deliberately not extended |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `display: block` strips implicit table ARIA roles, regressing screen-reader users | High (certain if unaddressed) | Explicit `role` attributes are a spec requirement; assert roles in the E2E spec |
| Changing `overflow: hidden` → `overflow-x: auto` breaks the `.table-container` border-radius corner clipping | Medium | Spec must define the intended corner treatment; verify visually before slice 1 merges |
| `data-label` text drifts out of sync with `<th>` text over time | Medium | Spec must require label parity with the header cell; E2E asserts at least one label matches its column header |
| Full-stack E2E is slower and needs a real backend + seeded data | Medium | Scoped `testMatch` runs the spec once; alternative (extend mock backend) reconsidered in design if runtime cost bites |
| Card transform makes the 8-column appointments card very tall, hurting scannability | Medium | Spec must define which columns are suppressed on mobile beyond `#`; long `Descripción` values need a truncation rule |
| Overriding Bootstrap's `.table`/`.table-striped` inside a media query loses a specificity fight | Medium | `components/tables.css` loads after the Bootstrap CDN link; design must confirm specificity for each override, not assume |
| Empty state (`No se encontraron…`) is outside `.table-container` and untested at mobile widths | Low | Spec includes an empty-state scenario; E2E covers it via a no-match search |
| Slice 3's config edit accidentally makes existing fullstack specs run twice or not at all | Medium | Isolated slice; the existing suite must stay green as the gate |

## Rollback Plan

Every slice is an independent, stateless revert — no schema change, no data migration, no persisted state, no dependency change. Reverting slice 3 removes the mobile project and spec, leaving the CSS/markup in place. Reverting slice 2 removes the card transform; the `data-label`/`role` attributes are inert without it, so a partial revert of CSS alone is also safe. Reverting slice 1 restores `overflow: hidden` and the inline `width: 250px`. Reverting all three returns `tables.css` and the three `+page.svelte` files byte-identical to today.

## Dependencies

- None external. No new npm or Maven dependency. Bootstrap stays CDN-loaded at 5.3.3, unpinned locally — unchanged and explicitly out of scope. Playwright and its bundled device presets are already installed.

## Success Criteria

- [ ] At 375px width, `/patients`, `/dentists`, and `/appointments` produce no horizontal page overflow — header and content both fit.
- [ ] Below 768px, each table row renders as a stacked card with a visible label for every displayed value; the `#` column is suppressed.
- [ ] Edit and delete actions remain visible and tappable on every mobile card; the delete confirmation still fires.
- [ ] Table ARIA roles (`table`, `row`, `cell`) remain present in the accessibility tree at both mobile and desktop widths.
- [ ] Above the card breakpoint, a table wider than its container scrolls horizontally instead of clipping.
- [ ] The empty state renders correctly at mobile widths.
- [ ] Desktop rendering at ≥768px is byte-identical to today for all three pages.
- [ ] Landing, login, register, dashboard, and error routes are untouched by the diff.
- [ ] `npm run test`, `npm run check`, and the existing full-stack suite pass on every slice.
- [ ] No slice exceeds the 400-line review budget without an explicitly accepted exception.

## Proposal Question Round — Resolved

Maintainer confirmed the larger scope (overflow fixes **and** card transform) before this proposal. The four open questions carried from exploration are resolved here with defensible defaults rather than another round:

1. **Breakpoint — RESOLVED:** reuse the repo convention (768px / 576px), no new custom breakpoints. Card transform fires at `max-width: 767.98px`.
2. **Scope boundary — RESOLVED:** only `components/tables.css` and the three list-page `+page.svelte` files (plus the E2E config/spec). Landing, login, register, dashboard, and error routes are explicitly excluded.
3. **Verification — RESOLVED:** a new `mobile-fullstack-chromium` Playwright project, not `setViewportSize` calls, because only a device preset supplies `isMobile`/`hasTouch`. It lands in the full-stack config because the mock backend serves no list endpoints (verified).
4. **Card semantics — RESOLVED:** CSS-only `display: block` transform driven by `data-label` attributes plus explicit ARIA roles; no dual Svelte render. Verified achievable for all three pages despite their differing column counts, because every data cell holds plain text and the actions cell has an identical shape in all three.

Residual product questions for the maintainer (defaults chosen, cheap to change during spec):

- Should any column beyond `#` be suppressed on the 8-field appointments card? Default: no — all fields shown, `Descripción` truncated with an ellipsis.
- Should long `Descripción` values be expandable on tap? Default: no — plain truncation, no interaction.
- Should the first data column be promoted to a bold card title? Default: no — uniform label/value rows across all three pages, lower risk and a smaller diff.
