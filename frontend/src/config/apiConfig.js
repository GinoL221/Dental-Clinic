const config = {
  // URL base del backend Spring Boot
  BACKEND_URL: process.env.BACKEND_URL || "http://localhost:8080",

  // Endpoints específicos del backend
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      REGISTER: "/auth/register",
      LOGOUT: "/auth/logout",
      VALIDATE: "/auth/validate",
      REFRESH: "/auth/refresh",
    },
    DENTIST: {
      FIND_ALL: "/dentist/findAll",
      SAVE: "/dentist/save",
      UPDATE: "/dentist/update",
      DELETE: "/dentist/delete",
      FIND_BY_ID: "/dentist/findById",
    },
    PATIENT: {
      FIND_ALL: "/patient/findAll",
      SAVE: "/patient/save",
      UPDATE: "/patient/update",
      DELETE: "/patient/delete",
      FIND_BY_ID: "/patient/findById",
    },
    APPOINTMENT: {
      FIND_ALL: "/appointment/findAll",
      SAVE: "/appointment/save",
      UPDATE: "/appointment/update",
      DELETE: "/appointment/delete",
      FIND_BY_ID: "/appointment/findById",
    },
  },

  // Configuración de timeouts y otros parámetros
  TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3,

  // Helper para construir URLs completas
  getFullUrl: (endpoint) => {
    return `${config.BACKEND_URL}${endpoint}`;
  },

  // Helper para endpoints de autenticación
  getAuthUrl: (authEndpoint) => {
    return config.getFullUrl(config.ENDPOINTS.AUTH[authEndpoint]);
  },

  // Helper para endpoints de dentistas
  getDentistUrl: (dentistEndpoint) => {
    return config.getFullUrl(config.ENDPOINTS.DENTIST[dentistEndpoint]);
  },

  // Helper para endpoints de pacientes
  getPatientUrl: (patientEndpoint) => {
    return config.getFullUrl(config.ENDPOINTS.PATIENT[patientEndpoint]);
  },

  // Helper para endpoints de citas
  getAppointmentUrl: (appointmentEndpoint) => {
    return config.getFullUrl(config.ENDPOINTS.APPOINTMENT[appointmentEndpoint]);
  },
};

module.exports = config;
