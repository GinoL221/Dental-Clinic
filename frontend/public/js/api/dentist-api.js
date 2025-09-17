import { API_BASE_URL, handleApiError, getAuthHeaders } from "./config.js";

const DentistAPI = {
  // Obtener todos los dentistas
  async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/dentists`, {
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

  // Obtener un dentista por ID
  async getById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/dentists/${id}`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Dentista no encontrado");
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Crear un nuevo dentista
  async create(dentist) {
    try {
      // Validar datos requeridos
      this.validateDentistData(dentist);

      const authHeaders = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/dentists`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(dentist),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            "No tienes permisos para crear dentistas. Verifica que estés autenticado."
          );
        } else if (response.status === 409) {
          throw new Error("Ya existe un dentista con ese número de matrícula");
        } else if (response.status === 400) {
          throw new Error("Datos del dentista inválidos");
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar un dentista
  async update(id, dentistData) {
    try {
      let dentist;
      if (dentistData === undefined && typeof id === "object") {
        dentist = id;
      } else {
        dentist = { id, ...dentistData };
      }

      // Validar datos requeridos
      this.validateDentistData(dentist, true);

      const response = await fetch(`${API_BASE_URL}/dentists`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(dentist),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Dentista no encontrado");
        } else if (response.status === 409) {
          throw new Error("Ya existe un dentista con ese número de matrícula");
        } else if (response.status === 400) {
          throw new Error("Datos del dentista inválidos");
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Eliminar un dentista
  async delete(id) {
    try {
      if (!id) {
        throw new Error("ID del dentista es requerido");
      }

      const response = await fetch(`${API_BASE_URL}/dentists/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Dentista no encontrado");
        } else if (response.status === 409) {
          throw new Error(
            "No se puede eliminar el dentista porque tiene citas asociadas"
          );
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Buscar por número de matrícula
  async getByRegistrationNumber(registrationNumber) {
    try {
      if (!registrationNumber) {
        throw new Error("Número de matrícula es requerido");
      }

      const response = await fetch(
        `${API_BASE_URL}/dentists/registration/${registrationNumber}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "No se encontró dentista con ese número de matrícula"
          );
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Validar datos del dentista
  validateDentistData(dentist, isUpdate = false) {
    if (!dentist) {
      throw new Error("Datos del dentista son requeridos");
    }

    if (isUpdate && !dentist.id) {
      throw new Error("ID del dentista es requerido para actualización");
    }

    // Usar solo firstName
    if (!dentist.firstName || dentist.firstName.trim().length < 2) {
      throw new Error("El nombre debe tener al menos 2 caracteres");
    }

    if (!dentist.lastName || dentist.lastName.trim().length < 2) {
      throw new Error("El apellido debe tener al menos 2 caracteres");
    }

    if (
      !dentist.registrationNumber ||
      dentist.registrationNumber.trim().length < 3
    ) {
      throw new Error(
        "El número de matrícula debe tener al menos 3 caracteres"
      );
    }

    const registrationRegex = /^[A-Za-z0-9]+$/;
    if (!registrationRegex.test(dentist.registrationNumber)) {
      throw new Error(
        "El número de matrícula solo puede contener letras y números"
      );
    }
  },

  // Formatear datos del dentista para mostrar
  formatDentistDisplay(dentist) {
    if (!dentist) return null;

    return {
      ...dentist,
      fullName: `${dentist.firstName} ${dentist.lastName}`,
      displayName: `Dr/a. ${dentist.firstName} ${dentist.lastName}`,
      registrationFormatted: dentist.registrationNumber?.toUpperCase(),
    };
  },
};

// Exportar para uso en otros archivos
if (typeof module !== "undefined" && module.exports) {
  module.exports = { DentistAPI };
}

export default DentistAPI;
