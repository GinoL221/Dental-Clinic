# API - Documentación consolidada (frontend)

Este documento consolida los endpoints usados por el frontend, los helpers y ejemplos de payloads. Está extraído de los wrappers en `frontend/public/js/api/*.js`.

Base URL
- API_BASE_URL: http://localhost:8080

Principales recursos y endpoints

1) Autenticación (AUTH)
- LOGIN: POST /auth/login
  - Body: { email, password }
  - Response: { token, role, ... }
- REGISTER: POST /auth/register
  - Body (usuario): { firstName, lastName, email, password, role }
  - Response: { token, role, ... }
- LOGOUT: POST /auth/logout (wrapper client solo limpia token)
- VALIDATE: GET /auth/validate (obtener usuario actual / validar token)
- CHECK_EMAIL: GET /auth/check-email?email=... → boolean

2) Dentistas (DENTIST)
- FIND_ALL: GET /dentists → [Dentist]
- FIND_BY_ID: GET /dentists/{id} → Dentist
- SAVE: POST /dentists
  - Body: { firstName, lastName, registrationNumber, ... }
- UPDATE: PUT /dentists
  - Body: full dentist object (se valida id en update)
- DELETE: DELETE /dentists/{id}
- FIND_BY_REGISTRATION: GET /dentists/registration/{registrationNumber}

Notas: los wrappers validan campos (nombre >=2, apellido >=2, registrationNumber >=3 y solo alfanumérico). El endpoint de update usa PUT a /dentists con el objeto completo.

3) Pacientes (PATIENT)
- FIND_ALL: GET /patients → [Patient]
- FIND_BY_ID: GET /patients/{id} → Patient
- SAVE: POST /patients
  - Body: { firstName, lastName, email, password, admissionDate, cardIdentity, address? }
- UPDATE: PUT /patients
- DELETE: DELETE /patients/{id}
- CHECK_CARD_IDENTITY: GET /patients/check-card-identity?cardIdentity=... → boolean

4) Citas (APPOINTMENT)
- FIND_ALL / SEARCH: GET /appointments/search?{filters}
  - Filtros soportados por el wrapper: patient, dentist, date (fromDate/toDate), status, page, size
- FIND_BY_ID: GET /appointments/{id}
- SAVE: POST /appointments
  - Body: { date, dentist_id, patient_id, description?, status? }
  - Validaciones cliente: date requerida, dentist_id y patient_id requeridos; no permitir fecha en pasado (salvo update que no cambie la fecha)
- UPDATE: PUT /appointments
  - Body: objeto cita completo (id requerido en update)
- DELETE: DELETE /appointments/{id}
- GET_BY_DENTIST: GET /appointments/dentist/{dentistId}
- GET_BY_PATIENT: GET /appointments/patient/{patientId}
- GET_BY_DATE: GET /appointments/date/{date}

5) Dashboard / Estadísticas
- UPCOMING: GET /dashboard/upcoming → próximas citas (el frontend usa endpoints bajo /appointments y filtra/transforma)
- APPOINTMENTS_BY_MONTH: GET /dashboard/appointments-by-month → serie mensual (el wrapper compone desde /appointments)
- STATS: GET /dashboard/stats → agregado de métricas (implementación en backend depende del controlador)

Headers y auth
- Uso de Authorization: Bearer <token> (el wrapper `getAuthHeaders()` añade Authorization si hay token en localStorage)
- Content-Type: application/json para POST/PUT; algunos wrappers incluyen credentials: 'include' cuando necesitan cookies

Errores y manejo
- Los wrappers intentan mapear status comunes:
  - 400 → datos inválidos (mostrar mensaje del body si existe)
  - 401 → no autorizado (clear tokens, redirect al login)
  - 403 → acceso denegado
  - 404 → recurso no encontrado
  - 409 → conflicto (ej.: cita o dentista duplicado)

Ejemplos rápidos

- Crear cita (cliente)

POST /appointments
Content-Type: application/json

{
  "date": "2025-10-23",
  "time": "10:30",
  "dentist_id": 12,
  "patient_id": 34,
  "description": "Limpieza"
}

- Crear dentista

POST /dentists
{
  "firstName": "Ana",
  "lastName": "Perez",
  "registrationNumber": "D1234"
}

Dónde mirar en el código
- Cliente: `frontend/public/js/api/*` (wrappers), `frontend/public/js/api/config.js` (endpoints y `API_BASE_URL`)
- Server-side helpers (Node controllers): `frontend/src/config/apiConfig.js` y `frontend/src/server-controller/*` para rutas del servidor
- Backend Java: `backend/src/main/java/.../controller` expone las rutas reales (ver `@RequestMapping` y métodos)

Notas finales
- Mantener `API_BASE_URL` sincronizada entre cliente y despliegue.
- Para añadir un nuevo recurso: crear wrapper en `public/js/api/`, exponer ruta en backend y documentarla aquí.
