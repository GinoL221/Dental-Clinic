# Backend - Clínica Dental MVC

Este proyecto es el backend de una aplicación para la gestión de una clínica dental, desarrollado en Java con Spring
Boot siguiendo el patrón MVC.

## Características principales

- Gestión de usuarios: pacientes, odontólogos y administradores (herencia de entidad User).
- Autenticación y autorización con JWT y roles (`ADMIN`, `DENTIST`, `PATIENT`).
- CRUD completo para pacientes, odontólogos y turnos.
- Validaciones de datos y unicidad (email, DNI, matrícula).
- Contraseña por defecto generada si no se envía (nombre+apellido+últimos 3 dígitos de DNI/matrícula).
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
- Base de datos relacional (configurable en `application.properties`)

## Instalación y ejecución

1. Clonar el repositorio.
2. Configurar la base de datos en `src/main/resources/application.properties`.
3. Compilar y ejecutar:
   ```bash
   ./mvnw clean install
   ./mvnw spring-boot:run
   ```
   O en Windows:
   ```cmd
   mvnw.cmd clean install
   mvnw.cmd spring-boot:run
   ```

## Endpoints principales

- `/auth/register` - Registro de usuario (admin, paciente, odontólogo)
- `/auth/login` - Login y obtención de JWT
- `/patients` - CRUD de pacientes
- `/dentists` - CRUD de odontólogos
- `/appointments` - CRUD de turnos
- `/dashboard` - Estadísticas generales

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
