# Tasks: Update Docs Architecture

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 700-1000 (full rewrites across 8 files, ~706 raw lines today) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 root-light -> PR2 root-heavy -> PR3 frontend-overview -> PR4 frontend-api+config |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending (user decision required) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | `README.md` + `AGENTS.md`: stack, quick-path commands, check/typecheck | PR 1 | base: main; lowest risk |
| 2 | `CONEXION.md` + `SPECIALTY_VERIFICATION.md`: dev startup, cookie session, ports | PR 2 | base: PR1 or main; heaviest legacy content |
| 3 | `frontend/README.md` + `frontend/API-CONFIG.md`: SvelteKit overview, `BACKEND_URL` | PR 3 | base: PR2 or main; independent content |
| 4 | `frontend/API-DOCS.md` remap + `openspec/config.yaml` + full sweep | PR 4 | base: PR3 or main; final consistency gate |

Note: no TDD RED/GREEN applies — docs/config only, no source code touched (per proposal Out of Scope).

## Phase 1: Ground-Truth Verification (Foundation)
- [x] 1.1 Re-confirm `frontend/package.json` scripts (dev/build/preview/test/test:watch/test:e2e/check/typecheck) match design.md ground truth.
- [x] 1.2 Re-confirm `vite.config.js` has no `server.proxy` block (no Vite proxy exists — do not document one).
- [x] 1.3 Re-confirm `hooks.server.js` cookie flow (`authToken`/`userRole`/`userEmail` -> `event.locals.user`) and `lib/api.js`/`config/apiConfig.js` `BACKEND_URL` fallback `:8080`.

## Phase 2: Root Docs — satisfies sveltekit-dev-workflow, vitest-playwright-testing, svelte-check-type-safety (Work Units 1-2)
- [x] 2.1 Rewrite `README.md`: stack, `npm run dev`@5173, backend@8080, `npm run test`/`test:e2e`, `npm run check`/`typecheck`.
- [x] 2.2 Rewrite `AGENTS.md`: replace Express/EJS rules with SvelteKit/Vite conventions; require `npm run check` + `typecheck` before commit.
- [x] 2.3 Rewrite `CONEXION.md`: dev startup, Spring Boot@8080, cookie-session via `hooks.server.js`, server-side `apiFetch` -> `BACKEND_URL` (NOT a Vite proxy).
- [x] 2.4 Rewrite `SPECIALTY_VERIFICATION.md`: fix ports (3000/3001 -> 5173/4173) and start commands.

## Phase 3: Frontend Docs — satisfies sveltekit-dev-workflow (Work Units 3-4)
- [x] 3.1 Overhaul `frontend/README.md`: SvelteKit app structure, routes, hooks, dev/build/preview/test commands.
- [x] 3.2 Rewrite `frontend/API-CONFIG.md`: `lib/api.js`/`config/apiConfig.js`, `BACKEND_URL` env (default `:8080`); remove proxy wording.
- [x] 3.3 Rewrite `frontend/API-DOCS.md`: replace Express controller/middleware mapping with SvelteKit loaders (`+page.server.js`), actions, `hooks.server.js` guards; describe server-side `apiFetch`, not a dev proxy.

## Phase 4: Config Metadata (Work Unit 4)
- [x] 4.1 Update `openspec/config.yaml` `stack.frontend`: framework -> `SvelteKit 2 + Svelte 4 + Vite 5`; `test_runner.command` -> `npm run test`; framework -> `Vitest + Playwright`.
- [x] 4.2 Update `openspec/config.yaml` `testing.frontend`: command -> `npm run test`; notes -> Vitest unit + Playwright E2E + `npm run check`.

## Phase 5: Consistency Verification — satisfies all three specs (Work Unit 4)
- [x] 5.1 `rg -i "express|ejs|jest|localstorage"` across all 8 changed files; confirm zero matches outside legacy-mapping tables.
- [x] 5.2 `rg "3000|3001"` across changed files; confirm zero remaining legacy ports.
- [x] 5.3 YAML-lint `openspec/config.yaml`; confirm it parses and reflects SvelteKit/Vitest/Playwright.
- [x] 5.4 Manually diff every documented command/port against `frontend/package.json` scripts.
