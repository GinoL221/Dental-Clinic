import logger from '../logger.js';
import {
  getAuthApiUrl,
  getPatientApiUrl,
  apiConfig,
  handleApiError,
  getAuthHeaders,
} from './config.js';

const AuthAPI = {
  // Login de usuario
  /**
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    try {
      const response = await fetch(getAuthApiUrl('LOGIN'), {
        method: 'POST',
        headers: apiConfig.headers,
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Credenciales incorrectas');
        } else if (response.status === 404) {
          throw new Error('Usuario no encontrado');
        } else {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
      }

      const authResponse = await response.json();

      // El JWT viaja en la cookie httpOnly que el backend ya seteó en esta
      // misma respuesta; aquí solo persistimos el rol (dato no sensible).
      if (authResponse.token) {
        localStorage.setItem('userRole', authResponse.role);
      }

      return authResponse;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Registro de usuario
  /**
   * @param {string} firstName
   * @param {string} lastName
   * @param {string} email
   * @param {string} password
   * @param {string} [role]
   */
  async register(firstName, lastName, email, password, role = 'PATIENT') {
    try {
      const response = await fetch(getAuthApiUrl('REGISTER'), {
        method: 'POST',
        headers: apiConfig.headers,
        body: JSON.stringify({
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: password,
          role: role,
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('El email ya está registrado');
        } else if (response.status === 400) {
          throw new Error('Datos de registro inválidos');
        } else {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
      }

      const authResponse = await response.json();

      // El JWT viaja en la cookie httpOnly que el backend ya seteó en esta
      // misma respuesta; aquí solo persistimos el rol (dato no sensible).
      if (authResponse.token) {
        localStorage.setItem('userRole', authResponse.role);
      }

      return authResponse;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Registro específico de paciente
  /**
   * @param {Record<string, any>} patientData
   * @returns {Promise<any>}
   */
  async registerPatient(patientData) {
    try {
      const response = await fetch(getAuthApiUrl('REGISTER'), {
        method: 'POST',
        headers: apiConfig.headers,
        body: JSON.stringify({
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          email: patientData.email,
          password: patientData.password,
          role: 'PATIENT',
          // Datos específicos del paciente
          dni: patientData.dni,
          phone: patientData.phone,
          birthDate: patientData.birthDate,
          address: patientData.address,
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('El email o DNI ya está registrado');
        } else if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Datos de registro inválidos');
        } else {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
      }

      const authResponse = await response.json();
      return authResponse;
    } catch (error) {
      logger.error('Error en registerPatient:', error);
      throw error;
    }
  },

  // Logout
  /**
   * @returns {void}
   */
  logout() {
    localStorage.removeItem('userRole');
    window.location.href = '/';
  },

  // Verificar si está autenticado
  // El JWT vive en la cookie httpOnly 'authToken' (no expuesta a
  // document.cookie por diseño). El backend setea 'userEmail' como cookie
  // NO httpOnly en la misma respuesta de login, así que su presencia es la
  // señal de sesión activa visible desde el cliente.
  /**
   * @returns {boolean}
   */
  isAuthenticated() {
    return document.cookie.includes('userEmail=');
  },

  // Limpiar datos de autenticación
  /**
   * @returns {void}
   */
  clearAuth() {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
  },

  // Obtener token
  // Deprecated: el JWT vive exclusivamente en la cookie httpOnly, invisible
  // para JS por diseño. No hay ningún valor legible que este método pueda
  // devolver — queda solo para no romper callers existentes.
  /**
   * @returns {null}
   */
  getToken() {
    return null;
  },

  // Obtener rol del usuario
  /**
   * @returns {string|null}
   */
  getUserRole() {
    return localStorage.getItem('userRole');
  },

  // Verificar si el email ya está registrado
  /**
   * @param {string} email
   * @returns {Promise<boolean>}
   */
  async checkEmailExists(email) {
    try {
      const response = await fetch(
        getAuthApiUrl('CHECK_EMAIL') + `?email=${encodeURIComponent(email)}`,
      );
      if (!response.ok) {
        throw new Error('Error al verificar email');
      }
      const data = await response.json();
      return data === true;
    } catch (error) {
      logger.error('Error en checkEmailExists:', error);
      return false;
    }
  },

  // Verificar si el DNI ya está registrado
  /**
   * @param {string|number} cardIdentity
   * @returns {Promise<boolean>}
   */
  async checkCardIdentityExists(cardIdentity) {
    try {
      const response = await fetch(
        getPatientApiUrl('CHECK_CARD_IDENTITY') +
          `?cardIdentity=${encodeURIComponent(cardIdentity)}`,
      );
      if (!response.ok) {
        throw new Error('Error al verificar cardIdentity');
      }
      const data = await response.json();
      return data === true;
    } catch (error) {
      logger.error('Error en checkCardIdentityExists:', error);
      return false;
    }
  },

  // Verificar si el usuario es admin
  /**
   * @returns {boolean}
   */
  isAdmin() {
    return this.getUserRole() === 'ADMIN';
  },

  // Obtener datos del usuario actual (futuro endpoint)
  async getCurrentUser() {
    try {
      const response = await fetch(getAuthApiUrl('VALIDATE'), {
        // Usando VALIDATE como endpoint genérico
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  // Validar token (futuro endpoint)
  async validateToken() {
    try {
      const response = await fetch(getAuthApiUrl('VALIDATE'), {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      return response.ok;
    } catch (error) {
      logger.warn('Error validating token:', error);
      return false;
    }
  },

  // Refrescar token
  async refreshToken() {
    try {
      const response = await fetch(getAuthApiUrl('REFRESH'), {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },
};

// Exportar para uso en otros archivos y navegador
if (typeof window !== 'undefined') {
  window.AuthAPI = AuthAPI;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthAPI };
}

export default AuthAPI;
