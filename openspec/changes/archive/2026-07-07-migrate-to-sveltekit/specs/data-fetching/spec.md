# Delta Specification: Data Fetching

## Purpose
Migrate data-fetching from Express controllers to SvelteKit loaders and Form Actions.

## Requirements
- Svelte pages MUST fetch data using `load` functions in `+page.server.js` contacting the Spring Boot REST API.
- Data modifications MUST use SvelteKit Form Actions instead of Axios Express controllers.

## Scenarios

### Scenario: Server-side page data fetch
- GIVEN a client navigates to `/patients`
- WHEN SvelteKit processes the request
- THEN `+page.server.js` `load()` MUST fetch patients from the backend REST API.

### Scenario: Form Action mutation
- GIVEN a user submits a creation form on `/patients`
- WHEN SvelteKit executes the associated Form Action
- THEN the action MUST send a `POST` request to the backend REST API.
