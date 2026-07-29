# Auth Session Contract Specification

## Purpose

Define the secure session boundary.

## Requirements

### Requirement: Exact protected profile

The system MUST expose authenticated `GET /auth/me` with exactly five fields: `id`, `firstName`, `lastName`, `email`, `role`. Its matcher MUST precede broad `/auth/**` `permitAll()`; invalid credentials MUST return established `401 Unauthorized`.

#### Scenario: Authenticated profile

- GIVEN a valid existing-user credential
- WHEN the client requests `GET /auth/me`
- THEN it receives `200 OK` with the five fields

#### Scenario: Invalid profile request

- GIVEN an absent, malformed, expired, or deleted-user credential
- WHEN the client requests `GET /auth/me`
- THEN it receives established `401 Unauthorized`

### Requirement: Server-only credential boundary

The hook MUST call `/api/auth/me` and project five fields. `event.locals.user` and PageData MUST exclude JWTs, passwords, authorities, and relationships. The JWT MUST remain only in `event.locals.authToken`; protected loaders/actions MUST forward it, with zero `locals.user.token` references.

#### Scenario: Protected state is safe

- GIVEN a valid session and protected server call
- WHEN locals are created and the backend is called
- THEN only the public profile serializes and the private token is forwarded

### Requirement: Recovery, compatibility, and documentation

Cookies `authToken`, `userRole`, and `userEmail` MUST last 10 hours. Invalid sessions MUST clear all three and redirect guarded routes to `/login`. Login/register, roles, header-over-cookie precedence, and established `401`/`403` MUST remain compatible. Update `README.md`, `CONEXION.md`, and frontend auth docs; refresh tokens and archives are out of scope.

#### Scenario: Guarded stale session recovers

- GIVEN an invalid, expired, or deleted-user session on a guarded request
- WHEN the hook processes it
- THEN all auth cookies clear and the response redirects to `/login`
