# Specification for Svelte Typecheck

## Purpose
Introduce a static type-checking step to verify type correctness of Svelte components and JavaScript scripts.

## Requirements

### Requirement: Svelte Typecheck script
The `frontend/package.json` MUST define a `check` script.

#### Scenario: Running check command
- GIVEN the frontend project config
- WHEN executing `npm run check`
- THEN `svelte-check` MUST run using the configuration in `jsconfig.json`.

### Requirement: Global Type Declarations
The compiler MUST load global definitions, including `uPlot`, to prevent reference errors.

#### Scenario: Compilation of uPlot reference
- GIVEN a global declaration file `frontend/src/global.d.ts` containing the `uPlot` interface
- WHEN the check script is executed
- THEN the compiler MUST resolve `uPlot` without undefined identifier errors.
