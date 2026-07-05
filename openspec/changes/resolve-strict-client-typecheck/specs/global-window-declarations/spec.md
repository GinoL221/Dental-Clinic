# Delta for Global Window Declarations

## Purpose
Strictly type custom properties declared on the `Window` interface to resolve global compiler checks.

## MODIFIED Requirements

### Requirement: Strict Window Globals Declaration
The `frontend/global.d.ts` file MUST type all custom properties on the `Window` interface using explicit classes or object shapes rather than generic fallback types.

#### Scenario: Verify strict global property access
- GIVEN a custom property `window.dentistSpecialtyUI` in a client-side module
- WHEN the compiler resolves its type to the exact `DentistSpecialtyUI` interface in `global.d.ts`
- THEN the type checks compile without implicit any warnings under `strict: true`.
