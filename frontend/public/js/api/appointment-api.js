import { API_BASE_URL, handleApiError, getAuthHeaders } from "./config.js";
import logger from "../logger.js";
import { parseYMDToLocalDate, formatLocalDate } from "../utils/date-utils.js";
import { requireEntityData, requireIdOnUpdate } from "./validation-utils.js";

const AppointmentAPI = {
  // Obtener todas las citas con filtros opcionales
  /**
   * @param {Record<string, any>} [filters]
   */
  async getAll(filters = {}) {
    try {
      let url = `${API_BASE_URL}/api/appointments/search?`;
      if (filters.patient)
        url += `patient=${encodeURIComponent(filters.patient)}&`;
      if (filters.dentist)
        url += `dentist=${encodeURIComponent(filters.dentist)}&`;
      if (filters.date)
        url += `fromDate=${filters.date}&toDate=${filters.date}&`;
      if (
        filters.status !== undefined &&
        filters.status !== null &&
        filters.status !== ""
      )
        url += `status=${encodeURIComponent(filters.status)}&`;
      if (filters.page) url += `page=${filters.page}&`;
      if (filters.size) url += `size=${filters.size}&`;
      url = url.replace(/&$/, "");

      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Obtener una cita por ID
  /**
   * @param {string|number} id
   */
  async getById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${id}`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Cita no encontrada");
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Crear una nueva cita
  /**
   * @param {Record<string, any>} appointment
   * @returns {Promise<any>}
   */
  async create(appointment) {
    try {
      this.validateAppointmentData(appointment);

  const headers = getAuthHeaders();
  logger.debug("AppointmentAPI - create headers:", headers);
  logger.debug("AppointmentAPI - create data:", appointment);

      const response = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: "POST",
        headers: headers,
        credentials: "include",
        body: JSON.stringify(appointment),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("Ya existe una cita en esa fecha y hora");
        } else if (response.status === 400) {
          throw new Error("Datos de la cita inválidos");
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Actualizar una cita
  /**
   * @param {Record<string, any>} appointment
   * @returns {Promise<any>}
   */
  async update(appointment) {
    try {
      this.validateAppointmentData(appointment, true);

      const targetId = appointment.id;
      const appointmentCopy = { ...appointment };
      delete appointmentCopy.id;

      const response = await fetch(`${API_BASE_URL}/api/appointments/${targetId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(appointmentCopy),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Cita no encontrada");
        } else if (response.status === 409) {
          throw new Error("Ya existe una cita en esa fecha y hora");
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Eliminar una cita
  /**
   * @param {string|number} id
   * @returns {Promise<string|undefined>}
   */
  async delete(id) {
    try {
      if (!id) {
        throw new Error("ID de la cita es requerido");
      }

      const response = await fetch(`${API_BASE_URL}/api/appointments/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Cita no encontrada");
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Obtener citas por dentista
  /**
   * @param {string|number} dentistId
   * @returns {Promise<any>}
   */
  async getByDentist(dentistId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/appointments/dentist/${dentistId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Obtener citas por paciente
  /**
   * @param {string|number} patientId
   * @returns {Promise<any>}
   */
  async getByPatient(patientId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/appointments/patient/${patientId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Obtener citas por fecha
  /**
   * @param {string} date
   * @returns {Promise<any>}
   */
  async getByDate(date) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/appointments/date/${date}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Validar datos de la cita
  /**
   * @param {Record<string, any>} appointment
   * @param {boolean} [isUpdate]
   * @returns {void}
   */
  validateAppointmentData(appointment, isUpdate = false) {
    logger.debug(
      "🔍 validateAppointmentData - isUpdate:",
      isUpdate,
      "appointment:",
      appointment
    );

    requireEntityData(appointment, "de la cita");

    if (isUpdate && !appointment.id) {
      logger.warn(
        "❌ validateAppointmentData - ID faltante. appointment.id:",
        appointment.id
      );
    }
    // requireIdOnUpdate throws the same error the inline check above would;
    // kept separate so the warn log above still fires before the throw.
    requireIdOnUpdate(appointment, isUpdate, "de la cita");

    if (!appointment.date) {
      throw new Error("La fecha es requerida");
    }

    if (!appointment.dentistId) {
      throw new Error("El dentista es requerido");
    }

    if (!appointment.patientId) {
      throw new Error("El paciente es requerido");
    }

    // Validar que la fecha no sea en el pasado
    const appointmentDate = parseYMDToLocalDate(appointment.date) || new Date(appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!appointmentDate || appointmentDate < today) {
      // Si es una actualización, permitir si la fecha no fue modificada
      if (isUpdate) {
        try {
          const dateInput = document.getElementById("appointmentDate");
          const originalDate = dateInput?.getAttribute("data-original-date") || "";
          if (originalDate && originalDate === appointment.date) {
            // permitir la actualización si la fecha no cambió
          } else {
            throw new Error("La fecha de la cita no puede ser anterior a la fecha actual");
          }
        } catch (err) {
          // Si ocurre cualquier problema leyendo el DOM, fallar conservadoramente
          throw new Error("La fecha de la cita no puede ser anterior a la fecha actual");
        }
      } else {
        throw new Error(
          "La fecha de la cita no puede ser anterior a la fecha actual"
        );
      }
    }
  },

  // Formatear cita para mostrar
  /**
   * @param {Record<string, any> | null | undefined} appointment
   * @returns {Record<string, any> | null}
   */
  formatAppointmentDisplay(appointment) {
    if (!appointment) return null;

    return {
      ...appointment,
      formattedDate: formatLocalDate(appointment.date),
      formattedTime: (() => {
        const d = parseYMDToLocalDate(appointment.date) || new Date(appointment.date);
        try {
          return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
        } catch (e) {
          return "";
        }
      })(),
      formattedDateTime: (() => {
        const d = parseYMDToLocalDate(appointment.date) || new Date(appointment.date);
        try { return d.toLocaleString("es-ES"); } catch (e) { return String(appointment.date); }
      })(),
    };
  },
};

// Exportar para uso en otros archivos
if (typeof module !== "undefined" && module.exports) {
  module.exports = { AppointmentAPI };
}

export default AppointmentAPI;
