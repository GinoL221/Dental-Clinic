# Configuración Centralizada de APIs

Este documento explica cómo usar la configuración centralizada de URLs del backend para mantener un código más limpio y mantenible.

## Archivos de Configuración

### 1. Backend (Servidor Node.js)

**Archivo:** `frontend/src/config/apiConfig.js`

```javascript
const apiConfig = require("../../config/apiConfig");

// Usar URLs centralizadas
const backendResponse = await axios.post(
  apiConfig.getAuthUrl("LOGIN"),
  { email, password }
);
```

### 2. Frontend (Cliente JavaScript)

**Archivo:** `frontend/public/js/api/config.js`

```javascript
// Usar helpers globales
const response = await fetch(getAuthApiUrl("LOGIN"), {
  method: "POST",
  headers: apiConfig.headers,
  body: JSON.stringify(credentials),
});
```

## Helpers Disponibles

### Backend (Node.js)

- `apiConfig.getAuthUrl(endpoint)` - URLs de autenticación
- `apiConfig.getDentistUrl(endpoint)` - URLs de dentistas
- `apiConfig.getPatientUrl(endpoint)` - URLs de pacientes
- `apiConfig.getAppointmentUrl(endpoint)` - URLs de citas
- `apiConfig.getFullUrl(endpoint)` - URL completa personalizada

### Frontend (JavaScript)

- `getAuthApiUrl(endpoint)` - URLs de autenticación
- `getDentistApiUrl(endpoint)` - URLs de dentistas
- `getPatientApiUrl(endpoint)` - URLs de pacientes
- `getAppointmentApiUrl(endpoint)` - URLs de citas
- `getApiUrl(endpoint)` - URL completa personalizada

## Endpoints Disponibles

### Autenticación

- `LOGIN` → `/auth/login`
- `REGISTER` → `/auth/register`
- `LOGOUT` → `/auth/logout`
- `VALIDATE` → `/auth/validate`
- `REFRESH` → `/auth/refresh`

### Dentistas

- `FIND_ALL` → `/dentists`
- `SAVE` → `/dentists`
- `UPDATE` → `/dentists/{id}`
- `DELETE` → `/dentists/{id}`
- `FIND_BY_ID` → `/dentists/{id}`

### Pacientes

- `FIND_ALL` → `/patients`
- `SAVE` → `/patients`
- `UPDATE` → `/patients/{id}`
- `DELETE` → `/patients/{id}`
- `FIND_BY_ID` → `/patients/{id}`

### Citas

- `FIND_ALL` → `/appointments`
- `SAVE` → `/appointments`
- `UPDATE` → `/appointments/{id}`
- `DELETE` → `/appointments/{id}`
- `FIND_BY_ID` → `/appointments/{id}`

## Configuración de Entorno

### Cambiar URL del Backend

**Opción 1:** Variable de entorno

```bash
export BACKEND_URL=https://api.miapp.com
```

**Opción 2:** Modificar archivo de configuración

```javascript
// En apiConfig.js
BACKEND_URL: process.env.BACKEND_URL || "http://localhost:8080";
```

## Ventajas

✅ **Mantenibilidad:** Un solo lugar para cambiar URLs  
✅ **Consistencia:** Todas las peticiones usan la misma configuración  
✅ **Flexibilidad:** Fácil cambio entre entornos (dev/prod)  
✅ **Menos errores:** No más URLs hardcodeadas dispersas  
✅ **Autocompletado:** Los IDEs pueden sugerir endpoints disponibles

## Migración de Código Existente

### Antes

```javascript
const response = await fetch("http://localhost:8080/auth/login", {
  method: "POST",
  body: JSON.stringify(data),
});
```

### Después

```javascript
const response = await fetch(getAuthApiUrl("LOGIN"), {
  method: "POST",
  body: JSON.stringify(data),
});
```

---
