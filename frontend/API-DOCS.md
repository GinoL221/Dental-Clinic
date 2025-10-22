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
    constructor() {
        # API - Documentación consolidada (frontend)

        Este documento consolida la configuración de APIs y los endpoints usados por el frontend. Está sincronizado con los helpers y módulos en `frontend/public/js` y la configuración en `frontend/src/config/apiConfig.js`.

        ## Archivos relevantes

        - `frontend/src/config/apiConfig.js` — configuración server-side para helpers (usada por controladores Node)
        - `frontend/public/js/api/config.js` — configuración cliente: `API_BASE_URL`, funciones helper (ej. `getAuthApiUrl`, `getDentistApiUrl`, etc.)
        - `frontend/public/js/api/*.js` — wrappers por recurso (auth-api.js, dentist-api.js, patient-api.js, appointment-api.js)

        ## Base URL y helpers

        - Variable central: `API_BASE_URL` (por defecto `http://localhost:8080`). En el cliente se exporta desde `public/js/api/config.js`.
        - Helpers principales (cliente):
          - `getAuthApiUrl(key)` → URL para endpoints de auth (LOGIN, REGISTER, VALIDATE, CHECK_EMAIL...)
          - `getDentistApiUrl(key)` → endpoints para dentistas (FIND_ALL, SAVE, UPDATE, DELETE, FIND_BY_ID)
          - `getPatientApiUrl(key)` → endpoints para pacientes
          - `getAppointmentApiUrl(key)` → endpoints para citas
          - `getApiUrl(path)` → construye URL absoluta a partir de un path

        Ejemplo (cliente):

        ```javascript
        // desde public/js/api/auth-api.js
        const response = await fetch(getAuthApiUrl('LOGIN'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        ```

        ## Endpoints principales (reales en el código)

        Nota: el backend expone rutas bajo `/api` en la API REST (backend Java). En el frontend, los wrappers usan paths como `/dentists`, `/patients`, `/appointments` sobre la `API_BASE_URL`.

        Autenticación

        - LOGIN: `/auth/login`
        - REGISTER: `/auth/register`
        - VALIDATE: `/auth/validate`
        - CHECK_EMAIL: `/auth/check-email` (consulta con ?email=...)

        Dentistas

        - FIND_ALL / SAVE / UPDATE / DELETE / FIND_BY_ID: `/dentists` (métodos HTTP según operación)

        Pacientes

        - FIND_ALL / SAVE / UPDATE / DELETE / FIND_BY_ID: `/patients`

        Citas

        - FIND_ALL / SAVE / UPDATE / DELETE / FIND_BY_ID: `/appointments`
        - Endpoints adicionales usados por dashboard:
          - `/dashboard/stats` → estadísticas del dashboard
          - `/dashboard/appointments-by-month` → serie mensual para el gráfico
          - `/dashboard/upcoming-appointments` → próximas citas
          - `/appointments/{id}/status` → actualizar estado de una cita (PATCH)

        ## Mapeo a archivos del frontend

        - Wrappers: `frontend/public/js/api/*.js` (ej. `dentist-api.js`, `patient-api.js`, `auth-api.js`, `appointment-api.js`)
        - Uso en vistas: las páginas EJS inyectan scripts que consumen estos wrappers y los controladores UI en `public/js/*-controller.js`.
        - Configuración del API client: `frontend/public/js/api/config.js` (exporta `API_BASE_URL` y helpers `get*ApiUrl`).

        ## Ejemplos prácticos

        1) Obtener lista de dentistas (cliente)

        ```javascript
        import { getDentistApiUrl, getAuthHeaders } from './api/config.js';

        const res = await fetch(getDentistApiUrl('FIND_ALL'), {
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        const dentists = await res.json();
        ```

        2) Actualizar estado de cita (usado por el dashboard)

        ```javascript
        // DashboardAPI
        await fetch(`${API_BASE_URL}/appointments/${id}/status`, {
          method: 'PATCH',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        ```

        ## Buenas prácticas y notas

        - Mantener un único origen de verdad para URLs: `public/js/api/config.js` y `frontend/src/config/apiConfig.js`.
        - Usar los helpers (`getXApiUrl`) en lugar de concatenar strings para evitar inconsistencias.
        - Normalizar tipos antes de enviar (p. ej. `registrationNumber` como String cuando el backend valida longitud).
        - Para debugging rápido: abre DevTools > Network y revisa `Request Payload` + `Response` para cualquier 400/409.

        ## Cómo extender la documentación

        1. Si agregás un nuevo recurso: crear `frontend/public/js/api/new-resource-api.js` siguiendo el patrón.
        2. Añadir la nueva ruta a `frontend/src/config/apiConfig.js` (si lo usás server-side) y a `public/js/api/config.js` (cliente).
        3. Documentar el endpoint y ejemplos en este archivo.

        ---
