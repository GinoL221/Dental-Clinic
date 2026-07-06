# Clínica Dental — Sistema de gestión

Aplicación full-stack para la gestión de una clínica dental. Incluye autenticación con roles (ADMIN / DENTIST / PATIENT), CRUD de dentistas y pacientes, gestión de citas con estados, y seguridad endurecida (XSS, IDOR, JWT en cookie httpOnly).

## Stack

| Capa | Tecnologías |
|------|-------------|
| Backend | Java 21, Spring Boot 3.x, Spring Security (JWT), Spring Data JPA (Hibernate) |
| Frontend | Node.js, Express, EJS, Vanilla JS (módulos ES) |
| Base de datos | MySQL (producción), H2 en memoria (tests) |
| Build & test | Maven + JUnit 5 + MockMvc (backend), Jest (frontend) |
| CI | GitHub Actions — tests backend y frontend en cada push/PR |

## Quick start

**Prerequisitos:** Java 21, Node.js 20+, Maven, MySQL local.

```bash
# 1. Configurar variables de entorno del backend
cp backend/.env.example backend/.env
# Editar backend/.env con tus credenciales de DB y JWT_SECRET

# 2. Iniciar backend (http://localhost:8080)
cd backend
./mvnw spring-boot:run

# 3. Iniciar frontend (http://localhost:3000)
cd frontend
npm install
node app.js
```

## Tests

```bash
# Backend — JUnit + MockMvc (H2 en memoria, no requiere DB)
cd backend && ./mvnw test

# Frontend — Jest (análisis estático + jsdom)
cd frontend && npm test
```

## Endpoints principales

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Login — JWT en cookie httpOnly, no en body |
| POST | `/api/auth/logout` | Logout — limpia la cookie |

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
- **Frontend:** módulos ES independientes por dominio (auth, appointment, dentist, patient). Renderizado server-side con EJS.
- **Autenticación:** JWT almacenado exclusivamente en cookie httpOnly. El frontend autentica con `credentials: "include"` — sin tokens en `localStorage`.

## Seguridad

- IDOR y escalación de privilegios cerrados en el backend (decisiones de autorización sobre el principal autenticado, no sobre campos del body).
- XSS mitigado en los renderers de listas frontend (conversión de `innerHTML` + template literals a `createElement`/`textContent`).
- JWT fuera de `localStorage` — viaja en cookie httpOnly seteada por el backend.
- Provisión de usuarios ADMIN bloqueada en producción (requiere CLI o migración).

## Pendientes / Mejoras Futuras

- **Optimización Mobile**: Mejorar la responsividad y la experiencia de usuario en dispositivos móviles (revisar [08_mobile_home.png](file:///home/ginopc/Desarrollo/Dental-Clinic/tools/screenshots/08_mobile_home.png)).
- **Página de Registro**: Refactorizar y pulir la interfaz visual y validaciones del formulario de registro (revisar [03_register_page.png](file:///home/ginopc/Desarrollo/Dental-Clinic/tools/screenshots/03_register_page.png)).
- **Dashboard**: Enriquecer la visualización de gráficos y los controles del panel principal (revisar [04_dashboard.png](file:///home/ginopc/Desarrollo/Dental-Clinic/tools/screenshots/04_dashboard.png)).

## Contribuir

1. Crear una rama con prefijo `feat/`, `fix/`, `refactor/`, etc.
2. Correr tests localmente antes de abrir PR.
3. Abrir PR hacia `main` con descripción clara.

## Contacto

Gino Lencina — [GinoL221/Dental-Clinic](https://github.com/GinoL221/Dental-Clinic)
