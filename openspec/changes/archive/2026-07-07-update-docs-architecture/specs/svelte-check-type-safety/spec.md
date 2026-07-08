# Specification: Svelte-Check Type Safety

## Purpose
Establish static type analysis verification procedures using JSDoc and `svelte-check`.

## Requirements
- Documentation MUST require static analysis check using `npm run check` (`svelte-check`) and `npm run typecheck` (`tsc`).
- Coding style documents (such as `AGENTS.md`) MUST instruct developers to validate JSDoc types and Svelte templates.

## Scenarios

### Scenario: Static Type Verification
- GIVEN a developer verifying type safety of Svelte components and JavaScript files
- WHEN reading the validation guidelines in `AGENTS.md`
- THEN the document MUST require execution of `npm run check` and `npm run typecheck` to prevent compilation errors.
