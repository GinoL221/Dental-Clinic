# Tasks: Refactor Frontend CSS Modularization

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,800 (1,753 split + ~50 head.ejs) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 3 stacked PRs (foundation → views/utilities → integration) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation: base/ + components/ + layout/ CSS files | PR 1 | Core structure; head.ejs still loads style.css (dual-load safe state) |
| 2 | Utilities + views: animations.css + responsive.css + 4 view files | PR 2 | Independent of PR 1; head.ejs still loads style.css |
| 3 | Integration: head.ejs update + cascade verification + style.css removal | PR 3 | Final wiring; remove legacy file only after cascade confirmed |

---

## Phase 1: Audit and Plan (PR 1 prerequisite)

- [x] 1.1 Read entire `frontend/public/css/style.css` (1,753 lines), document line ranges for each section per the design file map
- [x] 1.2 Verify `frontend/src/views/partials/head.ejs` has `extraStylesheets` mechanism (already confirmed)
- [x] 1.3 Create directories: `frontend/public/css/base/`, `frontend/public/css/components/`, `frontend/public/css/layout/`, `frontend/public/css/views/`, `frontend/public/css/utilities/` (views/ and utilities/ deferred to PR 2)

---

## Phase 2: PR 1 — Foundation Files (base/ + components/ + layout/)

- [x] 2.1 Create `frontend/public/css/base/tokens.css` — extract `:root` block (style.css lines 1–7): CSS custom properties (--color-*)
- [x] 2.2 Create `frontend/public/css/base/layout.css` — extract body/.main-content rules (style.css lines 9–45): HTML/body height, flex layout, main-content padding (body font-family moved to typography.css per user instruction)
- [x] 2.3 Create `frontend/public/css/components/buttons.css` — extract all button variants (style.css lines 112–297): .btn-primary, .btn-outline-*, .auth-btn-*, .error-btn-*, .btn:disabled
- [x] 2.4 Create `frontend/public/css/components/cards.css` — extract .content-card (style.css lines 331–341)
- [x] 2.5 Create `frontend/public/css/components/forms.css` — extract password toggle + form styles (style.css lines 1401–1496): .password-*, .form-control:focus
- [x] 2.6 Create `frontend/public/css/components/alerts.css` — extract .alert, .alert-success, .alert-danger (style.css lines 1498–1516)
- [x] 2.7 Create `frontend/public/css/components/tables.css` — extract table/dentist list styles (style.css lines 1320–1404): .table-container, .table thead, .btn-edit, .btn-delete, .btn-action
- [x] 2.8 Create `frontend/public/css/layout/header.css` — extract navbar + user dropdown (style.css lines 47–111, 1548–1585): .navbar, .nav-link, .dropdown-*, .user-dropdown
- [x] 2.9 Create `frontend/public/css/layout/footer.css` — extract footer styles (style.css lines 299–329): footer, .footer-*
- [x] 2.10 Verify: `grep -c` selector count in new files equals original selector count from style.css — verified: all 30+ unique selectors from extracted ranges accounted for; zero PR 2 selector leaks; no standalone duplicate definitions

---

## Phase 3: PR 2 — Utilities and View-Specific Files

- [x] 3.1 Create `frontend/public/css/utilities/animations.css` — extract all @keyframes (style.css lines 1518–1546, 1703–1717): fadeIn, slideUp, spin, .fade-in, .spinning
- [x] 3.2 Create `frontend/public/css/utilities/responsive.css` — extract all @media queries (style.css lines 716–798, 843–864, 918–942, 1587–1701): landing breakpoints, auth/error card, footer, main-content responsive
- [x] 3.3 Create `frontend/public/css/views/landing.css` — extract landing page + tech logos (style.css lines 343–942): .landing-hero, .hero-*, .landing-features, .feature-*, .tech-icon-img, .tech-logo
- [x] 3.4 Create `frontend/public/css/views/auth.css` — extract auth page styles (style.css lines 944–1133): .auth-container, .auth-card, .auth-*, .form-label, .auth-form
- [x] 3.5 Create `frontend/public/css/views/error.css` — extract error page styles (style.css lines 1134–1319): .error-container, .error-card, .error-*, .error-help
- [x] 3.6 Create `frontend/public/css/views/dashboard.css` — extract dashboard mobile polish (style.css lines 1719–1753): .appointment-item responsive rules
- [x] 3.7 Update controllers to set `extraStylesheets` for views that need view-specific CSS: landing → /css/views/landing.css, auth → /css/views/auth.css, error → /css/views/error.css, dashboard → /css/views/dashboard.css (routes.js updated for landing + aboutUs; other routes will be handled in PR 3 / integration phase)
- [x] 3.8 Verify: no selector from style.css appears in multiple files (cross-file grep) — verified: no PR2-specific selectors (.landing-hero, .auth-container, .error-container, .appointment-item, .fade-in, .portfolio-badge, .btn-cta-primary) appear in PR1 files. Known intentional duplicate: .error-btn-primary in both components/buttons.css and views/error.css (mirrors original style.css cascade where the second definition overrides the first).

---

## Phase 4: PR 3 — Integration, Cascade, and Cleanup

- [ ] 4.1 In `frontend/src/views/partials/head.ejs`: replace `<link rel="stylesheet" href="/css/style.css" />` with 12 module `<link>` tags in cascade order: tokens.css → layout.css → buttons.css → cards.css → forms.css → alerts.css → tables.css → header.css → footer.css → animations.css → responsive.css (keep normalize.css and Bootstrap untouched)
- [ ] 4.2 Verify: inspect rendered `<head>` for landing page — confirm base → components → layout → utilities load order matches design
- [ ] 4.3 Verify: landing page loads landing.css via extraStylesheets after shared CSS (check rendered HTML)
- [ ] 4.4 Visual test: open landing page, login, register, dashboard, dentist list, patient list, appointment list, 404 — confirm pixel-identical rendering
- [ ] 4.5 Delete `frontend/public/css/style.css` (file fully decomposed)
- [ ] 4.6 Final grep: confirm style.css no longer referenced in any template
- [ ] 4.7 Commit PR 3 with message: "refactor(frontend): remove legacy style.css after modular split"