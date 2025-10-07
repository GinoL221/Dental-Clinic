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
        // Intentar extraer mensaje del cuerpo de respuesta para dar información útil
        let errMsg = `Error: ${response.status} ${response.statusText}`;
        try {
          const body = await response.json();
          if (body && body.message) errMsg = body.message;
          else if (typeof body === 'string') errMsg = body;
        } catch (e) {
          try {
            const text = await response.text();
            if (text) errMsg = text;
          } catch (e2) {
            // ignore
          }
        }

        if (response.status === 403) throw new Error(errMsg || 'No tienes permisos para crear dentistas.');
        if (response.status === 409) throw new Error(errMsg || 'Ya existe un dentista con ese número de matrícula');
        if (response.status === 400) throw new Error(errMsg || 'Datos del dentista inválidos');

        throw new Error(errMsg);
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
        let errMsg = `Error: ${response.status} ${response.statusText}`;
        try {
          const body = await response.json();
          if (body && body.message) errMsg = body.message;
          else if (typeof body === 'string') errMsg = body;
        } catch (e) {
          try {
            const text = await response.text();
            if (text) errMsg = text;
          } catch (e2) {
            // ignore
          }
        }

        if (response.status === 404) throw new Error(errMsg || 'Dentista no encontrado');
        if (response.status === 409) throw new Error(errMsg || 'Ya existe un dentista con ese número de matrícula');
        if (response.status === 400) throw new Error(errMsg || 'Datos del dentista inválidos');

        throw new Error(errMsg);
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

  validateDentistData(dentist, isUpdate = false) {
    if (!dentist) {
      throw new Error("Datos del dentista son requeridos");
    }

    if (isUpdate && !dentist.id) {
      throw new Error("ID del dentista es requerido para actualización");
    }

    // Normalizar y proteger valores antes de usar trim()
    const firstName = dentist.firstName ? String(dentist.firstName).trim() : "";
    const lastName = dentist.lastName ? String(dentist.lastName).trim() : "";
    let registrationNumber = dentist.registrationNumber;
    registrationNumber =
      registrationNumber === null || registrationNumber === undefined
        ? ""
        : String(registrationNumber).trim();

    if (firstName.length < 2) {
      throw new Error("El nombre debe tener al menos 2 caracteres");
    }

    if (lastName.length < 2) {
      throw new Error("El apellido debe tener al menos 2 caracteres");
    }

    if (registrationNumber.length < 3) {
      throw new Error(
        "El número de matrícula debe tener al menos 3 caracteres"
      );
    }

    const registrationRegex = /^[A-Za-z0-9]+$/;
    if (!registrationRegex.test(registrationNumber)) {
      throw new Error(
        "El número de matrícula solo puede contener letras y números"
      );
    }

    // Normalizar en el objeto: si es solo dígitos convertir a Number, sino dejar string
    dentist.registrationNumber = /^[0-9]+$/.test(registrationNumber)
      ? Number(registrationNumber)
      : registrationNumber;
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
