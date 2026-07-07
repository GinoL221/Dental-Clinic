# Tasks: Fix Typecheck Errors

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 150-250 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units
| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Test Mock Infrastructure | PR 1 | Create mockFactory.js and refactor 12 test files |
| 2 | Server Actions & Loaders | PR 1 | Refactor 8 +page.server.js files for FormData/catch casting |
| 3 | Validation | PR 1 | Run typecheck, Vitest, Playwright |

## Phase 1: Test Infrastructure
- [x] 1.1 Create `frontend/src/test/mockFactory.js` helper.
- [x] 1.2 Refactor the 12 test files to import and use the mock factory helper.

## Phase 2: Server Loaders and Actions
- [x] 2.1 Refactor the 8 server loaders/actions (`+page.server.js`) to resolve `FormData` parsing and catch block casting issues.

## Phase 3: Validation
- [ ] 3.1 Run typecheck validation: `npm run typecheck`.
- [ ] 3.2 Run unit tests: `npm run test` (Vitest).
- [ ] 3.3 Run end-to-end tests: `npm run test:e2e` (Playwright).
