# 🦷 Dental Clinic — Proyecto (Portfolio)

![CI](https://github.com/GinoL221/Dental-Clinic/actions/workflows/ci.yml/badge.svg)

Pequeña aplicación full-stack para la gestión de una clínica dental. Esta rama contiene mejoras enfocadas en la robustez del backend, validaciones de negocio y experiencia del frontend.

## Contenido rápido

- Qué arreglé (resumen para el portfolio)
- Stack tecnológico
- Cómo ejecutar (rápido)
- Tests y CI
- Capturas / Qué mostrar en el portfolio

---

## 🔧 Qué arreglé (resumen para el portfolio)

- Moví validaciones de negocio (fecha y hora de citas) al service (`AppointmentServiceImpl`) para centralizar la lógica y facilitar pruebas.
- Mensajes de error claros y en español: p.ej. "La fecha no puede ser anterior a hoy", "La hora seleccionada ya pasó".
- Centralicé el manejo de errores en `GlobalExceptionHandler` y estandaricé `ErrorResponse` con estructura JSON consistente.
- Eliminé prints/stack traces expuestos y corregí controladores que devolvían HTTP 500 inesperados.
- Añadí y adapté tests (JUnit + MockMvc) para flujos críticos, incluyendo validaciones de citas.
- Añadí un workflow de CI (GitHub Actions) que ejecuta los tests en Java 21.

---

## 🧰 Stack tecnológico

- Backend: Java 21, Spring Boot 3.x, Spring Security, Spring Data JPA (Hibernate)
- Base de datos: H2 (tests) / MySQL (producción)
- Frontend: Node.js + Express, EJS + Vanilla JS modular
- Tests: JUnit, Spring MockMvc; CI: GitHub Actions

---

## 🚀 Cómo ejecutar (rápido)

Prerrequisitos:

```
Java 21+
Maven 3.6+
Node.js 18+
```

Backend:

```bash
cd backend
./mvnw spring-boot:run
```

Frontend (desarrollo):

```bash
cd frontend
npm install
npm run dev
```

Endpoints principales:
- Backend: http://localhost:8080
- Frontend: http://localhost:3000

---

## ✅ Tests y CI

- Ejecutar tests backend localmente:

```bash
cd backend
./mvnw test
```

- CI: workflow en `.github/workflows/ci.yml` que ejecuta `./mvnw -B test` en Java 21.

---

## 📸 Capturas / Qué mostrar en el portfolio

Recomendación de assets:

1. Screenshot del dashboard principal (estadísticas y gráfico).
2. GIF corto mostrando creación de una cita y la validación que evita una fecha pasada.
3. Screenshot del pipeline de CI con tests verdes.

---

Si querés, genero los screenshots automatizados y un `README_PORTFOLIO.md` más largo con contexto y notas de diseño.

---

Desarrollado por Gino Lencina — Octubre 2025

