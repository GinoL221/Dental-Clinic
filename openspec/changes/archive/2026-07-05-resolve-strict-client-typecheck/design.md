# Design: Resolve Strict Client Typecheck

## Technical Approach

Enable `strict: true` in `frontend/jsconfig.json` by systematically eliminating 795 compiler errors across 46 files. The work is pure JSDoc annotation + null-guard insertion — zero runtime behaviour changes. Files are migrated leaf-to-root so that downstream type information propagates correctly.

## Architecture Decisions

### Decision: JSDoc inline types over `.d.ts` companion files
**Choice**: Annotate all functions with `@param`/`@returns` JSDoc directly in each `.js` file.
**Alternatives considered**: Per-module `.d.ts` sidecar files.
**Rationale**: The codebase already uses inline JSDoc (see `config.js`, `date-utils.js`, `logger.js`). Sidecars would double file count and introduce sync drift.

### Decision: Null-guard strategy by site category
**Choice**: Three patterns matched to context:
1. **`if (el)` block** — for DOM queries where subsequent logic depends on the element (existing pattern in `ui-manager.js`, `form-manager.js`).
2. **Optional chaining `?.`** — for single-property reads or method calls on possibly-null targets (existing pattern in `appointment-api.js:268`).
3. **JSDoc cast with early-return** — for functions whose entire body requires the element, e.g. `const el = /** @type {HTMLInputElement} */ (document.getElementById(...)); if (!el) return;`

**Alternatives considered**: Non-null assertions (`/** @type {HTMLInputElement} */ (el!)`). Rejected — they suppress real bugs and violate the spec requirement for null-safety.
**Rationale**: Match the guard style already present in each file to minimize diff noise and preserve existing control flow.

