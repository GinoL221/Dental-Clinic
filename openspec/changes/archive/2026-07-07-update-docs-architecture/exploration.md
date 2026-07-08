## Exploration: Documenting Modern Decoupled Architecture

### Current State
The project has transitioned from a legacy Express + EJS web app to a modern SvelteKit SPA/MPA frontend decoupled from a Spring Boot layered backend. However, several root and configuration documentation files still refer to Express, EJS, Jest, and port configurations from the old setup (e.g., frontend on port `3000` running EJS, using `localStorage` for JWTs instead of HTTP-only cookies managed via SvelteKit server-side hooks, and running `node app.js`). The testing commands in the documentation also reference `jest` instead of `vitest` and `playwright`.

### Affected Areas
- `README.md` — References Express/EJS, Jest, port `3000`, `node app.js`, and local token storage. Needs to reference SvelteKit, Vite, Vitest, Playwright, JSDoc verification, and the correct dev commands.
- `AGENTS.md` — Contains coding rules for EJS, Express, and lacks rules for SvelteKit, Vite, `checkJs`, and `svelte-check` type-checking.
- `CONEXION.md` — Explains how to start the legacy Express app (`npm start` running `app.js` on port `3000`) and has outdated references to client-side localStorage token authorization headers.
- `SPECIALTY_VERIFICATION.md` — References port `3001` for the frontend and outdated start commands (`npm run dev`).
- `openspec/config.yaml` — Defines the stack as Express 5.x + EJS and Jest 29. Needs updating to SvelteKit + Vitest + Playwright + JSDoc/TS checkJs.
- `frontend/README.md` — Needs overhaul as it defines the frontend as an Express + EJS app.
- `frontend/API-CONFIG.md` — Describes legacy client/server config setup using global helpers.
- `frontend/API-DOCS.md` — Describes legacy controller architecture (`public/js/`).

### Approaches
1. **Incremental Updates to Key Files** — Focus only on the root markdown files requested in the change prompt (`README.md`, `AGENTS.md`, `CONEXION.md`, `SPECIALTY_VERIFICATION.md`).
   - Pros: Simpler, smaller scope of changes.
   - Cons: Leaves internal config files (`openspec/config.yaml`, `frontend/README.md`) in an inconsistent state, pointing to legacy configurations.
   - Effort: Medium

2. **Comprehensive Update (Recommended)** — Update the four root markdown files AND the internal stack configuration files (`openspec/config.yaml`, `frontend/README.md`, `frontend/API-CONFIG.md`, `frontend/API-DOCS.md`).
   - Pros: Establishes a single source of truth across all documentation and configuration levels, eliminating confusion for developers and automated tools.
   - Cons: Slightly more files to modify.
   - Effort: Medium

### Recommendation
Option 2 is recommended. The discrepancy between files like `openspec/config.yaml` or `frontend/README.md` and the actual SvelteKit code will lead to confusion and incorrect tool behavior (e.g. tools attempting to run Jest commands instead of Vitest/Playwright). Modifying both the root and local config docs to reflect SvelteKit + Vite + Vitest + Playwright + JSDoc/TS checkJs is the most robust path.

### Risks
- Overlooking specific port references or environment variables (e.g., `BACKEND_URL` fallback vs SvelteKit server-side endpoint proxying).
- Outdated setup steps might be partially copied over; careful review of SvelteKit's dev/preview ports (typically `5173` or custom dev ports) is required.

### Ready for Proposal
Yes — The next step is to create a proposal to apply these updates cleanly across the codebase.
