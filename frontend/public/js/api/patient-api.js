import { API_BASE_URL, handleApiError, getAuthHeaders } from "./config.js";

const PatientAPI = {
  // Obtener todos los pacientes
  async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/patients`, {
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

  // Obtener un paciente por ID
  async getById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Paciente no encontrado");
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Alias para compatibilidad
  async findById(id) {
    return await this.getById(id);
  },

  // Crear un nuevo paciente
  async create(patient) {
    try {
      // Validar datos requeridos
      this.validatePatientData(patient);

      const authHeaders = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/patients`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(patient),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            "No tienes permisos para crear pacientes. Verifica que estés autenticado."
          );
        } else if (response.status === 409) {
          throw new Error("Ya existe un paciente con ese DNI");
        } else if (response.status === 400) {
          throw new Error("Datos del paciente inválidos");
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar un paciente
  async update(id, patientData) {
    try {
      let patient;
      if (patientData === undefined && typeof id === "object") {
        patient = id;
      } else {
        patient = { id, ...patientData };
      }

      // Validar datos requeridos
      this.validatePatientData(patient, true);

      const response = await fetch(`${API_BASE_URL}/patients`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(patient),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Paciente no encontrado");
        } else if (response.status === 409) {
          throw new Error("Ya existe un paciente con ese DNI");
        } else if (response.status === 400) {
          throw new Error("Datos del paciente inválidos");
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Eliminar un paciente
  async delete(id) {
    try {
      if (!id) {
        throw new Error("ID del paciente es requerido");
      }

      const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Paciente no encontrado");
        } else if (response.status === 409) {
          throw new Error(
            "No se puede eliminar el paciente porque tiene citas asociadas"
          );
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Buscar paciente por email
  async searchByEmail(email) {
    try {
      if (!email) {
        throw new Error("Email es requerido");
      }

      const response = await fetch(
        `${API_BASE_URL}/patients/search?email=${encodeURIComponent(email)}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("No se encontró paciente con ese email");
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Buscar paciente por DNI
  async getByCardIdentity(cardIdentity) {
    try {
      if (!cardIdentity) {
        throw new Error("DNI es requerido");
      }

      const response = await fetch(
        `${API_BASE_URL}/patients/dni/${cardIdentity}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("No se encontró paciente con ese DNI");
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Crear paciente desde usuario logueado
  async createFromUser(userData) {
    try {
      const patientData = {
        // Campos heredados de User
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,

        // Campos específicos de Patient
        cardIdentity:
          userData.cardIdentity || Math.floor(Math.random() * 100000000),
        admissionDate: new Date().toISOString().split("T")[0], // LocalDate en formato YYYY-MM-DD

        // Address como objeto anidado
        address: {
          street: userData.address?.street || "",
          number: userData.address?.number || "",
          city: userData.address?.city || userData.address?.location || "",
          province: userData.address?.province || "",
          postalCode: userData.address?.postalCode || "",
        },
      };

      return await this.create(patientData);
    } catch (error) {
      console.error("Error en createFromUser:", error);
      throw error;
    }
  },

  // Validar datos del paciente según la entidad Java
  validatePatientData(patient, isUpdate = false) {
    if (!patient) {
      throw new Error("Datos del paciente son requeridos");
    }

    if (isUpdate && !patient.id) {
      throw new Error("ID del paciente es requerido para actualización");
    }

    // Validar campos heredados de User
    if (!patient.firstName || patient.firstName.trim().length < 2) {
      throw new Error("El nombre debe tener al menos 2 caracteres");
    }

    if (!patient.lastName || patient.lastName.trim().length < 2) {
      throw new Error("El apellido debe tener al menos 2 caracteres");
    }

    if (!patient.email || !this.isValidEmail(patient.email)) {
      throw new Error("Debe proporcionar un email válido");
    }

    // Validar campos específicos de Patient
    if (patient.cardIdentity) {
      const dni = parseInt(patient.cardIdentity);
      if (isNaN(dni) || dni <= 0) {
        throw new Error("El DNI debe ser un número válido");
      }
    }

    // Validar admissionDate (LocalDate)
    if (!patient.admissionDate) {
      // Si no se proporciona, usar fecha actual
      patient.admissionDate = new Date().toISOString().split("T")[0];
    } else {
      // Validar formato de fecha
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(patient.admissionDate)) {
        throw new Error("La fecha de admisión debe tener formato YYYY-MM-DD");
      }

      const admissionDate = new Date(patient.admissionDate);
      if (isNaN(admissionDate.getTime())) {
        throw new Error("La fecha de admisión no es válida");
      }
    }

    // Validar address (opcional, pero si está debe ser un objeto)
    if (patient.address && typeof patient.address !== "object") {
      throw new Error("La dirección debe ser un objeto");
    }
  },

  // Validar formato de email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Formatear datos del paciente para mostrar
  formatPatientDisplay(patient) {
    if (!patient) return null;

    return {
      ...patient,
      fullName: `${patient.firstName} ${patient.lastName}`,
      displayName: `${patient.firstName} ${patient.lastName}`,
      cardIdentityFormatted: patient.cardIdentity
        ? patient.cardIdentity.toLocaleString()
        : "N/A",
      addressFormatted: this.formatAddress(patient.address),
      admissionDateFormatted: patient.admissionDate
        ? this.formatDate(patient.admissionDate)
        : "No especificada",
    };
  },

  // Formatear dirección
  formatAddress(address) {
    if (!address) return "No especificada";

    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.number) parts.push(address.number);
    if (address.city) parts.push(address.city);
    if (address.province) parts.push(address.province);

    return parts.length > 0 ? parts.join(", ") : "No especificada";
  },

  // Formatear fecha (LocalDate viene como YYYY-MM-DD)
  formatDate(dateString) {
    if (!dateString) return null;

    try {
      const date = new Date(dateString + "T00:00:00"); // Evitar problemas de timezone
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return dateString; // Retornar el original si no se puede formatear
    }
  },

  // Obtener estadísticas básicas de pacientes
  getPatientStats(patients) {
    if (!patients || !Array.isArray(patients)) {
      return {
        total: 0,
        withAddress: 0,
        recentAdmissions: 0,
        byProvince: {},
      };
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      total: patients.length,
      withAddress: patients.filter(
        (p) => p.address && (p.address.street || p.address.city)
      ).length,
      recentAdmissions: 0,
      byProvince: {},
    };

    // Contar admisiones recientes (últimos 30 días)
    stats.recentAdmissions = patients.filter((patient) => {
      if (!patient.admissionDate) return false;
      const admissionDate = new Date(patient.admissionDate + "T00:00:00");
      return admissionDate >= thirtyDaysAgo;
    }).length;

    // Agrupar por provincia
    patients.forEach((patient) => {
      const province = patient.address?.province || "No especificada";
      stats.byProvince[province] = (stats.byProvince[province] || 0) + 1;
    });

    return stats;
  },
};

// Mantener compatibilidad con funciones individuales
export const getAllPatients = PatientAPI.getAll.bind(PatientAPI);
export const searchPatientByEmail = PatientAPI.searchByEmail.bind(PatientAPI);
export const createPatientFromUser = PatientAPI.createFromUser.bind(PatientAPI);

// Exportar para uso en otros archivos
if (typeof module !== "undefined" && module.exports) {
  module.exports = { PatientAPI };
}

export default PatientAPI;
