# Specification: Vitest and Playwright Testing

## Purpose
Align test runner documentation with Vitest and Playwright instead of legacy Jest.

## Requirements
- Documentation MUST instruct developers to run frontend unit/component tests using `npm run test` or `npm run test:watch`.
- Documentation MUST instruct developers to run end-to-end (E2E) tests using `npm run test:e2e` via Playwright.
- References to Jest configuration or running `jest` directly MUST be removed.

## Scenarios

### Scenario: Running Unit and E2E Tests
- GIVEN a developer or CI runner executing frontend tests
- WHEN referencing test commands in `README.md` or `openspec/config.yaml`
- THEN the instructions MUST specify `npm run test` for unit tests and `npm run test:e2e` for E2E tests.
