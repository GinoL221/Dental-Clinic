# Typed JS Parameters Specification

## Purpose
Enforce JSDoc type annotations on function parameters in client-side JavaScript to eliminate implicit `any` type warnings.

## Requirements

### Requirement: JSDoc Parameter Typing
All client-side JavaScript function parameters MUST have explicit JSDoc `@param` annotations. Bare `any` types MUST NOT be used where specific types can be resolved.

#### Scenario: Implicit Any Parameter Check
- GIVEN a function parameter `id` in `appointment-controller.js`
- WHEN annotated with `/** @param {number} id */` and verified via `tsc --noEmit`
- THEN the parameter compiles successfully without implicit `any` diagnostics
