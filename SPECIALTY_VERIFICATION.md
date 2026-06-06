# Specialty Feature — Manual Verification Checklist

**Change**: cleanup-dental-clinic / Phase 3: Specialty feature
**Date**: 2026-06-06
**Tester**: _______________
**Result**: ⬜ PASS / ⬜ FAIL

---

## Prerequisites

```bash
# 1. Start backend (port 8080)
cd backend && mvn spring-boot:run

# 2. Start frontend (port 3001, proxies to 8080)
cd frontend && npm run dev

# 3. Obtain a JWT token (replace with real credentials)
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dentalclinic.com","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")
echo "Token: $TOKEN"
```

---

## Section A: Backend API — curl Verification

### A.1 List all specialties (`GET /api/specialties`)

| Step | Command | Expected Result | Actual |
|------|---------|-----------------|--------|
| A.1.1 | `curl -s http://localhost:8080/api/specialties -H "Authorization: Bearer $TOKEN"` | HTTP 200, JSON array of specialties | ⬜ |
| A.1.2 | `curl -s http://localhost:8080/api/specialties` | HTTP 401 or 403 (no auth) | ⬜ |

### A.2 Get one specialty (`GET /api/specialties/{id}`)

| Step | Command | Expected Result | Actual |
|------|---------|-----------------|--------|
| A.2.1 | `curl -s http://localhost:8080/api/specialties/1 -H "Authorization: Bearer $TOKEN"` | HTTP 200, JSON with id, name, description | ⬜ |
| A.2.2 | `curl -s http://localhost:8080/api/specialties/9999 -H "Authorization: Bearer $TOKEN"` | HTTP 404 | ⬜ |

### A.3 Create specialty (`POST /api/specialties`)

| Step | Command | Expected Result | Actual |
|------|---------|-----------------|--------|
| A.3.1 | `curl -s -X POST http://localhost:8080/api/specialties -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"Implantología","description":"Implantes dentales"}'` | HTTP 201, JSON with new specialty | ⬜ |
| A.3.2 | Repeat A.3.1 (same name) | HTTP 409 — duplicate name | ⬜ |

### A.4 Update specialty (`PUT /api/specialties/{id}`)

| Step | Command | Expected Result | Actual |
|------|---------|-----------------|--------|
| A.4.1 | `curl -s -X PUT http://localhost:8080/api/specialties/1 -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"Odontología General","description":"Actualizada"}'` | HTTP 200 | ⬜ |
| A.4.2 | `curl -s -X PUT http://localhost:8080/api/specialties/9999 -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"Test"}'` | HTTP 404 | ⬜ |

### A.5 Delete specialty — succeeds when unused (`DELETE /api/specialties/{id}`)

| Step | Command | Expected Result | Actual |
|------|---------|-----------------|--------|
| A.5.1 | First create a test specialty, then delete it: `curl -s -X DELETE http://localhost:8080/api/specialties/{id} -H "Authorization: Bearer $TOKEN"` | HTTP 204 | ⬜ |

### A.6 Delete specialty — fails when in use (409 conflict)

| Step | Command | Expected Result | Actual |
|------|---------|-----------------|--------|
| A.6.1 | `curl -s -X DELETE http://localhost:8080/api/specialties/1 -H "Authorization: Bearer $TOKEN"` (if specialty 1 is assigned to a dentist) | HTTP 409 | ⬜ |

### A.7 Assign specialty to dentist (`POST /dentists/{dId}/specialties/{sId}`)

| Step | Command | Expected Result | Actual |
|------|---------|-----------------|--------|
| A.7.1 | `curl -s -X POST http://localhost:8080/api/dentists/1/specialties/2 -H "Authorization: Bearer $TOKEN"` | HTTP 200 | ⬜ |
| A.7.2 | Repeat A.7.1 (duplicate assignment) | HTTP 409 | ⬜ |
| A.7.3 | `curl -s -X POST http://localhost:8080/api/dentists/9999/specialties/1 -H "Authorization: Bearer $TOKEN"` | HTTP 404 (dentist not found) | ⬜ |
| A.7.4 | `curl -s -X POST http://localhost:8080/api/dentists/1/specialties/9999 -H "Authorization: Bearer $TOKEN"` | HTTP 404 (specialty not found) | ⬜ |

