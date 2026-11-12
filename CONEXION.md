# Conexión Frontend-Backend

El frontend (SvelteKit + Vite, puerto `5173`) nunca llama al backend desde el navegador: todas las llamadas ocurren **server-side** (`+page.server.js`, `hooks.server.js`) vía `apiFetch` (`frontend/src/lib/api.js`) hacia `BACKEND_URL` (por defecto `http://localhost:8080`). No existe proxy de Vite (`vite.config.js` no tiene bloque `server.proxy`) ni CORS real que resolver: el navegador solo habla con el servidor SvelteKit.

## Quick path

1. Levantar el backend (Spring Boot, puerto `8080`) con el perfil local `dev`.
2. Levantar el frontend (SvelteKit, puerto `5173`).
3. Iniciar sesión con el usuario admin local del seed y verificar que ambos servicios responden.

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

4. Abrir `http://localhost:5173/login` e iniciar sesión con el usuario admin que `DataInitializer` siembra automáticamente en el perfil local `dev` (no se ejecuta con `prod`; es idempotente y no se duplica en reinicios):

   ```
   email: admin@dentalclinic.com
   password: admin123
   ```

## Cómo funciona la sesión (cookies, no localStorage)

| Paso             | Qué pasa                                                                                                                                                                                                                                                                                                           | Dónde                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| Login            | El form de `/login` hace `POST` server-side a `/api/auth/login`; la respuesta trae `token` + `role` + `mustChangePassword`                                                                                                                                                                                         | `frontend/src/routes/login/+page.server.js`        |
| Set-cookie       | El servidor SvelteKit setea `authToken`, `userRole`, `userEmail` como cookies **httpOnly**, `sameSite=lax`, `maxAge: 36000` (10 h, igual al vencimiento del JWT)                                                                                                                                                   | mismo archivo                                      |
| Cada request     | `hooks.server.js` lee la cookie `authToken` y pide el perfil autenticado vía `GET /api/auth/me`; proyecta las 6 propiedades públicas (`id`, `firstName`, `lastName`, `email`, `role`, `mustChangePassword`) en `event.locals.user` y guarda el JWT solo en `event.locals.authToken` (nunca serializado a PageData) | `frontend/src/hooks.server.js`                     |
| Rutas protegidas | `/dashboard`, `/patients`, `/dentists`, `/appointments` y `/users/change-password` redirigen a `/login` si no hay cookie válida                                                                                                                                                                                    | `frontend/src/hooks.server.js`                     |
| Cambio forzado   | Si `event.locals.user.mustChangePassword === true`, cualquier ruta que no sea `/users/change-password` ni `/users/logout` redirige con `303` a `/users/change-password`                                                                                                                                            | `frontend/src/hooks.server.js`                     |
| Logout           | `POST /users/logout` borra las 3 cookies y redirige a `/` — **no** llama al backend (no existe endpoint `/auth/logout`)                                                                                                                                                                                            | `frontend/src/routes/users/logout/+page.server.js` |

No hay JWT en `localStorage` ni header `Authorization` manejado desde el navegador: el token vive en la cookie httpOnly y solo el servidor SvelteKit lo reenvía al backend.

## Endpoints principales (todos bajo `/api`, por `server.servlet.context-path=/api`)

### Autenticación

| Método | Endpoint                          | Notas                                                                                                                                                  |
| ------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| POST   | `/api/auth/register`              | Alta pública de `PATIENT`. Un `role` distinto se rechaza. `ADMIN`/`DENTIST` los crea un ADMIN (o el seed de `dev`)                                     |
| POST   | `/api/auth/login`                 | Devuelve `{ token, role, id, firstName, lastName, email, mustChangePassword }`                                                                         |
| GET    | `/api/auth/check-email?email=...` | Público; verifica si el email ya existe                                                                                                                |
| GET    | `/api/auth/me`                    | Autenticado; perfil de sesión (`id`, `firstName`, `lastName`, `email`, `role`, `mustChangePassword`, sin JWT ni password). Usado por `hooks.server.js` |
| POST   | `/api/auth/change-password`       | Autenticado; valida contraseña actual, actualiza hash BCrypt y limpia `mustChangePassword = false`                                                     |

### Pacientes / Dentistas / Citas / Especialidades

