# Proposal: Resolve Client-Side Type Warnings

## Intent
The project has `checkJs: true` enabled in `frontend/jsconfig.json`, producing 1,314 tsc warnings across 52 files under `public/js/`. These warnings obscure real bugs and erode developer trust in the type checker. This change eliminates all warnings through type declarations and JSDoc annotations — a pure technical refactor with zero behavior changes.

## Scope

### In Scope
- Create `frontend/global.d.ts` extending the `Window` interface with all custom properties
- Add JSDoc `@param`/`@type` annotations to untyped function parameters across `public/js/**/*.js`
- Add JSDoc casts for DOM element access (`HTMLInputElement`, `HTMLSelectElement`, etc.)
- Fix `toLocaleDateString` option typing in `date-utils.js`
- Fix circular self-reference in `src/config/apiConfig.js` (TS7022/TS2502)

### Out of Scope
- Converting any `.js` file to `.ts`
- Changing runtime behavior, business logic, or API contracts
- Modifying server-side (Express/Node) code beyond `apiConfig.js`
- Adding new tests (existing 255 tests are the regression gate)

## Capabilities

### New Capabilities
- `global-window-declarations`: A `global.d.ts` file declaring all custom `window.*` properties (controllers, functions, flags) so TypeScript recognizes them without per-file casts
- `typed-js-parameters`: JSDoc `@param` annotations on all function parameters currently flagged as implicit `any`
- `typed-dom-access`: JSDoc type casts on `querySelector`/`getElementById` results and `e.target` references to specific `HTML*Element` types

### Modified Capabilities
- `date-utils-formatting`: Fix overload resolution by casting date format options to `Intl.DateTimeFormatOptions`
- `api-config-typing`: Break circular type inference in `apiConfig.js` with an explicit JSDoc `@type` annotation

## Approach
1. **Create `frontend/global.d.ts`** — Extend the `Window` interface to declare every custom property (`window.*Controller`, `window.load*`, `window.APP_DEBUG`, etc.). Include it in `jsconfig.json`.
2. **Annotate JS files** — Add `@param`, `@returns`, and `@type` JSDoc comments to all functions with implicit-any parameters. Use specific HTML element types (not `any`) for DOM casts.
3. **Fix `apiConfig.js`** — Add an explicit `@type` annotation to break the TS7022/TS2502 circular reference.
4. **Validate** — Run `tsc --noEmit` to confirm zero warnings; run all 255 frontend tests to confirm no regressions.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `frontend/global.d.ts` | New | Window interface extension for all custom globals |
| `frontend/jsconfig.json` | Modified | Include `global.d.ts` in compilation scope |
| `frontend/public/js/**/*.js` (52 files) | Modified | JSDoc annotations for params, DOM casts, and types |
| `frontend/public/js/utils/date-utils.js` | Modified | Fix `toLocaleDateString` option typing |
| `frontend/src/config/apiConfig.js` | Modified | Explicit type annotation to break circular reference |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Over-broad `any` casts hiding real bugs | Med | Code review rule: use specific HTML*Element / controller types; `any` only as last resort |
| `global.d.ts` declarations drift from actual `window.*` usage | Low | Duplicate-window-assignment-guard spec already tracks these; keep declarations in sync |
| JSDoc annotations break existing Jest tests | Low | Pure comment additions; run full 255-test suite before merge |

## Rollback Plan
Revert the commit. All changes are additive (comments + a new `.d.ts` file) with no runtime impact, so a single `git revert` restores the prior state with no data migration needed.

## Dependencies
- Existing `frontend/jsconfig.json` with `checkJs: true` (already present)
- Specs: `duplicate-window-assignment-guard` (defines the canonical set of `window.*` globals)
- Specs: `per-entity-init-wiring` (defines controller instance patterns referenced in `global.d.ts`)

## Success Criteria
- [ ] `tsc --noEmit` against `frontend/jsconfig.json` reports 0 warnings/errors
- [ ] All 255 frontend tests pass without modification
- [ ] No use of bare `any` where a specific HTML element or controller type is available
- [ ] `global.d.ts` covers every `window.*` property used across `public/js/`
