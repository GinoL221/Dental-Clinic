const config = {
  // URL base del backend Spring Boot
  BACKEND_URL: "http://localhost:8080",

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
      FIND_ALL: "/dentists",
      SAVE: "/dentists",
      UPDATE: "/dentists",
      DELETE: "/dentists",
      FIND_BY_ID: "/dentists",
    },
    PATIENT: {
      FIND_ALL: "/patients",
      SAVE: "/patients",
      UPDATE: "/patients",
      DELETE: "/patients",
      FIND_BY_ID: "/patients",
    },
    APPOINTMENT: {
      FIND_ALL: "/appointments",
      SAVE: "/appointments",
      UPDATE: "/appointments",
      DELETE: "/appointments",
      FIND_BY_ID: "/appointments",
      SEARCH: "/appointments/search",
    },
    DASHBOARD: {
      STATS: "/appointments", // Usar appointments existente
      APPOINTMENTS_BY_MONTH: "/appointments", // Usar appointments existente
      UPCOMING: "/appointments", // Usar appointments existente
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

  // Helper para endpoints de dashboard
  getDashboardUrl: (dashboardEndpoint) => {
    return config.getFullUrl(config.ENDPOINTS.DASHBOARD[dashboardEndpoint]);
  },
};

module.exports = config;
