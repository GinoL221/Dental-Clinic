# Tasks: Migrate to SvelteKit

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 3500-5000 lines |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 4 PRs: 1. Infra/Hooks/Layout, 2. Auth/Views, 3. Remaining Views, 4. Tests/Cleanups |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units
| Unit | Goal | Likely PR | Notes |
|---|---|---|---|
| Scaffold | Initialize SvelteKit structure | PR 1 | Base config and files |
| Auth Shell | Hooks, layout, and global style | PR 1 | Route guards |
| Core Views | Auth and dashboard migration | PR 2 | Key entry points |
| Domain Views | Patients/Dentists/Appointments | PR 3 | Data views and actions |
| Verification | Tests and Express deprecation | PR 4 | Complete migration |

## Phase 1: Scaffold & Infrastructure
- [x] 1.1 Update `package.json` with SvelteKit, Vite, Vitest, and Playwright dependencies.
- [x] 1.2 Add `svelte.config.js` and `vite.config.js` under `frontend/`.
- [x] 1.3 Create folder structure for SvelteKit routes (`frontend/src/routes/`).
- [x] 1.4 Move legacy assets from `frontend/public/` to `frontend/static/`.

## Phase 2: Hooks, Auth, and Layout
- [x] 2.1 Implement `frontend/src/hooks.server.js` for validation against `/api/auth/validate`.
- [x] 2.2 Create `frontend/src/lib/api.js` client wrapper for Spring Boot communication.
- [x] 2.3 Add global root `frontend/src/routes/+layout.svelte` with layout shell and CSS imports.
- [x] 2.4 Add `frontend/src/routes/+layout.server.js` loader to inject `event.locals.user`.

## Phase 3: Page by Page Migration
- [x] 3.1 Migrate auth pages: `login/` and `users/register/` Svelte pages & server Form Actions.
- [x] 3.2 Migrate landing page `+page.svelte` without auth guard.
- [x] 3.3 Migrate `dashboard/` with admin-only auth redirection.
- [x] 3.4 Migrate `patients/` views (list, add, edit Svelte components & loaders).
- [x] 3.5 Migrate `dentists/` views (list, add, edit Svelte components & loaders).
- [x] 3.6 Migrate `appointments/` views (list, add, edit Svelte components & loaders).

## Phase 4: Testing Setup
- [x] 4.1 Create `frontend/playwright.config.js` and add E2E tests in `frontend/tests/`.
- [x] 4.2 Setup `frontend/src/test/setup.js` for Vitest and write unit tests for hooks and loaders.

## Phase 5: Cleanup
- [x] 5.1 Delete legacy Express configuration `frontend/app.js`.
- [x] 5.2 Remove legacy EJS templates from `frontend/src/views/`.
- [x] 5.3 Remove Express route handlers from `frontend/src/routes/`.
- [x] 5.4 Delete vanilla controllers from `frontend/public/js/`.
- [x] 5.5 Remove unused Jest and Supertest dependencies from `package.json`.
