# <Design: Fix Typecheck Errors>

## Technical Approach
Resolve type safety and compilation errors across the SvelteKit frontend codebase.
- Centralize mock RequestEvent and ServerLoadEvent creation into a mock factory function `createMockEvent()` in `frontend/src/test/mockFactory.js`.
- Refactor all 12 unit test files to import and utilize `createMockEvent`, resolving SvelteKit-specific argument assignability compilation errors.
- Enforce explicit, safe string coercions for form data fields extracted using `FormData.get()` (using standard JavaScript constructors or methods).
- Standardize catch block error handling to cast `unknown` error variables to `any` before referencing properties like `.status`.
- Retain strict compiler rules in `frontend/jsconfig.json` with `checkJs: true` to prevent future regressions.

## Architecture Decisions
### Decision: Centralized Testing Mock Factory
- Choice: Create `frontend/src/test/mockFactory.js` containing `createMockEvent` to centralize Vitest request mock events.
- Alternatives: Inline type-casting (casting `{ locals: {} }` as `any` at every test call site), or creating custom mock event objects in each test file individually.
- Rationale: Centralization eliminates code duplication across 12 test files, simplifies test maintenance, and provides a single location to update as SvelteKit event types evolve.

### Decision: Safe String Coercion Strategy
- Choice: Coerce all values retrieved via `FormData.get(...)` using `String(value)` or fallback `value?.toString() || ''` instead of using type assertions.
- Alternatives: Casting fields to `string` with `@type {string}`, which is unsafe if the form field is null/undefined or a File.
- Rationale: String coercion handles cases where form inputs are missing (null) or represented as File objects, preventing runtime type/TypeError crashes.

### Decision: Standardized Catch Block Error Handling
- Choice: Assign caught exceptions to a local variable `err` cast to `any` using `const err = /** @type {any} */ (error);`.
- Alternatives: Using `instanceof Error` checks or custom type guards.
- Rationale: Under strict `checkJs: true` and TypeScript, caught errors are of type `unknown` by default. SvelteKit redirects (which are thrown in actions/loaders) are not standard `Error` instances, so standard JSDoc casting to `any` is the most pragmatic and robust solution to access properties like `.status` or `.message`.

## Data Flow
```
[ Test Suite (Vitest) ]
           │
           ├── (1) Calls createMockEvent(options)
           ▼
 [ mockFactory.js ] ──► Merges options with default properties
           │            (locals, params, cookies, request)
           ▼
[ Mock RequestEvent / ServerLoadEvent (any) ]
           │
           ├── (2) Passes mock event to SvelteKit loaders/actions
           ▼
 [ +page.server.js ]
           │
           ├── (3) Retrieves FormData (request.formData())
           ├── (4) Safely coerces fields: String(data.get('x'))
           ├── (5) Calls apiFetch() inside try/catch
           │         └── Catch block: casts error to 'any'
           ▼
  [ Assertions / Result Checks ]
```

