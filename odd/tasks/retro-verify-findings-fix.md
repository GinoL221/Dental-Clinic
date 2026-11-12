# Retro Verification Findings Fix

Branch fix/retro-verify-findings (from main 048b469). Closes the three findings from the retrospective verification wave:

1. WCAG AA failures: `.hero-badge` (landing.css, 2.97:1) and `.user-dropdown .dropdown-item:hover` (header.css, 2.28:1).
2. Accessibility regression: FormCard error alert lost role="alert" and warning icon (affects change-password, login).
3. docs/product.md line-range drift after later refactors (5 of 13 ranges stale) + temporaryPassword wording.

## Specs

- S1: `.hero-badge` text uses `--color-primario-dark` (#2b6cb0, >= 4.5:1 on its tinted background).
- S2: `.user-dropdown .dropdown-item:hover` uses accessible colors (text >= 4.5:1 against hover background).
- S3: FormCard error alert renders with `role="alert"` and a warning icon (`bi-exclamation-triangle`).
- S4: docs/product.md line ranges match current code (hooks.server.js, PatientServiceImpl, DentistServiceImpl, DentistController, PatientController, AppointmentController); temporaryPassword wording says services fill it.
- S5: Full verification: frontend check/typecheck/tests, impeccable detect, backend spotless + focused tests.

## Tasks

- [x] T1 (S1, S2) Fix WCAG AA contrast in landing.css and header.css — route: inline — commit: this commit
- [x] T2 (S3) Restore role="alert" and warning icon in FormCard error alert — route: inline — commit: this commit
- [x] T3 (S4) Refresh docs/product.md line ranges and wording — route: inline — commit: this commit
- [x] T4 (S5) Full verification and commit — route: inline — commit: this closing commit

## Log

- L1: User approved: "si" to closing the three retro findings.
- L2: T1 implemented: .hero-badge uses --color-primario-dark; .user-dropdown .dropdown-item:hover uses --color-primario-dark background with --color-blanco text.
- L3: T2 implemented: FormCard error alert now has role="alert" and bi-exclamation-triangle icon.
- L4: T3 implemented: refreshed docs/product.md ranges (hooks.server.js:4-57, controllers 32-115/32-124/55-232, PatientServiceImpl:52-67, DentistServiceImpl:49-64) and temporaryPassword wording (services fill it).
- L5: T4 verified: svelte-check 0 errors 0 warnings, tsc clean, 150 vitest tests pass, vite build clean, impeccable detect 0 findings ([]), backend spotless clean and 33 focused tests pass.
