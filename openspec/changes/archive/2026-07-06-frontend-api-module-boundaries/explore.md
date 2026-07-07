# Exploration Report: Frontend API Module Boundaries

## Purpose
This document explores consolidating raw network access across the frontend JS modules into dedicated API modules in `frontend/public/js/api/` and documents the investigation into the appointment enricher fallback bug.

## 1. Investigation of Raw Network Accesses

We scanned `frontend/public/js/` to identify all raw network accesses (specifically `fetch` calls) outside of the core API module layer (`frontend/public/js/api/`).

### Identified Call Sites

1. **`frontend/public/js/dashboard/dashboard-api.js`**
   - **Access Type**: Direct `fetch` requests inside custom helper `_fetchJson()`.
   - **Current Paths**: `${API_BASE_URL}/api/dashboard/snapshot`, `${API_BASE_URL}/api/appointments/${id}/status`.
   - **Assessment**: While this file acts as a module-specific API layer, it lives under `dashboard/` instead of `api/`.
   - **Recommendation**: Move `dashboard-api.js` to `frontend/public/js/api/dashboard-api.js` to consolidate all API boundaries. Update all references in views (`dashboard.ejs`), controller (`dashboard-controller.js`), and tests.

2. **`frontend/public/js/appointment/modules/appointment-enricher.js`**
   - **Access Type**: Direct `fetch` for individual patient fallback lookup.
   - **Current Path**: `${apiBaseUrl}/api/patients/${appointment.patient_id}`.
   - **Assessment**: This raw fetch bypasses `PatientAPI`.
   - **Recommendation**: Import `PatientAPI` and replace the direct fetch with `PatientAPI.getById(appointment.patient_id)`.

3. **`frontend/public/js/appointment/modules/data-manager.js`**
   - **Access Type**: Direct `fetch` in `loadPatients()` and `loadCurrentUserData()`.
   - **Current Path**: `${API_BASE_URL}/api/patients`.
   - **Assessment**: These methods should be delegating data retrieval to the API layer.
   - **Recommendation**: Import `PatientAPI` and use `PatientAPI.getAll()` instead of calling `fetch` inline.

4. **`frontend/public/js/appointment/modules/ui-manager.js`**
   - **Access Type**: Direct `fetch` inside `loadPatientDataForAppointments()`.
   - **Current Path**: `${API_BASE_URL}/api/patients/${patientId}`.
   - **Assessment**: A UI component should not execute network queries directly.
   - **Recommendation**: Import `PatientAPI` and use `PatientAPI.getById(patientId)`.

5. **`frontend/public/js/appointment/modules/server-data-loader.js`**
   - **Access Type**: Direct `fetch` to `/appointments/server-data`.
   - **Current Path**: `/appointments/server-data` (and `/appointments/server-data/${appointmentId}`).
   - **Assessment**: This route is hosted by the Express frontend server, returning session/user metadata rather than the Java REST API. It falls back to local globals. Since this acts as a frontend bootstrap loader, keeping the raw fetch might be acceptable, but wrapping it or leaving it as a frontend-specific endpoint is fine.

6. **`frontend/public/js/auth/modules/data-manager.js`**
   - **Access Type**: Direct `fetch` calls to `/users/login`, `/users/register`, `/users/logout` (frontend server endpoints) and `${this.apiBaseUrl}/auth/validate`, `${this.apiBaseUrl}/auth/refresh` (backend endpoints).
   - **Assessment**: Backend calls should delegate to `AuthAPI`. The frontend session endpoints are unique to the AuthDataManager's role of managing local cookies/session state.
   - **Recommendation**: Replace direct calls to `auth/validate` and `auth/refresh` with `AuthAPI.validateToken()` / `AuthAPI.getCurrentUser()`.

7. **`frontend/public/js/auth/register-controller.js`**
   - **Access Type**: Direct `fetch` to `/users/register`.
   - **Assessment**: This is a frontend routing form submission, not a backend API request. Already uses `AuthAPI` for validation checks.
   - **Recommendation**: Keep as-is, since it triggers the Node-side form processing.

---

## 2. The Appointment Enricher Fallback Bug

### History and Bug Description
Historically, `appointment-enricher.js` fell back to retrieving individual patients using:
```javascript
`${apiBaseUrl}/patients/${appointment.patient_id}`
```
Since the Spring Boot backend runs under a servlet context path of `/api`, the actual endpoint was `/api/patients/{id}`. This omission of `/api` caused individual patient loading fallback queries to fail with 404.

### Current State
A previous hotfix adjusted the inline fetch path to:
```javascript
`${apiBaseUrl}/api/patients/${appointment.patient_id}`
```
While this corrected the path omission, the implementation remains a direct `fetch` bypassing the `PatientAPI` boundary.

### Proposed Fix / Resolution
The canonical solution is to import `PatientAPI` into `appointment-enricher.js` and call `PatientAPI.getById(appointment.patient_id)`.
This eliminates duplicate fetch configuration, guarantees consistent credentials/header setup, and routes all patient requests through the unified patient API module.

---

## 3. Consolidation Action Plan

To enforce strict API module boundaries, we will carry out the following refactoring:

1. **Move Dashboard API**:
   - Relocate `frontend/public/js/dashboard/dashboard-api.js` to `frontend/public/js/api/dashboard-api.js`.
   - Update script/import references in `dashboard.ejs`, `dashboard-controller.js`, and `dashboard-api.test.js`.

2. **Refactor Appointment Enricher**:
   - Import `PatientAPI` from `../../api/patient-api.js` in `appointment-enricher.js`.
   - Replace the direct fetch block with `await PatientAPI.getById(appointment.patient_id)`.

3. **Refactor Appointment Data Manager**:
   - Import `PatientAPI` from `../../api/patient-api.js` in `data-manager.js`.
   - Replace direct fetch calls to `/api/patients` in `loadPatients()` and `loadCurrentUserData()` with `PatientAPI.getAll()`.

4. **Refactor Appointment UI Manager**:
   - Import `PatientAPI` in `ui-manager.js`.
   - Replace the fetch call in `loadPatientDataForAppointments()` with `PatientAPI.getById(patientId)`.

5. **Refactor Auth Data Manager**:
   - Delegate validation and refresh calls to `AuthAPI` instead of making direct fetch requests to the backend base URL.