## File Changes
| File | Action | Description |
|---|---|---|
| `frontend/src/test/mockFactory.js` | Create | Centralized mock factory utility containing `createMockEvent`. |
| `frontend/src/hooks.server.test.js` | Modify | Update unit tests to import and use `createMockEvent`. |
| `frontend/src/routes/layout.server.test.js` | Modify | Update unit tests to import and use `createMockEvent`. |
| `frontend/src/routes/appointments/add/+page.server.js` | Modify | Implement safe FormData string coercion and error casting in catch blocks. |
| `frontend/src/routes/appointments/appointments.server.test.js` | Modify | Update unit tests to import and use `createMockEvent`. |
| `frontend/src/routes/appointments/edit/[id]/+page.server.js` | Modify | Implement safe FormData string coercion and error casting in catch blocks. |
| `frontend/src/routes/appointments/edit/[id]/appointments-edit.server.test.js` | Modify | Update unit tests to import and use `createMockEvent`. |
| `frontend/src/routes/dashboard/+page.server.js` | Modify | Implement safe FormData string coercion and error casting in catch blocks. |
| `frontend/src/routes/dashboard/dashboard.server.test.js` | Modify | Update unit tests to import and use `createMockEvent`. |
| `frontend/src/routes/dentists/add/+page.server.js` | Modify | Implement safe FormData string coercion and error casting in catch blocks. |
| `frontend/src/routes/dentists/add/dentists-add.server.test.js` | Modify | Update unit tests to import and use `createMockEvent`. |
| `frontend/src/routes/dentists/dentists.server.test.js` | Modify | Update unit tests to import and use `createMockEvent`. |
| `frontend/src/routes/dentists/edit/[id]/+page.server.js` | Modify | Implement safe FormData string coercion and error casting in catch blocks. |
| `frontend/src/routes/dentists/edit/[id]/dentists-edit.server.test.js` | Modify | Update unit tests to import and use `createMockEvent`. |
| `frontend/src/routes/login/+page.server.js` | Modify | Implement safe FormData string coercion and error casting in catch blocks. |
| `frontend/src/routes/login/login.server.test.js` | Modify | Update unit tests to import and use `createMockEvent`. |
| `frontend/src/routes/patients/add/+page.server.js` | Modify | Implement safe FormData string coercion and error casting in catch blocks. |
| `frontend/src/routes/patients/add/patients-add.server.test.js` | Modify | Update unit tests to import and use `createMockEvent`. |
| `frontend/src/routes/patients/edit/[id]/+page.server.js` | Modify | Implement safe FormData string coercion and error casting in catch blocks. Initialise `patientData` with `address` structure to avoid property addition errors. |
| `frontend/src/routes/patients/edit/[id]/patients-edit.server.test.js` | Modify | Update unit tests to import and use `createMockEvent`. |
| `frontend/src/routes/patients/patients.server.test.js` | Modify | Update unit tests to import and use `createMockEvent`. |

## Interfaces / Contracts
```javascript
// frontend/src/test/mockFactory.js:
/**
 * @param {Object} [options]
 * @param {Partial<App.Locals>} [options.locals]
 * @param {Record<string, string>} [options.params]
 * @param {Partial<Request> | { formData?: import('vitest').Mock }} [options.request]
 * @param {Partial<import('@sveltejs/kit').Cookies>} [options.cookies]
 * @param {URL} [options.url]
 * @returns {any}
 */
export function createMockEvent(options = {}) { ... }
```

### Standard Code Patterns:
- **Form Data Retrieval Coercion**:
  ```javascript
  const value = String(formData.get('field') || '');
  ```
- **Catch Block Casting**:
  ```javascript
  try { ... } catch (error) {
    const err = /** @type {any} */ (error);
    if (err.status === 303) throw err;
  }
  ```

## Testing Strategy
| Layer | What to Test | Approach |
|---|---|---|
| Type Safety | Compilation | Run `npm run typecheck` to verify zero compiler errors remain. |
| Unit Tests | Loaders & Actions | Run `npm run test` (Vitest) to verify mock events function correctly in all 12 test suites. |
| Integration | Server Hooks | Run Vitest suite to verify hook logic redirects appropriately. |
| E2E | End-to-End Journeys | Run `npm run test:e2e` (Playwright) to verify all flows function without regressions. |

## Migration / Rollout
1. **Scaffold Mock Factory**: Create `frontend/src/test/mockFactory.js` and implement `createMockEvent` with default mocks.
2. **Refactor Server Actions & Loaders**: Update the 8 `+page.server.js` files with safe `FormData` string coercions and catch block error casting.
3. **Refactor Test Suites**: Replace inline mock events with imports from `mockFactory.js` in all 12 test files.
4. **Validation**: Execute `npm run typecheck` to verify no compile-time errors remain, then run Vitest and Playwright tests.

## Open Questions
None.
