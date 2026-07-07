import { API_BASE_URL, handleApiError, getAuthHeaders } from './config.js';
import logger from '../logger.js';
import { parseYMDToLocalDate, formatLocalDate } from '../utils/date-utils.js';
import {
  isValidEmail,
  requireEntityData,
  requireIdOnUpdate,
  requireMinLength,
} from './validation-utils.js';

const PatientAPI = {
  // Obtener todos los pacientes
  /**
   * @returns {Promise<any>}
   */
  async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/patients`, {
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

  // Obtener un paciente por ID
  /**
   * @param {string|number} id
   * @returns {Promise<any>}
   */
  async getById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Paciente no encontrado');
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Alias para compatibilidad
  /**
   * @param {string|number} id
   * @returns {Promise<any>}
   */
  async findById(id) {
    return await this.getById(id);
  },

  // Crear un nuevo paciente
  /**
   * @param {Record<string, any>} patient
   * @returns {Promise<any>}
   */
  async create(patient) {
    try {
      // Validar datos requeridos
      this.validatePatientData(patient);

      const authHeaders = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/patients`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(patient),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            'No tienes permisos para crear pacientes. Verifica que estés autenticado.',
          );
        } else if (response.status === 409) {
          throw new Error('Ya existe un paciente con ese DNI');
        } else if (response.status === 400) {
          throw new Error('Datos del paciente inválidos');
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
  // Full-replace semantics: the body must carry the complete editable field
  // set (firstName, lastName, email, cardIdentity, admissionDate, address?).
  // The target id travels in the URL, never in the body.
  /**
   * @param {any} id
   * @param {Record<string, any>} [patientData]
   * @returns {Promise<string|undefined>}
   */
  async update(id, patientData) {
    try {
      let targetId;
      let patient;
      if (patientData === undefined && typeof id === 'object') {
        targetId = id.id;
        patient = { ...id };
        delete patient.id;
      } else {
        targetId = id;
        patient = { ...patientData };
        delete patient.id;
      }

      // Validar datos requeridos
      this.validatePatientData({ id: targetId, ...patient }, true);

      const response = await fetch(`${API_BASE_URL}/api/patients/${targetId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(patient),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Paciente no encontrado');
        } else if (response.status === 409) {
          throw new Error('Ya existe un paciente con ese DNI');
        } else if (response.status === 400) {
          throw new Error('Datos del paciente inválidos');
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Eliminar un paciente
  /**
   * @param {string|number} id
   * @returns {Promise<string|undefined>}
   */
  async delete(id) {
    try {
      if (!id) {
        throw new Error('ID del paciente es requerido');
      }

      const response = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Paciente no encontrado');
        } else if (response.status === 409) {
          throw new Error('No se puede eliminar el paciente porque tiene citas asociadas');
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Buscar paciente por email
  /**
   * @param {string} email
   * @returns {Promise<any>}
   */
  async searchByEmail(email) {
    try {
      if (!email) {
        throw new Error('Email es requerido');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/patients/search?email=${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No se encontró paciente con ese email');
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Buscar paciente por DNI
  /**
   * @param {string|number} cardIdentity
   * @returns {Promise<any>}
   */
  async getByCardIdentity(cardIdentity) {
    try {
      if (!cardIdentity) {
        throw new Error('DNI es requerido');
      }

      const response = await fetch(`${API_BASE_URL}/api/patients/dni/${cardIdentity}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No se encontró paciente con ese DNI');
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Crear paciente desde usuario logueado
  /**
   * @param {{ firstName: string, lastName: string, email: string, cardIdentity?: string|number, address?: { street?: string, number?: string, location?: string, city?: string, province?: string } }} userData
   * @returns {Promise<any>}
   */
  async createFromUser(userData) {
    try {
      const patientData = /** @type {Record<string, any>} */ ({
        // Campos heredados de User
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,

        // Campos específicos de Patient
        cardIdentity: userData.cardIdentity || Math.floor(Math.random() * 100000000),
        admissionDate: new Date().toISOString().split('T')[0], // LocalDate en formato YYYY-MM-DD
      });

      // Address como objeto anidado: `location` es el nombre canónico
      // (coincide con Address.location en el backend). Se omite por
      // completo cuando no hay datos reales, ya que el backend ahora
      // rechaza una dirección con `location` en blanco.
      const street = userData.address?.street || '';
      const number = userData.address?.number || '';
      const location = userData.address?.location || userData.address?.city || '';
      const province = userData.address?.province || '';

      if (street || number || location || province) {
        patientData.address = { street, number, location, province };
      }

      return await this.create(patientData);
    } catch (error) {
      logger.error('Error en createFromUser:', error);
      throw error;
    }
  },

  // Validar datos del paciente según la entidad Java
  /**
   * @param {Record<string, any>} patient
   * @param {boolean} [isUpdate]
   * @returns {void}
   */
  validatePatientData(patient, isUpdate = false) {
    requireEntityData(patient, 'del paciente');
    requireIdOnUpdate(patient, isUpdate, 'del paciente');

    // Validar campos heredados de User
    requireMinLength(patient.firstName, 2, 'El nombre debe tener al menos 2 caracteres');

    requireMinLength(patient.lastName, 2, 'El apellido debe tener al menos 2 caracteres');

    if (!patient.email || !isValidEmail(patient.email)) {
      throw new Error('Debe proporcionar un email válido');
    }

    // Validar campos específicos de Patient
    if (patient.cardIdentity) {
      const dni = parseInt(patient.cardIdentity);
      if (isNaN(dni) || dni <= 0) {
        throw new Error('El DNI debe ser un número válido');
      }
    }

    // Validar admissionDate (LocalDate)
    if (!patient.admissionDate) {
      // Si no se proporciona, usar fecha actual
      patient.admissionDate = new Date().toISOString().split('T')[0];
    } else {
      // Validar formato de fecha
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(patient.admissionDate)) {
        throw new Error('La fecha de admisión debe tener formato YYYY-MM-DD');
      }

      const admissionDate = parseYMDToLocalDate(patient.admissionDate);
      if (!admissionDate || isNaN(admissionDate.getTime())) {
        throw new Error('La fecha de admisión no es válida');
      }
    }

    // Validar address (opcional, pero si está debe ser un objeto)
    if (patient.address && typeof patient.address !== 'object') {
      throw new Error('La dirección debe ser un objeto');
    }
  },

  // Formatear datos del paciente para mostrar
  /**
   * @param {Record<string, any> | null | undefined} patient
   * @returns {Record<string, any> | null}
   */
  formatPatientDisplay(patient) {
    if (!patient) return null;

    return {
      ...patient,
      fullName: `${patient.firstName} ${patient.lastName}`,
      displayName: `${patient.firstName} ${patient.lastName}`,
      cardIdentityFormatted: patient.cardIdentity ? patient.cardIdentity.toLocaleString() : 'N/A',
      addressFormatted: this.formatAddress(patient.address),
      admissionDateFormatted: patient.admissionDate
        ? this.formatDate(patient.admissionDate)
        : 'No especificada',
    };
  },

  // Formatear dirección
  /**
   * @param {Record<string, any> | null | undefined} address
   * @returns {string}
   */
  formatAddress(address) {
    if (!address) return 'No especificada';

    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.number) parts.push(address.number);
    if (address.city) parts.push(address.city);
    if (address.province) parts.push(address.province);

    return parts.length > 0 ? parts.join(', ') : 'No especificada';
  },

  // Formatear fecha (LocalDate viene como YYYY-MM-DD)
  /**
   * @param {string} dateString
   * @returns {any}
   */
  formatDate(dateString) {
    if (!dateString) return null;

    return formatLocalDate(dateString);
  },

  // Obtener estadísticas básicas de pacientes
  /**
   * @param {Array<Record<string, any>>} patients
   * @returns {{ total: number, withAddress: number, recentAdmissions: number, byProvince: Record<string, number> }}
   */
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
      withAddress: patients.filter((p) => p.address && (p.address.street || p.address.city)).length,
      recentAdmissions: 0,
      byProvince: /** @type {Record<string, number>} */ ({}),
    };

    // Contar admisiones recientes (últimos 30 días)
    stats.recentAdmissions = patients.filter((patient) => {
      if (!patient.admissionDate) return false;
      const admissionDate = new Date(patient.admissionDate + 'T00:00:00');
      return admissionDate >= thirtyDaysAgo;
    }).length;

    // Agrupar por provincia
    patients.forEach((patient) => {
      const province = patient.address?.province || 'No especificada';
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
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PatientAPI };
}

export default PatientAPI;
