# Frontend - Dental Clinic

Aplicación Express + EJS que actúa como capa de presentación para la API Java (backend).

## Resumen

Este frontend sirve vistas EJS y recursos estáticos (CSS/JS/assets). Contiene controladores cliente en `public/js` que consumen la API REST del backend (Spring Boot) alojada por defecto en `http://localhost:8080`.

Stack: Node.js, Express 5, EJS, Fetch API en frontend. Dependencias principales: axios (en algunos módulos), express, ejs.

## Requisitos

- Node >= 18 (o LTS moderna)
- Java backend corriendo en `http://localhost:8080` (por defecto)

## Instalación

1. Ir al directorio `frontend`
2. Instalar dependencias:

   npm install

3. Levantar en modo desarrollo (con recarga):

   npm run dev

4. O iniciar normalmente:

   npm start

El servidor por defecto escucha en el puerto 3000.

## Estructura relevante

- `app.js` - punto de entrada de Express.
- `src/routes/` - definiciones de rutas del servidor (renderizado EJS).
- `src/views/` - plantillas EJS.
- `public/` - archivos estáticos servidos (css, js, assets).
- `public/js/api/` - wrappers para llamar a la API del backend (auth, dentists, patients appointments).
- `public/js/client-controllers/` - lógica que controla vistas específicas (forms, listados, UI helpers).

## Configuración de API

La URL base de la API está en `public/js/api/config.js` como `API_BASE_URL` (por defecto `http://localhost:8080`). Si tu backend corre en otro host/puerto, actualiza esa constante.

Funciones utilitarias en `config.js`:

- `getAuthHeaders()` - adjunta el token JWT localStorage (si existe).
- `handleApiError()` - manejo centralizado de errores (redirige en 401, limpia tokens en 403, etc.).

## Endpoints usados (resumen)

- Auth: `/auth/login`, `/auth/register`, `/auth/validate`
- Dentists: `/dentists` (GET, POST, PUT, DELETE), `/dentists/{id}`, `/dentists/registration/{number}`
- Patients: `/patients` (GET, POST, PUT, DELETE), `/patients/check-card-identity`
- Appointments: `/appointments` (GET, POST, PUT, DELETE), `/appointments/search`

Consulta `public/js/api/*.js` para detalles de cada wrapper.

## Problemas conocidos y troubleshooting

- 400 al crear/editar dentista ("trim is not a function" o validaciones):
- Causa común: el backend espera `registrationNumber` en un tipo (Integer o String según validación) y el frontend puede enviar Number o String. En `public/js/api/dentist-api.js` ya hay normalización que convierte valores solo numéricos a Number; sin embargo, si el backend aplica validación basada en tamaño/minLength, enviar Number puede provocar mensajes confusos.
- Qué revisar: en DevTools -> Network -> Request Payload ver exactamente el JSON enviado; revisar las validaciones en backend (logs / consola de Spring) para ver qué constraints se rompen.

- ID de cita faltante al editar cita (error: "ID de la cita es requerido"): revisar `public/js/api/appointment-api.js` y los módulos UI que llenan el formulario de edición (`client-controllers/appointment/modules/ui-manager.js` y `form-manager.js`) — los cambios recientes añaden logs para rastrear cuándo se pierde `appointment.id`.

- CORS / autorización: si ves 401/403 desde fetch, confirma que el backend acepta cookies y/o tokens; `getAuthHeaders()` agrega el header Authorization con token en localStorage.

- Dependencia axios: la versión en `package.json` es ^1.11.0. Ejecuta `npm audit` y `npm audit fix` si recibes avisos. Para proyectos en producción, revisa CVEs y actualiza dependencias a versiones seguras.

## Desarrollo y contribuciones

- Añadir nuevas rutas: crear la vista EJS en `src/views/` y el controlador JS en `public/js/client-controllers/`.
- Para llamadas a la API, usar los wrappers en `public/js/api/` para mantener manejo centralizado de errores y headers.

Buenas prácticas:
- Normalizar tipos antes de enviar (usar String(...) y parseInt cuando corresponda).
- No llamar `.trim()` directamente sobre valores que puedan ser Number/undefined.

## Comprobaciones rápidas (smoke tests)

1. Levantar backend (Spring Boot) en localhost:8080.
2. Levantar frontend: `npm start`.
3. Abrir `http://localhost:3000` y navegar a "Dentists" -> crear uno nuevo. En caso de 400, abrir DevTools > Network > seleccionar petición POST `/dentists` y copiar Request Payload + Response Body.

Si quieres, pega aquí el Request Payload y la respuesta del servidor y te ayudo a interpretar el error y ajustar el frontend o las validaciones del backend.

## Contacto

Si trabajas en equipo: deja un comentario en el PR o crea un issue describiendo el endpoint, payload y respuesta del servidor.

---
Pequeños siguientes pasos recomendados:

1. Ejecutar `npm audit` y actualizar axios si hay CVEs críticos.
2. Reproducir y compartir Request Payload + backend response para el error 400 en `/dentists`.
3. Si quieres, puedo generar tests unitarios simples para los wrappers de API (jest) o crear scripts de curl para reproducir peticiones rápidamente.
