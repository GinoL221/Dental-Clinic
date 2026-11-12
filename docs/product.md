# Producto — Dental Clinic

Documento vivo de producto. Define el **propósito del proyecto**, la experiencia de evaluación objetivo y las **capacidades implementadas hoy** verificadas contra el código (referencias `archivo:línea` entre paréntesis). Lo que todavía no existe o está pendiente figura como límite explícito o en [Brechas conocidas](#brechas-conocidas), nunca como funcionalidad terminada.

## 1. Propósito, usuarios y posicionamiento

### Propósito del producto

**Dental Clinic** es un proyecto de portafolio/CV que implementa un sistema de gestión odontológica full-stack (Spring Boot 3 / Java 21 + SvelteKit 2): alta y mantenimiento de pacientes y odontólogos, agenda de turnos con validación de horarios y colisiones, autenticación JWT en cookies `httpOnly`, control de acceso por rol y propiedad (anti-IDOR), y un panel analítico para administración.

Su objetivo es demostrar criterio de ingeniería y diseño mediante un producto funcional cuyas entrañas resisten inspección técnica, más allá de una maqueta visual. Las capacidades documentadas abajo reflejan el comportamiento implementado en el repositorio; la disponibilidad de un despliegue público (Railway) y el aislamiento entre visitantes concurrentes son objetivos de entrega separados y no se dan por probados solo por existir el código o las credenciales de prueba en la landing.

### Audiencias

- **Usuario primario — Evaluador técnico (reclutador, líder técnico o ingeniero):** llega desde el CV, GitHub o el portafolio personal para evaluar cómo se construye y asegura el software. Recorre los flujos de los tres roles, inspecciona bordes (permisos, validación, manejo de errores, pruebas) y contrasta la interfaz con el código.
- **Usuarios secundarios — Roles operativos del dominio clínico:** las personas que el sistema modela en operación real (`ADMIN`, `DENTIST`, `PATIENT` y visitante). Cada flujo de negocio se diseña de forma honesta para estos roles y es juzgado por el evaluador primario.

| Rol / Actor       | Trabajo principal                                                                      | Condición de éxito                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Evaluador técnico | Probar recorridos por rol (`ADMIN`, `DENTIST`, `PATIENT`) e inspeccionar arquitectura. | Comprobar límites de permisos reales en backend/UI, datos sembrados coherentes y cero errores 500. |
| `ADMIN`           | Operar la clínica: pacientes, odontólogos, turnos y métricas del dashboard.            | Gestionar agenda y catálogo completo y analizar el estado operativo sin fricción.                  |
| `DENTIST`         | Consultar y atender sus propios turnos; actualizar su perfil profesional.              | Cambiar el estado de un turno propio o editar sus datos sin acceder a agendas ajenas.              |
| `PATIENT`         | Registrarse, reservar turno y consultar su agenda.                                     | Reservar un turno válido sin ayuda de la clínica y sin ver datos de otros pacientes.               |
| Visitante         | Conocer el sistema, registrarse como paciente o iniciar sesión.                        | Llegar a `/login` o `/users/register` y comprender el alcance de la demo sin fricción.             |

### Posicionamiento técnico

Lo que distingue a este proyecto de un CRUD de plantilla es la consistencia entre su superficie y su implementación:

- **Seguridad aplicada en el backend:** autenticación JWT stateless servida mediante cookies `httpOnly` en SvelteKit (`hooks.server.js`), reglas `@PreAuthorize` por rol, guardas explícitas contra IDOR en turnos, pacientes y odontólogos, y contraseñas temporales aleatorias de 14 caracteres con cambio obligatorio en el primer inicio de sesión (`mustChangePassword`).
- **Esquema e integridad de datos:** migraciones versionadas con Flyway (`V1` a `V3`) y restricción única de colisión de turnos activos por odontólogo, fecha y hora.
- **Calidad verificable:** suites automatizadas en backend (JUnit 5 + MockMvc), frontend (Vitest + `svelte-check` + `tsc`) y runner E2E full-stack con manejo limpio de procesos.

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
| Odontólogos: ver por id   | Sí      | Solo el propio                          | —                                    |
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

Fuentes: `PatientController.java:32-115`, `DentistController.java:32-124`, `AppointmentController.java:55-232`, `SpecialtyController.java:25-85`, `DashboardController.java:24-38`.

**Rutas públicas de la API:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/check-email` (`SecurityConfiguration.java:65-92`). `GET /api/auth/me` y `POST /api/auth/change-password` exigen sesión autenticada (`AuthenticationController.java:36-61`).

**Guards del frontend** (`hooks.server.js:4-57`): `/dashboard`, `/patients`, `/dentists`, `/appointments` y `/users/change-password` exigen la cookie `authToken`; la sesión se resuelve contra `GET /api/auth/me` y, si falla, se borran las cookies y se redirige con `303` a `/login`. Si `event.locals.user.mustChangePassword` es `true`, cualquier petición que no sea `/users/change-password` ni `/users/logout` redirige con `303` a `/users/change-password` hasta que el usuario actualice su clave (`hooks.server.js:48-54`). `/dashboard` además devuelve `403` si el rol no es `ADMIN` (`dashboard/+page.server.js:37`).

## 4. Modelo de dominio

```text
User (id, firstName, lastName, email único, password solo escritura, role, mustChangePassword)
 ├─ Patient  (cardIdentity único, admissionDate, address 1:1)
 └─ Dentist  (registrationNumber único, specialties N:M)
Address      (street, number, location, province)
Specialty    (name único, description)
Appointment  (patient, dentist, date, time, description ≤ 500, status)
```

Fuentes: `User.java:28-54`, `Patient.java:23-38`, `Dentist.java:23-35`, `Address.java:16-30`, `Specialty.java:17-26`, `Appointment.java:32-57`.

Reglas de integridad relevantes:

- Un odontólogo no puede tener dos turnos **activos** en la misma fecha y hora: restricción única `uk_appointment_active_dentist_slot` sobre `(dentist_id, date, time, active_slot)`; `active_slot` es nulo cuando el turno está cancelado, así un horario cancelado queda libre.
- DNI (`cardIdentity`), matrícula y email son únicos.
- Si un `ADMIN` da de alta un paciente u odontólogo sin especificar contraseña, `UserPasswordPolicy.resolveForCreate(...)` genera una contraseña temporal aleatoria de 14 caracteres con `SecureRandom`, el servicio persiste `mustChangePassword = true` en el usuario y el servicio completa el DTO de respuesta con `temporaryPassword` para que el `POST` la devuelva por única vez (`UserPasswordPolicy.java:50-57`, `PatientServiceImpl.java:50-87`, `DentistServiceImpl.java:47-84`).

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

| Ruta                      | Rol que accede     | Propósito                                                                  |
| ------------------------- | ------------------ | -------------------------------------------------------------------------- |
| `/`                       | Todos              | Landing: presentación, características, accesos de demo.                   |
| `/login`                  | Visitante          | Ingreso con email y contraseña.                                            |
| `/users/register`         | Visitante          | Alta de paciente con dirección y confirmación de contraseña.               |
| `/users/change-password`  | Autenticado        | Cambio de contraseña actual o temporal obligatoria (`mustChangePassword`). |
| `/users/logout`           | Autenticado        | Acción POST que borra las cookies y vuelve a `/`.                          |
| `/dashboard`              | `ADMIN`            | Métricas, filtros por fecha y odontólogo, 3 gráficos, próximos turnos.     |
| `/patients`               | `ADMIN`, `DENTIST` | Tabla con búsqueda en vivo, alta, edición y borrado.                       |
| `/patients/add`           | `ADMIN`            | Alta de paciente.                                                          |
| `/patients/edit/[id]`     | `ADMIN`, `PATIENT` | Edición con datos precargados.                                             |
| `/dentists`               | Autenticados       | Tabla con filtro, alta, edición y borrado.                                 |
| `/dentists/add`           | `ADMIN`            | Alta de odontólogo.                                                        |
| `/dentists/edit/[id]`     | `ADMIN`, `DENTIST` | Edición con datos precargados.                                             |
| `/appointments`           | Autenticados       | Tabla de turnos con estado, búsqueda y acciones.                           |
| `/appointments/add`       | Autenticados       | Programar turno con vista previa del paciente.                             |
| `/appointments/edit/[id]` | `ADMIN`, `DENTIST` | Reprogramar o editar un turno existente.                                   |

Navegación: la barra superior cambia según el rol; «Dashboard» solo aparece para `ADMIN` (`+layout.svelte:30-170`).

## 8. Métricas del dashboard

Tarjetas: turnos totales, turnos de hoy, odontólogos y pacientes. Gráficos (uPlot): evolución mensual, desglose por estado y desglose por odontólogo. Filtros: rango de fechas y odontólogo. Lista de próximos turnos con cambio rápido de estado (`dashboard/+page.svelte`, datos desde `GET /api/dashboard/snapshot`).

## Brechas conocidas

Hallazgos verificados y estado de remediación en el plan de evolución:

| #   | Brecha                                                                                                                                                                                                                                        | Estado                | Evidencia / Solución                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| G1  | La landing muestra credenciales de demo que no funcionan: admin con `Admin123!` (el seed usa `admin123`) y usuarios dentista y paciente que el seed no crea.                                                                                  | **Resuelta** (Fase 3) | Alineadas con `DataInitializer.java`: `admin@dentalclinic.com`, `maria.gonzalez@dentalclinic.com`, `juan.perez@email.com`. |
| G2  | Un `PATIENT` que abre `/appointments/add` provoca un error 500: la página llama a `GET /api/patients`, reservado a `ADMIN` y `DENTIST`. El backend sí permite a un paciente crear turnos.                                                     | **Resuelta** (Fase 3) | El loader omite llamar a `/api/patients` para `PATIENT` y la vista auto-asigna su ID.                                      |
| G3  | Los listados no condicionan por rol los botones «Agregar Paciente», «Agregar Odontólogo» ni «Eliminar»: quien no tiene el permiso (por ejemplo `DENTIST` en pacientes, o `DENTIST` y `PATIENT` al eliminar turnos) los ve y termina en `403`. | **Resuelta** (Fase 3) | Botones condicionados por `data.user?.role === 'ADMIN'` en `/patients`, `/dentists` y `/appointments`.                     |
| G4  | Un `PATIENT` no puede ver el detalle de un turno ni editarlo (`GET`/`PUT` por id son solo `ADMIN` y `DENTIST`), pero la navegación le ofrece «Listar citas» con enlaces de edición.                                                           | **Resuelta** (Fase 3) | Ocultos botones de edición y eliminación para pacientes en `/appointments`.                                                |
| G5  | Las especialidades existen en la API y el modelo, pero ninguna pantalla las gestiona ni las muestra.                                                                                                                                          | **Abierta**           | `SpecialtyController.java:24-85`, rutas del frontend.                                                                      |
| G6  | La API usa `camelCase` al recibir turnos (`patientId`) y `snake_case` al responder (`patient_id`).                                                                                                                                            | **Resuelta** (Fase 4) | `AppointmentDTO` expone únicamente `patientId` y `dentistId` en `camelCase`.                                               |
| G7  | Enlace de edición solo con ícono, sin nombre accesible, en próximos turnos del dashboard.                                                                                                                                                     | **Resuelta** (Fase 3) | Añadido `aria-label="Editar turno de {appointment.patientName}"`, logrando 0 warnings en `svelte-check`.                   |

## Decisiones pendientes de producto

- ¿Puede un `PATIENT` ver y cancelar sus propios turnos? Hoy puede crearlos, pero no consultarlos por id ni cambiarles el estado.
- ¿Debe existir un perfil propio («Mi cuenta») para `PATIENT` y `DENTIST`?
- ¿Las especialidades se gestionan desde la interfaz y se usan para elegir odontólogo al reservar?
- ¿Horario y días laborables configurables por odontólogo, o se mantiene la franja fija?
