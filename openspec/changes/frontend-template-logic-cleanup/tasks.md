# Tasks: Frontend Template Logic Cleanup

## Review Workload Forecast
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

## Suggested Work Units
| Unit | Description | Key Files |
|---|---|---|
| 1 | EJS Script Partialization | `frontend/src/views/partials/scripts.ejs` and all view EJS files |
| 2 | Body Dataset State Migration | `server-data-loader.js`, `dashboard-controller.js`, `dashboard.ejs`, `appointment*.ejs` |
| 3 | UI Controller Refactoring | `ui-manager.js`, `form-manager.js`, `appointmentEdit.ejs` |

## Phase 1: Foundation / Infrastructure
- [x] 1.1 Create shared EJS partial at [scripts.ejs](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/src/views/partials/scripts.ejs) for the Bootstrap bundle script tag.
- [x] 1.2 Locate and replace hardcoded Bootstrap `<script>` tags across all `.ejs` templates (e.g. in `dentists/`, `patients/`, `users/`, and main layouts) with the new scripts partial `<%- include('../partials/scripts') %>`.

## Phase 2: Core Refactoring
- [ ] 2.1 Refactor [server-data-loader.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/appointment/modules/server-data-loader.js) to reconstruct `window.serverData` from `document.body.dataset` before using existing fallbacks.
- [ ] 2.2 Update [dashboard-controller.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/dashboard/dashboard-controller.js) to import and invoke `loadServerData` within `init()`.
- [ ] 2.3 Add metadata dataset attributes (`data-user-id`, etc.) to `<body>` tags and remove inline scripts initializing `window.serverData` in EJS files:
  - [dashboard.ejs](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/src/views/dashboard/dashboard.ejs)
  - [appointmentList.ejs](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/src/views/appointments/appointmentList.ejs)
  - [appointmentAdd.ejs](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/src/views/appointments/appointmentAdd.ejs)
  - [appointmentEdit.ejs](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/src/views/appointments/appointmentEdit.ejs)
- [ ] 2.4 Refactor [ui-manager.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/appointment/modules/ui-manager.js) to set `#btn-add-new-appointment` text dynamically based on the role retrieved from the loaded dataset.
- [ ] 2.5 Refactor [form-manager.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/appointment/modules/form-manager.js) to bind change listeners on `#patientSelect` dynamically in both `bindAddFormEvents` and `bindEditFormEvents`, and remove all corresponding inline scripts/event handlers from [appointmentEdit.ejs](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/src/views/appointments/appointmentEdit.ejs).

## Phase 3: Verification
- [ ] 3.1 Verify there are no remaining inline `<script>` tags injecting `window.serverData` or `window.currentUser` across all EJS views.
- [ ] 3.2 Verify no hardcoded Bootstrap bundle script tags remain.
- [ ] 3.3 Run tests (`npm test` in frontend/backend) to verify code syntax, layout checks, and test coverage regressions.
