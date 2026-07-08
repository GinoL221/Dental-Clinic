# Apply Progress: Update Docs Architecture

**Change**: update-docs-architecture
**Mode**: Standard (docs/config-only — no application source code touched; Strict TDD does not apply per proposal Out of Scope)

## Work Unit Boundary

- **Unit 1 (done)**: `README.md`, `AGENTS.md`
- **Unit 2 (done)**: `CONEXION.md`, `SPECIALTY_VERIFICATION.md`
- **Unit 3 (done)**: `frontend/README.md`, `frontend/API-CONFIG.md`
- **Unit 4 (this batch, done — FINAL)**: `frontend/API-DOCS.md`, `openspec/config.yaml` (stack/testing metadata), README.md logout fix, full consistency sweep across all 8 files
- **Changed lines Unit 1**: 60 (`AGENTS.md` +9/-6, `README.md` +24/-21)
- **Changed lines Unit 2**: 329 (`CONEXION.md` +123/-206 full rewrite, `SPECIALTY_VERIFICATION.md` +2/-2 targeted port/proxy fix)
- **Changed lines Unit 3**: 288 total (`frontend/README.md` + `frontend/API-CONFIG.md`, both full rewrites)
- **Changed lines Unit 4**: 274 total (`git diff --stat`: 108 insertions + 166 deletions across `README.md` (logout fix), `frontend/API-DOCS.md` (full rewrite), `openspec/config.yaml` (stack/testing metadata)) — well within the 400-line budget
- Chain strategy: `stacked-to-main` (user-confirmed)

## Completed Tasks

- [x] 1.1 Re-confirmed `frontend/package.json` scripts (`dev`, `build`, `preview`/`start`, `test`, `test:watch`, `test:e2e`, `check`, `typecheck`) match design.md ground truth.
- [x] 1.2 Re-confirmed `frontend/vite.config.js` has no `server.proxy` block — only the `sveltekit()` plugin and Vitest config.
- [x] 1.3 Re-confirmed `frontend/src/hooks.server.js` cookie flow (`authToken`/`userRole`/`userEmail` → `event.locals.user`) and `frontend/src/lib/api.js` `BACKEND_URL` fallback to `http://localhost:8080`.
- [x] 2.1 Rewrote `README.md`: SvelteKit/Vite stack table, quick-path (`npm run dev`@5173, backend@8080), tests/type-check table, architecture section — zero legacy Express/EJS/Jest/port-3000 references.
- [x] 2.2 Rewrote `AGENTS.md`: replaced Express/EJS sections with SvelteKit/Vite conventions; required `npm run check` + `npm run typecheck` before committing frontend changes.
- [x] 2.3 Rewrote `CONEXION.md`: dev startup, cookie-session flow table, server-side `apiFetch`/`BACKEND_URL`, corrected `/api` context-path endpoints, request-vs-response DTO shape, real seeded demo admin, H2 console fix, removed CORS troubleshooting entry, removed inaccurate `/api/auth/logout` backend-call framing.
- [x] 2.4 Rewrote `SPECIALTY_VERIFICATION.md`: fixed port refs (3001→5173) and proxy claim; rest already accurate.
- [x] 3.1 Overhauled `frontend/README.md`: full Spanish rewrite with cognitive-doc-design shape — Quick path, Stack table, project-structure table, tests/type-check table, legacy→actual mapping table.
- [x] 3.2 Rewrote `frontend/API-CONFIG.md`: documents real `apiFetch`/`getAuthHeaders`/`BACKEND_URL` integration path; flags `src/config/apiConfig.js` as verified dead code.
- [x] 3.3 Rewrote `frontend/API-DOCS.md`: full remap of legacy Express controller/middleware documentation to a SvelteKit route table (`load`/`actions` per route → real backend endpoint(s), sourced directly from each `+page.server.js`), a `hooks.server.js` guard-flow section, a real `apiFetch` error-handling section (based on actual `Error`/`status` behavior, not assumed), and an updated legacy→actual mapping table.
- [x] 4.1 Updated `openspec/config.yaml` `stack.frontend`: `framework` → `SvelteKit 2 + Svelte 4 + Vite 5`; `test_runner.command` → `npm run test`; `test_runner.framework` → `Vitest + Playwright`.
- [x] 4.2 Updated `openspec/config.yaml` `testing.frontend`: `command` → `npm run test`; `notes` → Vitest unit/component tests, Playwright E2E (`npm run test:e2e`), and type safety via `npm run check`/`npm run typecheck`.
- [x] 5.1 `rg -in "express|ejs|jest|localstorage"` across all 8 changed files: only intentional negation ("no localStorage") and legacy-mapping-table mentions remain — zero instructional legacy content.
- [x] 5.2 `rg -n "3000|3001"` across all 8 changed files: only one match, in `frontend/README.md`'s intentional legacy→actual mapping table row (`Puerto 3000 -> 5173/4173`) — zero unintentional/instructional legacy port references.
- [x] 5.3 `python3 -c "import yaml; yaml.safe_load(...)"` on `openspec/config.yaml`: parses cleanly; `stack.frontend` and `testing.frontend` reflect SvelteKit/Vitest/Playwright.
- [x] 5.4 Manually diffed every documented command (`dev`, `build`, `preview`/`start`, `test`, `test:watch`, `test:e2e`, `check`, `typecheck`) and port (`5173` dev, `4173` preview, `8080` backend, `8080` Playwright mock-backend) against `frontend/package.json` scripts, `frontend/vite.config.js` (no port override), and `frontend/playwright.config.js` (`port: 8080` mock-backend, `port: 4173` preview) — all match exactly.

