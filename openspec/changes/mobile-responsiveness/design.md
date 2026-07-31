# Design: Mobile-Responsive List Pages

## Technical Approach

One DOM, three CSS layers. The three list pages keep their exact current markup shape — same elements, same order, same cell count — and gain only two inert attribute families (`data-label`, `role`). All behaviour lives in `frontend/static/css/components/tables.css`: an unconditional `.table-container` scroll fallback, an unconditional `.list-search-input` width rule, and one `@media (max-width: 767.98px)` block that turns `table/tbody/tr/td` into stacked cards. Because no markup is added or removed, every existing selector, page object (`pages/appointments.js` reads `td` by index) and reactive filter keeps working untouched. Verification is a fourth layer: a `mobile-fullstack-chromium` Playwright project driving the same seeded backend at a real device profile.

The one thing this design must not inherit from the proposal is its cascade assumption — see the first Verified Fact.

## Verified Facts (read, not assumed)

| Claim | Verified |
|---|---|
| **The proposal is wrong about load order.** Bootstrap CDN is linked *after* every local stylesheet, so Bootstrap wins every specificity tie | `+layout.svelte:15` (tables.css) vs `:20` (bootstrap 5.3.3) |
| `.table-container { overflow: hidden }` with `border-radius: 8px` | `tables.css:38-43` |
| The actions cell is byte-identical in all three files: `<td class="text-center">` → `div.d-flex.justify-content-center.gap-2` → edit `<a class="btn btn-sm btn-outline-primary">` + `<form method="POST" action="?/delete">` with hidden `id` + `<button class="btn btn-sm btn-outline-danger">` | `patients/+page.svelte:72-88`, `dentists/+page.svelte:70-86`, `appointments/+page.svelte:89-105` |
| `#` is always the first `<td>`, actions always the last, in all three | same three ranges |
| Column counts differ: dentists 5, patients 6, appointments 8 | `dentists:55-61`, `patients:55-62`, `appointments:66-75` |
| Only non-text data cells are the appointments status `<span class="badge bg-success">` and the three actions cells | `appointments/+page.svelte:86-88` |
| `.patient-list-header`, `.patient-list-title`, `.btn-add-patient` have **zero** CSS rules anywhere in `static/css` | grep over `frontend/static/css` |
| `tables.css:12-36` styles `.dentist-list-header` / `.dentist-list-title` / `.btn-add-dentist` — class names **no page uses**. Dead CSS; not touched here | `tables.css:12-36` vs the three headers using `patient-list-*` |
| Svelte's compiler warns `a11y-no-redundant-roles` for `role` on `table`, `tbody`, `thead`, `tr`; `td`/`th` are **not** in the map; only `ul/ol/li` are exempted | `node_modules/svelte/src/compiler/compile/nodes/Element.js:125-167,670-674`; code string at `compiler_warnings.js:142` |
| Project `testIgnore`/`testMatch` **replace** the top-level values (`takeFirst`), while `use` **merges** (`mergeObjects`) | `node_modules/playwright/lib/common/index.js:654-657` |
| `devices['Pixel 5']` = viewport 393×727, `isMobile: true`, `hasTouch: true`; `devices['Desktop Chrome']` explicitly carries `isMobile: false, hasTouch: false` | `playwright-core/lib/server/deviceDescriptorsSource.json:2132-2146, 2694-2706` |
| The runner spawns `npx playwright test --config=playwright.fullstack.config.js` with **no** `--project` flag, so a new project is picked up automatically | `tests/fullstack/run-fullstack.js:208-211` |
| `browser.newContext()` inherits resolved `use` (baseURL) — proven by `adminPage` + relative `goto('/appointments')` passing today | `fixtures/e2e.js:84-89`, `pages/appointments.js:11`, `booking.spec.js:27-33` |
| Design tokens are only 5 colour vars; no border/grey token exists, and `tables.css` already uses literal `rgba()` | `base/tokens.css:10-16`, `tables.css:35,42` |

## Architecture Decisions

### Decision: Every override wins on specificity, never on source order

**Choice**: all mobile rules are anchored at `.table-container .table > tbody > tr > td` — specificity **(0,2,3)**.

