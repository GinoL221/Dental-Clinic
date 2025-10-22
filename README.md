
# Clinica Dental - Sistema de gestión

Breve y claro: aplicación full‑stack para la gestión de una clínica dental. Incluye autenticación, roles (ADMIN / DENTIST / PATIENT), CRUD de dentistas y pacientes, y gestión de citas con estados.

## 🎯 Resumen rápido (para reclutadores)

- Stack: Java 21 + Spring Boot 3.x (backend), Node.js + Express + EJS (frontend).
- Arquitectura: REST API (backend) + EJS server‑rendered UI (frontend).
- Estado: código principal y pruebas unit/integración funcionando; CI (GitHub Actions) ejecuta tests en Java 21.

## 🧰 Tecnologías principales

- Backend: Java 21, Spring Boot, Spring Security (JWT), Spring Data JPA (Hibernate).
- Frontend: Node.js, Express, EJS, Vanilla JS.
- Build & Test: Maven (./mvnw), JUnit 5, MockMvc; Jest (opcional) en frontend.
- DB: MySQL en producción; H2 en memoria para tests.

## ▶️ Quick start (desarrollador)

Prerequisitos:

- Java 21 (o 17+ compatible con la configuración actual).
- Node.js 18+ (para el frontend).
- Git, Maven.

Iniciar backend (desde la raíz):

```bash
cd backend
./mvnw spring-boot:run
```

Backend por defecto: `http://localhost:8080`

Iniciar frontend (desde la raíz):

```bash
cd frontend
npm install
npm run dev   # o: node app.js
```

Frontend por defecto: `http://localhost:3000`

Si quieres ejecutar sólo la suite de pruebas backend:

```bash
cd backend
./mvnw -B test
```

## � Endpoints principales (resumen)

Autenticación

- POST /api/auth/register  → Registrar usuario
- POST /api/auth/login     → Login (devuelve JWT)

Usuarios

- GET /api/patients
- GET /api/patients/{id}
- POST /api/patients
- PUT /api/patients/{id}
- DELETE /api/patients/{id}

- GET /api/dentists
- POST /api/dentists
- PUT /api/dentists/{id}

Citas

- GET /api/appointments
- GET /api/appointments/{id}
- POST /api/appointments
- PUT /api/appointments/{id}
- DELETE /api/appointments/{id}

Notas: para detalles de payload y respuestas consulta los controladores en `backend/src/main/java/com/dh/dentalClinicMVC/controller`.

## ✅ Testing y CI

- Tests backend: `./mvnw test` (JUnit + MockMvc). Los tests de integración usan H2 en memoria.
- CI: `.github/workflows/ci.yml` ejecuta `./mvnw -B test` en Java 21 en cada push/PR.

## 🧩 Arquitectura y buenas decisiones

- Validaciones y lógica de negocio centralizadas en los servicios (p. ej. validación de fechas de citas en `AppointmentServiceImpl`).
- Manejo centralizado de excepciones con `GlobalExceptionHandler` para respuestas JSON consistentes.
- Separación clara: controllers → services → repositories.

## �️ Consejos para desarrollo local

- Variables sensibles: crea `application.properties` o usa variables de entorno para credenciales DB y JWT.
- Si el frontend se siente lento al abrir grandes vistas EJS en VSCode, extrae scripts a `frontend/public/js` y usa `include` para partials.

## � ¿Cómo contribuir?

1. Crear un fork y una rama con prefijo `feature/` o `fix/`.
2. Ejecutar tests localmente y añadir tests para la nueva funcionalidad.
3. Abrir PR hacia `main` con descripción clara y screenshots si aplica.

## Contacto

Gino Lencina — repositorio: `GinoL221/Dental-Clinic` — e-mail en el perfil de GitHub.

---
