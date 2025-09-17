# 🦷 Sistema de Gestión - Clínica Dental

> Sistema completo de gestión para clínicas dentales con autenticación JWT y roles

## 🌟 Características

- 👨‍⚕️ **Gestión de Dentistas** - CRUD con matrícula profesional
- 👤 **Gestión de Pacientes** - Datos personales y admisión
- 📅 **Sistema de Citas** - Estados: SCHEDULED, COMPLETED, CANCELLED
- 🔒 **Autenticación JWT** - Roles: ADMIN, DENTIST, PATIENT
- 📊 **API RESTful** - Endpoints documentados

## 🛠️ Tecnologías Backend

- **Java 17** + **Spring Boot 3.0**
- **Spring Security** + **JWT**
- **JPA/Hibernate** - Herencia TABLE_PER_CLASS
- **MySQL** / **H2** (desarrollo)

## 🏗️ Arquitectura de Base de Datos

User (users) - Clase base
    ├── Patient (patients) - Herencia TABLE_PER_CLASS
    └── Dentist (dentists) - Herencia TABLE_PER_CLASS

Appointment (appointments)
    ├── patient_id → Patient
    └── dentist_id → Dentist

Address (addresses)
    └── patient.address_id → Address

## 📊 Diagrama Entidad-Relación (ER)

![Diagrama ER](docs/diagrama-er.webp)

## 📐 Diagrama UML de Clases

![Diagrama UML](docs/diagrama-uml.webp)

## 📱 API Endpoints Principales

### Autenticación

POST /api/auth/register # Registro usuarios
POST /api/auth/login # Login con JWT
GET /api/auth/check-email?email=test@email.com

### Gestión de Usuarios

GET /api/patients # Listar pacientes
GET /api/patients/{id} # Obtener paciente
POST /api/patients # Crear paciente
PUT /api/patients/{id} # Actualizar paciente
DELETE /api/patients/{id} # Eliminar paciente

GET /api/dentists # Listar dentistas
POST /api/dentists # Crear dentista
PUT /api/dentists/{id} # Actualizar dentista

### Citas Médicas

GET /api/appointments # Listar todas
GET /api/appointments/{id} # Obtener por ID
POST /api/appointments # Crear cita
PUT /api/appointments/{id} # Actualizar cita
DELETE /api/appointments/{id} # Eliminar cita
GET /api/appointments/search?patient=Juan&status=SCHEDULED

### 🚀 Instalación y Ejecución

### Prerrequisitos

    • Java 17+
    • MySQL 8.0+ (o H2 para desarrollo)
    • Maven 3.6+

### Configuración

    1.Clonar repositorio
    2.Configurar base de datos en application.yml
    3.Ejecutar backend:

cd backend
./mvnw spring-boot:run

Backend disponible en: http://localhost:8080

### 🔐 Roles y Permisos

    •ADMIN: Acceso completo, crear dentistas y pacientes
    •DENTIST: Ver y gestionar sus citas asignadas
    •PATIENT: Ver sus propias citas

### 📊 Estados de Citas

    •SCHEDULED - Programada
    •IN_PROGRESS - En progreso
    •COMPLETED - Completada
    •CANCELLED - Cancelada

### 🧪 Testing

# Ejecutar tests

./mvnw test

# Tests con coverage

./mvnw test jacoco:report

### 📚 Documentación Adicional

    •API Documentation
    •Conexión Frontend-Backend

👨‍💻 Desarrollado por Gino Lencina
⭐ Backend completado