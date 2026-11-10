# Producto — Dental Clinic

Documento vivo de producto. Describe **qué hace el sistema hoy**, verificado contra el código (referencias `archivo:línea` entre paréntesis). Lo que todavía no existe o está roto figura en [Brechas conocidas](#brechas-conocidas), nunca como funcionalidad.

## 1. Propósito

Sistema de gestión para una clínica dental: alta y mantenimiento de pacientes y odontólogos, agenda de turnos con validación de horario y colisiones, y un panel analítico para administración. Usa autenticación JWT transportada en cookies `httpOnly`.

**Quién lo usa y para qué**

| Rol       | Trabajo principal                                            | Condición de éxito                                       |
| --------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| `ADMIN`   | Operar la clínica: pacientes, odontólogos, turnos, métricas. | Ver el estado de la agenda y corregirlo sin errores 403. |
| `DENTIST` | Ver y atender sus propios turnos; mantener su perfil.        | Cambiar el estado de un turno propio en pocos pasos.     |
| `PATIENT` | Registrarse, sacar turno y mantener sus datos.               | Reservar un turno válido sin ayuda de la clínica.        |
| Visitante | Conocer el sistema, registrarse o ingresar.                  | Llegar a `/login` o `/users/register` sin fricción.      |

## 2. Alcance

**Dentro del producto actual**

- Registro público de pacientes e inicio de sesión.
- CRUD de pacientes, odontólogos y turnos con permisos por rol.
- Estados de turno con máquina de transiciones.
- Dashboard de administración con métricas, filtros y gráficos.
- Especialidades de odontólogos (solo API; ver brechas).

**Fuera de alcance (no implementado)**

- Historia clínica, odontograma, tratamientos y facturación.
- Notificaciones por email o SMS y recordatorios.
- Disponibilidad horaria configurable por odontólogo (el horario es fijo, ver §5).
- Recuperación de contraseña.

## 3. Roles y matriz de permisos

Roles definidos en `Role.java:3-7`. La autorización real vive en el backend (`@PreAuthorize`); el frontend solo redirige y oculta controles.

| Recurso                   | `ADMIN` | `DENTIST`                               | `PATIENT`                            |
| ------------------------- | ------- | --------------------------------------- | ------------------------------------ |
| Dashboard (snapshot)      | Ver     | —                                       | —                                    |
| Pacientes: listar         | Sí      | Sí                                      | —                                    |
| Pacientes: ver por id     | Sí      | Sí                                      | Solo el propio                       |
| Pacientes: crear / borrar | Sí      | —                                       | —                                    |
| Pacientes: editar         | Sí      | —                                       | Solo el propio (sin email ni DNI)    |
| Odontólogos: listar       | Sí      | Sí                                      | Sí                                   |
| Odontólogos: ver por id   | Sí      | —                                       | —                                    |
| Odontólogos: crear/borrar | Sí      | —                                       | —                                    |
| Odontólogos: editar       | Sí      | Solo el propio (sin email ni matrícula) | —                                    |
| Turnos: listar / buscar   | Todos   | Solo los suyos                          | Solo los suyos                       |
| Turnos: ver por id        | Sí      | Solo los suyos                          | —                                    |
| Turnos: crear             | Sí      | Sí                                      | Sí (se fuerza su propio `patientId`) |
| Turnos: editar            | Sí      | Solo los suyos, sin reasignar dentista  | —                                    |
| Turnos: cambiar estado    | Sí      | Solo los suyos                          | —                                    |
| Turnos: borrar            | Sí      | —                                       | —                                    |
| Especialidades: leer      | Sí      | Sí                                      | —                                    |
| Especialidades: escribir  | Sí      | —                                       | —                                    |

Fuentes: `PatientController.java:38-120`, `DentistController.java:38-119`, `AppointmentController.java:56-216`, `SpecialtyController.java:25-85`, `DashboardController.java:24-38`.

**Rutas públicas de la API:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/check-email` (`SecurityConfiguration.java:68-87`). `GET /api/auth/me` exige sesión.

**Guards del frontend** (`hooks.server.js:4-45`): `/dashboard`, `/patients`, `/dentists` y `/appointments` exigen la cookie `authToken`; la sesión se resuelve contra `GET /api/auth/me` y, si falla, se borran las cookies y se redirige con `303` a `/login`. `/dashboard` además devuelve `403` si el rol no es `ADMIN` (`dashboard/+page.server.js:37`).

## 4. Modelo de dominio

```text
User (id, firstName, lastName, email único, password solo escritura, role)
 ├─ Patient  (cardIdentity único, admissionDate, address 1:1)
 └─ Dentist  (registrationNumber único, specialties N:M)
Address      (street, number, location, province)
Specialty    (name único, description)
Appointment  (patient, dentist, date, time, description ≤ 500, status)
```

Fuentes: `User.java:28-44`, `Patient.java:23-38`, `Dentist.java:23-35`, `Address.java:16-30`, `Specialty.java:17-26`, `Appointment.java:32-57`.

Reglas de integridad relevantes:

- Un odontólogo no puede tener dos turnos **activos** en la misma fecha y hora: restricción única `uk_appointment_active_dentist_slot` sobre `(dentist_id, date, time, active_slot)`; `active_slot` es nulo cuando el turno está cancelado, así un horario cancelado queda libre.
- DNI (`cardIdentity`), matrícula y email son únicos.
- Si se da de alta un paciente u odontólogo sin contraseña, se genera una por defecto a partir de nombre, apellido y los últimos 3 dígitos del DNI o matrícula (`UserPasswordPolicy.java:16-24`).

## 5. Turnos

### Estados y transiciones

| Estado        | Etiqueta en UI sugerida | Transiciones permitidas                              |
| ------------- | ----------------------- | ---------------------------------------------------- |
| `SCHEDULED`   | Programado              | `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `IN_PROGRESS` | En curso                | `COMPLETED`, `CANCELLED`                             |
| `COMPLETED`   | Completado              | Ninguna (terminal)                                   |
| `CANCELLED`   | Cancelado               | Ninguna (terminal)                                   |

Una transición inválida lanza `InvalidStatusTransitionException` (`AppointmentStatus.java:9-20`, `AppointmentServiceImpl.java:200`).

### Reglas de agenda

(`AppointmentScheduleValidator.java:16-55`)

- Fecha `yyyy-MM-dd`, hora `HH:mm`.
- No se admiten fechas pasadas; el mismo día, tampoco horas anteriores a la actual.
- Solo lunes a viernes.
- Franja entre `08:00` y `18:00`.
- Colisión: si el odontólogo ya tiene un turno no cancelado en esa fecha y hora, error «El odontólogo ya tiene un turno en esa fecha y hora» (`AppointmentServiceImpl.java:82-84`).

## 6. Validación de entradas

| Entrada    | Reglas                                                                                  |
| ---------- | --------------------------------------------------------------------------------------- |
| Registro   | nombre, apellido, email, contraseña ≥ 6, DNI positivo (`RegisterRequest.java:21-48`).   |
| Paciente   | nombre y apellido ≥ 2, email válido, DNI positivo, fecha de admisión, dirección válida. |
| Odontólogo | nombre y apellido ≥ 2, email válido, matrícula positiva.                                |
| Dirección  | calle, localidad y provincia no vacías; número positivo.                                |
| Turno      | odontólogo y paciente obligatorios, fecha, hora y descripción ≤ 500 caracteres.         |

Fuentes: `PatientRequestDTO.java:15-32`, `DentistRequestDTO.java:14-29`, `AddressRequestDTO.java:12-25`, `AppointmentRequestDTO.java:13-28`.

## 7. Mapa de pantallas

El idioma de toda la interfaz es **español**.

| Ruta                      | Rol que accede     | Propósito                                                              |
| ------------------------- | ------------------ | ---------------------------------------------------------------------- |
| `/`                       | Todos              | Landing: presentación, características, accesos de demo.               |
| `/login`                  | Visitante          | Ingreso con email y contraseña.                                        |
| `/users/register`         | Visitante          | Alta de paciente con dirección y confirmación de contraseña.           |
| `/users/logout`           | Autenticado        | Acción POST que borra las cookies y vuelve a `/`.                      |
| `/dashboard`              | `ADMIN`            | Métricas, filtros por fecha y odontólogo, 3 gráficos, próximos turnos. |
| `/patients`               | `ADMIN`, `DENTIST` | Tabla con búsqueda en vivo, alta, edición y borrado.                   |
| `/patients/add`           | `ADMIN`            | Alta de paciente.                                                      |
| `/patients/edit/[id]`     | `ADMIN`, `PATIENT` | Edición con datos precargados.                                         |
| `/dentists`               | Autenticados       | Tabla con filtro, alta, edición y borrado.                             |
| `/dentists/add`           | `ADMIN`            | Alta de odontólogo.                                                    |
| `/dentists/edit/[id]`     | `ADMIN`, `DENTIST` | Edición con datos precargados.                                         |
| `/appointments`           | Autenticados       | Tabla de turnos con estado, búsqueda y acciones.                       |
| `/appointments/add`       | Autenticados       | Programar turno con vista previa del paciente.                         |
| `/appointments/edit/[id]` | `ADMIN`, `DENTIST` | Reprogramar o editar un turno existente.                               |

Navegación: la barra superior cambia según el rol; «Dashboard» solo aparece para `ADMIN` (`+layout.svelte:30-170`).

## 8. Métricas del dashboard

Tarjetas: turnos totales, turnos de hoy, odontólogos y pacientes. Gráficos (uPlot): evolución mensual, desglose por estado y desglose por odontólogo. Filtros: rango de fechas y odontólogo. Lista de próximos turnos con cambio rápido de estado (`dashboard/+page.svelte`, datos desde `GET /api/dashboard/snapshot`).

## Brechas conocidas

Hallazgos verificados al redactar este documento. No se corrigen aquí; cada uno es candidato a su propio cambio.

| #   | Brecha                                                                                                                                                                                                                                        | Evidencia                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| G1  | La landing muestra credenciales de demo que no funcionan: admin con `Admin123!` (el seed usa `admin123`) y usuarios dentista y paciente que el seed no crea.                                                                                  | `+page.svelte:239,254,267`, `DataInitializer.java:79`, `CONEXION.md:27`                     |
| G2  | Un `PATIENT` que abre `/appointments/add` provoca un error 500: la página llama a `GET /api/patients`, reservado a `ADMIN` y `DENTIST`. El backend sí permite a un paciente crear turnos.                                                     | `appointments/add/+page.server.js:14-17`, `PatientController.java:120`                      |
| G3  | Los listados no condicionan por rol los botones «Agregar Paciente», «Agregar Odontólogo» ni «Eliminar»: quien no tiene el permiso (por ejemplo `DENTIST` en pacientes, o `DENTIST` y `PATIENT` al eliminar turnos) los ve y termina en `403`. | `patients/+page.svelte:56,130`, `dentists/+page.svelte:56`, `appointments/+page.svelte:156` |
| G4  | Un `PATIENT` no puede ver el detalle de un turno ni editarlo (`GET`/`PUT` por id son solo `ADMIN` y `DENTIST`), pero la navegación le ofrece «Listar citas» con enlaces de edición.                                                           | `AppointmentController.java:73,100`, `appointments/+page.svelte:131`                        |
| G5  | Las especialidades existen en la API y el modelo, pero ninguna pantalla las gestiona ni las muestra.                                                                                                                                          | `SpecialtyController.java:24-85`, rutas del frontend                                        |
| G6  | La API usa `camelCase` al recibir turnos (`patientId`) y `snake_case` al responder (`patient_id`).                                                                                                                                            | `AppointmentDTO.java:11-12`, `CONEXION.md:67-93`                                            |
| G7  | Enlace de edición solo con ícono, sin nombre accesible, en próximos turnos del dashboard.                                                                                                                                                     | `dashboard/+page.svelte:637-641`                                                            |

## Decisiones pendientes de producto

- ¿Puede un `PATIENT` ver y cancelar sus propios turnos? Hoy puede crearlos, pero no consultarlos por id ni cambiarles el estado.
- ¿Debe existir un perfil propio («Mi cuenta») para `PATIENT` y `DENTIST`?
- ¿Las especialidades se gestionan desde la interfaz y se usan para elegir odontólogo al reservar?
- ¿Horario y días laborables configurables por odontólogo, o se mantiene la franja fija?
