import { API_BASE_URL, handleApiError, getAuthHeaders } from "./config.js";

const SpecialtyAPI = {
  // Obtener todas las especialidades
  async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/specialties`, {
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

  // Obtener una especialidad por ID
  /**
   * @param {string|number} id
   */
  async getById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/specialties/${id}`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Especialidad no encontrada");
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Crear una nueva especialidad
  /**
   * @param {Record<string, any>} specialty
   */
  async create(specialty) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/specialties`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(specialty),
      });

      if (!response.ok) {
        let errMsg = `Error: ${response.status} ${response.statusText}`;
        try {
          const body = await response.json();
          if (body && body.message) errMsg = body.message;
        } catch (e) {
          /* ignore */
        }

        if (response.status === 403)
          throw new Error(errMsg || "No tienes permisos para crear especialidades");
        if (response.status === 409)
          throw new Error(errMsg || "Ya existe una especialidad con ese nombre");
        if (response.status === 400)
          throw new Error(errMsg || "Datos de especialidad inválidos");

        throw new Error(errMsg);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Actualizar una especialidad
  /**
   * @param {string|number} id
   * @param {Record<string, any>} specialty
   * @returns {Promise<any>}
   */
  async update(id, specialty) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/specialties/${id}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(specialty),
      });

      if (!response.ok) {
        let errMsg = `Error: ${response.status} ${response.statusText}`;
        try {
          const body = await response.json();
          if (body && body.message) errMsg = body.message;
        } catch (e) {
          /* ignore */
        }

        if (response.status === 404)
          throw new Error(errMsg || "Especialidad no encontrada");
        if (response.status === 409)
          throw new Error(errMsg || "Ya existe una especialidad con ese nombre");
        if (response.status === 400)
          throw new Error(errMsg || "Datos de especialidad inválidos");

        throw new Error(errMsg);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Eliminar una especialidad
  /**
   * @param {string|number} id
   */
  async delete(id) {
    try {
      if (!id) {
        throw new Error("ID de especialidad es requerido");
      }

      const response = await fetch(`${API_BASE_URL}/api/specialties/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Especialidad no encontrada");
        } else if (response.status === 409) {
          throw new Error(
            "No se puede eliminar la especialidad: está asignada a dentistas"
          );
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      handleApiError(error);
    }
  },
};

export default SpecialtyAPI;
