# Delta Specification: Routing

## Purpose
Map custom Express routes to SvelteKit folder-based routing.

## Requirements
- All routes MUST use the file-system router in `src/routes/`.
- Legacy static routes MUST map to SvelteKit `+page.svelte` files (e.g., `/dentists` to `src/routes/dentists/+page.svelte`).
- Legacy dynamic routes MUST map to SvelteKit param folders (e.g., `/patients/:id` to `src/routes/patients/[id]/+page.svelte`).

## Scenarios

### Scenario: Static route resolution
- GIVEN a navigation request to `/dentists`
- WHEN SvelteKit resolves the path
- THEN it MUST render `src/routes/dentists/+page.svelte`.

### Scenario: Dynamic parameter resolution
- GIVEN a navigation request to `/patients/45`
- WHEN SvelteKit resolves the path
- THEN it MUST map parameter `id` to `"45"`.
