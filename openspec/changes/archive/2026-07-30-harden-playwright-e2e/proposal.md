# Proposal: Harden Playwright E2E

## Intent

CI can currently pass without proving critical integrated journeys. This proposal reduces false confidence and catches frontend/backend integration and authorization regressions before merge. Mocks remain fast feedback, not full-stack evidence.

## Scope

### In Scope
- Add a safe Spring Boot `e2e` profile with disposable H2 and deterministic role/booking fixtures.
- Separate mock/full-stack Playwright configs/scripts; add reusable POMs, fixtures, and sessions.
- Cover admin login/dashboard navigation, UI appointment creation with persisted/rendered verification, unauthenticated redirect, and non-admin denial.
- Add mandatory Chromium CI gate with fail-fast credential checks, diagnostics, and no secret logging.
- Remove tracked artifacts and add ignore rules.

### Out of Scope
- Defer Firefox/WebKit, a complete role matrix, and the full booking lifecycle unless a hard dependency emerges.
- Do not re-propose obsolete `/api/auth/validate`; use `/api/auth/me`.
- Keep portfolio screenshots unless proven Playwright-generated.

## Assumptions

- Chromium is the first full-stack baseline.
- Runs use isolated disposable state.
- Mock tests remain fast feedback, never full-stack evidence.

## Capabilities

### New Capabilities
- None; extends existing capability.

### Modified Capabilities
- `playwright-e2e-testing`: require full-stack execution, deterministic backend journeys, mock separation, and an initial Chromium CI gate.

## Approach

Run one Spring Boot `e2e` process and SvelteKit preview. Seed role/booking state and a future slot. Read environment credentials; validate presence without logging values. Keep mocks under a distinct command and assert backend data, not headings.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/tests/`, `frontend/playwright.config.js` | Modified/New | Suites, POMs, fixtures, sessions. |
| `backend/.../configuration/`, `application-e2e.properties` | Modified/New | Isolated profile and fixtures. |
| `.github/workflows/ci.yml` | Modified | Mandatory Chromium gate. |
| `.gitignore`, `frontend/test-results/` | Modified/Removed | Ignore and remove generated artifacts. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Fixture dates or shared state cause flakiness | Med | Future weekday/time, disposable H2, one worker. |
| Profile or credentials leak into unsafe environments | Med | Explicit profile boundary, fail-fast validation, no secret logging. |
| Dashboard fallback masks backend failure | Med | Assert seeded values and backend-rendered booking state. |

## Rollback Plan

Revert E2E profile/fixtures, Playwright configuration/scripts, CI job, and ignore/artifact changes together; restore the mock command and remove the gate. Application behavior and `/api/auth/me` remain unchanged.

## Dependencies

- `playwright-e2e-testing` requirement and `/api/auth/me` contract.
- CI-provided credentials and Chromium installation.

## Success Criteria

- [ ] The full-stack Chromium suite passes locally and in CI against disposable `e2e` state.
- [ ] The suite proves all four in-scope journeys, including persisted booking state and non-admin denial.
- [ ] Mock and full-stack commands are independently runnable, and generated Playwright artifacts are not tracked.
