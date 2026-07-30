# Frontend — Dental Clinic (SvelteKit)

App SvelteKit desacoplada que sirve como capa de presentación de la clínica dental. Renderiza server-side, resuelve la sesión en `hooks.server.js` y consume la API REST de Spring Boot exclusivamente desde el servidor (nunca desde el navegador).

## Quick path

1. Instalar dependencias y arrancar el backend Spring Boot (puerto `8080`, ver `../CONEXION.md`).
2. Instalar dependencias y levantar el frontend.
3. Verificar que responde en `http://localhost:5173`.

```bash
cd frontend
npm install

npm run dev        # http://localhost:5173
```

No hay proxy de Vite: `vite.config.js` solo registra el plugin `sveltekit()` y la config de Vitest — sin bloque `server.proxy`. Todas las llamadas al backend salen server-side vía `apiFetch` (`src/lib/api.js`) hacia `BACKEND_URL` (variable de entorno en `frontend/.env`, por defecto `http://localhost:8080`).

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | SvelteKit 2 + Svelte 4 + Vite 5, `@sveltejs/adapter-auto` |
| Tipado | JSDoc + `checkJs` (`jsconfig.json`), sin TypeScript — `.js`/`.svelte`, no `.ts` |
| Tests unitarios/componentes | Vitest (`vitest.config` vive dentro de `vite.config.js`), entorno `jsdom` |
| Tests E2E | Playwright |
| Formato | Prettier (`format` / `format:check`) |

## Estructura del proyecto

| Ruta | Qué es |
|------|--------|
| `src/routes/` | Rutas SvelteKit basadas en archivos: `+page.svelte` (UI), `+page.server.js` (loaders y actions server-side) |
| `src/hooks.server.js` | Guardia de sesión: lee la cookie `authToken`, pide el perfil vía `GET /api/auth/me` y llena `event.locals.user` (5 campos públicos) + `event.locals.authToken` (JWT, server-only); redirige a `/login` en rutas protegidas (`/dashboard`, `/patients`, `/dentists`, `/appointments`) si no hay sesión válida |
| `src/lib/api.js` | Único cliente HTTP real hacia el backend: `apiFetch(endpoint, options)` y `getAuthHeaders(token)`. Ver `API-CONFIG.md` |
| `src/app.d.ts` | Tipos de `App.Locals`: `user` (`id`, `firstName`, `lastName`, `email`, `role`, sin token) y `authToken` (JWT server-only, nunca devuelto por un `load`) |
| `static/` | Assets estáticos servidos tal cual (`css/`, `js/`, `assets/`, `favicon.ico`) |
| `tests/` | Specs E2E mock (`auth.spec.js`) + `mock-backend.js` (backend falso, solo para el modo mock) |
| `tests/fullstack/` | Suite E2E full-stack real: `run-fullstack.js` (orquestador de procesos), `pages/*.js` (Page Object Models), `auth.setup.js` (login real, storage states), `auth.spec.js`/`booking.spec.js`/`authorization.spec.js` (journeys), `fixtures/e2e.js` + `fixtures/process-runner-fixtures.js` |
| `*.test.js` junto al código (`hooks.server.test.js`, `lib/api.test.js`, `routes/**/*.server.test.js`) | Tests unitarios Vitest, co-ubicados con el código que verifican |

## Sesión (cookies, no localStorage)

El login (`src/routes/login/+page.server.js`) hace `POST /api/auth/login` server-side y, si es exitoso, setea `authToken`, `userRole` y `userEmail` como cookies **httpOnly** (`sameSite=lax`, `maxAge: 36000` — 10 h, igual al vencimiento del JWT). En cada request, `hooks.server.js` llama `GET /api/auth/me` con `authToken` y arma `event.locals.user` (perfil público) y `event.locals.authToken` (JWT, nunca expuesto a PageData). No hay JWT en `localStorage` ni headers `Authorization` manejados desde el navegador. Detalle completo del flujo en `../CONEXION.md`.

## Tests y type-check

| Comando | Qué hace |
|---------|----------|
| `npm run test` | Tests unitarios/componentes (Vitest, una sola pasada) |
| `npm run test:watch` | Vitest en modo watch |
| `npm run test:e2e` | Playwright — levanta `tests/mock-backend.js` en `:8080` y `npm run build && npm run preview` en `:4173`; **no** requiere el backend Spring Boot real |
| `npm run test:e2e:process` | Tests unitarios (`node:test`) del orquestador `tests/fullstack/run-fullstack.js` — preflight de credenciales, puertos, exit codes, cleanup; no levanta servicios reales |
| `npm run test:e2e:fullstack` | E2E full-stack real (login, dashboard, booking, autorización) contra Spring Boot (perfil `e2e`) + SvelteKit preview + Chromium reales — ver sección abajo |
| `npm run check` | `svelte-check` sobre `.svelte` + JSDoc |
| `npm run typecheck` | `tsc -p jsconfig.json --noEmit` |
| `npm run build` / `npm run preview` (o `npm start`) | Build de producción / servirlo (`http://localhost:4173`) |

## E2E full-stack (real, no mockeado)

`npm run test:e2e:fullstack` orquesta el ciclo completo: levanta el backend Spring Boot con el perfil `e2e` (H2 en memoria, descartable, nunca toca `dev`/`prod`), hace build+preview del frontend, espera a que ambos respondan, corre los journeys de Playwright en Chromium contra el stack real, y limpia todo al final (procesos y puertos) pase lo que pase.

Requiere estas variables de entorno (nunca se loguean sus valores, solo los nombres si faltan):

| Variable | Uso |
|----------|-----|
| `JWT_SECRET` | Firma de JWT del perfil `e2e` — **debe ser Base64 válido** (ej. `openssl rand -base64 32`); un valor con guiones rompe la firma con un 500 genérico |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | Credenciales del ADMIN sembrado por `E2eDataInitializer` |
| `E2E_NON_ADMIN_EMAIL` / `E2E_NON_ADMIN_PASSWORD` | Credenciales del PATIENT sembrado |

```bash
JWT_SECRET="$(openssl rand -base64 32)" \
E2E_ADMIN_EMAIL="admin.e2e@example.com" \
E2E_ADMIN_PASSWORD="AdminFixture123!" \
E2E_NON_ADMIN_EMAIL="patient.e2e@example.com" \
E2E_NON_ADMIN_PASSWORD="PatientFixture123!" \
npm run test:e2e:fullstack
```

En CI (`.github/workflows/ci.yml`, job `Full-Stack E2E (Chromium)`) estas mismas variables vienen de GitHub Actions secrets; el job falla rápido, antes de instalar Chromium, si falta alguna.

## Legacy → actual

| Referencia antigua | Reemplazada por |
|---------------------|------------------|
| Express 5 + EJS, `app.js`, `public/js/` controllers | SvelteKit, `src/routes/**/+page.server.js` (loaders/actions) |
| Puerto `3000` | `5173` (dev), `4173` (preview/E2E) |
| Jest | Vitest (`npm run test`) + Playwright (`npm run test:e2e`) |
| JWT en `localStorage` + header `Authorization` desde el navegador | Cookies httpOnly resueltas en `hooks.server.js` |
| `public/js/api/config.js` (`API_BASE_URL`) | `src/lib/api.js` (`BACKEND_URL`) — ver `API-CONFIG.md` |

## Próximo paso

Ver `API-CONFIG.md` para el detalle de `apiFetch`/`BACKEND_URL` y `../CONEXION.md` para el flujo completo frontend-backend (endpoints, DTOs, credenciales de seed).
