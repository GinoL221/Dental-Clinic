# Proposal: Auth Controller Service Boundary

## Intent

Remove direct repository access from `AuthenticationController` so the authentication API follows the project boundary rule: Controller → Service interface/implementation → Repository. This slice specifically addresses the archived architecture audit Slice 1 finding that `/auth/check-email` currently checks email existence through `IUserRepository` from the controller instead of delegating to the service/application layer.

## Problem Statement

`AuthenticationController` currently injects `IUserRepository` directly and uses it in `checkEmailExists` to answer `/auth/check-email` requests. That bypasses the service layer, weakens responsibility separation, and makes it easier for future controller code to accumulate persistence/business decisions outside the application boundary.

Audit basis:

- Backlog Slice 1: `openspec/changes/archive/2026-07-02-architecture-responsibility-test-audit/remediation-backlog.md`
- Audit report finding: BM-01, with test gaps TM-01 and TM-03
- Canonical audit spec: `openspec/specs/architecture-responsibility-test-audit/spec.md`

## Goals

- Restore the authentication boundary so controllers delegate through the authentication service layer rather than repositories.
- Preserve existing register, login, and check-email behavior.
- Add or strengthen tests that protect the controller/service/repository boundary.
- Keep the change small, reviewable, and aligned with AGENTS.md Spring rules and Gentleman Book responsibility separation.

## Non-Goals

- No authentication redesign.
- No JWT or Spring Security model changes.
- No broad DTO migration beyond what this slice strictly needs.
- No frontend changes.
- No package-wide Clean Architecture rewrite.
- No unrelated controller, repository, or service refactors.

## Scope

In scope:

- `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationController.java`
- `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationService.java` or the existing authentication service boundary used by the controller
- Backend authentication controller tests and focused architecture-boundary tests needed to protect this slice

Out of scope:

- Other controllers identified in the archived audit backlog
- Frontend auth flows
- CI configuration changes
- Persistence model changes

## Affected Areas

- Authentication HTTP endpoints, especially `GET /auth/check-email`
- Authentication service/application layer
- Backend tests around auth controller behavior and architecture boundary enforcement

## Proposed Behavior

`AuthenticationController` should expose the same public routes and response shapes, but it should no longer inject or call `IUserRepository` directly. The email-existence check should be delegated to the authentication service boundary, which already owns user repository access for register and login behavior.

Expected behavior remains equivalent:

- `POST /auth/register` keeps current success and rejection behavior.
- `POST /auth/login` keeps current authentication behavior.
- `GET /auth/check-email?email=...` returns the same boolean result as before.

## Testing Expectations

The implementation should add or update tests for:

- Controller behavior for `GET /auth/check-email`, including existing and missing email cases when practical.
- Architecture boundary protection proving `AuthenticationController` does not depend on repository types such as `IUserRepository`.
- Regression coverage for existing register/login behavior sufficient to show the boundary change did not alter public auth behavior.

Focused backend Maven tests are acceptable for this small slice if the full Maven test suite is too expensive, but the result should clearly state what was run.

## Proposal Question Round

Interactive SDD mode normally offers a product question round before finalizing the proposal. The current task already includes the approved Slice 1 intent and explicit requirements, so this proposal proceeds with the following assumptions for user review:

- The first product slice is intentionally narrow: remove only the auth controller repository dependency and add protective tests.
- The business priority is reducing future auth-surface risk by enforcing a clearer service boundary without changing user-visible behavior.
- The highest tradeoff is avoiding accidental behavior/security changes while touching authentication code.
- Broader DTO, JWT/security, and frontend changes remain separate future decisions.

If any of those assumptions are wrong, this proposal should be corrected before the spec/design/tasks phases.

## Risks and Tradeoffs

- Authentication is a security-sensitive surface; even a small wiring change must preserve behavior exactly.
- Architecture-boundary tests can become brittle if they assert incidental implementation details, so they should protect the explicit boundary only: controllers must not depend on repositories.
- Adding service methods for simple repository queries is a small abstraction cost, but it restores the layered architecture and keeps persistence decisions out of controllers.

## Rollback Plan

Rollback should revert the controller/service wiring and the tests added for this slice as one work unit. Because no database schema, JWT, frontend, or CI changes are intended, rollback should be limited to backend authentication source and test files.

## Success Criteria

- `AuthenticationController` no longer injects or imports `IUserRepository` or any repository type.
- Email-existence checks are delegated through the authentication service/application layer.
- Register, login, and check-email behavior remain equivalent from the API consumer perspective.
- Tests cover check-email behavior and the controller/repository boundary.
- Maven backend tests pass, or the focused backend test command for this slice passes and any unrun broader suite is explicitly reported.

## Relationship to Project Rules and Gentleman Book

This proposal enforces AGENTS.md backend guidance for standard Spring layered architecture: Controller → Service interface/implementation → Repository. It also supports Gentleman Book-style responsibility separation by keeping controllers thin, testable, and free of persistence access while preserving behavior through focused regression tests.
