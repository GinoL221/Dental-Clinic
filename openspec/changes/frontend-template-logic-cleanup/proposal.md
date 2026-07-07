# Proposal: Frontend Template Logic Cleanup

## Intent
Decouple logic, configuration, and global state from EJS templates to enforce presentational templates, eliminate redundant script loads, and prevent global window object pollution.

## Scope

### In Scope
- Create a unified scripts partial (`partials/scripts.ejs`) for loading Bootstrap JS.
- Replace manual script loads of Bootstrap JS across EJS templates with the new partial.
- Replace dynamic `<script>` blocks injecting `window.serverData`/`window.currentUser` in templates with semantic `data-*` attributes on the `<body>` element.
- Update `server-data-loader.js` to load state from body data attributes.
- Relocate inline template-specific JS scripts and role-based UI event logic to client-side JS controllers.

### Out of Scope
- Backend Java changes, Express routing changes, or API endpoint modifications.
- Complete React migration or styling design modifications.

## Capabilities

### New Capabilities
None

### Modified Capabilities
None

> This is a pure refactor. No spec-level capabilities are added or changed.

## Approach
To mitigate the **HIGH** review-size risk, the implementation is split into three phases:

| Phase | Description | Key Files |
|---|---|---|
| **Phase 1** | Unify Bootstrap script imports into a shared EJS partial. | `partials/scripts.ejs`, All `.ejs` files |
| **Phase 2** | Replace template `<script>` blocks with DOM data attributes. Update `server-data-loader.js`. | `server-data-loader.js`, `dashboard.ejs`, `appointment*.ejs` |
| **Phase 3** | Move inline event listeners & role-based UI logic to controllers. | `appointment-controller.js`, `appointmentEdit.ejs` |

## Affected Areas

| File | Change Type |
|---|---|
| `frontend/src/views/partials/scripts.ejs` | Create |
| `frontend/public/js/appointment/modules/server-data-loader.js` | Modify |
| `frontend/src/views/dashboard/dashboard.ejs` | Modify |
| `frontend/src/views/appointments/appointmentList.ejs` | Modify |
| `frontend/src/views/appointments/appointmentAdd.ejs` | Modify |
| `frontend/src/views/appointments/appointmentEdit.ejs` | Modify |
| All other EJS templates (e.g. `dentists/*.ejs`, `patients/*.ejs`, `users/*.ejs`) | Modify |

## Risks & Mitigation

| Risk | Likelihood | Mitigation |
|---|---|---|
| **High Review-Size** | High | Split implementation into 3 separate phases/PRs. |
| **Global State Loss** | Medium | Maintain temporary fallback/mapping inside `server-data-loader.js` for `window` globals. |
| **Broken Event Listeners** | Low | Verify all form event bindings in controllers during Phase 3. |

## Rollback Plan
Perform a standard `git revert` of the commits. Since this is a client-side pure refactor with no database or backend changes, reverting the codebase state is immediate and safe.

## Dependencies
None.

## Success Criteria
1. No EJS view contains a hardcoded Bootstrap bundle JS script tag (replaced by `partials/scripts.ejs`).
2. No EJS template injects `window.serverData` inline.
3. `server-data-loader.js` successfully initializes state from `<body>` data attributes.
4. All existing tests pass.
