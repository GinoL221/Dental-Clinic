# Tasks: Resolve Client-Side Type Warnings

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 600-800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Foundation) → PR 2 (Core Utils & Modules) → PR 3 (Domain Controllers & Pages) → PR 4 (Verification) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: size-exception
400-line budget risk: High

### Suggested Work Units
- **PR 1: Foundation**: Set up devDependencies, update [jsconfig.json](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/jsconfig.json), resolve [apiConfig.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/src/config/apiConfig.js) circular reference, and create base [global.d.ts](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/global.d.ts).
- **PR 2: Core Utils & Modules**: JSDoc annotations and casts in utilities ([date-utils.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/utils/date-utils.js), [logger.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/logger.js), [export-utils.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/utils/export-utils.js)) and reusable modules (`form-manager`, `ui-manager`, `validation-manager`, `data-manager`).
- **PR 3: Domain Controllers & Pages**: JSDoc annotations and casts in domain-specific controllers (appointment, patient, dentist, auth, dashboard).
- **PR 4: Verification**: Final typecheck run via `tsc --noEmit` and running Jest frontend tests.

## Phase 1: Foundation
- [x] 1.1 Install `typescript` as a devDependency in [package.json](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/package.json) and add `typecheck` script.
- [x] 1.2 Update [jsconfig.json](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/jsconfig.json) to include [global.d.ts](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/global.d.ts) and set checkJs target.
- [x] 1.3 Break circular type reference in [apiConfig.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/src/config/apiConfig.js) using JSDoc.
- [x] 1.4 Create [global.d.ts](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/global.d.ts) with custom properties on the `Window` interface.

## Phase 2: Core Utils & Modules
- [x] 2.1 Add types and cast `options` to `Intl.DateTimeFormatOptions` in [date-utils.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/utils/date-utils.js).
- [x] 2.2 Add JSDoc annotations to [logger.js](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/public/js/logger.js) and the files under `public/js/api/`.
- [x] 2.3 Add JSDoc and DOM casts to common helper modules: `form-manager.js` and `ui-manager.js`.
- [x] 2.4 Add JSDoc and DOM casts to validation and data modules: `validation-manager.js` and `data-manager.js`.
- [x] 2.5 Add JSDoc to common utilities: `search-controller.js` and `export-utils.js`.

## Phase 3: Domain Controllers & Pages
- [x] 3.1 Type auth modules and controllers (`login-controller.js`, `register-controller.js`, `http-interceptor.js`, `route-guard.js`, `auth-utils.js`).
- [x] 3.2 Add types and DOM casts to appointment controllers and module scripts under `public/js/appointment/`.
- [x] 3.3 Add types and DOM casts to dentist modules and specialty controllers under `public/js/dentist/`.
- [x] 3.4 Add JSDoc annotations to patient controllers under `public/js/patient/`.
- [x] 3.5 Type dashboard controllers and scripts (`dashboard-controller.js`, `dashboard-uplot.js`, `dashboard-api.js`).

## Phase 4: Verification
- [x] 4.1 Run typechecking via `npx tsc --noEmit` and resolve any remaining type warnings.
- [x] 4.2 Run Jest tests (`npm test`) to ensure zero regressions.
