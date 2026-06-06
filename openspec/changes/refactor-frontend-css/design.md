# Design: Refactor Frontend CSS Modularization

## Technical Approach

Split the 1753-line monolithic `frontend/public/css/style.css` into 15 modular files across five directories (`base/`, `components/`, `layout/`, `views/`, `utilities/`). Replace the single `<link>` in `head.ejs` with explicit `<link>` tags for shared modules, and use the existing `extraStylesheets` mechanism for per-view CSS. No visual changes — pure file restructuring with selector-level verification.

## Architecture Decisions

### Decision: Template Loading Strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| A: `style.css` with `@import` | Backward-compatible, but `@import` blocks parallel downloads (performance hit) | Rejected |
| B: Multiple `<link>` tags in `head.ejs` + `extraStylesheets` | More `<link>` tags in `<head>`, but parallel downloads, explicit per-view control | **Selected** |

**Rationale**: The spec requires HTML-driven cascade (not `@import`). The project already has `extraStylesheets` support in `head.ejs`, making per-view loading trivial. Performance is better with parallel `<link>` downloads.

### Decision: Empty View Files

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Create all 7 view files per proposal | Some files would be empty (dentists, patients, appointments have no view-specific CSS) | Rejected |
| Create only files with actual content | Fewer files, but dev may expect all view files to exist | **Selected** |

**Rationale**: The CSS file has zero selectors scoped to dentist/patient/appointment views. Creating empty files adds noise. Only `landing.css`, `auth.css`, `error.css`, and `dashboard.css` will have content.

### Decision: Cross-Cutting Responsive Rules

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Keep responsive rules in their source files | Harder to audit all breakpoints at once | Rejected |
| Centralize all `@media` queries in `utilities/responsive.css` | Single file for responsive audit, but splits related rules | **Selected** |

**Rationale**: The spec defines `responsive.css` in utilities. Centralizing makes it easy to verify no breakpoint is missed. Each rule gets a comment noting its source section.

## CSS Load Order (Cascade)

```
<head>
  1. /css/base/normalize.css     (reset — always first)
  2. /css/base/tokens.css        (CSS variables — must be before any usage)
  3. /css/base/layout.css        (body, .main-content structure)
  4. /css/base/typography.css    (fonts, text — if extracted)
  5. /css/components/buttons.css (reusable button styles)
  6. /css/components/cards.css   (.content-card, .feature-card)
  7. /css/components/forms.css   (.auth-input, .form-control, .password-*)
  8. /css/components/alerts.css  (.alert, .alert-success, .alert-danger)
  9. /css/components/tables.css  (.table-container, .table thead, .btn-action)
  10. /css/layout/header.css     (.navbar, .nav-link, .dropdown-*, .user-dropdown)
  11. /css/layout/footer.css     (footer, .footer-*)
  12. /css/utilities/animations.css  (@keyframes, .fade-in, .spinning)
  13. /css/utilities/responsive.css  (all @media queries)
  14. /css/views/{view}.css      (per-view, via extraStylesheets — loaded last)
  15. Bootstrap CDN              (unchanged — after our CSS for override control)
</head>
```

## File Map

