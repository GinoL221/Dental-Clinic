<Proposal: Fix Typecheck Errors>
## Intent
Address type-checking errors in the SvelteKit frontend codebase to improve code reliability, developer velocity, and maintainability by resolving compiler issues while preserving strict checkJs verification.

## Scope
### In Scope
- Resolve all typescript/JSDoc type errors in frontend source and test files.
- Keep `checkJs: true` enabled in `frontend/jsconfig.json` for strict validation.
- Create `frontend/src/test/mockFactory.js` with a unified `createMockEvent()` helper to consolidate mock events across 12 test files.
- Standardize catch block error handling to `const err = /** @type {any} */ (error);` for caught errors.
- Implement safe parsing (using `.toString()` or `String()`) for form data values before using them.
- Apply JSDoc type casting and type definitions where necessary.
### Out of Scope
- Refactoring backend Spring Boot code or schemas.
- Converting JavaScript files to TypeScript `.ts` extensions.
- Modifying E2E Playwright test configurations unless broken by type casts.

## Capabilities
### New Capabilities
- None (pure type safety and test refactoring change).
### Modified Capabilities
- `Type-safe Form Data Processing`: Robust form input retrieval with explicit string coercion.
- `Standardized Mocking Utility`: Centralized `createMockEvent` helper to create type-safe mock RequestEvent objects for Vitest.

## Approach
- Create the shared mock factory `frontend/src/test/mockFactory.js`.
- Scan and iteratively fix type errors in loader, action, and helper files.
- Refactor duplicate event mocks in the 12 test files to use `createMockEvent` from the mock factory.
- Inject standard JSDoc type casts for errors inside catch blocks (`/** @type {any} */`).
- Coerce values extracted from `FormData` (e.g. `formData.get('x')`) to strings safely.
- Run `npm run typecheck` to verify no compiler errors remain.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| JS Config | Low | Keeping checkJs strict validation active. |
| Test Suite | Medium | Refactoring 12 test files to import mock event factory. |
| Server Actions | Medium | Ensuring safe parses on form values and standard catch blocks. |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Test suite regressions | Low | Rely on existing Vitest and Playwright tests to check behavior. |
| Incorrect type coercion breaking runtime logic | Low | Use standard `String(x)` or `x?.toString()` instead of unsafe casts. |

## Rollback Plan
- Revert all git changes using `git checkout` or `git reset` on frontend files.

## Dependencies
- SvelteKit dev dependencies, TypeScript compiler version compatibility.

## Success Criteria
- [ ] `npm run typecheck` executes successfully with zero errors.
- [ ] Unit and integration test suites run and pass.
- [ ] No regression in E2E tests.
