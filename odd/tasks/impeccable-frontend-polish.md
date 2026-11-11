# Impeccable Frontend Polish & WCAG AA Remediation

Branch feat/impeccable-frontend-polish (from main 04447a1). Refines frontend CSS using Impeccable heuristics and solves remaining WCAG AA contrast gaps and hardcoded hex values across tables, alerts, auth, error, dashboard, forms, and landing views.

## Specs

- S1: Eliminate `impeccable detect` warnings in `auth.css` and `error.css` (remove `.auth-card::before` and `.error-card::before` artificial 5px gradient stripes, replacing with clean border `1px solid var(--color-borde-suave)`). `npx impeccable detect frontend/src frontend/static/css` must return exit 0 with 0 findings (`[]`).
- S2: Fix WCAG AA contrast in `tables.css` and `alerts.css`: `.btn-edit` must use `--color-info-dark` (`#0e7490`, 5.36:1 on white/white-on-color); `.alert-success` and `.btn-add-dentist` must use `--color-exito-texto` (`#1b4332`, 7.51:1 on mint `#a4e2c2`); mobile `td::before` labels must use `--color-primario-dark` (5.42:1); `.btn-delete` must use `--color-peligro` and `--color-peligro-hover`; remove obsolete `!important` on mobile action button tints.
- S3: In `auth.css` and `error.css`, eliminate hardcoded hex colors and WCAG AA contrast issues on white: `.form-label`, `.auth-title`, `.auth-link` (and hover with underline + `--color-primario-dark`), `.auth-btn-secondary`, `.error-link`, `.error-btn-secondary` must use `--color-primario-dark`; `.error-btn-primary` must use `var(--gradient-primary)`; replace `#6c757d`, `#e9ecef`, `#dc3545` with their respective tokens.
- S4: In `dashboard.css`, `forms.css`, and `landing.css`, replace hardcoded hex colors (`#6c757d`, `#dc3545`, `#e9ecef`) with tokens and remove unnecessary `!important` overrides in `landing.css` CTA buttons.
- S5: Update `design/system.md` to document that hardcoded hex values and contrast issues have been eliminated and fully tokenized.
- S6: Full verification: `npx impeccable detect` (0 findings), `npm run check` (0 errors, 0 warnings), `npm run typecheck`, `npm test` (all pass), `npm run build`, backend `./mvnw spotless:check` and `./mvnw test`, and atomic conventional commits.

## Tasks

- [x] T1 (S1) Remove AI slop side-tab stripes in `auth.css` and `error.css` — route: inline — commit: this commit
- [x] T2 (S2) Fix WCAG AA contrast and token usage in `tables.css` and `alerts.css` — route: inline — commit: this commit
- [x] T3 (S3) Tokenize and fix contrast in `auth.css` and `error.css` — route: inline — commit: this commit
- [x] T4 (S4) Tokenize `dashboard.css`, `forms.css`, and clean `landing.css` — route: inline — commit: this commit
- [x] T5 (S5) Update `design/system.md` with resolved status — route: inline — commit: this commit
- [x] T6 (S6) Run full verification suite and commit — route: inline — commit: this closing commit

## Log

- L1: User approved plan: "bien, avanzamos con el plan". Created feat/impeccable-frontend-polish from main (04447a1).
- L2: T1 implemented: removed .auth-card::before and .error-card::before stripes; impeccable detect returned 0 findings [].
- L3: T2 implemented: updated tables.css and alerts.css with --color-info-dark, --color-exito-texto, --color-peligro, --color-primario-dark, and removed obsolete !important tints.
- L4: T3 implemented: updated auth.css and error.css with --color-primario-dark, --color-texto-muted, --color-borde-suave, --color-peligro, and accessible underline hover.
- L5: T4 implemented: updated dashboard.css, forms.css, and landing.css with tokens and cleaned !important in CTA buttons.
- L6: T5 implemented: updated design/system.md reflecting full remediation.
- L7: T6 verified: impeccable detect returned [], svelte-check 0 errors 0 warnings, tsc clean, 132 vitest tests pass, 14 process runner tests pass, vite build successful, backend spotless and tests clean.
