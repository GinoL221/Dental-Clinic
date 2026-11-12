# Contrato de errores de la API

Todas las respuestas de error del backend (Spring Boot, bajo `/api`) comparten un único cuerpo JSON: `ErrorResponse` (`backend/src/main/java/com/dh/dentalClinicMVC/exception/ErrorResponse.java`). La misma forma se aplica desde tres capas: `GlobalExceptionHandler` (excepciones de la capa MVC, incluye `@PreAuthorize` denegado a nivel método), `RestAccessDeniedHandler` (denegación a nivel regla de URL en `SecurityConfiguration`) y `StalePrincipalEntryPoint` (401 para rutas protegidas sin sesión válida).

## Forma del cuerpo

```json
{
  "error": "Recurso duplicado",
  "message": "El email ya está registrado",
  "path": "/api/patients",
  "status": 409,
  "timestamp": "2026-11-12T15:30:00.123456"
}
```

| Campo         | Tipo                | Siempre presente | Descripción                                                                             |
| ------------- | ------------------- | ---------------- | --------------------------------------------------------------------------------------- |
| `error`       | string              | sí               | Categoría del error (ej. `Datos inválidos`, `Acceso denegado`).                         |
| `message`     | string              | sí               | Mensaje legible; el frontend lo muestra tal cual (`frontend/src/lib/api.js:36`).        |
| `path`        | string              | sí               | Ruta solicitada.                                                                        |
| `status`      | int                 | sí               | Código HTTP, redundante con el status de la respuesta.                                  |
| `timestamp`   | string (date-time)  | sí               | Momento del error.                                                                      |
| `fieldErrors` | map campo → mensaje | solo validación  | **Aditivo:** presente únicamente en 400 por `@Valid`; los demás cuerpos no lo incluyen. |

Reglas de compatibilidad: `message` es la única clave que el frontend consume; agregar campos es seguro, cambiar los valores de `error`/`message` exige revisar los textos esperados en `+page.server.js`.

## Códigos HTTP y cuándo se usan

| Código | Cuándo                                                                                                                                                 | Ejemplos de `error`                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `400`  | Validación `@Valid` fallida, JSON malformado, tipo de path variable incorrecto, argumentos inválidos, violación de integridad **no** de unicidad.      | `Datos inválidos`, `Cuerpo de solicitud inválido`, `Error de integridad de datos` |
| `401`  | Sin token, token inválido/expirado, principal sin fila de respaldo (stale principal), credenciales incorrectas (login).                                | `No autenticado`, `Credenciales inválidas`                                        |
| `403`  | Rol insuficiente (URL o `@PreAuthorize`) o intento de acceso a un recurso ajeno (IDOR bloqueado).                                                      | `Acceso denegado`                                                                 |
| `404`  | Ruta inexistente o recurso no encontrado.                                                                                                              | `Recurso no encontrado`                                                           |
| `409`  | **Todo recurso duplicado** (email, DNI, matrícula, especialidad, asignación) y conflictos de negocio (turno duplicado, transición de estado inválida). | `Recurso duplicado`, `Transición de estado inválida`                              |
| `500`  | Error no manejado; el cuerpo no incluye stacktrace ni detalles internos.                                                                               | `Error interno del servidor`                                                      |

### Caso especial: duplicados y `DataIntegrityViolationException`

El check de duplicado ocurre primero en la capa de servicio (`DuplicateResourceException` → 409). Si la solicitud se cuela hasta la constraint de base de datos, `GlobalExceptionHandler` clasifica el mensaje de la DB: violaciones de unicidad (`uk_appointment_active_dentist_slot`, `uk_user_email`, `uk_patient_card_identity`, `uk_dentist_registration_number` o palabras clave `unique`/`duplicate`) también devuelven **409** con el mismo texto que la capa de servicio; el resto de las violaciones de integridad devuelven **400**.

### Excepción conocida

Algunos controles de pertenencia (IDOR) devuelven `403` con **cuerpo vacío** (ej. `PatientController.findById` cuando un paciente consulta un registro ajeno): se construyen como `ResponseEntity.status(FORBIDDEN).build()` dentro del controlador, fuera del handler. Está en el backlog unificarlos con `ErrorResponse` (revisión de lógica de ownership duplicada); el status es correcto, solo falta el cuerpo.

## Documentación viva (OpenAPI)

En desarrollo, springdoc expone la API documentada (deshabilitado en `prod`):

- Swagger UI: `http://localhost:8080/api/swagger-ui/index.html`
- Documento OpenAPI: `http://localhost:8080/api/v3/api-docs`

El esquema `ErrorResponse` está registrado globalmente por `ErrorResponseCustomiser` y cada operación declara sus 404/409 específicos vía `@ApiResponse`. Un smoke test (`OpenApiDocsSmokeTest`) verifica en cada corrida que el documento describe la superficie real de la API.
