# Proposal: Resolve Strict Client Typecheck

## Intent
Enable `strict: true` in `frontend/jsconfig.json` so the entire client-side codebase compiles with zero errors under `noImplicitAny` and `strictNullChecks`. This eliminates an entire class of null-reference and implicit-any bugs caught only at runtime today.

## Scope

### In Scope
- Add JSDoc `@param` / `@returns` / `@type` annotations to all 46 files under `frontend/public/js/`
- Add null-guards (optional chaining, explicit `if` checks) for every DOM query result
- Add typed index-signature access patterns where objects are keyed dynamically
- Enable `strict: true` in `frontend/jsconfig.json` as the final gate
- Ensure all 255 existing tests continue to pass

### Out of Scope
- Migrating `.js` files to `.ts`
- Adding new tests (existing suite is the regression gate)
- Changes to backend code or business logic
- Refactoring module structure or API signatures

## Capabilities

### Modified Capabilities
- `typed-js-parameters`: Extend JSDoc `@param` coverage from partial to 100% of client-side functions
- `typed-dom-access`: Extend typed DOM casts and null-guards to every DOM query site
- `global-window-declarations`: Ensure `frontend/global.d.ts` covers all custom `window` properties under strict mode

### New Capabilities
- `strict-typecheck-gate`: `npm run typecheck` enforces `strict: true` with zero errors as a CI-ready check

## Approach
Targeted manual migration in topological order using compiler error output as the worklist:

1. **APIs & Utilities** — `public/js/api/*.js` (38 errors) — leaf modules with no internal deps
2. **Feature modules** — `*/modules/*.js` (547 errors) — annotate data-managers, form-managers, UI-managers, validation-managers
3. **Page controllers** — `*-controller.js` (210 errors) — top-level orchestrators that consume the modules
4. **Config flip** — Set `"strict": true` in `frontend/jsconfig.json`, run `npm run typecheck`, confirm 0 errors

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `frontend/jsconfig.json` | Modified | Add `"strict": true` |
| `frontend/public/js/api/*.js` (6 files) | Modified | JSDoc params + null-guards |
| `frontend/public/js/*/modules/*.js` (26 files) | Modified | JSDoc params + DOM casts + null-guards |
| `frontend/public/js/*/*-controller.js` (10 files) | Modified | JSDoc params + DOM casts + null-guards |
| `frontend/public/js/dashboard/*.js` (2 files) | Modified | JSDoc params + DOM casts |
| `frontend/public/js/dentist/dentist-specialty-ui.js` | Modified | JSDoc params + DOM casts |
| `frontend/global.d.ts` | Modified | Potential additions for strict-mode window types |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Null-guard changes runtime behavior (e.g., silent fail instead of crash) | Med | Review every `?.` / `if` guard to ensure it matches existing control flow; keep test suite green |
| Incorrect JSDoc type hides real bug | Low | Use specific types (`HTMLInputElement`, domain models) not `any`; compiler cross-validates |
| Large PR is hard to review | Med | Split into 3 PRs matching the topological layers (APIs → modules → controllers + config flip) |

## Rollback Plan
Revert the single `jsconfig.json` change (`"strict": true` → remove) to restore previous non-strict mode. All JSDoc annotations are additive comments and do not affect runtime, so they can remain safely even if strict is disabled.

## Dependencies
- Existing specs: `typed-js-parameters`, `typed-dom-access`, `global-window-declarations` — this change completes their intent
- `npm run typecheck` script must invoke `tsc --noEmit` against `jsconfig.json`

## Success Criteria
- [ ] `npm run typecheck` with `strict: true` reports 0 errors
- [ ] All 255 frontend tests pass (`npm test`)
- [ ] No bare `any` types introduced — all annotations use specific types
- [ ] Zero runtime behavior changes (no new early-returns or swallowed errors)
