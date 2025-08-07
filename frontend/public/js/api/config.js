window.API_BASE_URL = window.API_BASE_URL || "http://localhost:8080";

// Configuración de endpoints centralizados
window.API_ENDPOINTS = {
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
};

// Helper para construir URLs completas
window.getApiUrl = function (endpoint) {
  return `${window.API_BASE_URL}${endpoint}`;
};

// Helpers específicos por módulo
window.getAuthApiUrl = function (authEndpoint) {
  return window.getApiUrl(window.API_ENDPOINTS.AUTH[authEndpoint]);
};

window.getDentistApiUrl = function (dentistEndpoint) {
  return window.getApiUrl(window.API_ENDPOINTS.DENTIST[dentistEndpoint]);
};

window.getPatientApiUrl = function (patientEndpoint) {
  return window.getApiUrl(window.API_ENDPOINTS.PATIENT[patientEndpoint]);
};

window.getAppointmentApiUrl = function (appointmentEndpoint) {
  return window.getApiUrl(
    window.API_ENDPOINTS.APPOINTMENT[appointmentEndpoint]
  );
};

// Configuración común para todas las peticiones
window.apiConfig = {
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000, // 30 segundos
};

// Función para obtener headers con autenticación
function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return {
    ...apiConfig.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Función para manejar errores de la API
function handleApiError(error) {
  console.error("API Error:", error);

  // Si es un error 401, limpiar tokens y redirigir al login
  if (error.message.includes("401")) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    window.location.href = "/users/login";
  }

  // Si es un error 403, mostrar mensaje específico
  if (error.message.includes("403")) {
    console.error(
      "Error 403 - Acceso denegado. Verificar permisos y autenticación."
    );
    console.error("Token actual:", localStorage.getItem("authToken"));
    console.error("Rol actual:", localStorage.getItem("userRole"));
  }

  throw error;
}

// Configuración de endpoints de la API - UTILIZANDO LOS NUEVOS HELPERS
window.API_CONFIG = {
  endpoints: {
    auth: {
      login: window.API_ENDPOINTS.AUTH.LOGIN,
      register: window.API_ENDPOINTS.AUTH.REGISTER,
      logout: window.API_ENDPOINTS.AUTH.LOGOUT,
    },
    dentists: {
      list: window.API_ENDPOINTS.DENTIST.FIND_ALL,
      create: window.API_ENDPOINTS.DENTIST.SAVE,
      update: window.API_ENDPOINTS.DENTIST.UPDATE,
      delete: window.API_ENDPOINTS.DENTIST.DELETE,
      findById: window.API_ENDPOINTS.DENTIST.FIND_BY_ID,
    },
    patients: {
      list: window.API_ENDPOINTS.PATIENT.FIND_ALL,
      create: window.API_ENDPOINTS.PATIENT.SAVE,
      update: window.API_ENDPOINTS.PATIENT.UPDATE,
      delete: window.API_ENDPOINTS.PATIENT.DELETE,
      findById: window.API_ENDPOINTS.PATIENT.FIND_BY_ID,
      search: "/patient/search", // Endpoint personalizado
    },
    appointments: {
      list: window.API_ENDPOINTS.APPOINTMENT.FIND_ALL,
      create: window.API_ENDPOINTS.APPOINTMENT.SAVE,
      update: window.API_ENDPOINTS.APPOINTMENT.UPDATE,
      delete: window.API_ENDPOINTS.APPOINTMENT.DELETE,
      findById: window.API_ENDPOINTS.APPOINTMENT.FIND_BY_ID,
    },
  },
};

// Exportar configuración
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    API_BASE_URL,
    apiConfig,
    getAuthHeaders,
    handleApiError,
    API_CONFIG,
  };
}