| Bootstrap 5.3.3 rule | Specificity | Sets | Beaten by |
|---|---|---|---|
| `.table > :not(caption) > * > *` | (0,1,1) | `padding`, `background-color`, `box-shadow: inset …9999px` | (0,2,3) ✔ |
| `.table-striped > tbody > tr:nth-of-type(odd) > *` | (0,2,2) | `--bs-table-bg-type` | (0,2,3) ✔ |
| `.table-hover > tbody > tr:hover > *` | (0,2,2) | `--bs-table-bg-state` | (0,2,3) ✔ |
| `.form-control` | (0,1,0) | `width: 100%` | `.patient-list-header .list-search-input` (0,2,0) ✔ |
| `.d-flex`, `.justify-content-*`, `.align-items-*`, `.gap-2`, `.text-center` | any | `!important` | **not beatable — never targeted** |

**Rationale**: the proposal claimed `tables.css` loads after Bootstrap. It does not (`+layout.svelte:15` vs `:20`). Under the proposal's assumption a tie would have been safe; under reality a tie silently loses. Two concrete consequences this design bakes in: (a) striping is neutralized by setting `box-shadow: none` **on the `td`**, not by redefining `--bs-*` vars (the striped rule sets them on the `td` itself at (0,2,2), so an inherited redefinition on `.table` would lose); (b) `.list-search-input` **must** be descendant-qualified or `.form-control { width: 100% }` wins and desktop breaks — today only the inline `style` attribute is holding that width.

**Rejected**: `!important` everywhere (unauditable, and Bootstrap's utilities are already `!important` — an arms race); reordering the `<link>` tags in `+layout.svelte` (touches a shared layout used by every route, far outside this change's blast radius, and would silently re-decide dozens of unrelated ties).

### Decision: `overflow-x: auto` + explicit `overflow-y: hidden`; border-radius clipping is preserved for free

**Choice**:

