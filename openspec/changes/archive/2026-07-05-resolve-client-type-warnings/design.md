# Design: Resolve Client-Side Type Warnings

## Technical Approach
Eliminate all ~1,314 `tsc --noEmit` warnings across 52 client-side JS files in two complementary layers: (1) a single `frontend/global.d.ts` declaring ~90 custom `window.*` properties to resolve TS2339 errors globally, and (2) per-file JSDoc `@param`/`@type` annotations to resolve TS7006 implicit-any and TS2339 DOM-mismatch warnings. A targeted fix in `apiConfig.js` breaks the TS7022/TS2502 circular reference, and `date-utils.js` gets an `Intl.DateTimeFormatOptions` cast.

## Architecture Decisions

### Decision: Separate `global.d.ts` vs inline casts for Window properties
**Choice**: `frontend/global.d.ts` with `declare global { interface Window { ... } }`
**Alternatives considered**: Per-file `/** @type {any} */(window).prop` casts
**Rationale**: ~90 custom `window.*` properties are used across 30+ files. A centralized `.d.ts` resolves 100+ warnings without touching JS source. The existing `express-session.d.ts` already declares `window.__ENV__`, so `global.d.ts` follows the established pattern while keeping browser-only types separate from server-side types.

### Decision: Specific HTML element types, not `any`
**Choice**: Use `HTMLInputElement`, `HTMLSelectElement`, `HTMLFormElement`, `HTMLButtonElement`, `HTMLTableElement` in JSDoc casts
**Alternatives considered**: Casting to `any` for all DOM queries
**Rationale**: The codebase accesses `.value` (inputs/selects), `.selectedIndex`/`.options` (selects), `.disabled` (buttons), `.checked` (checkboxes), `.style.display` (divs). Specific types catch real bugs (e.g., accessing `.value` on a non-input element).

### Decision: `typeof` references for controller types in `global.d.ts`
**Choice**: Type controller globals (e.g., `window.dentistController`) as the controller class type using import-based `typeof`
**Alternatives considered**: Using `any` for controller types
**Rationale**: Controllers are classes (`DentistController`, `PatientController`, `AuthController`, `AppointmentController`) with public APIs accessed via `window.*`. Using `InstanceType<typeof import(...)>` lets TS validate `.loadList()`, `.dataManager`, etc.