### A.8 Unassign specialty from dentist (`DELETE /dentists/{dId}/specialties/{sId}`)

| Step | Command | Expected Result | Actual |
|------|---------|-----------------|--------|
| A.8.1 | `curl -s -X DELETE http://localhost:8080/api/dentists/1/specialties/2 -H "Authorization: Bearer $TOKEN"` | HTTP 204 (idempotent — always succeeds) | ⬜ |
| A.8.2 | Repeat A.8.1 (already unassigned) | HTTP 204 (no-op) | ⬜ |

### A.9 List dentist's specialties (`GET /dentists/{id}/specialties`)

| Step | Command | Expected Result | Actual |
|------|---------|-----------------|--------|
| A.9.1 | `curl -s http://localhost:8080/api/dentists/1/specialties -H "Authorization: Bearer $TOKEN"` | HTTP 200, JSON array of that dentist's specialties | ⬜ |

---

## Section B: Frontend — Dentist Edit Page (UI Test)

**URL**: `http://localhost:3001/dentists/edit/1` (or any existing dentist ID)

**Precondition**: Log in as ADMIN.

### B.1 Specialty section visibility

| Step | Action | Expected Result | Actual |
|------|--------|-----------------|--------|
| B.1.1 | Navigate to `/dentists/edit/{id}` as ADMIN | "Especialidades" section visible below the form | ⬜ |
| B.1.2 | Log in as DENTIST (non-admin) and navigate to same URL | No specialty section visible | ⬜ |

### B.2 Current specialties display

| Step | Action | Expected Result | Actual |
|------|--------|-----------------|--------|
| B.2.1 | View assigned specialties | Each assigned specialty shows as a badge with ✕ button | ⬜ |
| B.2.2 | No specialties assigned | Shows "Sin especialidades asignadas" in muted text | ⬜ |

### B.3 Assign a specialty

| Step | Action | Expected Result | Actual |
|------|--------|-----------------|--------|
| B.3.1 | Select a specialty from the dropdown, click "Asignar" | Success alert "Especialidad asignada", badge appears | ⬜ |
| B.3.2 | Try to assign a specialty already assigned (should not appear in dropdown) | Already-assigned specialty not in the dropdown | ⬜ |
| B.3.3 | Select nothing and click "Asignar" | Warning: "Selecciona una especialidad" | ⬜ |

### B.4 Remove a specialty

| Step | Action | Expected Result | Actual |
|------|--------|-----------------|--------|
| B.4.1 | Click ✕ on a specialty badge | Success alert "Especialidad desasignada", badge removed, specialty reappears in dropdown | ⬜ |

### B.5 Error handling

| Step | Action | Expected Result | Actual |
|------|--------|-----------------|--------|
| B.5.1 | Try to duplicate-assign via direct API call (curl), then verify UI still shows correct state | No crash, existing specialties still visible | ⬜ |
| B.5.2 | Stop backend, try to assign/remove in UI | Error message appears, UI stays functional | ⬜ |

---

## Section C: Regression — Other pages unaffected

| Step | Page | Expected Result | Actual |
|------|------|-----------------|--------|
| C.1 | `/dentists` — list page | Loads correctly, actions work | ⬜ |
| C.2 | `/dentists/add` — create page | Form works, no specialty section shown | ⬜ |
| C.3 | `/patients` — list page | Loads correctly | ⬜ |
| C.4 | `/appointments` — list page | Loads correctly | ⬜ |
| C.5 | `/dashboard` — home | Loads correctly | ⬜ |

---

## Summary

| Section | Tests | Passed | Failed |
|---------|-------|--------|--------|
| A — Backend curl | 15 | ___ | ___ |
| B — Frontend UI | 8 | ___ | ___ |
| C — Regression | 5 | ___ | ___ |
| **Total** | **28** | ___ | ___ |

**Tester notes**:
```
[Add any observations here]
```

**Final verdict**: ⬜ ALL PASS / ⬜ ISSUES FOUND

---

## Issues Found

| # | Test | Description | Severity | Resolution |
|---|------|-------------|----------|------------|
| 1 | | | | |
