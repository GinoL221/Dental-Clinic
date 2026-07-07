# Specification: Vitest Unit Testing

## Purpose
Execute fast, isolated unit tests for Svelte component logic and page loaders.

## Requirements
- The system MUST use Vitest as the primary unit test runner.
- All loaders (`+page.server.js`) and utilities MUST have unit tests.
- External REST API calls inside loader functions MUST be mocked during unit testing.

## Scenarios

### Scenario: Utility function unit test runs
- GIVEN a date formatter helper function
- WHEN tested using Vitest
- THEN it MUST match the expected formatted output.

### Scenario: Server loader test stubs REST API
- GIVEN a page loader fetching data
- WHEN Vitest executes the loader test with mocked REST API responses
- THEN the loader MUST return the correct structured data.
