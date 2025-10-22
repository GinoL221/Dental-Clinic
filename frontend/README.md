# Frontend - Dental Clinic

Aplicación Express + EJS que actúa como capa de presentación para la API Java (backend).

## Resumen

Este frontend sirve vistas EJS y recursos estáticos (CSS/JS/assets). Contiene controladores cliente en `public/js` que consumen la API REST del backend (Spring Boot) alojada por defecto en `http://localhost:8080`.

Stack: Node.js, Express 5, EJS, Fetch API en frontend. Dependencias principales: axios (en algunos módulos), express, ejs.

## Requisitos

# Frontend - Dental Clinic

Este proyecto provee la capa de presentación: Express + EJS para render server-side y una carpeta `public/` con los controladores cliente (vanilla JS) que consumen la API backend.

Resumen rápido

- Stack: Node.js 18+, Express 5, EJS.
- Conexión: consume la API backend (por defecto en `http://localhost:8080`). La base de la API se configura en `public/js/api/config.js`.

Requisitos

- Node.js 18+ y npm
- Backend Spring Boot corriendo localmente (por defecto en `http://localhost:8080`)

Instalación y ejecución

```bash
cd frontend
npm install

# Desarrollo
npm run dev

# Producción / start normal
npm start
```

Por defecto el servidor escucha en `http://localhost:3000`

Estructura importante

- `app.js` - entrada de Express (configura routes, middlewares y static files).
- `src/routes/` - rutas que renderizan las vistas EJS.
- `src/views/` - plantillas EJS (pages y partials).
- `public/` - recursos estáticos: `css`, `js`, `assets`.
  - `public/js/api/` - wrappers que encapsulan llamadas a la API (auth, dentist, patient, appointment).
  - `public/js/client-controllers/` - lógica UI específica por vista.

Configuración de la API

La URL base está centralizada en `public/js/api/config.js` como `API_BASE_URL`. Si tu backend corre en otro host/puerto, actualiza esa constante o utiliza variables de entorno en la capa de despliegue.

Funciones utilitarias clave

- `getAuthHeaders()` — adjunta el token JWT desde `localStorage`.
- `handleApiError()` — manejo centralizado de errores (redirige en 401, limpia tokens en 403, muestra mensajes).

Endpoints usados (resumen)

- Auth: `/auth/login`, `/auth/register`, `/auth/validate`
- Dentists: `/dentists`, `/dentists/{id}`, `/dentists/registration/{number}`
- Patients: `/patients`, `/patients/check-card-identity`
- Appointments: `/appointments`, `/appointments/search`

Consulta `public/js/api/*.js` para detalles de cada wrapper y los modelos de payload.

Problemas comunes y cómo depurarlos

- 400 al crear/editar dentista (ej. "trim is not a function"): normalmente viene por tipos inconsistentes (Number vs String). Verifica el `Request Payload` en DevTools y normaliza valores en los formularios antes de enviar.
- ID de cita faltante en edición: verificar que el `appointment.id` se preserve en los formularios; revisar `ui-manager.js` y `form-manager.js` en `client-controllers`.
- Errores 401/403: revisar `getAuthHeaders()` y la presencia del token en localStorage; también comprobar CORS en el backend.

Seguridad / dependencias

- Ejecuta `npm audit` y `npm audit fix` periódicamente. Actualiza `axios` si aparecen CVEs críticos.

Desarrollo y contribuciones

1. Fork + branch `feature/` o `fix/`.
2. Ejecuta tests localmente (ver sección de backend para integración).
3. Abre PR con descripción clara y capturas si aplica.

Buenas prácticas

- Normalizar tipos en los formularios (parseInt, String) antes de enviar.
- Extraer scripts pesados desde vistas EJS a `public/js` para evitar que editores/IDE consuman demasiada memoria al abrir archivos grandes.

Smoke tests rápidos

1. Levantar backend en `http://localhost:8080`
2. Levantar frontend: `npm start`
3. Abrir `http://localhost:300` y probar creación de dentista; si hay errores, inspeccionar DevTools > Network > Request Payload + Response Body.

¿Quieres que genere tests básicos (Jest) para los wrappers de `public/js/api/` o un script de `curl` para reproducir peticiones? Indica cuál y lo creo.

---
