# Clínica Dental MVC - Conexión Frontend-Backend

## Pasos para conectar la aplicación completa

### 1. Iniciar el Backend (Spring Boot)

```bash
# Navegar al directorio del backend
cd backend

# Ejecutar el proyecto con Maven (Windows)
./mvnw.cmd spring-boot:run

# O ejecutar con Maven (Linux/Mac)
./mvnw spring-boot:run
```

El backend estará disponible en: `http://localhost:8080`

### 2. Iniciar el Frontend (Express.js)

```bash
# Navegar al directorio del frontend
cd frontend

# Instalar dependencias (si no están instaladas)
npm install

# Iniciar el servidor de desarrollo
npm start
```

El frontend estará disponible en: `http://localhost:3000`

### 3. Verificar la conexión

1. **Verifica que el backend esté funcionando:**
   - Visita: `http://localhost:8080/dentists`
   - Deberías ver una respuesta JSON (vacía inicialmente): `[]`

2. **Verifica que el frontend esté funcionando:**
   - Visita: `http://localhost:3000`
   - Navega a la sección de "Gestión Odontólogos" > "Listar odontólogos"

### 4. Funcionalidades disponibles

#### API Endpoints (Backend):
- `GET /dentists` - Obtener todos los dentistas
- `GET /dentists/{id}` - Obtener un dentista por ID
- `POST /dentists` - Crear un nuevo dentista
- `PUT /dentists` - Actualizar un dentista
- `DELETE /dentists/{id}` - Eliminar un dentista
- `GET /dentists/registration/{number}` - Buscar por matrícula

#### Frontend Pages:
- `/` - Página de inicio
- `/dentists` - Lista de dentistas con CRUD completo
- `/dentists/add` - Formulario para agregar dentista
- `/dentists/edit/:id` - Formulario para editar dentista
- `/users/login` - Página de login
- `/users/register` - Página de registro

### 5. Base de datos

- El proyecto usa **H2 Database** en memoria
- Los datos se reinician cada vez que se reinicia el backend
- Console H2 disponible en: `http://localhost:8080/h2-console`
  - JDBC URL: `jdbc:h2:mem:dental1`
  - Username: `sa`
  - Password: `sa`

### 6. Estructura de datos

#### Dentist Entity:
```json
{
  "id": 1,
  "registrationNumber": 12345,
  "name": "Juan",
  "lastName": "Pérez"
}
```

### 7. Solución de problemas

#### Si el frontend no puede conectar al backend:
1. Verifica que el backend esté corriendo en el puerto 8080
2. Verifica que no hay errores de CORS (ya configurado)
3. Revisa la consola del navegador para errores

#### Si hay errores de CORS:
- El backend ya tiene configuración CORS para permitir el frontend
- Archivo: `backend/src/main/java/com/dh/dentalClinicMVC/configuration/CorsConfig.java`

#### Si la base de datos no tiene datos:
- Los datos se crean dinámicamente desde el frontend
- Usa el formulario "Agregar Dentista" para crear registros

### 8. Próximos pasos

1. **Agregar datos de prueba**: Crear un archivo `data.sql` con datos iniciales
2. **Implementar autenticación**: Conectar las páginas de login/register
3. **Agregar validaciones**: Implementar validaciones tanto en frontend como backend
4. **Manejo de errores**: Mejorar el manejo de errores y mensajes al usuario
