# Tasks: Frontend API Module Boundaries

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Files |
|------|------|-------|
| 1    | Relocate Dashboard API & Add Refresh | `dashboard-api.js`, `auth-api.js`, `dashboard-controller.js`, `dashboard.ejs`, `dashboard-api.test.js` |
| 2    | Refactor Appointment & Auth Modules | `appointment-enricher.js`, `data-manager.js` (x2), `ui-manager.js` |

## Phase 1: Foundation / Infrastructure

- [x] 1.1 Relocate [dashboard-api.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/dashboard/dashboard-api.js) to `/frontend/public/js/api/dashboard-api.js` and change imports from `../api/config.js` to `./config.js`.
- [x] 1.2 Update import of `DashboardAPI` in [dashboard-controller.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/dashboard/dashboard-controller.js) to point to `../api/dashboard-api.js`.
- [x] 1.3 Update script tag src for `dashboard-api.js` in [dashboard.ejs](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/src/views/dashboard/dashboard.ejs) to `/js/api/dashboard-api.js`.
- [x] 1.4 Update the file path to `dashboard-api.js` in [dashboard-api.test.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/test/dashboard-api.test.js).
- [x] 1.5 Add `AuthAPI.refreshToken()` method wrapping the `REFRESH` endpoint in [auth-api.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/api/auth-api.js).

## Phase 2: Core Refactoring

- [x] 2.1 Import `PatientAPI` and replace the direct fetch with `PatientAPI.getById` in [appointment-enricher.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/appointment/modules/appointment-enricher.js).
- [x] 2.2 Import `PatientAPI` and replace direct fetches with `PatientAPI.getAll` in [data-manager.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/appointment/modules/data-manager.js).
- [x] 2.3 Import `PatientAPI` and replace direct fetch with `PatientAPI.getById` in [ui-manager.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/appointment/modules/ui-manager.js).
- [x] 2.4 Import `AuthAPI` and replace direct fetches with `AuthAPI.validateToken()` and `AuthAPI.refreshToken()` in [data-manager.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/auth/modules/data-manager.js).

## Phase 3: Verification

- [x] 3.1 Run frontend test suite via `npm test` inside the `frontend` directory.
- [x] 3.2 Run grep search to verify no direct fetch calls to `/api/patients` or `/auth/` remain in the refactored files.
