# Delta for Typed DOM Access

## Purpose
Ensure all DOM queries and target manipulations are guarded against null references to satisfy compiler check conditions under strict mode.

## ADDED Requirements

### Requirement: DOM Access Null-Guards
All DOM queries (e.g. `document.getElementById`, `document.querySelector`) MUST be guarded against null references using optional chaining or explicit conditional checks prior to element property or method invocation.

#### Scenario: Element operation with explicit null check
- GIVEN a cast DOM element query result
- WHEN wrapped in an `if (element)` statement
- THEN properties on the element can be read/written without compiler null diagnostics.

#### Scenario: Element property access using optional chaining
- GIVEN a cast DOM element query result
- WHEN accessed with the optional chaining operator `?.`
- THEN the compiler resolves the accessed value without null diagnostics.

### Requirement: Event Target Guarding and Casting
Event target objects accessed inside listeners MUST be cast to their specific element type and guarded against potential null states.

#### Scenario: Event target cast and checked
- GIVEN a click listener event
- WHEN `event.target` is cast via JSDoc and guarded against null
- THEN its properties MUST compile successfully without type or null diagnostics.
