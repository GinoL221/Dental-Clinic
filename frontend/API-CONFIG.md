# Configuración Centralizada de APIs

Este documento explica cómo usar la configuración centralizada de URLs del backend para mantener un código más limpio y mantenible.

## Archivos de Configuración

### 1. Backend (Servidor Node.js)

**Archivo:** `frontend/src/config/apiConfig.js`

```javascript
const apiConfig = require("../../config/apiConfig");

// Usar URLs centralizadas
const backendResponse = await axios.post(
  apiConfig.getAuthUrl("LOGIN"), // En lugar de "http://localhost:8080/auth/login"
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

- `FIND_ALL` → `/dentist/findAll`
- `SAVE` → `/dentist/save`
- `UPDATE` → `/dentist/update`
- `DELETE` → `/dentist/delete`
- `FIND_BY_ID` → `/dentist/findById`

### Pacientes

- `FIND_ALL` → `/patient/findAll`
- `SAVE` → `/patient/save`
- `UPDATE` → `/patient/update`
- `DELETE` → `/patient/delete`
- `FIND_BY_ID` → `/patient/findById`

### Citas

- `FIND_ALL` → `/appointment/findAll`
- `SAVE` → `/appointment/save`
- `UPDATE` → `/appointment/update`
- `DELETE` → `/appointment/delete`
- `FIND_BY_ID` → `/appointment/findById`

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

## Ejemplos de Uso

### Crear nuevo endpoint

```javascript
// 1. Agregar a la configuración
ENDPOINTS: {
  USER: {
    PROFILE: "/user/profile",
    SETTINGS: "/user/settings"
  }
}

// 2. Crear helper (opcional)
getUserApiUrl: (userEndpoint) => {
  return config.getFullUrl(config.ENDPOINTS.USER[userEndpoint]);
}

// 3. Usar en el código
const profile = await fetch(getUserApiUrl("PROFILE"));
```

### Petición personalizada

```javascript
// Si necesitas un endpoint no definido
const response = await fetch(getApiUrl("/custom/endpoint"));
```
