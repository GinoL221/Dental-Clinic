# Conexión Frontend-Backend

El frontend (SvelteKit + Vite, puerto `5173`) nunca llama al backend desde el navegador: todas las llamadas ocurren **server-side** (`+page.server.js`, `hooks.server.js`) vía `apiFetch` (`frontend/src/lib/api.js`) hacia `BACKEND_URL` (por defecto `http://localhost:8080`). No existe proxy de Vite (`vite.config.js` no tiene bloque `server.proxy`) ni CORS real que resolver: el navegador solo habla con el servidor SvelteKit.

## Quick path

1. Levantar el backend (Spring Boot, puerto `8080`).
2. Levantar el frontend (SvelteKit, puerto `5173`).
3. Loguearse con el usuario admin de seed y verificar que ambos servicios responden.

```bash
# 1. Backend — http://localhost:8080 (API bajo /api por server.servlet.context-path)
cd backend
./mvnw spring-boot:run          # Linux/Mac
./mvnw.cmd spring-boot:run       # Windows

# 2. Frontend — http://localhost:5173
cd frontend
npm install
npm run dev
```

4. Abrir `http://localhost:5173/login` e iniciar sesión con el usuario admin que `DataInitializer` siembra automáticamente en el perfil `dev` (idempotente, no se duplica en reinicios):

   ```
   email: admin@dentalclinic.com
   password: admin123
   ```

## Cómo funciona la sesión (cookies, no localStorage)

| Paso | Qué pasa | Dónde |
|------|----------|-------|
| Login | El form de `/login` hace `POST` server-side a `/api/auth/login`; la respuesta trae `token` + `role` | `frontend/src/routes/login/+page.server.js` |
| Set-cookie | El servidor SvelteKit setea `authToken`, `userRole`, `userEmail` como cookies **httpOnly**, `sameSite=lax`, 24 h de vida | mismo archivo |
| Cada request | `hooks.server.js` lee la cookie `authToken` y valida contra `GET /api/auth/validate`; guarda el resultado en `event.locals.user` | `frontend/src/hooks.server.js` |
| Rutas protegidas | `/dashboard`, `/patients`, `/dentists`, `/appointments` redirigen a `/login` si no hay cookie válida | `frontend/src/hooks.server.js` |
| Logout | `POST /users/logout` borra las 3 cookies y redirige a `/` — **no** llama al backend (no existe endpoint `/auth/logout`) | `frontend/src/routes/users/logout/+page.server.js` |

No hay JWT en `localStorage` ni header `Authorization` manejado desde el navegador: el token vive en la cookie httpOnly y solo el servidor SvelteKit lo reenvía al backend.

## Endpoints principales (todos bajo `/api`, por `server.servlet.context-path=/api`)

### Autenticación

| Método | Endpoint | Notas |
|--------|----------|-------|
| POST | `/api/auth/register` | Alta de usuario (`ADMIN`/`DENTIST`/`PATIENT`) |
| POST | `/api/auth/login` | Devuelve `{ token, role }` |
| GET | `/api/auth/check-email?email=...` | Verifica si el email ya existe |
| GET | `/api/auth/validate` | Usado por `hooks.server.js` para validar la cookie en cada request |

### Pacientes / Dentistas / Citas / Especialidades

| Método | Endpoint |
|--------|----------|
| GET/POST/PUT/DELETE | `/api/patients`, `/api/patients/{id}` |
| GET/POST/PUT/DELETE | `/api/dentists`, `/api/dentists/{id}` |
| GET/POST/PUT/DELETE | `/api/appointments`, `/api/appointments/{id}` |
| GET | `/api/appointments/search?patient=Juan&status=SCHEDULED` |
| GET/POST/PUT/DELETE | `/api/specialties`, `/api/specialties/{id}` |

Todas estas rutas requieren autenticación (`SecurityConfiguration`: `anyRequest().authenticated()`); solo `/api/auth/**` y la docs de Swagger son públicas.

## Estructura de datos — request vs response

Los DTOs de request y response **no son iguales**: los de creación/edición usan `camelCase` y los de respuesta de citas usan `snake_case`.

**Paciente — crear (`POST /api/patients`, request):**

```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@email.com",
  "cardIdentity": 12345678,
  "admissionDate": "2025-01-15",
  "address": { "street": "Av. Principal", "number": 123, "location": "Ciudad", "province": "Provincia" }
}
```

**Paciente — respuesta (`PatientResponseDTO`):** igual que el request más `id`; no incluye `role` ni `password`.

**Cita — crear (`POST /api/appointments`, request, `AppointmentRequestDTO`):**

```json
{ "dentistId": 2, "patientId": 1, "date": "2025-09-15", "time": "14:00", "description": "Limpieza dental" }
```

**Cita — respuesta (`AppointmentDTO`):**

```json
{
  "id": 1,
  "dentist_id": 2,
  "patient_id": 1,
  "date": "2025-09-15",
  "time": "14:00",
  "description": "Limpieza dental",
  "status": "SCHEDULED"
}
```

## Base de datos (perfil `dev`)

- H2 en memoria: `jdbc:h2:mem:dental1`, usuario `sa`, password `sa`.
- Consola H2: `http://localhost:8080/api/h2-console` (hereda `/api` del `context-path`; requiere estar autenticado según `SecurityConfiguration`, no es de acceso libre).
- `DataInitializer` siembra especialidades, 1 admin, 4 dentistas y 10 pacientes con citas en distintos estados — solo si `admin@dentalclinic.com` no existe todavía.

## Solución de problemas

| Síntoma | Causa probable | Acción |
|---------|-----------------|--------|
| `401 Unauthorized` en rutas protegidas | Cookie `authToken` vencida (24 h) o ausente | Volver a hacer login en `/login` |
| `404` en `/patients/{id}` o `/dentists/{id}` | El `id` no existe | Listar vía `GET /api/patients` o `/api/dentists` para ver IDs válidos |
| El frontend no arranca en `5173` | Puerto ocupado o `npm install` no corrido | `npm install` en `frontend/`, verificar que nada más use `5173` |
| El backend no responde en `8080` | Backend no levantado o `BACKEND_URL` mal seteado | Confirmar `./mvnw spring-boot:run` corriendo y revisar `frontend/.env` |

## Próximo paso

Ver `README.md` para comandos de test (`npm run test`, `npm run test:e2e`) y type-check (`npm run check`, `npm run typecheck`), y `SPECIALTY_VERIFICATION.md` para el checklist manual de la feature de especialidades.
