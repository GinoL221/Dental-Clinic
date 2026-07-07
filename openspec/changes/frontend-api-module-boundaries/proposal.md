# Proposal: Frontend API Module Boundaries

## Intent
Enforce a single adapter layer for all backend HTTP calls by removing raw `fetch` usage from business and UI modules. All backend requests must flow through `frontend/public/js/api/` modules.

## Scope

### In Scope
- Move `dashboard-api.js` from `dashboard/` into the centralized `api/` folder.
- Replace direct `fetch` calls in appointment modules (`appointment-enricher.js`, `data-manager.js`, `ui-manager.js`) with `PatientAPI` delegates.
- Replace direct `fetch` calls in `auth/modules/data-manager.js` for backend endpoints (`auth/validate`, `auth/refresh`) with `AuthAPI` delegates.
- Fix the enricher fallback bug by removing the manual fetch entirely (delegate to `PatientAPI.getById`).

### Out of Scope
- EJS template refactoring (Slice 5).
- Frontend-server endpoints (`/users/login`, `/users/register`, `/appointments/server-data`) — these are Express routes, not backend API calls.
- `server-data-loader.js` — bootstraps session state from the Node frontend, not the Java API.
- `register-controller.js` — already uses `AuthAPI`; remaining fetch is a Node form submit.

## Capabilities

### New Capabilities
None

### Modified Capabilities
None

> This is a pure structural refactor. No spec-level behavior changes.

## Approach

| Step | Action | Files |
|------|--------|-------|
| 1 | **Relocate Dashboard API** | `dashboard/dashboard-api.js` → `api/dashboard-api.js` |
| 2 | **Update references** | `dashboard.ejs`, `dashboard-controller.js`, `dashboard-api.test.js` |
| 3 | **Enricher → PatientAPI** | `appointment/modules/appointment-enricher.js` |
| 4 | **Data-Manager → PatientAPI** | `appointment/modules/data-manager.js` |
| 5 | **UI-Manager → PatientAPI** | `appointment/modules/ui-manager.js` |
| 6 | **Auth Data-Manager → AuthAPI** | `auth/modules/data-manager.js` |

All paths below are relative to `frontend/public/js/`.

## Affected Areas

| File | Change Type |
|------|-------------|
| `frontend/public/js/dashboard/dashboard-api.js` | Delete (moved) |
| `frontend/public/js/api/dashboard-api.js` | Create (relocated) |
| `frontend/public/js/appointment/modules/appointment-enricher.js` | Modify |
| `frontend/public/js/appointment/modules/data-manager.js` | Modify |
| `frontend/public/js/appointment/modules/ui-manager.js` | Modify |
| `frontend/public/js/auth/modules/data-manager.js` | Modify |
| `frontend/views/dashboard.ejs` | Modify (script src) |
| `frontend/public/js/dashboard/dashboard-controller.js` | Modify (import path) |
| `tests/` (dashboard-api tests) | Modify (import path) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Broken import paths after move | Medium | Grep all references before and after; run full test suite |
| Auth token/header loss in delegated calls | Low | `PatientAPI`/`AuthAPI` already handle credentials via shared `config.js` |
| Missed `fetch` call site | Low | Automated grep for `fetch(` outside `api/` as CI gate |

## Rollback Plan
Revert the commit (single atomic commit). No database, config, or API contract changes are involved — a `git revert` fully restores prior state.

## Dependencies
- `PatientAPI` (`frontend/public/js/api/patient-api.js`) must expose `getById()` and `getAll()`.
- `AuthAPI` (`frontend/public/js/api/auth-api.js`) must expose `validateToken()` and token-refresh functionality.

## Success Criteria
1. **Zero raw `fetch` calls** in business/UI modules targeting the Java backend API (verified by grep).
2. `dashboard-api.js` resides exclusively in `frontend/public/js/api/`.
3. All existing tests pass with no behavioral regressions.
4. The enricher fallback bug (missing `/api` prefix) is eliminated by delegation.
