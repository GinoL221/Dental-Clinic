<Proposal: Migrate to SvelteKit>
## Intent
Address technical debt of the legacy Express/EJS frontend by migrating to SvelteKit, improving performance, modularity, and developer experience.

## Scope
### In Scope
- Core layout and authentication flow implementation.
- Migration of views (Landing, Dashboard, Appointments, Patients, Dentists, Users) to Svelte pages (`+page.svelte`).
- Data fetching transition from Axios controllers to SvelteKit loaders (`+page.server.js`) and Form Actions.
- Porting authentication/session guards to SvelteKit server hooks (`hooks.server.js`).
- Testing framework replacement with Vitest and Playwright.

### Out of Scope
- Rewriting the Spring Boot REST API backend.
- Adding new functional features to the application.
- Altering existing CSS styling or UI design themes.

## Capabilities
### New Capabilities
- `server-side-hooks`: Centralized request intercepts, session authentication checks, and layout context injection.
- `vitest-unit-testing`: Fast unit and loader test execution.
- `playwright-e2e-testing`: Robust, browser-driven end-to-end integration testing.

### Modified Capabilities
- `data-fetching`: Pages fetch data via page loaders and Form Actions instead of Express controllers.
- `routing`: Standardized SvelteKit directory-based routing instead of Express route handlers.

## Approach
- Scaffold SvelteKit under `frontend/` as a modern SPA/SSR application.
- Implement session authentication wrapper in `hooks.server.js` matching legacy cookie patterns.
- Port pages incrementally: starting with Landing and Auth, then Patients, Dentists, Appointments, and Dashboard.
- Clean up Express server configurations (`app.js`), route files, EJS templates, and Jest/Supertest dependencies.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `frontend/app.js` | Critical | Replaced by SvelteKit engine. |
| `frontend/src/views` | Critical | Converted from EJS templates to Svelte pages. |
| `frontend/src/routes` | Critical | Mapped into SvelteKit file-based routing. |
| `frontend/src/middlewares` | Critical | Migrated to server-side hooks. |
| `frontend/src/controllers` | High | Replaced by SvelteKit loaders/actions. |
| `frontend/package.json` | High | Updated dependencies (SvelteKit, Vitest, Playwright). |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Session alignment mismatch | Low | Validate cookies inside server hooks against Spring Boot API. |
| Styling regressions | Medium | Import existing CSS files globally and scope page-specific styles. |

## Rollback Plan
- Revert all git changes in `frontend/` to the pre-migration commit tag or branch.

## Dependencies
- Compatibility with existing Spring Boot REST API.

## Success Criteria
- [ ] 100% functional parity of migrated pages (Landing, Dashboard, Appointments, Patients, Dentists, Users).
- [ ] Successful session verification across all guarded routes via SvelteKit hooks.
- [ ] All unit and end-to-end tests passing under Vitest and Playwright.
</Proposal: Migrate to SvelteKit>
