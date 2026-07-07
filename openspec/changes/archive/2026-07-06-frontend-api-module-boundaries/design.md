# Design: Frontend API Module Boundaries

## Technical Approach

Eliminate all raw `fetch` calls targeting the Java backend from business/UI modules. Every HTTP request to the backend must flow through the centralized `frontend/public/js/api/` layer, which already provides `API_BASE_URL`, `getAuthHeaders()`, `credentials: 'include'`, and unified error handling via `handleApiError()`.

The refactor has two axes:
1. **Relocate** — Move `dashboard-api.js` into `api/`, update all consumers.
2. **Delegate** — Replace inline `fetch` in 4 consumer modules with calls to `PatientAPI` / `AuthAPI`.

```
  Before                              After
  ┌──────────────────┐               ┌──────────────────┐
  │ enricher.js      │──fetch──►API  │ enricher.js      │──►PatientAPI──►API
  │ data-manager.js  │──fetch──►API  │ data-manager.js  │──►PatientAPI──►API
  │ ui-manager.js    │──fetch──►API  │ ui-manager.js    │──►PatientAPI──►API
  │ auth/data-mgr.js │──fetch──►API  │ auth/data-mgr.js │──►AuthAPI────►API
  │ dashboard-api.js │  (in dashboard/) │ dashboard-api.js │  (in api/)
  └──────────────────┘               └──────────────────┘
```

## Architecture Decisions

### AD-1: Static ESM imports, no runtime globals

| Aspect | Detail |
|--------|--------|
| **Choice** | `import PatientAPI from '../../api/patient-api.js'` |
| **Alternatives** | Rely on `window.PatientAPI` global set by `patient-api.js` |
| **Rationale** | All existing appointment modules already use ESM imports for `DentistAPI`, `AppointmentAPI`, and `config.js`. Globals would bypass module graph and break test isolation. |

### AD-2: Use PatientAPI.getAll() return directly

| Aspect | Detail |
|--------|--------|
| **Choice** | Call `PatientAPI.getAll()` which returns parsed JSON (same shape as the inline fetch) |
| **Alternatives** | Add new thin-wrapper methods |
| **Rationale** | `PatientAPI.getAll()` already does `fetch(…/api/patients)` → `response.json()`, identical to what `data-manager.loadPatients()` does inline. Zero behavioral change. |

### AD-3: AuthAPI delegates for validate/refresh

| Aspect | Detail |
|--------|--------|
| **Choice** | `AuthAPI.validateToken()` and `AuthAPI.getCurrentUser()` (existing methods) |
| **Alternatives** | Import `getAuthApiUrl` from config and build new fetch inline |
| **Rationale** | `AuthAPI.validateToken()` already calls `getAuthApiUrl('VALIDATE')` → `/api/auth/validate`. The current auth `data-manager.js` uses `${this.apiBaseUrl}/auth/validate` — **missing the `/api` prefix** — so delegation also fixes this latent bug. |

### AD-4: Dashboard API import path update strategy

| Aspect | Detail |
|--------|--------|
| **Choice** | Move file, update import in `dashboard-controller.js` from `'./dashboard-api.js'` to `'../api/dashboard-api.js'`, update `dashboard.ejs` `<script src>`, update test path |
| **Alternatives** | Leave a re-export shim at the old path |
| **Rationale** | Only 3 consumers reference the file. A clean move is simpler than maintaining a shim. The file's internal import of `'../api/config.js'` changes to `'./config.js'` — a simplification. |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/public/js/dashboard/dashboard-api.js` | **Delete** | Removed after relocation |
| `frontend/public/js/api/dashboard-api.js` | **Create** | Relocated; internal import path simplified from `'../api/config.js'` → `'./config.js'` |
| `frontend/public/js/dashboard/dashboard-controller.js` | **Modify** | Import path: `'./dashboard-api.js'` → `'../api/dashboard-api.js'` (line 2) |
| `frontend/src/views/dashboard/dashboard.ejs` | **Modify** | Script src: `/js/dashboard/dashboard-api.js` → `/js/api/dashboard-api.js` (line 179) |
| `frontend/test/dashboard-api.test.js` | **Modify** | `path.join(…, 'dashboard', 'dashboard-api.js')` → `path.join(…, 'api', 'dashboard-api.js')` (line 10) |
| `frontend/public/js/appointment/modules/appointment-enricher.js` | **Modify** | Remove inline fetch (lines 36–55); import `PatientAPI`; call `PatientAPI.getById(appointment.patient_id)` |
| `frontend/public/js/appointment/modules/data-manager.js` | **Modify** | Import `PatientAPI`; replace fetch in `loadPatients()` (lines 50–62) and `loadCurrentUserData()` (lines 114–126) with `PatientAPI.getAll()` |
| `frontend/public/js/appointment/modules/ui-manager.js` | **Modify** | Import `PatientAPI`; replace fetch in `loadPatientDataForAppointments()` (lines 258–276) with `PatientAPI.getById(patientId)` |
| `frontend/public/js/auth/modules/data-manager.js` | **Modify** | Import `AuthAPI`; replace `validateSession()` (line 376) with `AuthAPI.validateToken()` and `refreshToken()` (line 397) with `AuthAPI.getCurrentUser()` or equivalent |

## Interfaces / Contracts

No new interfaces. Existing delegates already satisfy all call shapes:

```javascript
// PatientAPI (patient-api.js) — already exported
PatientAPI.getAll()           // → Promise<any[]>   — replaces fetch('/api/patients')
PatientAPI.getById(id)        // → Promise<any>     — replaces fetch('/api/patients/{id}')

// AuthAPI (auth-api.js) — already exported
AuthAPI.validateToken()       // → Promise<boolean> — replaces fetch('/auth/validate')
AuthAPI.getCurrentUser()      // → Promise<any>     — replaces fetch('/auth/validate') for data
```

## Testing Strategy

| Scope | Test | Action |
|-------|------|--------|
| Dashboard path | `dashboard-api.test.js` | Update file path; tests verify endpoint string & normalization — no logic change |
| Enricher delegation | Existing enricher integration tests | Verify patient data still populates after delegation |
| Data-manager patients | Existing appointment flow tests | Verify `loadPatients()` returns same shape via `PatientAPI.getAll()` |
| Auth session | Manual / existing auth flow | Verify `validateSession()` now hits `/api/auth/validate` (bug fix) |
| Grep gate | CI script or manual | `grep -rn 'fetch(' frontend/public/js/ --include='*.js' | grep -v '/api/'` must return only frontend-server endpoints |

## Migration / Rollout

- **Single atomic commit** — all file moves and edits land together.
- **No database, config, or API contract changes** — purely frontend refactor.
- **Rollback**: `git revert <sha>` restores prior state with zero side effects.

## Open Questions

1. **`refreshToken()` delegate**: `AuthAPI` has `validateToken()` but no explicit `refreshToken()` method. Should we add `AuthAPI.refreshToken()` wrapping `getAuthApiUrl('REFRESH')`, or inline the config import just for this one call? **Recommendation**: add `AuthAPI.refreshToken()` for consistency, since `REFRESH` is already in `API_ENDPOINTS.AUTH`.
2. **`loadCurrentUserData()` optimization**: after delegation to `PatientAPI.getAll()`, the data-manager still does a client-side `find()` by email. A future `PatientAPI.getByEmail()` would be more efficient, but is out of scope for this refactor.
