# Frontend Shared Components & Duplication Remediation

Branch refactor/frontend-shared-components (from main 2685d5c). Extracts reusable presentational components into `frontend/src/lib/components/` and refactors patients and dentists list and add pages to eliminate structural duplication.

## Specs

- S1: Create reusable presentational components in `frontend/src/lib/components/`:
  - `ListPageHeader.svelte`: search input, clear button, title, and conditional add action.
  - `EmptyState.svelte`: icon, title, and message for empty searches or lists.
  - `FormCard.svelte`: card container, header (title + subtitle), error alert, and footer back-link.
- S2: Refactor `frontend/src/routes/patients/+page.svelte` and `frontend/src/routes/dentists/+page.svelte` to consume `ListPageHeader` and `EmptyState`.
- S3: Refactor `frontend/src/routes/patients/add/+page.svelte` and `frontend/src/routes/dentists/add/+page.svelte` to consume `FormCard`.
- S4: Full verification: `npm run check` (0 errors, 0 warnings), `npm run typecheck`, `npm test` (all pass), and `npm run build`.

## Tasks

- [x] T1 (S1) Create `ListPageHeader.svelte`, `EmptyState.svelte`, and `FormCard.svelte` in `src/lib/components/` — route: inline — commit: this commit
- [x] T2 (S2) Refactor `patients/+page.svelte` and `dentists/+page.svelte` — route: inline — commit: this commit
- [x] T3 (S3) Refactor `patients/add/+page.svelte` and `dentists/add/+page.svelte` — route: inline — commit: this commit
- [x] T4 (S4) Run full verification suite and commit — route: inline — commit: this closing commit

## Log

- L1: User approved: "si" to creating the 3 components and refactoring patients and dentists.
- L2: T1 implemented: created ListPageHeader.svelte, EmptyState.svelte, FormCard.svelte in src/lib/components/.
- L3: T2 implemented: refactored patients/+page.svelte and dentists/+page.svelte to use ListPageHeader and EmptyState.
- L4: T3 implemented: refactored patients/add/+page.svelte and dentists/add/+page.svelte to use FormCard.
- L5: T4 verified: svelte-check 0 errors 0 warnings, tsc clean, 132 vitest tests pass, vite build successful, impeccable detect 0 findings ([]), backend spotless and tests clean.
