# Configuración de conexión al backend

El frontend habla con el backend Spring Boot **solo desde el servidor SvelteKit** (loaders y actions en `+page.server.js`, y `hooks.server.js`). El único cliente HTTP real es `apiFetch` en `src/lib/api.js`; no hay proxy de Vite ni llamadas `fetch` desde el navegador.

## Quick path

1. La URL base sale de la variable de entorno `BACKEND_URL` (definida en `frontend/.env`, ver `frontend/.env.example`), con fallback a `http://localhost:8080` si no está seteada.
2. Cada ruta que necesita el backend llama `apiFetch('/api/...')` directamente con el path completo — no hay una capa de "builder de URLs" intermedia en uso.
3. Para requests autenticados, se agrega el header con `getAuthHeaders(token)`.

```js
// src/lib/api.js
const BACKEND_URL = (typeof process !== 'undefined' && process.env?.BACKEND_URL) || 'http://localhost:8080';

export function getAuthHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function apiFetch(endpoint, options = {}) {
  const url = `${BACKEND_URL}${endpoint}`;
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}
```

```js
// Ejemplo real — src/routes/dashboard/+page.server.js
import { apiFetch, getAuthHeaders } from '../../lib/api.js';

const snapshot = await apiFetch('/api/dashboard/snapshot', {
  headers: getAuthHeaders(locals.user.token)
});
```

## `src/config/apiConfig.js` fue eliminado

Ese archivo definía un mapa de endpoints (`ENDPOINTS.AUTH`, `ENDPOINTS.DENTIST`, etc.) y helpers como `getAuthUrl(endpoint)` o `getDentistUrl(endpoint)`, pero nunca fue importado por ningún archivo del proyecto. No era el camino real de integración — las rutas llaman `apiFetch` con el path literal (por ejemplo `'/api/dashboard/snapshot'`), no con `getDashboardUrl('SNAPSHOT')`. Se eliminó como código muerto. Si en el futuro se quiere una capa de configuración centralizada de endpoints, hay que crearla de nuevo y cablear las rutas existentes para que la consuman.

## Endpoints reales usados en las rutas (ejemplos)

Extraídos directamente de los `+page.server.js` que los llaman, no del mapa de `apiConfig.js`:

| Endpoint | Método | Usado en |
|----------|--------|----------|
| `/api/auth/login` | POST | `src/routes/login/+page.server.js` |
| `/api/auth/validate` | GET | `src/hooks.server.js` (valida la cookie en cada request) |
| `/api/dashboard/snapshot` | GET | `src/routes/dashboard/+page.server.js` |
| `/api/appointments/{id}/status` | PATCH | `src/routes/dashboard/+page.server.js` (action `updateStatus`) |

El listado completo de endpoints del backend (pacientes, dentistas, citas, especialidades — todos bajo `/api` por `server.servlet.context-path=/api`) está en `../CONEXION.md`.

## Cambiar la URL del backend

Setear `BACKEND_URL` como variable de entorno antes de levantar el frontend (por ejemplo en `frontend/.env`, a partir de `frontend/.env.example`):

```bash
BACKEND_URL=https://api.miapp.com
```

No hace falta tocar código: `src/lib/api.js` lee `process.env.BACKEND_URL` en cada llamada, con `http://localhost:8080` como único fallback.

## Legacy → actual

| Referencia antigua | Reemplazada por |
|---------------------|------------------|
| `public/js/api/config.js` (`API_BASE_URL`, cliente) | `src/lib/api.js` (`BACKEND_URL`, server-side) |
| `getAuthHeaders()` leyendo el token de `localStorage` | `getAuthHeaders(token)` recibe el token desde `event.locals.user.token` (cookie httpOnly resuelta en `hooks.server.js`) |
| Endpoints sin prefijo (`/auth/login`, `/dentists`) | Todos bajo `/api` (`server.servlet.context-path=/api`) |

## Próximo paso

Ver `README.md` para la estructura general del proyecto y `../CONEXION.md` para el flujo completo de sesión, DTOs y credenciales de seed.
