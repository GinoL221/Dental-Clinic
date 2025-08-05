const DentistAPI = {
  // Obtener todos los dentistas
  async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/dentists`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include", // Incluir cookies de sesión
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
        credentials: "include", // Incluir cookies de sesión
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
      // Asegurar que usamos name en lugar de firstName para el backend
      let dentistData = { ...dentist };

      if (dentistData.firstName && !dentistData.name) {
        dentistData.name = dentistData.firstName;
        delete dentistData.firstName;
      }

      // Validar datos requeridos
      this.validateDentistData(dentistData);

      const response = await fetch(`${API_BASE_URL}/dentists`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include", // Incluir cookies de sesión
        body: JSON.stringify(dentistData),
      });

      if (!response.ok) {
        if (response.status === 409) {
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
  async update(dentist) {
    try {
      // Asegurar que usamos name en lugar de firstName para el backend
      let dentistData = { ...dentist };

      if (dentistData.firstName && !dentistData.name) {
        dentistData.name = dentistData.firstName;
        delete dentistData.firstName;
      }

      // Validar datos requeridos
      this.validateDentistData(dentistData, true);

      const response = await fetch(`${API_BASE_URL}/dentists`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include", // Incluir cookies de sesión
        body: JSON.stringify(dentistData),
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
        credentials: "include", // Incluir cookies de sesión
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

    // Verificar que al menos uno de los dos campos de nombre exista
    const nameField = dentist.name ? "name" : "firstName";
    if (!dentist[nameField] || dentist[nameField].trim().length < 2) {
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

    // Validar formato de matrícula (ejemplo: solo números y letras)
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
