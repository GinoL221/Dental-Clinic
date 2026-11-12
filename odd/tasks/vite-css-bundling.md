# Vite CSS Bundling & Pipeline Architecture

Branch refactor/vite-css-bundling (from main 8577397). Bundles all modular frontend stylesheets into Vite's asset pipeline via `src/app.css`, eliminates 13 runtime static `<link>` requests, enforces cascade order with Bootstrap CDN in `app.html`, and adds Subresource Integrity (SRI) attributes.

## Specs

- S1: Create master stylesheet `frontend/src/app.css` importing all modular base, component, layout, utility, and view CSS files.
- S2: In `frontend/src/routes/+layout.svelte`, replace the 13 static `<link>` tags with `import "../app.css";`.
- S3: In `frontend/src/app.html`, position Bootstrap 5.3.3 and Bootstrap Icons 1.10.5 CDN tags before `%sveltekit.head%` with Subresource Integrity (`integrity="sha384-..." crossorigin="anonymous"`).
- S4: In route components (`+page.svelte`, `dashboard/+page.svelte`, `login/+page.svelte`, `users/register/+page.svelte`, `users/change-password/+page.svelte`), remove redundant view-level `<link>` tags.
- S5: Full verification: `npm run check` (0 errors, 0 warnings), `npm run typecheck`, `npm test` (all 150 pass), `npm run build` (single hashed CSS bundle `0.BRvp...css`), `npm run test:e2e:process` (14/14 pass), backend tests pass, and `impeccable detect` returns 0 findings (`[]`).

## Tasks

- [x] T1 (S1) Create `frontend/src/app.css` with modular stylesheet imports — route: inline — commit: this commit
- [x] T2 (S2, S3) Update `+layout.svelte` and `app.html` with SRI and cascade ordering — route: inline — commit: this commit
- [x] T3 (S4) Remove redundant view `<link>` tags across route pages — route: inline — commit: this commit
- [x] T4 (S5) Full verification and reviewable commit — route: inline — commit: this closing commit

## Log

- L1: User approved: "opcion a" to bundling CSS in Vite pipeline and ordering Bootstrap in app.html.
- L2: T1 implemented: created src/app.css with all 16 modular stylesheets.
- L3: T2 implemented: updated +layout.svelte with `import "../app.css"`, removed 13 `<link>` tags; updated app.html with Bootstrap CDN + SRI hashes before `%sveltekit.head%`.
- L4: T3 implemented: removed view `<link>` tags from landing, dashboard, login, register, and change-password pages.
- L5: T4 verified: svelte-check 0 errors 0 warnings, tsc clean, 150 vitest tests pass, 14 process runner tests pass, vite build generates single 29.37 kB (5.61 kB gzip) hashed bundle, impeccable detect 0 findings ([]), backend spotless and tests clean.
