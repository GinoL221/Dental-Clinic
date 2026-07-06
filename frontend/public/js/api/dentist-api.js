import { API_BASE_URL, handleApiError, getAuthHeaders } from './config.js';
import { requireEntityData, requireIdOnUpdate, requireMinLength } from './validation-utils.js';

const DentistAPI = {
  // Obtener todos los dentistas
  /**
   * @returns {Promise<any>}
   */
  async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dentists`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
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
  /**
   * @param {string|number} id
   * @returns {Promise<any>}
   */
  async getById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dentists/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Dentista no encontrado');
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Crear un nuevo dentista
  /**
   * @param {Record<string, any>} dentist
   * @returns {Promise<any>}
   */
  async create(dentist) {
    try {
      // Validar datos requeridos
      this.validateDentistData(dentist);

      const authHeaders = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/dentists`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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

        if (response.status === 403)
          throw new Error(errMsg || 'No tienes permisos para crear dentistas.');
        if (response.status === 409)
          throw new Error(errMsg || 'Ya existe un dentista con ese número de matrícula');
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
  // Full-replace semantics: the body must carry the complete editable field
  // set (firstName, lastName, email, registrationNumber). The target id
  // travels in the URL, never in the body.
  /**
   * @param {any} id
   * @param {Record<string, any>} [dentistData]
   * @returns {Promise<string|undefined>}
   */
  async update(id, dentistData) {
    try {
      let targetId;
      let dentist;
      if (dentistData === undefined && typeof id === 'object') {
        targetId = id.id;
        dentist = { ...id };
      } else {
        targetId = id;
        dentist = { id, ...dentistData };
      }

      // Validar datos requeridos (normaliza registrationNumber en el objeto real)
      this.validateDentistData(dentist, true);

      delete dentist.id;

      const response = await fetch(`${API_BASE_URL}/api/dentists/${targetId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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
        if (response.status === 409)
          throw new Error(errMsg || 'Ya existe un dentista con ese número de matrícula');
        if (response.status === 400) throw new Error(errMsg || 'Datos del dentista inválidos');

        throw new Error(errMsg);
      }

      return await response.text();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Eliminar un dentista
  /**
   * @param {string|number} id
   * @returns {Promise<string|undefined>}
   */
  async delete(id) {
    try {
      if (!id) {
        throw new Error('ID del dentista es requerido');
      }

      const response = await fetch(`${API_BASE_URL}/api/dentists/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Dentista no encontrado');
        } else if (response.status === 409) {
          throw new Error('No se puede eliminar el dentista porque tiene citas asociadas');
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Buscar por número de matrícula
  /**
   * @param {string|number} registrationNumber
   * @returns {Promise<any>}
   */
  async getByRegistrationNumber(registrationNumber) {
    try {
      if (!registrationNumber) {
        throw new Error('Número de matrícula es requerido');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/dentists/registration/${registrationNumber}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: getAuthHeaders(),
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No se encontró dentista con ese número de matrícula');
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * @param {Record<string, any>} dentist
   * @param {boolean} [isUpdate]
   * @returns {void}
   */
  validateDentistData(dentist, isUpdate = false) {
    requireEntityData(dentist, 'del dentista');
    requireIdOnUpdate(dentist, isUpdate, 'del dentista');

    // Normalizar y proteger valores antes de usar trim()
    requireMinLength(dentist.firstName, 2, 'El nombre debe tener al menos 2 caracteres');
    requireMinLength(dentist.lastName, 2, 'El apellido debe tener al menos 2 caracteres');

    let registrationNumber = dentist.registrationNumber;
    registrationNumber =
      registrationNumber === null || registrationNumber === undefined
        ? ''
        : String(registrationNumber).trim();

    if (registrationNumber.length < 3) {
      throw new Error('El número de matrícula debe tener al menos 3 caracteres');
    }

    const registrationRegex = /^[A-Za-z0-9]+$/;
    if (!registrationRegex.test(registrationNumber)) {
      throw new Error('El número de matrícula solo puede contener letras y números');
    }

    // Normalizar en el objeto: si es solo dígitos convertir a Number, sino dejar string
    dentist.registrationNumber = /^[0-9]+$/.test(registrationNumber)
      ? Number(registrationNumber)
      : registrationNumber;
  },

  // Asignar especialidad a un dentista
  /**
   * @param {string|number} dentistId
   * @param {string|number} specialtyId
   * @returns {Promise<void>}
   */
  async assignSpecialty(dentistId, specialtyId) {
    const response = await fetch(
      `${API_BASE_URL}/api/dentists/${dentistId}/specialties/${specialtyId}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      },
    );
    if (!response.ok) {
      if (response.status === 404) throw new Error('Dentista o especialidad no encontrada');
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
  },

  // Eliminar especialidad de un dentista
  /**
   * @param {string|number} dentistId
   * @param {string|number} specialtyId
   * @returns {Promise<void>}
   */
  async removeSpecialty(dentistId, specialtyId) {
    const response = await fetch(
      `${API_BASE_URL}/api/dentists/${dentistId}/specialties/${specialtyId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      },
    );
    if (!response.ok) {
      if (response.status === 404) throw new Error('Dentista o especialidad no encontrada');
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
  },

  // Formatear datos del dentista para mostrar
  /**
   * @param {Record<string, any> | null | undefined} dentist
   * @returns {Record<string, any> | null}
   */
  formatDentistDisplay(dentist) {
    if (!dentist) return null;

    return {
      ...dentist,
      fullName: `${dentist.firstName} ${dentist.lastName}`,
      displayName: `Dr/a. ${dentist.firstName} ${dentist.lastName}`,
      registrationFormatted: dentist.registrationNumber?.toString().toUpperCase(),
    };
  },
};

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DentistAPI };
}

export default DentistAPI;
