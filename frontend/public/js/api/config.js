// URL base del backend — inyectada por EJS desde process.env o fallback a localhost
import logger from '../logger.js';

export const API_BASE_URL = window.__ENV__?.API_BASE_URL ?? "http://localhost:8080";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    VALIDATE: "/api/auth/validate",
    REFRESH: "/api/auth/refresh",
    CHECK_EMAIL: "/api/auth/check-email",
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
    CHECK_CARD_IDENTITY: "/api/patients/check-card-identity",
  },
  APPOINTMENT: {
    FIND_ALL: "/api/appointments",
    SAVE: "/api/appointments",
    UPDATE: "/api/appointments",
    DELETE: "/api/appointments",
    FIND_BY_ID: "/api/appointments",
    SEARCH: "/api/appointments/search",
  },
  SPECIALTY: {
    FIND_ALL: "/api/specialties",
    FIND_BY_ID: "/api/specialties",
    SAVE: "/api/specialties",
    UPDATE: "/api/specialties",
    DELETE: "/api/specialties",
  },
  DASHBOARD: {
    SNAPSHOT: "/api/dashboard/snapshot",
  },
};

// Helper para construir URLs completas
/**
 * @param {string} endpoint
 * @returns {string}
 */
export function getApiUrl(endpoint) {
  return `${API_BASE_URL}${endpoint}`;
}

// Helpers específicos por módulo
/**
 * @param {keyof typeof API_ENDPOINTS.AUTH} authEndpoint
 * @returns {string}
 */
export function getAuthApiUrl(authEndpoint) {
  return getApiUrl(API_ENDPOINTS.AUTH[authEndpoint]);
}

/**
 * @param {keyof typeof API_ENDPOINTS.DENTIST} dentistEndpoint
 * @returns {string}
 */
export function getDentistApiUrl(dentistEndpoint) {
  return getApiUrl(API_ENDPOINTS.DENTIST[dentistEndpoint]);
}

/**
 * @param {keyof typeof API_ENDPOINTS.PATIENT} patientEndpoint
 * @returns {string}
 */
export function getPatientApiUrl(patientEndpoint) {
  return getApiUrl(API_ENDPOINTS.PATIENT[patientEndpoint]);
}

/**
 * @param {keyof typeof API_ENDPOINTS.APPOINTMENT} appointmentEndpoint
 * @returns {string}
 */
export function getAppointmentApiUrl(appointmentEndpoint) {
  return getApiUrl(API_ENDPOINTS.APPOINTMENT[appointmentEndpoint]);
}

/**
 * @param {keyof typeof API_ENDPOINTS.DASHBOARD} dashboardEndpoint
 * @returns {string}
 */
export function getDashboardApiUrl(dashboardEndpoint) {
  return getApiUrl(API_ENDPOINTS.DASHBOARD[dashboardEndpoint]);
}

// Configuración común para todas las peticiones
export const apiConfig = {
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
};

// Función para obtener headers con autenticación
// El JWT viaja exclusivamente en la cookie httpOnly (enviada automáticamente
// por el navegador vía `credentials: "include"` en cada fetch); ya no hay
// token legible en localStorage para construir un header Authorization.
export function getAuthHeaders() {
  return {
    ...apiConfig.headers,
  };
}

// Función para manejar errores de la API
/**
 * @param {any} error
 */
export function handleApiError(error) {
  logger.error("API Error:", error);

  // Si es un error 401, limpiar datos locales y redirigir al login
  if (error.message.includes("401")) {
    localStorage.removeItem("userRole");
    window.location.href = "/users/login";
  }

  // Si es un error 403, mostrar mensaje específico
  if (error.message.includes("403")) {
    logger.error(
      "Error 403 - Acceso denegado. Verificar permisos y autenticación."
    );
    logger.error("Rol actual:", localStorage.getItem("userRole"));
  }

  throw error;
}
