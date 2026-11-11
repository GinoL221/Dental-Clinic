# Design System Tokens and WCAG AA Cleanup

Branch feat/design-system-tokens-cleanup (from main 11f551d). Consolidates design tokens in tokens.css, removes !important gradients in buttons.css, fixes WCAG AA navigation link contrast in header.css, and updates design/system.md according to docs/design.md (Phase 6 of project plan).

## Specs

- S1: `frontend/static/css/base/tokens.css` must define all target tokens from `docs/design.md` §2 (`--color-primario-dark`, `--color-texto`, `--color-texto-muted`, `--color-borde-suave`, `--color-peligro`, `--color-peligro-hover`, `--color-info-dark`, `--color-exito-texto`, `--gradient-primary`, `--gradient-primary-hover`).
- S2: `frontend/static/css/components/buttons.css` must eliminate duplicated hardcoded gradients and `!important` overrides, referencing `var(--gradient-primary)` and `var(--gradient-primary-hover)`.
- S3: `frontend/static/css/layout/header.css` must use `--color-primario-dark` for `.nav-link` and `.nav-link:hover` (with text-decoration underline), eliminating the mint `#a4e2c2` hover on white that failed WCAG AA (1.48:1).
- S4: Synchronize `design/system.md` to document the full token catalog.
- S5: Full verification: frontend tests (`npm test`, `npm run check`, `npm run typecheck`), backend tests (`./mvnw test`), and format.

## Tasks

- [x] T1 (S1) Consolidate design tokens in `tokens.css` — route: inline — commit: this commit
- [x] T2 (S2) Remove `!important` gradients and hardcoded colors in `buttons.css` — route: inline — commit: this commit
- [x] T3 (S3) Fix WCAG AA contrast for navigation links in `header.css` — route: inline — commit: this commit
- [x] T4 (S4) Update `design/system.md` with active design tokens — route: inline — commit: this commit
- [x] T5 (S5) Full verification, format checks, and reviewable commits — route: inline — commit: this closing commit

## Log

- L1: User approved Phase 6: "si" to create feat/design-system-tokens-cleanup from main (11f551d).
- L2: T1 implemented: added --color-primario-dark, --color-texto, --color-texto-muted, --color-borde-suave, --color-peligro, --color-peligro-hover, --color-info-dark, --color-exito-texto, --gradient-primary, --gradient-primary-hover to tokens.css.
- L3: T2 implemented: removed !important and hardcoded hex values in buttons.css, switching to var(--gradient-primary), var(--gradient-primary-hover) and var(--color-primario-dark).
- L4: T3 implemented: updated header.css .navbar-brand, .nav-link, .dropdown-item, .user-dropdown to --color-primario-dark (5.42:1 WCAG AA contrast on white), removed mint hover on white.
- L5: T4 implemented: updated design/system.md token catalog.
- L6: T5 verified: svelte-check 0 errors 0 warnings, tsc clean, 132 vitest tests pass, 14 process runner tests pass, 269 backend tests pass, Prettier and Spotless clean.