```css
/* tables.css:38-43 — before */
.table-container {
  background-color: var(--color-blanco);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* after */
.table-container {
  background-color: var(--color-blanco);
  border-radius: 8px;
  /* Horizontal escape hatch: an 8-column table used to be clipped and
     unreachable. overflow-y stays hidden so no vertical scrollbar can appear. */
  overflow-x: auto;
  overflow-y: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

**The border-radius risk the proposal flagged is a non-risk, and the reason is exact**: corner clipping is triggered by *any* `overflow` computed value other than `visible`, not by `hidden` specifically — `auto` and `scroll` clip to the rounded padding edge identically. No inner element, no restated radius, no `clip-path` is needed. This is verifiable in one E2E assertion (`getComputedStyle(container).overflowX === 'auto'`) plus visual confirmation before slice 1 merges.

**Why `overflow-y: hidden` is stated rather than left off**: per CSS Overflow 3, when one axis is non-`visible` the other computes to `auto` anyway. Writing it makes the used value explicit and removes any chance of a stray vertical scrollbar once the card transform changes the container's content box.

**Rejected**: `overflow: auto` alone (same effect, but leaves the y-axis intent undocumented); wrapping the table in a new `.table-scroll` div (markup churn in three files for zero behavioural gain).

### Decision: Explicit roles on `table`/`tbody`/`tr`/`td` only — `thead` gets none, because it is `display: none`

**Choice** — exact attribute placement, `patients/+page.svelte` as the representative page:

```svelte
<div class="table-container">
  <!-- svelte-ignore a11y-no-redundant-roles -->
  <!-- role is redundant on desktop but load-bearing below 768px, where
       display:block strips the implicit table roles. See tables.css. -->
  <table class="table table-striped table-hover mb-0" role="table">
    <thead class="table-dark">          <!-- no role: display:none on mobile -->
      <tr>
        <th>#</th> … <th class="text-center">Acciones</th>
      </tr>
    </thead>
    <!-- svelte-ignore a11y-no-redundant-roles -->
    <tbody role="rowgroup">
      {#each filteredPatients as patient, index}
        <!-- svelte-ignore a11y-no-redundant-roles -->
        <tr role="row">
          <td data-label="#" role="cell">{index + 1}</td>
          <td data-label="DNI" role="cell">{patient.cardIdentity || 'N/A'}</td>
          <td data-label="Nombre Completo" role="cell">{patient.firstName} {patient.lastName}</td>
          <td data-label="Email" role="cell">{patient.email}</td>
          <td data-label="Fecha Admisión" role="cell">{patient.admissionDate || 'N/A'}</td>
          <td data-label="Acciones" role="cell" class="text-center">
            <!-- unchanged: d-flex justify-content-center gap-2 + edit <a> + delete <form> -->
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
```

**Rules**: every `<td>` carries `data-label` whose text is byte-identical to its `<th>`; `role="cell"` on every `<td>`; `role="row"` on the **tbody** `<tr>` only; `role="rowgroup"` on `<tbody>` only; `role="table"` on `<table>`. `<thead>`, its `<tr>` and every `<th>` are left completely untouched.

**Rationale**: `thead` is `display: none` below the breakpoint, so it is out of the accessibility tree exactly where roles would matter, and native above it. Dropping `role="rowgroup"`/`role="row"`/`role="columnheader"` from the header cuts the redundant-role warning count from 5 per file to **3 per file (9 total)** and removes 9+ pointless attributes from the diff. `role="rowgroup"` on `tbody` is *not* optional: ARIA's `table` requires owned `row` or `rowgroup → row`, and a generic `display:block` `tbody` between them breaks that chain in the Chrome/Firefox trees.

**The `svelte-ignore` is not cosmetic**: `node_modules/svelte/.../Element.js:670-674` warns whenever an explicit role equals the implicit one, exempting only `ul/ol/li` — with the in-source comment *"`<ul role="list">` is ok because CSS list-style:none removes the semantics and this is a way to bring them back"*, which is precisely our situation for tables, minus the exemption. Nine `<!-- svelte-ignore a11y-no-redundant-roles -->` comments are the honest fix; the repo already uses this directive (`+layout.svelte:59`, hyphenated form, matching the emitted code `a11y-no-redundant-roles`).

**Rejected**: applying roles via a spread (`<table {...tableRole}>`) to dodge the static check — it works, and that is the problem: it hides an intentional a11y decision from both the compiler and the next reader. Rejected: leaving 9 warnings unsuppressed — `npm run check` output is a maintained signal in this repo (`18b288d fix(dashboard): resolve svelte-check regressions in PR3`).

### Decision: `data-label` attribute selectors, not `:first-child` / `:last-child`

**Choice**: `td[data-label="#"] { display: none }` and `td[data-label="Acciones"]` for the footer treatment.

**Rationale**: identical specificity to a class (0,1,0), self-documenting, and it survives column reordering. The positional alternative is correct *today* (verified: `#` first, actions last, in all three files) but would silently mis-target the day a column is inserted. It also makes the label-parity E2E assertion and the CSS agree on one source of truth.

### Decision: `Descripción` truncation needs one `<span>` — anonymous flex items cannot be styled

**Choice**: in `appointments/+page.svelte` only, wrap the value:

```svelte
<td data-label="Descripción" role="cell"><span class="cell-truncate">{appointment.description || ''}</span></td>
```

**Rationale**: each `<td>` becomes a flex row whose label is `::before` and whose value is a bare text node — an *anonymous* flex item, which CSS cannot target at all. `text-overflow: ellipsis` therefore has nothing to attach to without a real element. The span is the minimum: one cell, one file. The paired CSS needs `min-width: 0` because flex items default to `min-width: auto` and would refuse to shrink below their content, so the ellipsis would never trigger.

**No regression**: `AppointmentsPage.readRow` reads `cells.nth(5).textContent()` (`pages/appointments.js:29`), and `textContent` descends into the span — unchanged. Pseudo-element text is *not* in `textContent`, so the new `::before` labels are invisible to every existing page object too.

**Rejected**: wrapping every value in all three files (≈40 extra elements for one requirement); `-webkit-line-clamp` (same anonymous-item problem); tap-to-expand (maintainer decided against interaction).

### Decision: uniform label/value rows, all 8 appointment fields, no promoted title — **final, not open**

Maintainer-confirmed and closed: all 8 appointment fields render on the card with no suppression beyond `#`; `Descripción` truncates with an ellipsis and is **not** expandable; **no** column is promoted to a bold card title — every row is a uniform label/value pair on all three pages. The proposal's "residual product questions" are hereby resolved, not carried forward.

### Decision: the mobile Playwright project, and the `testIgnore` trap the proposal walked into

**Choice** — exact `frontend/playwright.fullstack.config.js` projects block:

```js
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.js/, use: { ...devices['Desktop Chrome'] } },
    {
      name: 'fullstack-chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      // A project-level testIgnore REPLACES the top-level one (takeFirst, not
      // a merge — lib/common/index.js:654), so the process-runner exclusion
      // MUST be restated here or that node:test file gets collected again.
      testIgnore: ['**/process-runner.spec.js', '**/responsive.spec.js'],
    },
    {
      // Device preset, not setViewportSize: only a preset supplies isMobile +
      // hasTouch, and therefore meta-viewport emulation and touch pointers.
      name: 'mobile-fullstack-chromium',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
      testMatch: /responsive\.spec\.js/,
    },
  ],
```

**Verified mechanics** (`lib/common/index.js:654-657`):
- `testIgnore: takeFirst(projectConfig.testIgnore, config.testIgnore, [])` → **replace, not merge**. The proposal's plan of "give `fullstack-chromium` a matching `testIgnore`" is syntactically fine but *semantically a trap*: adding only `'**/responsive.spec.js'` would drop `'**/process-runner.spec.js'`, and that file auto-runs `node:test` on import — the exact failure the top-level ignore exists to prevent (`playwright.fullstack.config.js:12-15`). Both patterns must be listed.
- `testMatch` is likewise `takeFirst`, so the mobile project's `/responsive\.spec\.js/` fully replaces `/.*\.spec\.js/`. It declares no `testIgnore`, so it inherits the top-level one — harmless.
- `use: mergeObjects(config.use, projectConfig.use, …)` → **merges**, so `baseURL` and `trace` survive the device spread. Already proven by the existing `fullstack-chromium`.
- `dependencies: ['setup']` on two projects runs `setup` once; both reuse the same `admin.json` storage state.
- No `--project` flag is passed by the runner (`run-fullstack.js:208-211`), so the new project runs automatically. `workers: 1, fullyParallel: false` keeps it serial.

**Desktop assertions inside the mobile project**: because `browser.newContext()` inherits the resolved `use` (proven by `adminPage`), a context created inside this project would silently keep `isMobile: true`. The scroll-fallback test therefore spreads the desktop preset to reset it explicitly:

```js
const desktop = await browser.newContext({
  ...devices['Desktop Chrome'],          // carries isMobile:false, hasTouch:false
  storageState: ADMIN_STORAGE_STATE,
});
```

**Rejected**: a `webServer` block (the runner owns process lifecycle by design); extending `playwright.config.js` mock mode (`tests/mock-backend.js` serves no list endpoints — verified in the proposal); asserting `scrollWidth > clientWidth` for the fallback (content-dependent at 1280px, therefore flaky — the deterministic contract is the computed `overflow-x` plus "the page itself does not overflow").

## Data Flow

    375–767.98px                              ≥768px
    ───────────                               ──────
    <table role="table">      display:block   <table>          display:table
      <thead>                 display:none      <thead>        native
      <tbody role="rowgroup"> display:block     <tbody>        native
        <tr role="row">       display:block       <tr>         native
          td[data-label="#"]  display:none          td         native
          td role="cell"      display:flex          td          "
            ::before ← attr(data-label)             (no ::before rule outside MQ)
            value ────────────→ right
          td[data-label="Acciones"] display:block, ::before suppressed, .btn ≥44px

    .table-container: overflow-x:auto at ALL widths — the ≥768px escape hatch,
                      transparent/unclipped below 768px so card shadows survive.

## File Changes

| File | Slice | Action | Description |
|---|---|---|---|
| `frontend/static/css/components/tables.css` | 1 | Modify | `.table-container` overflow (lines 38-43); new `.patient-list-header` / `.patient-list-title` / `.patient-list-header .list-search-input` rules |
| `frontend/src/routes/{patients,dentists,appointments}/+page.svelte` | 1 | Modify | Header: drop `style="width: 250px"`, add `class="form-control list-search-input"` (3 × 1-line edit) |
| `frontend/static/css/components/tables.css` | 2 | Modify | Append the `@media (max-width: 767.98px)` card block |
| `frontend/src/routes/{patients,dentists,appointments}/+page.svelte` | 2 | Modify | `data-label` + `role` on table/tbody/tr/td; 3 `svelte-ignore` comments each; `<span class="cell-truncate">` in appointments only |
| `frontend/static/css/utilities/responsive.css` | 2 | Modify | Cross-reference comment under the header block (lines 1-10). No rules |
| `frontend/playwright.fullstack.config.js` | 3 | Modify | `mobile-fullstack-chromium` project; two-pattern `testIgnore` on `fullstack-chromium` |
| `frontend/tests/fullstack/responsive.spec.js` | 3 | Create | Mobile + desktop breakpoint assertions |
| `frontend/tests/fullstack/pages/lists.js` | 3 | Create (optional) | Shared locators for the three list pages, matching the existing `pages/` convention |
| `+layout.svelte`, `app.html`, `views/dashboard.css`, landing/auth/error CSS | — | **Unchanged** | Out of scope; the `<link>` order is deliberately not touched |

## Interfaces / Contracts

**Slice 1 — header (unconditional + mobile):**

```css
.patient-list-header { flex-wrap: wrap; }

/* Descendant-qualified (0,2,0) so it beats .form-control{width:100%} (0,1,0),
   which loads later. A bare .list-search-input would tie and lose. */
.patient-list-header .list-search-input { width: 250px; }

@media (max-width: 767.98px) {
  .patient-list-header { gap: 1rem; }
  .patient-list-header > .d-flex { width: 100%; flex-wrap: wrap; }
  .patient-list-header .list-search-input { width: auto; flex: 1 1 12rem; min-width: 0; }
}
```

Only properties Bootstrap's `!important` utilities do **not** set are used: `flex-wrap`, `gap`, `width`, `flex`, `min-width`. `align-items`/`justify-content`/`display` are never targeted. At ≥768px both new rules are no-ops on the rendered result (`space-between` already separates the two children, nothing wraps), so **desktop stays byte-identical**.

**Slice 2 — card block, appended to `tables.css`:**

```css
@media (max-width: 767.98px) {
  .table-container { background-color: transparent; box-shadow: none; overflow: visible; }

  .table-container .table { display: block; width: 100%; margin-bottom: 0; }
  .table-container .table thead { display: none; }
  .table-container .table > tbody { display: block; }

  .table-container .table > tbody > tr {
    display: block; margin-bottom: 1rem; overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 8px;
    background-color: var(--color-blanco); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .table-container .table > tbody > tr:last-child { margin-bottom: 0; }
  .table-container .table > tbody > tr:hover { background-color: var(--color-blanco); } /* (0,3,2) beats tables.css:54 */

  .table-container .table > tbody > tr > td {          /* (0,2,3) */
    display: flex; justify-content: space-between; align-items: baseline; gap: 1rem;
    padding: 0.5rem 0.75rem; text-align: right; overflow-wrap: anywhere;
    background-color: transparent;
    box-shadow: none;                                   /* kills table-striped + table-hover inset */
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }
  .table-container .table > tbody > tr > td::before {
    content: attr(data-label); flex: 0 0 auto; text-align: left;
    font-weight: 600; color: var(--color-primario);
  }

  .table-container .table > tbody > tr > td[data-label="#"] { display: none; }

  .table-container .table > tbody > tr > td[data-label="Acciones"] {
    display: block; padding: 0.75rem; border-bottom: 0; background-color: rgba(0, 0, 0, 0.02);
  }
  .table-container .table > tbody > tr > td[data-label="Acciones"]::before { content: none; }
  .table-container .table > tbody > tr > td[data-label="Acciones"] .btn { min-height: 44px; min-width: 44px; }

  .table-container .table > tbody > tr > td .cell-truncate {
    min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
}
```

`min-height/min-width: 44px` on the action buttons is deliberate: Bootstrap's `.btn-sm` is ~31px tall, below WCAG 2.5.5 AAA (44px) and marginal for a thumb. This is what makes the `hasTouch: true` project meaningful rather than decorative.

**`data-label` ↔ `<th>` parity table** (the contract the E2E asserts):

| Page | Labels, in DOM order |
|---|---|
| dentists (5) | `#`, `Matrícula`, `Nombre Completo`, `Email`, `Acciones` |
| patients (6) | `#`, `DNI`, `Nombre Completo`, `Email`, `Fecha Admisión`, `Acciones` |
| appointments (8) | `#`, `Fecha`, `Hora`, `Paciente`, `Odontólogo`, `Descripción`, `Estado`, `Acciones` |

## Testing Strategy

`strict_tdd: true` — slice 3's spec is written RED against the slice-1/2 CSS already merged, so each assertion fails for a real reason before it passes.

| Layer | What to Test | Approach |
|---|---|---|
| Unit (Vitest) | — | **Not covered.** No `.svelte` component test infra (deliberate, unchanged from `enrich-dashboard` / `register-page-redesign`). Nothing in this change is a pure JS module |
| Static | `npm run check` clean — 9 redundant-role warnings suppressed, no new ones | Existing script; gate on slices 1, 2, 3 |
| E2E mobile (Pixel 5) | Page does not overflow: `document.documentElement.scrollWidth <= window.innerWidth + 1` on all three routes | `page.evaluate` |
| E2E mobile | `thead` hidden; `td[data-label="#"]` hidden; every other `td` visible | `toBeHidden()` / `toBeVisible()` |
| E2E mobile | The label is actually *rendered*: `getComputedStyle(td, '::before').content` resolves to the `data-label` text (pseudo content is **not** in `textContent`, so it must be read via `evaluate`) | `page.evaluate` |
| E2E mobile | Label parity: `td[i].dataset.label === th[i].textContent.trim()` for every column of each page | DOM comparison — catches the drift risk the proposal flagged |
| E2E mobile | ARIA survives `display: block`: `getByRole('table')`, `getByRole('rowgroup')`, `getByRole('row')` count === row count, `getByRole('cell')` present | Role-based locators = the real accessibility tree, not attribute presence |
| E2E mobile | Edit link and delete button visible; both ≥44×44 via `boundingBox()` | Proves the touch-target rule |
| E2E mobile | Delete still confirms — and mutates nothing: `page.once('dialog', d => d.dismiss())`, assert the dialog fired and the row survives | Safe against a live seeded backend |
| E2E mobile | Empty state: search a no-match string, assert the `No se encontraron…` block visible and still no page overflow | Covers the untested empty-state gap |
| E2E desktop (in the same spec, reset context) | `getComputedStyle('.table-container').overflowX === 'auto'`; page does not overflow; `thead` **visible**; no `::before` label rendered | `browser.newContext({ ...devices['Desktop Chrome'], storageState })` |
| E2E regression gate | `auth`, `authorization`, `booking`, `register`, `dashboard` specs run **exactly once** and stay green | The gate for slice 3; `pages/appointments.js`'s `td` indices must be unaffected |

## Threat Matrix

N/A — no routing dispatch, shell command, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. Adjacent surfaces handled inline: `data-label` values are author-authored literals, never user data; no new network input, no new server route, no auth boundary touched; the Playwright config change is declarative and the process runner it feeds is unmodified.

## Migration / Rollout

No schema change, no data migration, no persisted state, no dependency change. Three chained PRs, stacked, `ask-on-risk`, sliceable exactly on these boundaries:

| Slice | Content | Est. authored lines | Independently revertible |
|---|---|---|---|
| 1 | `.table-container` overflow; header wrap + `.list-search-input`; drop 3 inline `width: 250px` | ~35–50 | Yes — restores `overflow: hidden` and the inline styles |
| 2 | `@media` card block; `data-label` + `role` + `svelte-ignore` across 3 pages; `.cell-truncate` span; `responsive.css` comment | ~170–200 | Yes — the attributes are inert without the CSS, so reverting the CSS alone is also safe |
| 3 | `mobile-fullstack-chromium` project + `responsive.spec.js` (+ optional page object) | ~130–160 | Yes — removes the project and spec, leaving CSS/markup intact |

`400-line budget risk: Medium` overall (~335–410), `Low` per slice. **Slices 1 and 2 may merge** if `sdd-tasks` forecasts the pair under 400 — slice 1's blast radius (one CSS rule + three attribute swaps) is genuinely small. **Slice 3 must stay separate**: it is the only slice touching shared test configuration, and the `testIgnore` replace-semantics trap documented above means a mistake there breaks every other suite rather than just this feature.

## Open Questions

- [ ] None blocking. Three observations deliberately left out of scope: (1) `tables.css:12-36` styles `.dentist-list-header` / `.dentist-list-title` / `.btn-add-dentist`, class names no page uses — dead CSS, deleting it is a separate cleanup; (2) `+layout.svelte` links Bootstrap *after* all local CSS, which is backwards for an override-oriented stylesheet set — a real latent hazard, but re-ordering it re-decides ties across every route and must be its own change; (3) `.content-card { padding: 2rem }` (`cards.css:11-17`) leaves ~287px of usable width at 375px — tight but not overflowing, so it is not fixed here.
