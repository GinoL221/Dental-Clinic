# Specification: Server-Side Hooks

## Purpose
Authenticate requests before SvelteKit routes render.

## Requirements
- The system MUST implement SvelteKit server-side hooks in `src/hooks.server.js`.
- The hook MUST intercept every request, extract auth cookies, and validate them against the Spring Boot API.
- If cookies are invalid and the request targets a guarded route, the hook MUST redirect to `/login`.
- If cookies are valid, the hook MUST inject session context into `event.locals`.

## Scenarios

### Scenario: Unauthenticated request is redirected
- GIVEN a request to `/dashboard` without cookies
- WHEN intercepted by the server hook
- THEN the response MUST redirect to `/login`.

### Scenario: Authenticated request is allowed
- GIVEN a request to `/dashboard` with valid cookies
- WHEN intercepted by the server hook
- THEN it MUST populate `event.locals.user` and allow the request.
