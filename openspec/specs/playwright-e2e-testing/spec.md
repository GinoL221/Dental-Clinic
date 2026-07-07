# Specification: Playwright E2E Testing

## Purpose
Validate complete user journeys using a real browser.

## Requirements
- The system MUST use Playwright to execute end-to-end integration tests.
- E2E tests MUST run against a running SvelteKit instance and cover login, navigation, and booking.

## Scenarios

### Scenario: Successful login via browser
- GIVEN the `/login` page is loaded in Playwright
- WHEN a user submits valid credentials
- THEN the browser MUST redirect to `/dashboard`.

### Scenario: Invalid login is rejected
- GIVEN the `/login` page is loaded in Playwright
- WHEN a user submits invalid credentials
- THEN the page MUST display an error message.
