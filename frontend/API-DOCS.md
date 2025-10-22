# Documentación del Sistema de APIs y Controladores

## Estructura de Archivos

```
frontend/public/js/
├── api/                          # APIs organizadas por funcionalidad
│   ├── config.js                 // Configuración base y manejo de errores
│   ├── utils.js                  // Utilidades de UI y validaciones
│   ├── auth-api.js              // API de autenticación y usuarios
│   ├── dentist-api.js           // API de dentistas
│   └── appointment-api.js        // API de citas (futuro)
├── controllers/                  # Controladores por página
│   ├── auth/
│   │   ├── login-controller.js   // Lógica de página de login
│   │   └── register-controller.js // Lógica de página de registro
│   └── dentist/
│       ├── dentist-list-controller.js // Lógica de lista de dentistas
│       ├── dentist-add-controller.js  // Futuro: agregar dentista
│       └── dentist-edit-controller.js // Futuro: editar dentista
└── api.js                        // Coordinador principal
```

## Arquitectura de Controladores

### Principios de Diseño

1. **Una clase por página** - Cada página tiene su controlador
2. **Separación de responsabilidades** - HTML en EJS, lógica en controladores
3. **Código reutilizable** - APIs compartidas entre controladores
4. **Inicialización automática** - Los controladores se cargan automáticamente

### Estructura de un Controlador

```javascript
class MiControlador {
    # Documentación de APIs (frontend)

    Este archivo es la referencia única del frontend para los endpoints y cómo se consumen desde los wrappers en `frontend/public/js/api`.

    Base URL
    - `API_BASE_URL` (cliente): http://localhost:8080

    Principales rutas y métodos

    Autenticación (AUTH)
    - POST /auth/login — login. Body: { email, password }
    - POST /auth/register — registro. Body: { firstName, lastName, email, password, role }
    - GET  /auth/validate — validar token / obtener usuario actual
    - GET  /auth/check-email?email=... — devuelve boolean

    Dentistas (DENTIST)
    - GET    /dentists — lista
    - GET    /dentists/{id} — buscar por id
    - POST   /dentists — crear (body: dentist)
    - PUT    /dentists — actualizar (body: dentist completo, incluye id)
    - DELETE /dentists/{id} — eliminar
    - GET    /dentists/registration/{registrationNumber} — buscar por matrícula

    Pacientes (PATIENT)
    - GET    /patients — lista
    - GET    /patients/{id} — por id
    - POST   /patients — crear (body: patient)
    - PUT    /patients — actualizar (body: patient completo)
    - DELETE /patients/{id} — eliminar
    - GET    /patients/check-card-identity?cardIdentity=... — boolean

    Citas (APPOINTMENT)
    - GET  /appointments/search?... — búsqueda/filtrado (patient, dentist, fromDate/toDate, status, page, size)
    - GET  /appointments — (wrapper usa /appointments o /appointments/search según necesidad)
    - GET  /appointments/{id}
    - POST /appointments — crear. Body: { date, dentist_id, patient_id, description?, status? }
    - PUT  /appointments — actualizar (body completo, id requerido)
    - DELETE /appointments/{id}
    - GET  /appointments/dentist/{dentistId}
    - GET  /appointments/patient/{patientId}
    - GET  /appointments/date/{date}

    Dashboard / estadísticas
    - El frontend consume datos de `/appointments` y endpoints relacionados. El backend puede exponer rutas específicas como:
      - GET /dashboard/upcoming
      - GET /dashboard/appointments-by-month
      - GET /dashboard/stats

    Headers y autenticación
    - El helper `getAuthHeaders()` añade `Authorization: Bearer <token>` si existe token en `localStorage`.
    - Para POST/PUT se usa `Content-Type: application/json`.

    Comportamiento de errores (resumen)
    - 400: datos inválidos — el wrapper intenta extraer el mensaje del body
    - 401: no autorizado — wrappers limpian token y redirigen al login
    - 403: acceso denegado — mostrar mensaje apropiado
    - 404: no encontrado
    - 409: conflicto (duplicados, solapamiento de cita, etc.)

    Dónde buscar el código
    - Cliente: `frontend/public/js/api/*` (wrappers: `auth-api.js`, `dentist-api.js`, `appointment-api.js`)
    - Config cliente: `frontend/public/js/api/config.js` (contiene `API_BASE_URL` y helpers `get*ApiUrl`)
    - Server-side helpers / vistas: `frontend/src/config/apiConfig.js`, `frontend/src/server-controller/*`
    - Backend (implementación de rutas): `backend/src/main/java/.../controller`

    Ejemplos rápidos
    - Crear cita (cliente):

    ```
    POST /appointments
    Content-Type: application/json

    {
      "date": "2025-10-23",
      "time": "10:30",
      "dentist_id": 12,
      "patient_id": 34,
      "description": "Limpieza"
    }
    ```

    - Obtener dentistas:

    ```
    GET /dentists
    ```

    Notas
    - Mantener `frontend/public/js/api/config.js` como origen de verdad para rutas en el cliente.
    - Si vas a documentar o añadir endpoints, actualizá este archivo en lugar de crear alternativas.
