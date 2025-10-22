# Dental Clinic

## Resumen breve

Proyecto full-stack para la gestión de una clínica dental. En la iteración reciente me enfoqué en:

- Consolidar validaciones de negocio en el backend (fechas/horas de citas).
- Unificar el manejo de errores y estandarizar la respuesta JSON para la API.
- Añadir pruebas automatizadas (JUnit + MockMvc) que cubren flujos críticos.
- Eliminar prints/debug y dejar el código listo para revisión y CI.

Estos cambios evitan errores 500 inesperados al crear recursos y mejoran la experiencia de errores del cliente (mensajes claros en español).

---

## Detalle técnico (qué arreglé y por qué)

1. Validaciones en el servicio

   - Antes: validaciones repartidas entre controlador y service, con algunos throw/ResponseStatusException inconsistentes.
   - Ahora: `AppointmentServiceImpl` centraliza el parseo y validación de `date` y `time` (patrones `yyyy-MM-dd` y `HH:mm`). Lanza `IllegalArgumentException` con mensajes amigables.
   - Beneficio: lógica testeable y reutilizable. Controladores dejan fluir excepciones y el `GlobalExceptionHandler` transforma a `ErrorResponse` consistente.

2. GlobalExceptionHandler

   - Estandariza la estructura de error JSON:

```json
{
  "error": "Argumento inválido",
  "message": "La fecha no puede ser anterior a hoy",
  "path": "/appointments",
  "status": 400,
  "timestamp": "2025-10-17T..."
}
```

   - Cubrimos casos comunes: `IllegalArgumentException`, `DateTimeParseException`, `ResourceNotFoundException` y un handler genérico 500.

3. Tests añadidos

   - `AppointmentValidationTest` (integración con MockMvc): comprueba que crear una cita con fecha anterior o con hora pasada hoy devuelve 400 y mensaje explicativo.
   - `DentistControllerNegativeTest` ajustado para validar la estructura `ErrorResponse`.

4. CI

   - Workflow en `.github/workflows/ci.yml` que ejecuta `./mvnw -B test` en Java 21. Esto asegura que la rama principal siempre tenga tests verdes.

---

## Arquitectura mínima y archivos clave

- `backend/src/main/java/.../service/impl/AppointmentServiceImpl.java` — validaciones y parseo de fecha/hora.
- `backend/src/main/java/.../exception/GlobalExceptionHandler.java` — mapea excepciones a `ErrorResponse`.
- `backend/src/main/java/.../controller/AppointmentController.java` — delega validaciones y declara `ResourceNotFoundException` donde aplica.
- `backend/src/test/java/.../AppointmentValidationTest.java` — pruebas de validación.

---

## Cómo demostrarlo localmente (playback rápido)

1) Levanta backend y frontend en tu máquina:

```bash
# Backend
cd backend
./mvnw spring-boot:run

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

2) Ejecutar la suite de tests (backend):

```bash
cd backend
./mvnw test
```
3) Generar capturas para el portfolio (opcional)
3) Generar capturas para el portfolio (opcional)
   - He incluido un script simple en `tools/generate-portfolio-screenshots.js` que usa Puppeteer para abrir páginas y capturar imágenes.
   - He incluido un script simple en `tools/generate-portfolio-screenshots.js` que usa Puppeteer para abrir páginas y capturar imágenes.
   - Pasos:

```bash
cd e:/Clinica-Dental-MVC
# instalar puppeteer globalmente o localmente en tools
npm install puppeteer --prefix tools
node tools/generate-portfolio-screenshots.js
```

   - El script asume que el frontend se sirve en `http://localhost:3000` y guardará imágenes en `tools/screenshots/`.

---

## Sugerencia de assets para el portfolio

- Dashboard principal (estadísticas + gráfico)
- GIF corto: crear cita -> validación (fecha anterior) -> error mostrado
- Resultado de la pipeline CI (badge + job green)

---