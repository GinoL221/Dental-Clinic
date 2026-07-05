# Strict Typecheck Gate Specification

## Purpose
Enforce a compiler gate on client-side JavaScript using strict compiler rules to guarantee type safety and prevent runtime errors.

## Requirements

### Requirement: Strict Typecheck Script
The system MUST provide an `npm run typecheck` command to run type verification.

#### Scenario: Running typecheck command succeeds
- GIVEN the client-side configuration with strict checks enabled
- WHEN `npm run typecheck` is run in the `frontend` directory
- THEN the compilation check MUST exit with status code 0
- AND no compilation errors MUST be reported.

### Requirement: Strict Compiler Configuration
The file `frontend/jsconfig.json` MUST configure strict type checking.

#### Scenario: Verify strict configuration is enabled
- GIVEN `frontend/jsconfig.json`
- WHEN the compiler options are read
- THEN the `strict` setting MUST be set to true
- AND all files under `frontend/public/js/` MUST be in scope.

### Requirement: Zero Error Type Checking Gate
The type checking gate MUST block the compilation of any implicit-any or null-unsafe code.

#### Scenario: Type violations fail the check
- GIVEN a JavaScript file with a typecheck violation
- WHEN the typecheck command is executed
- THEN the command MUST fail with a non-zero exit status.