## Files Changed (cumulative — all 4 units)

| File | Action | What Was Done |
|------|--------|----------------|
| `README.md` | Modified (Unit 1 + Unit 4 fix) | Stack table, quick-path commands, tests/typecheck table, architecture/auth section (Unit 1); corrected non-existent `POST /api/auth/logout` claim to the real `POST /users/logout` SvelteKit action (Unit 4) |
| `AGENTS.md` | Modified (Unit 1) | Replaced Express/EJS coding rules with SvelteKit/Vite conventions + check/typecheck requirement |
| `CONEXION.md` | Modified (Unit 2) | Full rewrite: SvelteKit dev startup, cookie-session table, `/api`-prefixed endpoints, request/response DTO accuracy, real seed credentials, H2 console fix, removed stale CORS/logout-endpoint claims |
| `SPECIALTY_VERIFICATION.md` | Modified (Unit 2) | Port 3001→5173, proxy claim replaced with server-side apiFetch description; rest already accurate |
| `frontend/README.md` | Modified (Unit 3) | Full rewrite: SvelteKit structure, quick-path, stack, tests/type-check table, legacy mapping |
| `frontend/API-CONFIG.md` | Modified (Unit 3) | Full rewrite: real `apiFetch`/`BACKEND_URL` integration documented; `config/apiConfig.js` flagged as verified dead code |
| `frontend/API-DOCS.md` | Modified (Unit 4) | Full rewrite: replaced Express controller/middleware docs with a SvelteKit route -> loader/action -> backend-endpoint table, `hooks.server.js` guard-flow section, real `apiFetch` error-handling section, updated legacy mapping |
| `openspec/config.yaml` | Modified (Unit 4) | `stack.frontend` and `testing.frontend` updated from Express/Jest metadata to SvelteKit/Vite/Vitest/Playwright |

## Verification Performed (Unit 4)

- Read every `+page.server.js` under `frontend/src/routes/**` (`rg -n "apiFetch\(" -A1` across `patients`, `dentists`, `appointments`, `users`) to build the route -> loader/action -> endpoint table in `API-DOCS.md` from real code, not assumption.
- Read `frontend/src/hooks.server.js` in full to describe the guard flow (`guardedPrefixes`, `GET /api/auth/validate`, cookie cleanup on failure) accurately.
- Read `frontend/src/lib/api.js` in full to describe `apiFetch`'s actual error behavior (`Error` with `.status` set, no built-in retry/redirect logic) instead of the old doc's generic HTTP-status-code list.
- Read `frontend/src/routes/users/logout/+page.server.js` and confirmed (again, independently of Unit 2/3 notes) that it only deletes 3 cookies and redirects — no backend call — before fixing the same claim in `README.md`.
- `rg -in "express|ejs|jest|localstorage" README.md AGENTS.md CONEXION.md SPECIALTY_VERIFICATION.md frontend/README.md frontend/API-CONFIG.md frontend/API-DOCS.md openspec/config.yaml`: all matches are intentional (legacy-mapping-table rows, or negation phrases like "no localStorage", "cookies, no localStorage"). Zero leftover instructional legacy content.
- `rg -n "3000|3001" <all 8 files>`: single match, the intentional `frontend/README.md` legacy→actual mapping table row. Zero unintended legacy port references.
- `python3 -c "import yaml; yaml.safe_load(open('openspec/config.yaml'))"`: parses without error; printed `stack.frontend` and `testing.frontend` sections confirm SvelteKit/Vite/Vitest/Playwright values landed correctly.
- Cross-read `frontend/package.json` scripts against every command referenced in all 8 files (`dev`, `build`, `preview`/`start`, `test`, `test:watch`, `test:e2e`, `check`, `typecheck`) — exact match, no drift.
- Cross-read `frontend/vite.config.js` (no `server.port` override -> Vite defaults 5173/4173 apply) and `frontend/playwright.config.js` (`port: 8080` for `tests/mock-backend.js`, `port: 4173` for the preview build) against every port mentioned in the 8 files — exact match.
- Cross-checked `frontend/API-DOCS.md`, `frontend/API-CONFIG.md`, `frontend/README.md`, `CONEXION.md`, and `README.md` against each other for contradictions on: `/api` context-path prefix (consistent everywhere), cookie names (`authToken`/`userRole`/`userEmail`, consistent everywhere), DTO casing (camelCase request / snake_case response, only stated in `CONEXION.md` — `API-DOCS.md`/`API-CONFIG.md` correctly defer to it via "ver `../CONEXION.md`" rather than duplicating/risking drift), no-Vite-proxy claim (consistent everywhere), logout endpoint (now consistent everywhere after the `README.md` fix).

