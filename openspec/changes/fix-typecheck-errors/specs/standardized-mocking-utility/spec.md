# Delta Specification: Standardized Mocking Utility

## Purpose
Consolidate duplicate RequestEvent mocks across frontend unit tests into a single, type-safe mocking factory function to reduce maintenance overhead and prevent typecheck failures.

## Requirements
- The system MUST centralize Vitest request mock events in `frontend/src/test/mockFactory.js`.
- The factory function `createMockEvent` MUST return a SvelteKit `RequestEvent`-like object that satisfies typescript type checking.
- The 12 unit test files containing duplicate mock event declarations MUST import and use `createMockEvent` from the mock factory.
- The utility MUST support optional custom properties (such as cookies, route parameters, or request bodies) to allow test-specific behavior customization.

## Scenarios

### Scenario: Request event mock creation with defaults
- GIVEN a unit test requiring a standard `RequestEvent`
- WHEN `createMockEvent` is called without arguments
- THEN it MUST return a mock object containing standard Request properties (headers, method, url) and mock helper functions (cookies, locals).

### Scenario: Request event mock creation with custom params
- GIVEN a unit test requiring a custom route parameter or mock cookies
- WHEN `createMockEvent` is called with custom properties
- THEN the returned mock object MUST merge the custom properties into the SvelteKit mock event structure.
