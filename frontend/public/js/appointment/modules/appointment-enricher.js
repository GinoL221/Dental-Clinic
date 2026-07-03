import logger from "../../logger.js";

// Enriquecer datos de cita con información completa del paciente
// Extraído de AppointmentController.enrichAppointmentData() verbatim.
//
// The second positional parameter is intentionally kept for API compatibility,
// but named `_dentists` because this function does not currently need it.
//
// Fallback fetch uses the backend context path because the REST API is served
// under /api. This keeps the individual-patient fallback aligned with the
// bulk-loaded endpoint behavior.
export async function enrichAppointmentData(appointment, _dentists, patients) {
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
          const runtimeWindow =
            /** @type {Window & { __ENV__?: { API_BASE_URL?: string } }} */ (window);
          const apiBaseUrl = runtimeWindow.__ENV__?.API_BASE_URL || "http://localhost:8080";
          const response = await fetch(
            `${apiBaseUrl}/api/patients/${appointment.patient_id}`,
            {
              method: "GET",
              credentials: "include", // JWT travels via httpOnly cookie; replaces the removed Bearer token header
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
