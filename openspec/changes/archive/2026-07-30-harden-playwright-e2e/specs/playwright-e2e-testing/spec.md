# Delta for Playwright E2E Testing

## MODIFIED Requirements

### Requirement: Running application journey coverage

E2E tests MUST run against a running SvelteKit instance and cover login, meaningful dashboard navigation, and booking. Full-stack runs MUST use deterministic, isolated disposable state and prove backend effects through persisted and rendered data; a page heading alone MUST NOT prove success.
(Previously: E2E tests only needed a SvelteKit instance and broad coverage of login, navigation, and booking.)

#### Scenario: Successful admin login and dashboard navigation

- GIVEN the `/login` page is loaded with valid admin credentials
- WHEN the administrator submits the credentials and navigates the dashboard
- THEN the browser MUST redirect to `/dashboard` and show seeded backend data in a meaningful dashboard view

#### Scenario: Invalid login is rejected

- GIVEN the `/login` page is loaded in Playwright
- WHEN a user submits invalid credentials
- THEN the page MUST display an error message and MUST NOT grant dashboard access

#### Scenario: UI booking proves persistence and rendering

- GIVEN an authenticated administrator and a seeded future slot in isolated state
- WHEN the administrator creates an appointment through the UI
- THEN the submitted appointment MUST be persisted and rendered with matching data; a heading alone MUST NOT count as proof

#### Scenario: Unauthenticated access is redirected

- GIVEN no authenticated session exists
- WHEN the browser opens a protected dashboard route
- THEN the browser MUST redirect to `/login` and MUST NOT expose protected data

#### Scenario: Non-admin access is denied

- GIVEN an authenticated non-admin user
- WHEN the user opens an admin-protected route or performs an admin-only action
- THEN access MUST be denied and protected admin content MUST remain unavailable

## ADDED Requirements

### Requirement: Explicit mock and full-stack evidence

Mock tests MAY provide fast feedback, but full-stack tests MUST exercise the real backend. Results MUST identify their execution mode, remain independently runnable, and MUST NOT use mock evidence as proof of full-stack behavior.

#### Scenario: Evidence modes remain separate

- GIVEN both mock and full-stack suites are executed
- WHEN their results are reported
- THEN each result MUST identify its mode and MUST be evaluated only against that mode's coverage

### Requirement: Mandatory initial Chromium CI gate

The initial CI gate MUST run the full-stack suite in Chromium and MUST fail before browser execution when required environment-provided credentials are absent. Credential values MUST NOT appear in logs or diagnostics.

#### Scenario: Chromium gate runs with supplied credentials

- GIVEN required credentials are present in the CI environment
- WHEN the initial gate runs
- THEN the full-stack Chromium suite MUST execute and the gate MUST pass only after its journeys pass

#### Scenario: Missing credentials fail safely

- GIVEN one or more required credentials are absent
- WHEN the initial gate starts
- THEN it MUST fail before browser execution, identify only missing inputs, and MUST NOT print credential values

### Requirement: Deterministic state and artifact hygiene

Full-stack runs MUST use isolated disposable state that produces repeatable fixture outcomes. Generated Playwright artifacts MUST NOT be tracked, and portfolio screenshots MUST NOT be deleted without proof that Playwright generated them.

#### Scenario: Repeated runs are isolated

- GIVEN two full-stack runs start from the same declared fixture state
- WHEN both execute the booking journey
- THEN each run MUST observe the same seeded data without consuming or altering the other run's state

#### Scenario: Generated artifacts remain untracked

- GIVEN a Playwright run produces reports, traces, screenshots, or videos
- WHEN repository tracking is checked
- THEN those generated artifacts MUST be absent from tracked changes

## Scope Boundaries

This delta does not require Firefox or WebKit, a complete role matrix, the full booking lifecycle, or any new use of obsolete `/api/auth/validate`. Portfolio screenshots remain unless proven Playwright-generated.
