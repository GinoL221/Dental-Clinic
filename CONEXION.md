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

1. **Backend funcionando:**

   ```
   GET http://localhost:8080/patients
   GET http://localhost:8080/dentists
   GET http://localhost:8080/appointments
   ```

2. **Frontend funcionando:**
   - Visita: `http://localhost:3000`
   - Páginas disponibles: Dashboard, Login, Gestión de Citas

### 4. Autenticación JWT

#### Crear usuario administrador:

```bash
POST http://localhost:8080/auth/register
Content-Type: application/json

{
    "firstName": "Admin",
    "lastName": "Sistema",
    "email": "admin@clinica.com",
    "password": "admin123",
    "role": "ADMIN"
}
```

#### Login:

```bash
POST http://localhost:8080/auth/login
Content-Type: application/json

{
    "email": "admin@clinica.com",
    "password": "admin123"
}
```

**Respuesta:** Token JWT para usar en headers:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### 5. API Endpoints Principales

#### Autenticación

- `POST http://localhost:8080/auth/register` - Registro usuarios (ADMIN/DENTIST/PATIENT)
- `POST http://localhost:8080/auth/login` - Login con JWT
- `GET http://localhost:8080/auth/check-email?email=test@email.com` - Verificar email

#### Gestión de Pacientes

- `GET http://localhost:8080/patients` - Listar todos
- `GET http://localhost:8080/patients/{id}` - Obtener por ID
- `POST http://localhost:8080/patients` - Crear paciente
- `PUT http://localhost:8080/patients/{id}` - Actualizar paciente
- `DELETE http://localhost:8080/patients/{id}` - Eliminar paciente

#### Gestión de Dentistas

- `GET http://localhost:8080/dentists` - Listar todos
- `POST http://localhost:8080/dentists` - Crear dentista
- `PUT http://localhost:8080/dentists/{id}` - Actualizar dentista
- `DELETE http://localhost:8080/dentists/{id}` - Eliminar dentista

#### Citas Médicas

- `GET http://localhost:8080/appointments` - Listar todas
- `POST http://localhost:8080/appointments` - Crear cita
- `GET http://localhost:8080/appointments/search?patient=Juan&status=SCHEDULED` - Búsqueda

### 6. Estructura de datos actualizada

#### Patient:

```json
{
  "id": 1,
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@email.com",
  "role": "PATIENT",
  "cardIdentity": 12345678,
  "admissionDate": "2025-01-15",
  "address": {
    "street": "Av. Principal",
    "number": 123,
    "location": "Ciudad",
    "province": "Provincia"
  }
}
```

#### Dentist:

```json
{
  "id": 2,
  "firstName": "Ana",
  "lastName": "García",
  "email": "ana@clinica.com",
  "role": "DENTIST",
  "registrationNumber": 54321
}
```

#### Appointment:

```json
{
  "id": 1,
  "patient_id": 1,
  "dentist_id": 2,
  "date": "2025-09-15",
  "time": "14:00",
  "description": "Limpieza dental",
  "status": "SCHEDULED"
}
```

### 7. Base de datos

- **Desarrollo**: H2 Database en memoria
- **Producción**: MySQL/PostgreSQL
- **Estrategia**: TABLE_PER_CLASS (users, patients, dentists separados)

**Console H2:** `http://localhost:8080/h2-console`

- JDBC URL: `jdbc:h2:mem:testdb`
- Username: `sa`
- Password: (vacío)

### 8. Flujo típico de uso

1. **Admin se registra/logea**
2. **Admin crea dentistas y pacientes**
3. **Programar citas entre pacientes y dentistas**
4. **Gestionar estados de citas (SCHEDULED → COMPLETED)**

### 9. Solución de problemas

#### Error "Paciente no encontrado":

- Verifica que el `patient_id` existe en tabla `patients`
- Usa endpoints GET para ver IDs disponibles

#### Error "Dentista no encontrado":

- Verifica que el `dentist_id` existe en tabla `dentists`

#### Error 401 Unauthorized:

- Incluir header: `Authorization: Bearer {token}`
- Verificar que el token no haya expirado

#### Error CORS:

- Backend configurado para aceptar `http://localhost:3000`
- Revisar `CorsConfig.java`

---

💡 **Tip:** Usa Postman o Thunder Client para probar los endpoints antes de integrar con frontend
