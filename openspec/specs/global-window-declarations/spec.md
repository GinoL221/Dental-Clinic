# Global Window Declarations Specification

## Purpose
Define static type declarations for custom `window` properties to resolve implicit type warnings during client-side compilation.

## Requirements

### Requirement: Declaring Window Globals
The `frontend/global.d.ts` file MUST declare all custom `window` properties to prevent compilation diagnostics.

#### Scenario: Verify Custom Global Controller Property
- GIVEN a custom property `window.appointmentController` is accessed in client-side code
- WHEN compile check is run with `tsc --noEmit`
- THEN the compiler resolves the property type correctly without warnings
