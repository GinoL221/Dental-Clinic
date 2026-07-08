# Documentación de rutas y acceso a la API (frontend)

No hay controladores Express ni EJS: cada ruta SvelteKit resuelve su propia lógica en `+page.server.js` (`load` para GET, `actions` para POST/PUT/PATCH/DELETE), la sesión se resuelve una sola vez en `src/hooks.server.js`, y el único cliente HTTP hacia el backend es `apiFetch` (`src/lib/api.js`, ver `API-CONFIG.md`).

## Quick path

1. Ver qué loader/action resuelve cada ruta y qué endpoint del backend llama.
2. Ver dónde se valida la sesión antes de llegar a una ruta protegida.
3. Ver el manejo de errores real de `apiFetch`.

## Rutas → loaders/actions → endpoints backend

| Ruta SvelteKit | `load` (GET) | `actions` | Endpoint(s) backend |
|-----------------|--------------|-----------|----------------------|
| `/login` | Redirige a `/` si ya hay sesión (`locals.user`) | `default`: login | `POST /api/auth/login` |
| `/users/register` | — | `default`: alta de usuario | `POST /api/auth/register` |
| `/users/logout` | Limpia cookies y redirige a `/` | `default`: limpia cookies y redirige a `/` | Ninguno — no existe `/api/auth/logout` |
| `/dashboard` | Snapshot del panel (requiere `role === 'ADMIN'`) | `updateStatus`: cambia estado de una cita | `GET /api/dashboard/snapshot`, `PATCH /api/appointments/{id}/status` |
| `/patients` | Lista de pacientes | `delete`: elimina paciente | `GET /api/patients`, `DELETE /api/patients/{id}` |
| `/patients/add` | — | `default`: crea paciente | `POST /api/patients` |
| `/patients/edit/[id]` | Paciente por id | `default`: actualiza paciente | `GET /api/patients/{id}`, `PUT /api/patients/{id}` |
| `/dentists` | Lista de dentistas | `delete`: elimina dentista | `GET /api/dentists`, `DELETE /api/dentists/{id}` |
| `/dentists/add` | — | `default`: crea dentista | `POST /api/dentists` |
| `/dentists/edit/[id]` | Dentista por id (+ especialidades) | `default`: actualiza dentista | `GET /api/dentists/{id}`, `PUT /api/dentists/{id}` |
| `/appointments` | Búsqueda de citas + pacientes/dentistas auxiliares para filtros | `delete`: elimina cita | `GET /api/appointments/search`, `GET /api/patients`, `GET /api/dentists`, `DELETE /api/appointments/{id}` |
| `/appointments/add` | Pacientes y dentistas para los selects | `default`: crea cita | `GET /api/patients`, `GET /api/dentists`, `POST /api/appointments` |
| `/appointments/edit/[id]` | Cita + pacientes/dentistas para los selects | `default`: actualiza cita | `GET /api/appointments/{id}`, `GET /api/patients`, `GET /api/dentists`, `PUT /api/appointments/{id}` |
| `+layout.server.js` | Expone `locals.user` a todas las páginas vía `data.user` | — | Ninguno |

Todos los `load`/`actions` de arriba viven en el `+page.server.js` de su carpeta de ruta (ej. `src/routes/patients/+page.server.js`), no en un directorio central de "controllers".

## Guardia de sesión (`hooks.server.js`)

`src/hooks.server.js` corre en cada request, antes de cualquier `load`/`action`:

1. Lee la cookie `authToken`.
2. Si no hay token: `locals.user = null`; si la ruta está en `guardedPrefixes` (`/dashboard`, `/patients`, `/dentists`, `/appointments`), redirige a `/login`.
3. Si hay token: llama `GET /api/auth/validate` con `getAuthHeaders(token)` y arma `locals.user = { ...user, token }`.
4. Si esa validación falla (token vencido/inválido): borra las 3 cookies (`authToken`, `userRole`, `userEmail`), pone `locals.user = null`, y redirige a `/login` solo si la ruta es protegida.

No hay middleware de Express ni sesión en memoria de servidor: el estado de sesión vive en las cookies httpOnly y se recalcula en cada request.

## Manejo de errores real (`apiFetch`)

`apiFetch` (`src/lib/api.js`) no reintenta ni transforma el código HTTP: si `response.ok` es `false`, lanza un `Error` con `error.status = response.status` y `error.message` tomado del body (`{ message }`) cuando el backend lo manda. El manejo posterior depende de quién llame:

- **En `actions` de formularios** (login, alta/edición de paciente, dentista, cita): el `catch` local inspecciona `err.status` (por ejemplo `401` → "Credenciales incorrectas", `404` → "Usuario no encontrado") y devuelve `{ success: false, errors: {...} }` para re-renderizar el formulario con el mensaje.
- **En `hooks.server.js`**: un `catch` alrededor de `GET /api/auth/validate` limpia la sesión y redirige (ver arriba); no distingue el código de error, cualquier falla invalida la sesión.
- **Redirects de SvelteKit** (`throw redirect(...)`) se re-lanzan explícitamente antes de tratarlos como error, porque `redirect()` también construye un objeto con `status` (303/302/307).

No hay un interceptor global de errores ni un middleware `GlobalExceptionHandler` del lado frontend — cada loader/action decide qué hacer con el error que le devuelve `apiFetch`.

## Legacy → actual

| Referencia antigua | Reemplazada por |
|---------------------|------------------|
| `public/js/controllers/auth/login-controller.js`, `register-controller.js` | `src/routes/login/+page.server.js`, `src/routes/users/register/+page.server.js` |
| `public/js/controllers/dentist/dentist-list-controller.js` (y futuros add/edit) | `src/routes/dentists/+page.server.js`, `src/routes/dentists/add/+page.server.js`, `src/routes/dentists/edit/[id]/+page.server.js` |
| Middleware Express de auth / sesión en memoria | `src/hooks.server.js` (`event.locals.user`, cookies httpOnly) |
| `public/js/api/*` wrappers + `public/js/api/config.js` (`API_BASE_URL`) | `src/lib/api.js` (`apiFetch`, `getAuthHeaders`) — ver `API-CONFIG.md` |
| `getAuthHeaders()` leyendo `localStorage` | `getAuthHeaders(token)` recibe el token desde `locals.user.token` (cookie httpOnly resuelta en `hooks.server.js`) |
| Endpoints sin prefijo (`/auth/login`, `/dentists`, `/patients`) | Todos bajo `/api` (`server.servlet.context-path=/api`) |
| `POST /auth/register`, body `{ ..., role }` | `POST /api/auth/register` (mismo body vía el formulario de `/users/register`) |

## Dónde buscar el código

- Rutas y su lógica: `frontend/src/routes/**/+page.server.js` (loaders y actions)
- Guardia de sesión: `frontend/src/hooks.server.js`
- Cliente HTTP: `frontend/src/lib/api.js` (`apiFetch`, `getAuthHeaders`) — detalle en `API-CONFIG.md`
- Backend (implementación real de cada endpoint): `backend/src/main/java/com/dh/dentalClinicMVC/controller`
- Flujo completo de sesión, DTOs y credenciales de seed: `../CONEXION.md`

## Próximo paso

Si agregás o cambiás un endpoint, actualizá la tabla de rutas de este archivo — no crees una alternativa. Ver `API-CONFIG.md` para el detalle de `BACKEND_URL`/`apiFetch` y `README.md` para la estructura general del frontend.
