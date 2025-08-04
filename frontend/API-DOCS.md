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
        // Propiedades del controlador
        this.elementos = null;
        this.init();
    }

    init() {
        // Inicialización principal
        this.bindElements();    // Enlazar elementos DOM
        this.attachEvents();    // Agregar event listeners
        this.loadData();        // Cargar datos iniciales
    }

    bindElements() {
        // Obtener referencias a elementos DOM
        this.form = document.getElementById('miFormulario');
    }

    attachEvents() {
        // Agregar event listeners
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }

    async handleSubmit(e) {
        // Manejar eventos
    }
}

// Auto-inicialización
document.addEventListener('DOMContentLoaded', () => {
    new MiControlador();
});
```

## Controladores Existentes

### 1. LoginController (auth/login-controller.js)
**Página:** `/users/login`
**Funcionalidades:**
- Validación de formulario de login
- Llamada a AuthAPI.login()
- Redirección automática si ya está autenticado
- Efectos visuales en inputs
- Manejo de errores específicos

**Elementos DOM requeridos:**
- `#loginForm` - Formulario principal
- `#email` - Input de email
- `#password` - Input de contraseña

### 2. RegisterController (auth/register-controller.js)
**Página:** `/users/register`
**Funcionalidades:**
- Validación completa de registro
- Verificación de contraseñas coincidentes
- Llamada a AuthAPI.register()
- Validación en tiempo real

**Elementos DOM requeridos:**
- `#registerForm` - Formulario principal
- `#firstName, #lastName, #email, #password, #confirmPassword, #role`

### 3. DentistListController (dentist/dentist-list-controller.js)
**Página:** `/dentists`
**Funcionalidades:**
- Carga y renderizado de lista de dentistas
- Edición inline de dentistas
- Eliminación con confirmación
- Formulario de actualización dinámico

**Elementos DOM requeridos:**
- `#dentistTableBody` - Tbody de la tabla
- `#update_dentist_form` - Formulario de edición
- `#div_dentist_updating` - Contenedor del formulario
- `#dentist_id, #registrationNumber, #name, #lastName`

## Uso en Páginas EJS

### Orden de Carga de Scripts
```html
<!-- Bootstrap (requerido para alertas y componentes) -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

<!-- APIs en orden obligatorio -->
<script src="/js/api/config.js"></script>
<script src="/js/api/utils.js"></script>
<script src="/js/api/auth-api.js"></script>
<script src="/js/api/dentist-api.js"></script>
<script src="/js/api.js"></script>

<!-- Controlador específico de la página -->
<script src="/js/controllers/auth/login-controller.js"></script>
```

### Ejemplo en EJS
```html
<!-- login.ejs -->
<!DOCTYPE html>
<html>
<head>
    <%- include('../partials/head') %>
</head>
<body>
    <%- include('../partials/header') %>
    
    <main>
        <!-- Solo estructura HTML, sin JavaScript inline -->
        <form id="loginForm">
            <input type="email" id="email" required>
            <input type="password" id="password" required>
            <button type="submit">Ingresar</button>
        </form>
    </main>
    
    <%- include('../partials/footer') %>
    
    <!-- Scripts (sin JavaScript inline) -->
    [scripts como se mostró arriba]
</body>
</html>
```

## APIs Disponibles

### 1. AuthAPI (auth-api.js)
Maneja autenticación y usuarios:

```javascript
// Login
const response = await AuthAPI.login(email, password);

// Registro
const response = await AuthAPI.register(firstName, lastName, email, password, role);

// Logout
AuthAPI.logout();

// Verificar autenticación
if (AuthAPI.isAuthenticated()) { ... }

// Obtener token
const token = AuthAPI.getToken();

// Obtener rol
const role = AuthAPI.getUserRole();

// Verificar si es admin
if (AuthAPI.isAdmin()) { ... }
```

### 2. DentistAPI (dentist-api.js)
Maneja operaciones CRUD de dentistas:

```javascript
// Obtener todos
const dentists = await DentistAPI.getAll();

// Obtener por ID
const dentist = await DentistAPI.getById(id);

// Crear nuevo
const newDentist = await DentistAPI.create({
    firstName: "Juan",
    lastName: "Pérez", 
    registrationNumber: "MP123"
});

// Actualizar
await DentistAPI.update({
    id: 1,
    firstName: "Juan Carlos",
    lastName: "Pérez",
    registrationNumber: "MP123"
});

// Eliminar
await DentistAPI.delete(id);

// Buscar por matrícula
const dentist = await DentistAPI.getByRegistrationNumber("MP123");

// Formatear para mostrar
const formatted = DentistAPI.formatDentistDisplay(dentist);
```

### 3. UIUtils (utils.js)
Utilidades para manejo de UI:

```javascript
// Mostrar alertas
UIUtils.showSuccess("Operación exitosa");
UIUtils.showError("Error en la operación");
UIUtils.showInfo("Información importante");

// Validaciones
if (UIUtils.isValidEmail(email)) { ... }

// Manejo de formularios
UIUtils.clearForm('formularioId');

// Botones con loading
UIUtils.setButtonLoading(button, true, 'Texto original');
UIUtils.setButtonLoading(button, false, 'Texto original');
```

## Configuración (config.js)

### Variables Globales
- `API_BASE_URL`: URL base del backend (http://localhost:8080)
- `apiConfig`: Configuración común de headers
- `getAuthHeaders()`: Headers con autenticación automática
- `handleApiError()`: Manejo centralizado de errores

### Manejo de Autenticación
El sistema automáticamente:
- Incluye tokens JWT en las peticiones
- Redirige al login si el token expira (error 401)
- Almacena tokens en localStorage

## Páginas Protegidas

El sistema automáticamente protege páginas como:
- `/dentists/*`
- `/appointments/*`

Si un usuario no autenticado intenta acceder, es redirigido al login.

## Validaciones

### Dentistas
- firstName: mínimo 2 caracteres
- lastName: mínimo 2 caracteres  
- registrationNumber: mínimo 3 caracteres, solo letras y números

### Usuarios
- email: formato válido
- password: mínimo 6 caracteres
- nombres: campos requeridos

## Manejo de Errores

### Tipos de Error Automáticos
- 401: Redirige al login
- 404: Mensaje "no encontrado"
- 409: Mensaje "ya existe"
- 400: Mensaje "datos inválidos"

### Personalización
```javascript
try {
    await DentistAPI.create(dentist);
} catch (error) {
    // error.message contiene el mensaje específico
    UIUtils.showError(error.message);
}
```

## Extensión del Sistema

### Agregar Nueva API
1. Crear archivo en `/js/api/nueva-api.js`
2. Seguir el patrón de las APIs existentes
3. Incluir en el orden de carga de scripts
4. Documentar aquí

### Agregar Nueva Validación
```javascript
// En utils.js
UIUtils.nuevaValidacion = function(valor) {
    // lógica de validación
    return esValido;
};
```

## Debugging

Para debuggear el sistema:
1. Abrir DevTools Console
2. Verificar que aparezca: "✅ API Sistema cargado correctamente"
3. Si aparece error, verificar orden de scripts
4. Todos los errores de API se logean en console

## Futuras Mejoras

- [ ] API de citas (AppointmentAPI)
- [ ] API de pacientes
- [ ] Caché de datos
- [ ] Modo offline
- [ ] Interceptores de peticiones
- [ ] Refresh automático de tokens
