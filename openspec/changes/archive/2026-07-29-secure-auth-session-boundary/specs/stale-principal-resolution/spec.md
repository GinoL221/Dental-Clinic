# Delta for Stale Principal Resolution

## ADDED Requirements

### Requirement: `/auth/me` resolves stale credentials as 401

Absent, malformed, expired, or deleted-user credentials on `GET /auth/me` MUST return established `401 Unauthorized`.

#### Scenario: Invalid credential

- GIVEN an absent, malformed, expired, or valid JWT for a deleted user
- WHEN the client requests `GET /auth/me`
- THEN it receives established `401 Unauthorized`
