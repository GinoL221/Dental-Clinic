# Tasks: Resolve Strict Client Typecheck

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 600-800 lines |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (APIs & Utilities) → PR 2 (Core Modules) → PR 3 (Controllers, config & verification) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units
- **PR 1**: Add JSDoc annotations to `appointment-api.js`, `auth-api.js`, `dentist-api.js`, `patient-api.js`, `specialty-api.js`, `utils.js`, and `date-utils.js`.
- **PR 2**: Add types, DOM casts, and null-guards to 26 core module files under `frontend/public/js/*/modules/`.
- **PR 3**: Type 10 page controllers, update `dashboard-uplot.js`, update `dentist-specialty-ui.js`, update `global.d.ts`, and flip `strict: true` in `jsconfig.json`.

## Phase 1: APIs & Utilities
- [x] 1.1 Add JSDoc params/returns to [appointment-api.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/api/appointment-api.js) and [auth-api.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/api/auth-api.js).
- [x] 1.2 Add JSDoc to [dentist-api.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/api/dentist-api.js), [patient-api.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/api/patient-api.js), and [specialty-api.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/api/specialty-api.js).
- [x] 1.3 Add types to helper utility [utils.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/api/utils.js) and [date-utils.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/utils/date-utils.js).

## Phase 2: Core Modules & Utilities
- [ ] 2.1 Annotate `data-manager.js` and `form-manager.js` across appointment, auth, dentist, patient modules under [js/](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/).
- [ ] 2.2 Annotate `ui-manager.js` and `validation-manager.js` across all 4 module directories.
- [ ] 2.3 Type module `index.js`, search-controllers, export-utils, loader, enricher, interceptor, and route-guard.

## Phase 3: Controllers & Integrations
- [ ] 3.1 Type 10 controller files (`*-controller.js`) and add DOM null-guards/casts.
- [ ] 3.2 Update specialty UI [dentist-specialty-ui.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/dentist/dentist-specialty-ui.js) and dashboard chart [dashboard-uplot.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/dashboard/dashboard-uplot.js).
- [ ] 3.3 Tighten typings for `window` properties in global definition [global.d.ts](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/global.d.ts).
- [ ] 3.4 Enable `"strict": true` in configuration [jsconfig.json](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/jsconfig.json).

## Phase 4: Final Verification
- [ ] 4.1 Run static typecheck via `npm run typecheck` to verify zero strict-mode errors.
- [ ] 4.2 Run test suite via `npm test` to verify all 255 existing tests pass.