## Verification Performed (Unit 2 — carried forward)

- `rg -in "express|ejs|jest|localstorage"` on both Unit 2 files: only 2 intentional negation mentions in `CONEXION.md` — no legacy instructional content remained.
- `rg -n "3000|3001"` on both Unit 2 files: zero matches.
- Verified `server.servlet.context-path=/api` in `backend/src/main/resources/application.properties`.
- Verified `DataInitializer.java` seeds `admin@dentalclinic.com`/`admin123`.
- Verified `AppointmentRequestDTO` (camelCase) vs `AppointmentDTO` response (snake_case).
- Verified `frontend/src/routes/users/logout/+page.server.js` clears cookies and redirects without any backend call. Flagged at the time that `README.md` (Unit 1, already merged) still had the stale `/api/auth/logout` claim — **fixed in this Unit 4 batch**.
- Verified no browser-side `fetch` call reaches the backend directly — removed the CORS troubleshooting entry as inapplicable.

## Verification Performed (Unit 3 — carried forward)

- `rg -in "express|ejs|jest|localstorage" frontend/README.md frontend/API-CONFIG.md`: only intentional legacy-mapping-table / negation mentions remained.
- `rg -n "3000|3001" frontend/README.md frontend/API-CONFIG.md`: zero matches.
- `rg -l "apiConfig" src` (from `frontend/`) returned no results — confirmed `src/config/apiConfig.js` is dead code.
- Cross-checked `src/lib/api.js` against real route usage in `dashboard/+page.server.js` and `login/+page.server.js`.
- Confirmed via `playwright.config.js` that `npm run test:e2e` boots `tests/mock-backend.js` on `:8080` plus preview on `:4173` — no real backend required.
- Confirmed `jsconfig.json` (`strict: true`, `checkJs: true`) backs both `npm run check` and `npm run typecheck`.

## Deviations from Design

None — implementation matches design.md ground truth and legacy→current mapping table across all 4 units.

Unit 3 extension (carried forward): task 3.2's `config/apiConfig.js` was documented as verified dead code rather than a secondary real integration path, per the "traceable to a verified file" design principle.

Unit 4 extension: task 3.3 only says "replace Express controller/middleware mapping with SvelteKit loaders... describe server-side apiFetch." During implementation it became clear that documenting an accurate *error-handling* section required reading `src/lib/api.js`'s actual throw behavior rather than reusing the old doc's generic HTTP-status-code list (400/401/403/404/409 framed as globally handled) — the real behavior is: `apiFetch` only sets `.status` on the thrown `Error`; each caller (form action or `hooks.server.js`) decides what to do with it. Documented this accurately instead of carrying forward the old doc's implied global error-handling middleware, per the same design principle of traceability to verified code.

## Issues Found

- **RESOLVED THIS UNIT**: `README.md` documented `POST /api/auth/logout` as a backend endpoint. Verified (again) no such backend endpoint exists (`AuthenticationController.java` has only `/register`, `/login`, `/check-email`); real logout is `POST /users/logout`, a SvelteKit route action that only clears cookies. Fixed in this Unit 4 batch (see Files Changed).
- Backend `CorsConfig.java` still hardcodes `allowedOrigins = http://localhost:3000` (stale, pre-SvelteKit value). Harmless because no browser code calls the backend directly (server-side `apiFetch` only), but is a landmine if any future code adds client-side fetches. Out of scope per proposal ("no application logic" edits) — logged for awareness only, not actioned, and not contradicted in any doc.
- `src/config/apiConfig.js` is dead/unused code (verified zero imports via `rg -l "apiConfig" src`). Application-source-code observation, not a docs defect — logged for awareness only, not actioned (out of scope per proposal). Worth a source-cleanup follow-up (delete the file or wire it in) outside this docs change.

## Remaining Tasks

None. All 16 tasks across Phases 1-5 are complete.

## Status

**16/16 tasks complete.** All 4 work units delivered (`README.md`+`AGENTS.md`, `CONEXION.md`+`SPECIALTY_VERIFICATION.md`, `frontend/README.md`+`frontend/API-CONFIG.md`, `frontend/API-DOCS.md`+`openspec/config.yaml`+full sweep). The Unit-3-flagged `README.md` logout inaccuracy was fixed in this final batch. Full 8-file consistency sweep (tasks 5.1-5.4) passed with zero unresolved contradictions: no legacy Express/EJS/Jest/localStorage instructional content, no legacy port references outside intentional mapping tables, `openspec/config.yaml` parses cleanly and reflects the SvelteKit/Vitest/Playwright stack, and every documented command/port matches `frontend/package.json`, `vite.config.js`, and `playwright.config.js` exactly.

**Ready for sdd-verify.**
