# Auth Controller Service Boundary Specification

## Purpose

Ensure backend authentication HTTP endpoints preserve existing behavior while enforcing the project boundary that controllers delegate persistence-related decisions through the authentication service layer instead of directly accessing repositories.

## Requirements

### Requirement: Authentication Controller Repository Independence

The system MUST ensure `AuthenticationController` does not directly depend on repository types for authentication behavior.

#### Scenario: Controller has no repository dependency

- GIVEN the backend authentication controller is compiled
- WHEN its constructor dependencies, fields, imports, and direct collaborators are inspected by a focused backend architecture test
- THEN no repository type, including `IUserRepository`, SHALL be a direct dependency of `AuthenticationController`
- AND repository access needed by authentication endpoints MUST remain outside the controller layer.

### Requirement: Email Existence Uses Service Boundary

The system MUST expose email-existence behavior for `/auth/check-email` through the authentication service boundary or an equivalent service-layer abstraction.

#### Scenario: Check-email delegates through service layer

- GIVEN a client requests `GET /auth/check-email?email=user@example.com`
- WHEN `AuthenticationController` handles the request
- THEN the controller MUST obtain the email-existence result through the authentication service boundary
- AND the controller MUST NOT query user repositories directly.

#### Scenario: Service layer owns repository-backed email lookup

- GIVEN the authentication service layer receives an email-existence request
- WHEN it determines whether the email exists
- THEN it MAY use the user repository or another persistence abstraction internally
- AND it MUST return a boolean result equivalent to the previous repository-backed controller behavior.

### Requirement: Authentication API Backward Compatibility

The system MUST preserve existing public behavior for authentication registration, login, and email-existence endpoints.

#### Scenario: Register behavior remains compatible

- GIVEN a valid registration request that previously succeeded
- WHEN the client calls the existing registration endpoint
- THEN the response status and response shape MUST remain compatible with the previous API behavior.

#### Scenario: Login behavior remains compatible

- GIVEN valid login credentials that previously authenticated successfully
- WHEN the client calls the existing login endpoint
- THEN the response status and response shape MUST remain compatible with the previous API behavior.

#### Scenario: Check-email behavior remains compatible for existing email

- GIVEN an email address that exists for a user
- WHEN the client calls `GET /auth/check-email?email={email}`
- THEN the endpoint MUST return the same boolean existence result as before this change.

#### Scenario: Check-email behavior remains compatible for missing email

- GIVEN an email address that does not exist for any user
- WHEN the client calls `GET /auth/check-email?email={email}`
- THEN the endpoint MUST return the same boolean non-existence result as before this change.

### Requirement: Focused Backend Regression and Boundary Tests

The system MUST include focused backend tests that verify check-email behavior, preserve auth endpoint compatibility, and protect the controller/service/repository boundary.

#### Scenario: Check-email behavior is covered by backend tests

- GIVEN backend tests for the authentication API
- WHEN the focused Maven test command for this slice is run
- THEN tests MUST verify `/auth/check-email` returns the expected boolean result for existing and missing email cases where practical.

#### Scenario: Boundary contract is covered without brittle incidental assertions

- GIVEN backend architecture or controller-boundary tests
- WHEN the tests inspect the authentication controller boundary
- THEN they MUST fail if `AuthenticationController` directly depends on repository types
- AND they SHOULD avoid assertions that depend only on incidental formatting, comments, or unrelated implementation details.

#### Scenario: Register and login regressions are guarded

- GIVEN the controller boundary change has been applied
- WHEN the focused backend tests for this slice are run
- THEN registration and login behavior MUST have sufficient regression coverage to show their public API behavior was not changed by the boundary refactor.