### Decision: Topological migration order
**Choice**: APIs/utils → feature modules → page controllers → config flip.
**Rationale**: Leaf modules (api/*.js, utils/*) have no internal imports. Annotating them first lets the compiler infer return types for callers. Modules (data-manager, form-manager, etc.) consume APIs. Controllers consume modules. Flipping `strict` last ensures zero-error gate at commit time.

### Decision: Keep `[key: string]: any` catch-all on Window
**Choice**: Retain the existing index signature in `global.d.ts` line 68.
**Alternatives considered**: Remove it and enumerate every `window.*` property.
**Rationale**: The codebase assigns ad-hoc window properties from multiple controllers. The catch-all prevents TS2339 on dynamic assignments without requiring exhaustive enumeration. Explicit declarations above the catch-all still give precise types where they exist.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/public/js/api/appointment-api.js` | Modify | Add `@param`/`@returns` to `create`, `update`, `delete`, `getByDentist`, `getByPatient`, `getByDate`, `validateAppointmentData`, `formatAppointmentDisplay` |
| `frontend/public/js/api/auth-api.js` | Modify | Add `@param`/`@returns` to 3 unannotated functions |
| `frontend/public/js/api/dentist-api.js` | Modify | Add `@param`/`@returns` to 8 unannotated call sites |
| `frontend/public/js/api/patient-api.js` | Modify | Add `@param`/`@returns` to all methods (12 errors) |
| `frontend/public/js/api/specialty-api.js` | Modify | Add `@param` to 2 methods |
| `frontend/public/js/api/utils.js` | Modify | Add `@param {string}` to `showSuccess`, `showError`, `showInfo`, `clearForm`; type `button` param in `setButtonLoading` as `HTMLButtonElement` |
| `frontend/public/js/utils/date-utils.js` | Modify | Narrow `@param {any}` to `{string \| Date}` on both functions |
| `frontend/public/js/*/modules/data-manager.js` (4) | Modify | Type all method params; type `error` catches as `unknown` or `Error`; add null-guards on API return values |
| `frontend/public/js/*/modules/form-manager.js` (4) | Modify | Type `Event` params; cast DOM queries via JSDoc; add `if (!el) return` guards |
| `frontend/public/js/*/modules/ui-manager.js` (4) | Modify | Type `selectElement` as `HTMLSelectElement`; type array params as `Array<{id:…}>` inline shapes; add null-guards on `getElementById` |
| `frontend/public/js/*/modules/validation-manager.js` (4) | Modify | Type `fieldName` as `string`, `value` as `string`; type index access on `validationRules` with `Record<string, ValidationRule>` typedef |
| `frontend/public/js/*/modules/index.js` (4) | Modify | Type constructor deps and state properties |
| `frontend/public/js/*/modules/search-controller.js` (2) | Modify | Type params, add DOM null-guards |
| `frontend/public/js/*/modules/export-utils.js` (2) | Modify | Type params |
| `frontend/public/js/appointment/modules/server-data-loader.js` | Modify | Type return value |
| `frontend/public/js/appointment/modules/appointment-enricher.js` | Modify | Type params |
| `frontend/public/js/auth/modules/http-interceptor.js` | Modify | Type params |
| `frontend/public/js/auth/modules/route-guard.js` | Modify | Type params, add null-guards |
| `frontend/public/js/*/*-controller.js` (10) | Modify | Type `error` in catch blocks; add DOM null-guards in `showErrorMessage`; type event listener callbacks |
| `frontend/public/js/dentist/dentist-specialty-ui.js` | Modify | Type params, add DOM null-guards |
| `frontend/public/js/dashboard/dashboard-uplot.js` | Modify | Type `snapshot` param shape, type `uPlot` usage via existing global |
| `frontend/global.d.ts` | Modify | Replace `any` on `AuthAPI`, `AuthUtils` with object shapes; type `DentistSpecialtyUI` for `window.dentistSpecialtyUI` if used; tighten `serverData.user` type |
| `frontend/jsconfig.json` | Modify | Add `"strict": true` (final commit) |

## Interfaces / Contracts

### JSDoc Patterns to Use

```js
// 1. Function params + returns
/** @param {string|number} id  @returns {Promise<Object|undefined>} */

// 2. DOM cast + null-guard (preferred pattern)
const el = /** @type {HTMLInputElement | null} */ (document.getElementById("x"));
if (!el) return;

// 3. Inline object shape for domain models
/** @param {{ id: number, firstName: string, lastName: string }} dentist */

// 4. Record for dynamic-key objects
/** @type {Record<string, {minLength?: number, maxLength?: number, pattern?: RegExp, errorMessage: string, required?: boolean}>} */

// 5. Callback / event
/** @param {Event} e */
/** @param {MouseEvent} e */
```

### global.d.ts Additions
- Replace `AuthAPI: any` → typed object shape matching `auth-api.js` exports
- Replace `AuthUtils: any` → typed object shape
- Add `dentistSpecialtyUI` entry if assigned to window
- Tighten `serverData.user` from `any` to `{ id: number; firstName: string; lastName: string; email: string; role: string } | null`

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Compiler gate | 0 errors under `strict: true` | `npm run typecheck` (already wired as `tsc -p jsconfig.json --noEmit`) |
| Regression | All 255 existing tests pass | `npm test` after each layer |
| Runtime | No silent null-swallowing | Review every `?.` addition to ensure it matches existing `if` guard pattern — not creating new early-returns |

## Migration / Rollout

1. **PR 1 — APIs & Utilities** (6 API files + `date-utils.js` + `logger.js`) — ~38 errors
2. **PR 2 — Feature Modules** (26 module files across 4 domains) — ~547 errors
3. **PR 3 — Controllers + Config Flip** (10 controllers + 2 dashboard + 1 specialty-ui + `jsconfig.json` + `global.d.ts`) — ~210 errors + gate

Each PR runs `npm test` and `npm run typecheck` (with strict enabled via a temp override flag for PRs 1–2, or simply counting remaining errors). The final PR flips `"strict": true` permanently.

## Open Questions

- [ ] Should `AuthAPI` and `AuthUtils` window types reference the actual export shapes or remain `any` with the catch-all? (Recommendation: type them for consistency)
- [ ] Is `uPlot` global typed via a `@types/uplot` package, or should `var uPlot: any` remain? (Check if `@types/uplot` is available)