### Decision: Add `typescript` as devDependency
**Choice**: `npm i -D typescript` — required since `tsc` is not currently installed
**Alternatives considered**: Use global tsc
**Rationale**: Pinned version ensures CI reproducibility; `jsconfig.json` already targets tsc semantics.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/global.d.ts` | **Create** | Extend `Window` with ~90 custom properties grouped by domain |
| `frontend/jsconfig.json` | **Modify** | Add `"include": ["global.d.ts", "public/**/*.js", "src/**/*.js", "src/**/*.d.ts"]` |
| `frontend/package.json` | **Modify** | Add `typescript` devDependency; add `"typecheck"` script |
| `frontend/src/config/apiConfig.js` | **Modify** | Add `/** @type {Record<string, any>} */` before `const config` to break circular TS7022 |
| `frontend/public/js/utils/date-utils.js` | **Modify** | Add `@param` types; cast `options` to `Intl.DateTimeFormatOptions` |
| `frontend/public/js/logger.js` | **Modify** | Add `@param {...any} args` to each method |
| 7 `api/*.js` files | **Modify** | Add `@param`/`@returns` JSDoc to exported functions |
| 4 controller files (`appointment-controller`, `appointment-list-controller`, `dentist-controller`, `dentist-list-controller`) | **Modify** | JSDoc `@param` on callbacks; `@type` casts for `e.target` in keyboard handlers |
| 3 controller files (`patient-list-controller`, `patient-add-controller`, `patient-edit-controller`) | **Modify** | JSDoc `@param` on callbacks and event handlers |
| 2 auth controller files (`login-controller`, `register-controller`) | **Modify** | `@param` on `event`, form data; `@type` casts for DOM queries |
| `dashboard-controller.js` | **Modify** | Cast `options` to `Intl.DateTimeFormatOptions`; `@param` on snapshot methods |
| `dashboard-uplot.js`, `dashboard-api.js` | **Modify** | `@param` on public methods |
| `dentist-specialty-ui.js` | **Modify** | `@param` on event handlers and async functions |
| 4×`modules/form-manager.js` | **Modify** | `@type` casts for `getElementById` results (`HTMLInputElement`, `HTMLSelectElement`, `HTMLFormElement`); `@param` on constructor/methods |
| 4×`modules/ui-manager.js` | **Modify** | `@param` on `showMessage`, rendering methods |
| 4×`modules/validation-manager.js` | **Modify** | `@type {HTMLInputElement}` cast on `e.target` in input handlers; `@param` on validate methods |
| 4×`modules/data-manager.js` | **Modify** | `@param`/`@returns` on CRUD methods |
| 4×`modules/index.js` | **Modify** | `@param` on controller methods; `@type` casts where needed |
| 2×`modules/search-controller.js` | **Modify** | `@type {HTMLInputElement}` cast on `e.target`; `@param` |
| 2×`modules/export-utils.js` | **Modify** | `@param` on build/download functions |
| `auth/modules/http-interceptor.js` | **Modify** | `@param` on interceptor setup |
| `auth/modules/route-guard.js` | **Modify** | `@param` on guard methods |
| `auth-utils.js` | **Modify** | `@param` on static methods |
| `appointment/modules/server-data-loader.js` | **Modify** | `@returns` annotation |
| `appointment/modules/appointment-enricher.js` | **Modify** | `@param`/`@returns` annotations |

**Total**: 1 new file + 1 config change + ~52 JS files modified (comments only)

## Interfaces / Contracts

### `frontend/global.d.ts` structure
```typescript
export {};
declare global {
  interface Window {
    // --- Flags & Config ---
    APP_DEBUG: boolean | string;
    isAdmin: boolean | (() => boolean);
    currentUser: { id: number; firstName: string; lastName: string; email: string; role: string; token: string } | null;
    serverData: { user: any; isAdmin: boolean; appointmentId?: string; [k: string]: any } | undefined;
    dentistId: string | number | undefined;
    patientId: string | number | undefined;
    currentSort: { field: string | null; direction: string };

    // --- API Objects ---
    AuthAPI: typeof import('./public/js/api/auth-api.js').default;
    AuthUtils: typeof AuthUtils; // class
    XLSX: any; // SheetJS loaded via CDN

    // --- Controller instances ---
    dentistController: InstanceType<typeof import('./public/js/dentist/modules/index.js').default> | undefined;
    patientController: InstanceType<typeof import('./public/js/patient/modules/index.js').default> | undefined;
    appointmentController: InstanceType<typeof import('./public/js/appointment/modules/index.js').default> | undefined;
    authController: any;
    dashboardController: any;

    // --- Global functions (~65 functions) ---
    // Appointment domain
    refreshAppointments(): any;
    exportAppointmentData(format?: string): any;
    addAppointment(data: any): Promise<any>;
    editAppointment(id: any, data: any): Promise<any>;
    deleteAppointment(id: any): Promise<any>;
    // ... (all 65 functions listed with signatures)
  }
}
```

### JSDoc patterns used
```javascript
// Function params
/** @param {string} id */
/** @param {Event} e */
/** @param {SubmitEvent} event */

// DOM casts
const input = /** @type {HTMLInputElement} */ (document.getElementById('x'));
const target = /** @type {HTMLInputElement} */ (e.target);

// Date formatting
const opts = /** @type {Intl.DateTimeFormatOptions} */ ({ year: 'numeric', month: 'long', day: 'numeric' });

// apiConfig circular break
/** @type {{ BACKEND_URL: string, ENDPOINTS: Record<string, Record<string, string>>, TIMEOUT: number, RETRY_ATTEMPTS: number, getFullUrl: (endpoint: string) => string, [k: string]: any }} */
const config = { ... };
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Compile | Zero tsc warnings | `npx tsc --noEmit` — must exit 0 with 0 diagnostics |
| Regression | All 255 existing Jest tests pass | `npm test` — no test modifications expected |
| Manual | Verify no runtime behavior change | Spot-check appointment/dentist/patient CRUD flows |

## Migration / Rollout
No migration required. All changes are additive JSDoc comments and a new `.d.ts` file. Single commit, revertible via `git revert`.

## Open Questions
- [ ] Should `window.isAdmin` be typed as `boolean | (() => boolean)` (used both ways) or split into two properties?
- [ ] Confirm `lib/uPlot.min.js` should remain excluded from type checking (it's a vendored minified library)
