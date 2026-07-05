# Typed DOM Access Specification

## Purpose
Type cast queried DOM elements and event targets to specific HTML element types, resolving type checker property errors.

## Requirements

### Requirement: Element Type Casting
DOM element queries and event targets MUST be explicitly cast to specific element interfaces using JSDoc. Bare `any` MUST NOT be used.

#### Scenario: DOM Input Value Verification
- GIVEN a DOM query `document.getElementById('input-field')`
- WHEN it is cast using `/** @type {HTMLInputElement} */`
- THEN accessing its `.value` property is verified without compiler warnings
