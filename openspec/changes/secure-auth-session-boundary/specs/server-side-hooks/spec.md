# Delta for Server-Side Hooks

## MODIFIED Requirements

### Requirement: Server-side hooks authenticate and project sessions

The system MUST implement the server hook: intercept requests, extract cookies, validate through `/api/auth/me`, redirect invalid guarded requests, and inject the profile.

(Previously: The hook validated cookies against the API and injected session context.)

#### Scenario: Unauthenticated guarded request

- GIVEN `/dashboard` without valid cookies
- WHEN the hook intercepts it
- THEN auth cookies clear and the response redirects to `/login`

#### Scenario: Authenticated request

- GIVEN a valid session for an existing user
- WHEN the hook intercepts it
- THEN `/api/auth/me` is used, access is allowed, and locals contain only the five public fields

## ADDED Requirements

### Requirement: Private forwarding and cookie lifetime

The JWT MUST remain only in server-only `event.locals.authToken` and be forwarded by every protected loader/action. User/PageData MUST exclude JWTs, passwords, authorities, and relationships; `locals.user.token` references MUST be zero. Auth cookies MUST expire after 10 hours.

#### Scenario: Protected call is private

- GIVEN an authenticated protected loader/action
- WHEN it calls the backend
- THEN it forwards `event.locals.authToken`, serializes only public data, and uses 10-hour cookies
