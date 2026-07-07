# Delta Specification for Dashboard Types

## Purpose
Resolve type-checking errors in the dashboard views, DOM queries, user login layouts, and form labels.

## MODIFIED Requirements

### Requirement: Dashboard Type Safety
All callback parameters, chart objects, and dynamic keys in Svelte templates MUST be fully typed.

#### Scenario: JSDoc type annotations on dashboard script parameters
- GIVEN a Svelte component script in the dashboard
- WHEN JSDoc tags like `@type` or `@param` are applied
- THEN the Svelte compiler MUST verify types without implicit `any` errors.

### Requirement: Typed DOM Access
Element queries executing DOM manipulations MUST use type assertions.

#### Scenario: Element style mutation cast
- GIVEN a generic Element queried from the DOM
- WHEN cast to `HTMLElement` using JSDoc type comments
- THEN accessing its `.style` property MUST compile successfully.

### Requirement: Accessibility and Structuring
All template HTML structures MUST conform to a11y standards.

#### Scenario: Form input label association
- GIVEN a form field in add or edit pages
- WHEN the `<label>` is correctly associated with the `<input>` (via `for`/`id` or nesting)
- THEN compiler a11y warnings MUST NOT be reported.
