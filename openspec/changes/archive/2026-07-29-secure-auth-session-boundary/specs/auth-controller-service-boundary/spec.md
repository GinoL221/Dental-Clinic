# Delta for Auth Controller Service Boundary

## ADDED Requirements

### Requirement: Session profile uses the auth boundary

The system MUST expose authenticated `GET /auth/me` via controller/service/DTO with the five public fields. Its matcher MUST precede broad `/auth/**` `permitAll()` rules.

#### Scenario: Profile and matcher are protected

- GIVEN an existing user or an anonymous request
- WHEN `GET /auth/me` is called
- THEN the user receives `200 OK` or the anonymous request receives `401 Unauthorized`

### Requirement: Existing authentication contracts remain compatible

The change MUST preserve login/register, role enforcement, header-over-cookie precedence, and established `401`/`403` outcomes.

#### Scenario: Existing auth behavior is unchanged

- GIVEN existing login/register, role-protected, and dual-header/cookie requests
- WHEN those requests are exercised
- THEN their shapes, precedence, and status outcomes remain unchanged
