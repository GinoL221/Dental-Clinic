## Intent
Address type-checking failures in the frontend application where running `svelte-check` results in 51 compiler errors and 10 warnings. This fixes technical debt, improves developer productivity, and guarantees Svelte template type safety.

## Scope
### In Scope
- Add `svelte-check` to `frontend/package.json` devDependencies and register a `"check"` run script.
- Relocate or create `frontend/src/global.d.ts` to declare the global `uPlot` interface.
- Resolve 46 implicit `any` parameter types and missing index signature errors in `frontend/src/routes/dashboard/+page.svelte` using JSDoc.
- Fix generic `Element` cast to `HTMLElement` for `.style` queries in `frontend/src/routes/login/+page.svelte`.
- Fix invalid `href="#"` accessibility warnings and invalid property reference checks (`user.firstName`) in `frontend/src/routes/+layout.svelte`.
- Fix unassociated HTML labels in `frontend/src/routes/appointments/add/+page.svelte` and `frontend/src/routes/appointments/edit/[id]/+page.svelte`.

### Out of Scope
- Migrating the JavaScript frontend project to fully TypeScript (.ts files).
- Modifying backend APIs or database schemas.
- Adding new feature functionality to the dashboard or appointments flow.

## Capabilities
### New Capabilities
- `svelte-typecheck`: Ability to execute static type checks on all Svelte templates and scripts via `npm run check`.
### Modified Capabilities
- `dashboard-types`: Fully typed dashboard views preventing silent properties or template reference errors.

## Approach
Implement JSDoc type annotations (`/** @type {...} */` and `/** @param {...} */`) to enforce type-safety for existing `.js` files within Svelte templates. Leverage type assertion (casting `Element` to `HTMLElement`) for DOM operations in Svelte scripts. Restructure global typings by adding `global.d.ts` directly into compiler inclusions (`frontend/src/global.d.ts`). Fix layout file properties and label HTML semantics to remove Svelte A11y compiler warnings.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `frontend/package.json` | Low | Adds devDependency `svelte-check` and a script to run it. |
| `frontend/src/global.d.ts` | Low | Declares the global `uPlot` interface/variables. |
| `frontend/src/routes/+layout.svelte` | Low | Resolves accessibility href warnings and user validation. |
| `frontend/src/routes/appointments` | Low | Fixes unassociated form labels. |
| `frontend/src/routes/dashboard/+page.svelte` | Medium | Injects JSDoc types for charts, variables, and parameters. |
| `frontend/src/routes/login/+page.svelte` | Low | Adds type assertion/casting for query selectors. |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Loose JSDoc typings (`any`) hide real bugs | Low | Use explicit types where possible and avoid overusing `any`. |

## Rollback Plan
Discard edits in `frontend/src/routes` and revert `frontend/package.json` and `frontend/src/global.d.ts` using Git checkouts.

## Dependencies
- Node.js environment with npm.
- Existing `jsconfig.json` configuration must remain.

## Success Criteria
- [ ] `npm run check` runs without any errors (0 errors) and without warnings (0 warnings).