| Método              | Endpoint                                                 |
| ------------------- | -------------------------------------------------------- |
| GET/POST/PUT/DELETE | `/api/patients`, `/api/patients/{id}`                    |
| GET/POST/PUT/DELETE | `/api/dentists`, `/api/dentists/{id}`                    |
| GET/POST/PUT/DELETE | `/api/appointments`, `/api/appointments/{id}`            |
| GET                 | `/api/appointments/search?patient=Juan&status=SCHEDULED` |
| GET/POST/PUT/DELETE | `/api/specialties`, `/api/specialties/{id}`              |

Todas estas rutas requieren autenticación (`SecurityConfiguration`: `anyRequest().authenticated()`). En auth, son públicos `POST /api/auth/login`, `POST /api/auth/register` y `GET /api/auth/check-email`. `GET /api/auth/me` exige sesión. Swagger queda público en dev (`/api/swagger-ui/index.html`, deshabilitado en `prod`).

Todas las respuestas de error comparten el contrato `ErrorResponse` (`error`, `message`, `path`, `status`, `timestamp`, `fieldErrors` solo en validación): tabla de códigos y excepciones conocidas en [`docs/api-errors.md`](docs/api-errors.md). El frontend consume solo `message` vía `apiFetch`.

## Estructura de datos — request vs response

Todos los DTOs de request y response utilizan `camelCase` de forma uniforme.

**Paciente — crear (`POST /api/patients`, request):**

```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@email.com",
  "cardIdentity": 12345678,
  "admissionDate": "2025-01-15",
  "address": {
    "street": "Av. Principal",
    "number": 123,
    "location": "Ciudad",
    "province": "Provincia"
  }
}
```

**Paciente — respuesta (`PatientResponseDTO`):** igual que el request más `id`; no incluye `role` ni `password` (cuando un `ADMIN` crea una cuenta con contraseña temporal autogenerada, el `POST` incluye por única vez `mustChangePassword` y `temporaryPassword`).

**Cita — crear (`POST /api/appointments`, request, `AppointmentRequestDTO`):**

```json
{
  "dentistId": 2,
  "patientId": 1,
  "date": "2025-09-15",
  "time": "14:00",
  "description": "Limpieza dental"
}
```

**Cita — respuesta (`AppointmentDTO`):**

```json
{
  "id": 1,
  "dentistId": 2,
  "patientId": 1,
  "date": "2025-09-15",
  "time": "14:00",
  "description": "Limpieza dental",
  "status": "SCHEDULED"
}
```

## Base de datos (perfil `dev`)

- H2 en memoria: `jdbc:h2:mem:dental1`, usuario `sa`, password `sa`.
- Consola H2: `http://localhost:8080/api/h2-console` (hereda `/api` del `context-path`; requiere estar autenticado según `SecurityConfiguration`, no es de acceso libre).
- `DataInitializer` siembra especialidades, 1 admin, 4 dentistas y 10 pacientes con citas en distintos estados en el perfil `dev` — solo si `admin@dentalclinic.com` no existe todavía; no está disponible en `prod`.
- Perfil `prod`: MySQL (Railway), Flyway habilitado (`V1` a `V3`), `ddl-auto=validate`, Swagger deshabilitado. El seed de `DataInitializer` no corre ahí.
- Un despliegue de producción debe seleccionar explícitamente `SPRING_PROFILES_ACTIVE=prod`; la provisión del ADMIN de producción queda fuera de este quick path.

## Solución de problemas

| Síntoma                                      | Causa probable                                   | Acción                                                                 |
| -------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| `401 Unauthorized` en rutas protegidas       | Cookie `authToken` vencida (10 h) o ausente      | Volver a hacer login en `/login`                                       |
| `404` en `/patients/{id}` o `/dentists/{id}` | El `id` no existe                                | Listar vía `GET /api/patients` o `/api/dentists` para ver IDs válidos  |
| El frontend no arranca en `5173`             | Puerto ocupado o `npm install` no corrido        | `npm install` en `frontend/`, verificar que nada más use `5173`        |
| El backend no responde en `8080`             | Backend no levantado o `BACKEND_URL` mal seteado | Confirmar `./mvnw spring-boot:run` corriendo y revisar `frontend/.env` |

## Próximo paso

Ver `README.md` para comandos de test (`npm run test`, `npm run test:e2e`) y type-check (`npm run check`, `npm run typecheck`), y `SPECIALTY_VERIFICATION.md` para el checklist manual de la feature de especialidades.
