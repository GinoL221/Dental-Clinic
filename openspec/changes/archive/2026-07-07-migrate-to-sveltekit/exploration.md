## Exploration: Migration of Express/EJS Frontend to SvelteKit

### Current State
- **Express / EJS Setup**: The current frontend is an Express-based server (configured in [app.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/app.js)) rendering server-side views using EJS templates in [views/](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/src/views).
- **Session & Auth**: Session management uses `express-session` with cookie backups (`authToken`, `userRole`, `userEmail`) created upon login. Middlewares like [requireAuth.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/src/middlewares/requireAuth.js) and [userDataMiddleware.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/src/middlewares/userDataMiddleware.js) handle route-protection and template local variable injection.
- **Routing & Controllers**: Express routes in [routes/](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/src/routes) map requests to controllers inside [controllers/](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/src/controllers), which in turn perform HTTP requests to the backend Spring Boot REST API using Axios.
- **Testing**: Frontend validation is tested via Jest and Supertest in [test/](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/test).

### Affected Areas
- [app.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/app.js) — The Express server initialization will be completely replaced by SvelteKit's engine.
- [views/](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/src/views) — EJS files will be converted into Svelte pages (`+page.svelte`) and reusable UI components.
- [routes/](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/src/routes) — Explicit route files will be mapped into SvelteKit's directory-based routing hierarchy (e.g., `src/routes/dentists/+page.svelte`).
- [middlewares/](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/src/middlewares) — Session injection and route auth gates will be migrated to server-side hooks (`hooks.server.js`) and layout loaders (`+layout.server.js`).
- [controllers/](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/src/controllers) — Backend communication and data-fetching will be moved into page/layout loaders (`+page.server.js`) and Form Actions.
- [package.json](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/package.json) — Dependencies like `express`, `ejs`, `express-session`, and `supertest` will be replaced by `@sveltejs/kit`, `svelte`, and modern testing tools (Vitest / Playwright).

### Approaches
1. **Incremental Port & Routing Transition** — Re-create the structure in a new SvelteKit project template and migrate one view/controller module at a time (e.g., Auth first, then Dentists, Patients, Appointments, and Dashboard).
   - Pros: Keeps the migration structured and manageable, allows isolated testing of SvelteKit endpoints against the Spring Boot API, prevents mixed-state server runtimes.
   - Cons: Temporary duplication of styles/views until all routes are migrated.
   - Effort: Medium

2. **Big-Bang Rewrite** — Re-write the entire application structure directly without phased milestones.
   - Pros: No temporary intermediate states.
   - Cons: High regression risk, difficult to debug auth flow issues and UI inconsistencies.
   - Effort: High

### Recommendation
We recommend **Approach 1 (Incremental Port & Routing Transition)**. Since the codebase is modular, we can port pages one-by-one inside a fresh SvelteKit workspace. We will prioritize migrating session/auth middleware into `hooks.server.js` first, followed by pages in order of complexity (Landing -> Auth -> Dentists -> Patients -> Appointments -> Dashboard).

### Risks
- **Session/Token Consistency**: Ensuring SvelteKit's server-side load cookies correctly align with client-side localStorage/cookies for authentication.
- **Styling and CSS Isolation**: Current global and conditional EJS stylesheets must be clean-mapped to global CSS imports or scoped Svelte styles.
- **Testing Shift**: Migrating from Supertest (Express integration tests) to Vitest (for SvelteKit loaders/actions) and Playwright (for end-to-end user flows).

### Ready for Proposal
Yes — we are ready to submit a formal specification detailing the SvelteKit folder architecture, data loaders, Form Actions, and hooks.