| Source (style.css lines) | Target File | Description |
|--------------------------|-------------|-------------|
| Lines 1-7 (`:root`) | `base/tokens.css` | CSS custom properties (--color-*) |
| Lines 9-45 (body, .main-content) | `base/layout.css` | HTML/body height, body flex, .main-content padding |
| Lines 47-111 (.navbar, .nav-link, .dropdown) | `layout/header.css` | Navbar, brand, links, dropdown menus |
| Lines 1548-1585 (.user-dropdown) | `layout/header.css` | User dropdown (appended to header) |
| Lines 299-329 (footer) | `layout/footer.css` | Footer styles, logo, text |
| Lines 112-297 (all button variants) | `components/buttons.css` | .btn-primary, .btn-outline-primary, .auth-btn-*, .error-btn-*, .btn:disabled |
| Lines 331-341 (.content-card) | `components/cards.css` | Content card base style |
| Lines 1405-1496 (.password-*, .position-relative) | `components/forms.css` | Password toggle, input focus, form labels, .auth-input, .form-control:focus |
| Lines 1498-1516 (.alert) | `components/alerts.css` | Alert base, success, danger |
| Lines 1320-1404 (tables, dentist list) | `components/tables.css` | .table-container, .table thead, .btn-edit, .btn-delete, .btn-action |
| Lines 343-798 (landing sections) | `views/landing.css` | .landing-hero, .hero-*, .landing-features, .feature-*, .landing-tech, .tech-*, .landing-cta, .cta-*, .btn-cta-*, .portfolio-badge |
| Lines 800-942 (tech logos) | `views/landing.css` | .tech-icon-img, .tech-logo (append to landing) |
| Lines 944-1133 (auth pages) | `views/auth.css` | .auth-container, .auth-card, .auth-*, .form-label, .auth-form |
| Lines 1134-1319 (error 404) | `views/error.css` | .error-container, .error-card, .error-*, .error-help |
| Lines 1719-1753 (dashboard mobile) | `views/dashboard.css` | .appointment-item responsive rules |
| Lines 1518-1546 (fadeIn, slideUp) | `utilities/animations.css` | @keyframes fadeIn/slideUp, .fade-in |
| Lines 1703-1717 (spin) | `utilities/animations.css` | @keyframes spin, .spinning (append) |
| Lines 716-798 (landing @media) | `utilities/responsive.css` | Landing responsive breakpoints |
| Lines 1587-1701 (global @media) | `utilities/responsive.css` | Auth/error card, footer, main-content responsive |
| Lines 843-864, 918-942 (tech @media) | `utilities/responsive.css` | Tech icon responsive (append) |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/public/css/base/tokens.css` | Create | Extract `:root` block (lines 1-7) |
| `frontend/public/css/base/layout.css` | Create | Extract body/main-content rules (lines 9-45) |
| `frontend/public/css/components/buttons.css` | Create | Extract all button variants (lines 112-297) |
| `frontend/public/css/components/cards.css` | Create | Extract .content-card (lines 331-341) |
| `frontend/public/css/components/forms.css` | Create | Extract password fix + form styles (lines 1046-1133, 1405-1496, 1401-1404) |
| `frontend/public/css/components/alerts.css` | Create | Extract alert styles (lines 1498-1516) |
| `frontend/public/css/components/tables.css` | Create | Extract table/dentist list styles (lines 1320-1404) |
| `frontend/public/css/layout/header.css` | Create | Extract navbar + user dropdown (lines 47-111, 1548-1585) |
| `frontend/public/css/layout/footer.css` | Create | Extract footer styles (lines 299-329) |
| `frontend/public/css/views/landing.css` | Create | Extract landing page + tech logos (lines 343-942) |
| `frontend/public/css/views/auth.css` | Create | Extract auth page styles (lines 944-1133) |
| `frontend/public/css/views/error.css` | Create | Extract error page styles (lines 1134-1319) |
| `frontend/public/css/views/dashboard.css` | Create | Extract dashboard mobile polish (lines 1719-1753) |
| `frontend/public/css/utilities/animations.css` | Create | Extract all @keyframes (lines 1518-1546, 1703-1717) |
| `frontend/public/css/utilities/responsive.css` | Create | Extract all @media queries (lines 716-798, 843-864, 918-942, 1587-1701) |
| `frontend/public/css/style.css` | Delete | Fully decomposed — no orphaned rules |
| `frontend/src/views/partials/head.ejs` | Modify | Replace single `style.css` link with 12 `<link>` tags for shared modules |

## Interfaces / Contracts

### head.ejs Shared CSS Block

Replace the current single line:
```html
<link rel="stylesheet" href="/css/style.css" />
```

With:
```html
<!-- Custom CSS Modules -->
<link rel="stylesheet" href="/css/base/tokens.css" />
<link rel="stylesheet" href="/css/base/layout.css" />
<link rel="stylesheet" href="/css/components/buttons.css" />
<link rel="stylesheet" href="/css/components/cards.css" />
<link rel="stylesheet" href="/css/components/forms.css" />
<link rel="stylesheet" href="/css/components/alerts.css" />
<link rel="stylesheet" href="/css/components/tables.css" />
<link rel="stylesheet" href="/css/layout/header.css" />
<link rel="stylesheet" href="/css/layout/footer.css" />
<link rel="stylesheet" href="/css/utilities/animations.css" />
<link rel="stylesheet" href="/css/utilities/responsive.css" />
```

Order is critical: tokens → layout → components → layout regions → utilities. This preserves the original cascade where later rules override earlier ones.

### View-Specific Loading via extraStylesheets

Views set `extraStylesheets` in their controller render call:
```js
res.render('landing/index', {
  title: 'Dental Clinic',
  extraStylesheets: ['/css/views/landing.css']
});
```

The existing `head.ejs` logic already handles this — no template changes needed beyond the shared CSS block.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Selector coverage | Every selector from original style.css exists in exactly one new file | Grep all selectors from original, count matches across new files, verify total equals original count |
| No duplicates | No selector appears in multiple files | Cross-file grep for each selector |
| Visual parity | Each view renders identically | Manual screenshot comparison per view (landing, login, register, dashboard, dentist list, patient list, appointment list, 404, 403) |
| Cascade order | Shared styles load before view styles | Inspect rendered `<head>` per view, verify `<link>` order |
| Bootstrap overrides | Custom `.btn-primary`, `.navbar` overrides still work | Visual check on any page with Bootstrap components |

## Migration / Rollout

### Step-by-step
1. Create directory structure: `base/`, `components/`, `layout/`, `views/`, `utilities/`
2. Extract each section from `style.css` into its target file (copy, don't move — keep original until verified)
3. Update `head.ejs` to load shared modules (keep `style.css` link temporarily)
4. Verify each view loads correctly with both old and new CSS
5. Remove `style.css` link from `head.ejs`
6. Delete `style.css`
7. Run full visual verification

### Rollback Plan
1. `git revert` the commit — all changes are file additions, one modification (head.ejs), and one deletion
2. Original `style.css` is in git history, instantly restorable
3. No database or backend changes to roll back
4. Keep `style.css.bak` locally during migration as safety net (not committed)

## Open Questions

- [ ] Should `base/typography.css` be created even though no dedicated typography rules exist beyond body font-family (currently in layout.css)? Decision: keep in layout.css for now, extract later if typography grows.
- [ ] Landing page (`views/landing/index.ejs`) does not set `extraStylesheets` — the controller needs to be updated. Need to verify the Express route handler for `/` and `/landing`.
