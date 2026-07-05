/** @type {{ BACKEND_URL: string, ENDPOINTS: { AUTH: Record<string, string>, DENTIST: Record<string, string>, PATIENT: Record<string, string>, APPOINTMENT: Record<string, string>, DASHBOARD: Record<string, string>, SPECIALTY: Record<string, string> }, TIMEOUT: number, RETRY_ATTEMPTS: number, getFullUrl: (endpoint: string) => string, getAuthUrl: (endpoint: string) => string, getDentistUrl: (endpoint: string) => string, getPatientUrl: (endpoint: string) => string, getAppointmentUrl: (endpoint: string) => string, getDashboardUrl: (endpoint: string) => string, [k: string]: any }} */
const config = {
  // URL base del backend Spring Boot
  BACKEND_URL: process.env.BACKEND_URL || "http://localhost:8080",

  // Endpoints específicos del backend
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/api/auth/login",
      REGISTER: "/api/auth/register",
      LOGOUT: "/api/auth/logout",
      VALIDATE: "/api/auth/validate",
      REFRESH: "/api/auth/refresh",
    },
    DENTIST: {
      FIND_ALL: "/api/dentists",
      SAVE: "/api/dentists",
      UPDATE: "/api/dentists",
      DELETE: "/api/dentists",
      FIND_BY_ID: "/api/dentists",
    },
    PATIENT: {
      FIND_ALL: "/api/patients",
      SAVE: "/api/patients",
      UPDATE: "/api/patients",
      DELETE: "/api/patients",
      FIND_BY_ID: "/api/patients",
    },
    APPOINTMENT: {
      FIND_ALL: "/api/appointments",
      SAVE: "/api/appointments",
      UPDATE: "/api/appointments",
      DELETE: "/api/appointments",
      FIND_BY_ID: "/api/appointments",
      SEARCH: "/api/appointments/search",
    },
    DASHBOARD: {
      SNAPSHOT: "/api/dashboard/snapshot",
    },
    SPECIALTY: {
      FIND_ALL: "/api/specialties",
      FIND_BY_ID: "/api/specialties",
      SAVE: "/api/specialties",
      UPDATE: "/api/specialties",
      DELETE: "/api/specialties",
    },
  },

  // Configuración de timeouts y otros parámetros
  TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3,

  // Helper para construir URLs completas
  /**
   * @param {string} endpoint
   * @returns {string}
   */
  getFullUrl: (endpoint) => {
    return `${config.BACKEND_URL}${endpoint}`;
  },

  // Helper para endpoints de autenticación
  /**
   * @param {keyof typeof config.ENDPOINTS.AUTH} authEndpoint
   * @returns {string}
   */
  getAuthUrl: (authEndpoint) => {
    return config.getFullUrl(config.ENDPOINTS.AUTH[authEndpoint]);
  },

  // Helper para endpoints de dentistas
  /**
   * @param {keyof typeof config.ENDPOINTS.DENTIST} dentistEndpoint
   * @returns {string}
   */
  getDentistUrl: (dentistEndpoint) => {
    return config.getFullUrl(config.ENDPOINTS.DENTIST[dentistEndpoint]);
  },

  // Helper para endpoints de pacientes
  /**
   * @param {keyof typeof config.ENDPOINTS.PATIENT} patientEndpoint
   * @returns {string}
   */
  getPatientUrl: (patientEndpoint) => {
    return config.getFullUrl(config.ENDPOINTS.PATIENT[patientEndpoint]);
  },

  // Helper para endpoints de citas
  /**
   * @param {keyof typeof config.ENDPOINTS.APPOINTMENT} appointmentEndpoint
   * @returns {string}
   */
  getAppointmentUrl: (appointmentEndpoint) => {
    return config.getFullUrl(config.ENDPOINTS.APPOINTMENT[appointmentEndpoint]);
  },

  // Helper para endpoints de dashboard
  /**
   * @param {keyof typeof config.ENDPOINTS.DASHBOARD} dashboardEndpoint
   * @returns {string}
   */
  getDashboardUrl: (dashboardEndpoint) => {
    return config.getFullUrl(config.ENDPOINTS.DASHBOARD[dashboardEndpoint]);
  },
};

module.exports = config;
