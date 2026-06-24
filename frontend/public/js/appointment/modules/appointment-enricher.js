import logger from "../../logger.js";

// Enriquecer datos de cita con información completa del paciente
// Extraído de AppointmentController.enrichAppointmentData() verbatim.
//
// El parámetro `dentists` se mantiene aunque no se usa dentro del cuerpo —
// es deuda preexistente de parámetro muerto, fuera de alcance para este
// refactor puro; cambiar la firma podría romper a un caller que pase
// argumentos posicionales esperando 3 parámetros.
//
// Bug preexistente conocido — se preserva tal cual, NO se corrige aquí: el
// fetch de fallback usa `${apiBaseUrl}/patients/${appointment.patient_id}`,
// sin el prefijo /api. El backend real usa
// server.servlet.context-path=/api, por lo que el endpoint REST real es
// /api/patients/{id} — este fetch da 404 en la práctica cuando el paciente
// no está ya en el array `patients` cargado en bulk. La función captura el
// error y continúa con patientData en null (degradado pero sin crashear).
// Documentado y trackeado por separado.
export async function enrichAppointmentData(appointment, dentists, patients) {
  try {
    logger.debug("Enriqueciendo datos de la cita...");

    // Crear copia del appointment original
    const enrichedAppointment = { ...appointment };

    // Obtener datos del paciente por ID desde la lista de pacientes
    if (appointment.patient_id) {
      let patientData = null;

      // Buscar en la lista de pacientes cargados
      if (patients && patients.length > 0) {
        patientData = patients.find((p) => p.id === appointment.patient_id);
      }

      // Si no encontramos en la lista, cargar individualmente
      if (!patientData) {
        try {
          const apiBaseUrl = window.__ENV__?.API_BASE_URL || "http://localhost:8080";
          const response = await fetch(
            `${apiBaseUrl}/patients/${appointment.patient_id}`,
            {
              method: "GET",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            patientData = await response.json();
            logger.info("✅ Datos del paciente cargados:", patientData);
          }
        } catch (error) {
          logger.error("Error al cargar datos del paciente:", error);
        }
      }

      // Agregar datos del paciente al appointment
      if (patientData) {
        enrichedAppointment.patientName =
          patientData.name || patientData.firstName || "";
        enrichedAppointment.patientLastName = patientData.lastName || "";
        enrichedAppointment.patientEmail = patientData.email || "";
        enrichedAppointment.patientId = patientData.id; // ID del paciente
      }
    }

    // Los datos del dentista y cita ya están correctos
    enrichedAppointment.dentistId = appointment.dentist_id;
    enrichedAppointment.appointmentDate = appointment.date;
    enrichedAppointment.appointmentTime = appointment.time;

    return enrichedAppointment;
  } catch (error) {
    logger.error("Error al enriquecer datos de la cita:", error);
    return appointment; // Devolver original si hay error
  }
}
