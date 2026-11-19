# Backend - Clínica Dental MVC

Este proyecto es el backend de una aplicación para la gestión de una clínica dental, desarrollado en Java con Spring
Boot siguiendo el patrón MVC.

## Características principales

- Gestión de usuarios: pacientes, odontólogos y administradores (herencia de entidad User).
- Autenticación y autorización con JWT y roles (`ADMIN`, `DENTIST`, `PATIENT`).
- CRUD completo para pacientes, odontólogos y turnos.
- Validaciones de datos y unicidad (email, DNI, matrícula).
- Contraseña temporal aleatoria de 14 caracteres (`SecureRandom`) con cambio obligatorio en el primer inicio de sesión (`mustChangePassword = true`) si no se envía contraseña al dar de alta un paciente u odontólogo.
- Hash de contraseñas con BCrypt.
- Uso de DTOs para evitar exponer datos sensibles.
- Manejo de errores personalizado.
- Endpoints RESTful.

## Estructura del proyecto

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/dh/dentalClinicMVC/
│   │   │   ├── authentication/
│   │   │   ├── configuration/
│   │   │   ├── controller/
│   │   │   ├── dto/
│   │   │   ├── entity/
│   │   │   ├── exception/
│   │   │   ├── openapi/
│   │   │   ├── repository/
│   │   │   └── service/
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       └── java/com/dh/dentalClinicMVC/
├── pom.xml
└── README.md
```

## Requisitos

- Java 21+
- Maven 3.8+
- Perfil `dev` (H2) o `prod` (MySQL vía variables de entorno; ver `backend/.env.example`)

## Instalación y ejecución

1. Clonar el repositorio.
2. Copiar `backend/.env.example` a `backend/.env` y completar `JWT_SECRET` (y, en `prod`, `DB_URL` / `DB_USER` / `DB_PASS`).
3. El perfil por defecto es `dev` (H2 en memoria, `DataInitializer`). Producción usa `SPRING_PROFILES_ACTIVE=prod` (MySQL + migraciones Flyway `V1`–`V4` con `ddl-auto=validate`).
4. Compilar, verificar formato y correr tests:
   ```bash
   ./mvnw spotless:check
   ./mvnw test
   ./mvnw spring-boot:run
   ```
   O en Windows:
   ```cmd
   mvnw.cmd clean install
   mvnw.cmd spring-boot:run
   ```

La API vive bajo `/api` (`server.servlet.context-path=/api`).

## Endpoints principales

- `POST /api/auth/register` — registro público, solo rol `PATIENT`
- `POST /api/auth/login` — login y JWT
- `GET /api/auth/me` — perfil de sesión (autenticado)
- `/api/patients` — CRUD de pacientes
- `/api/dentists` — CRUD de odontólogos
- `/api/appointments` — CRUD de turnos
- `/api/specialties` — especialidades
- `/api/dashboard` — estadísticas

## Seguridad

- Acceso protegido por roles y JWT.
- Contraseñas hasheadas con BCrypt.
- No se exponen contraseñas ni datos sensibles en las respuestas.

## Contribución

Este proyecto es desarrollado y mantenido por una sola persona.

## Licencia

Este proyecto es de uso académico y libre.

---

Para dudas o sugerencias, contacta al desarrollador principal.
