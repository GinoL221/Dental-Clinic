# Clínica Dental — Sistema de gestión

Aplicación full-stack para la gestión de una clínica dental. Incluye autenticación con roles (ADMIN / DENTIST / PATIENT), CRUD de dentistas y pacientes, gestión de citas con estados, y seguridad endurecida (XSS, IDOR, JWT en cookie httpOnly). El frontend es una SvelteKit app desacoplada que consume la API REST de Spring Boot.

## Stack

| Capa | Tecnologías |
|------|-------------|
| Backend | Java 21, Spring Boot 3.x, Spring Security (JWT), Spring Data JPA (Hibernate) |
| Frontend | SvelteKit 2 + Svelte 4 + Vite 5 (`adapter-auto`), JSDoc + `checkJs` |
| Base de datos | MySQL (producción), H2 en memoria (tests) |
| Build & test | Maven + JUnit 5 + MockMvc (backend), Vitest + Playwright (frontend) |
| CI | GitHub Actions — tests backend y frontend en cada push/PR |

## Quick path

1. Configurar variables de entorno del backend y arrancarlo.
2. Instalar dependencias del frontend y levantar el servidor de desarrollo.
3. Verificar que ambos servicios responden.

```bash
# 1. Backend (http://localhost:8080)
cp backend/.env.example backend/.env
# Editar backend/.env con tus credenciales de DB y JWT_SECRET
cd backend
./mvnw spring-boot:run

# 2. Frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

El frontend llama al backend server-side (`apiFetch` en `src/lib/api.js`) usando la variable `BACKEND_URL` (por defecto `http://localhost:8080`) — no hay proxy de Vite configurado.

El CORS del backend (`CorsConfig.java`) es configurable vía la variable de entorno opcional `CORS_ALLOWED_ORIGINS` (orígenes separados por coma), con default `http://localhost:5173`. En la práctica no es una ruta de ataque real hoy: el browser nunca llama al backend directamente (ver `CONEXION.md`), pero queda listo para el día que haya un consumidor browser directo o un dominio de despliegue distinto.

## Tests y type-check

| Comando | Qué hace |
|---------|----------|
| `cd backend && ./mvnw test` | Tests backend — JUnit + MockMvc (H2 en memoria, no requiere DB) |
| `cd frontend && npm run test` | Tests unitarios/componentes frontend (Vitest) |
| `cd frontend && npm run test:watch` | Vitest en modo watch |
| `cd frontend && npm run test:e2e` | Tests end-to-end (Playwright) |
| `cd frontend && npm run check` | Type-check de Svelte + JSDoc (`svelte-check`) |
| `cd frontend && npm run typecheck` | Type-check JS vía `tsc -p jsconfig.json --noEmit` |

## Endpoints principales

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Login — JWT en cookie httpOnly, no en body |

Logout no llama al backend: `POST /users/logout` es una action de SvelteKit (`src/routes/users/logout/+page.server.js`) que solo borra las cookies `authToken`/`userRole`/`userEmail` y redirige a `/`. No existe un endpoint `/api/auth/logout`.

### Pacientes

| Método | Endpoint |
|--------|----------|
| GET | `/api/patients` |
| GET | `/api/patients/{id}` |
| POST | `/api/patients` |
| PUT | `/api/patients/{id}` |
| DELETE | `/api/patients/{id}` |

### Dentistas

| Método | Endpoint |
|--------|----------|
| GET | `/api/dentists` |
| GET | `/api/dentists/{id}` |
| POST | `/api/dentists` |
| PUT | `/api/dentists/{id}` |
| DELETE | `/api/dentists/{id}` |

### Citas

| Método | Endpoint |
|--------|----------|
| GET | `/api/appointments` |
| GET | `/api/appointments/{id}` |
| POST | `/api/appointments` |
| PUT | `/api/appointments/{id}` |
| DELETE | `/api/appointments/{id}` |

Para detalles de payloads y respuestas, ver los controladores en `backend/src/main/java/com/dh/dentalClinicMVC/controller`.

## Arquitectura

- **Backend:** controllers → services → repositories. Validaciones y lógica de negocio centralizadas en servicios. Manejo de excepciones con `GlobalExceptionHandler` (respuestas JSON consistentes).
- **Frontend:** SvelteKit app desacoplada — rutas en `src/routes`, carga de datos server-side en `+page.server.js` (loaders/actions), sesión resuelta en `hooks.server.js` hacia `event.locals.user`, llamadas al backend vía `src/lib/api.js`.
- **Autenticación:** JWT (`authToken`) y metadatos de sesión (`userRole`, `userEmail`) viajan en cookies httpOnly, leídas server-side en `hooks.server.js`. Sin tokens en `localStorage`.

## Seguridad

- IDOR y escalación de privilegios cerrados en el backend (decisiones de autorización sobre el principal autenticado, no sobre campos del body).
- XSS mitigado en los renderers de listas frontend (conversión de `innerHTML` + template literals a `createElement`/`textContent`).
- JWT fuera de `localStorage` — viaja en cookie httpOnly seteada por el backend y validada en `hooks.server.js`.
- Provisión de usuarios ADMIN bloqueada en producción (requiere CLI o migración).

## Pendientes / Mejoras Futuras

- **Optimización Mobile**: Mejorar la responsividad y la experiencia de usuario en dispositivos móviles (revisar [08_mobile_home.png](tools/screenshots/08_mobile_home.png)).
- **Página de Registro**: Refactorizar y pulir la interfaz visual y validaciones del formulario de registro (revisar [03_register_page.png](tools/screenshots/03_register_page.png)).
- **Dashboard**: Enriquecer la visualización de gráficos y los controles del panel principal (revisar [04_dashboard.png](tools/screenshots/04_dashboard.png)).

## Contribuir

1. Crear una rama con prefijo `feat/`, `fix/`, `refactor/`, etc.
2. Correr `npm run check` y `npm run typecheck` en `frontend/`, y los tests locales de ambos módulos antes de abrir PR.
3. Abrir PR hacia `main` con descripción clara.

## Contacto

Gino Lencina — [GinoL221/Dental-Clinic](https://github.com/GinoL221/Dental-Clinic)
