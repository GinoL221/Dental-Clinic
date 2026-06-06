// URL base del backend — inyectada por EJS desde process.env o fallback a localhost
import logger from '../logger.js';

export const API_BASE_URL = window.__ENV__?.API_BASE_URL ?? "http://localhost:8080";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    VALIDATE: "/auth/validate",
    REFRESH: "/auth/refresh",
    CHECK_EMAIL: "/auth/check-email",
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
    CHECK_CARD_IDENTITY: "/patients/check-card-identity",
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
    SNAPSHOT: "/dashboard/snapshot",
  },
};

// Helper para construir URLs completas
export function getApiUrl(endpoint) {
  return `${API_BASE_URL}${endpoint}`;
}

// Helpers específicos por módulo
export function getAuthApiUrl(authEndpoint) {
  return getApiUrl(API_ENDPOINTS.AUTH[authEndpoint]);
}

export function getDentistApiUrl(dentistEndpoint) {
  return getApiUrl(API_ENDPOINTS.DENTIST[dentistEndpoint]);
}

export function getPatientApiUrl(patientEndpoint) {
  return getApiUrl(API_ENDPOINTS.PATIENT[patientEndpoint]);
}

export function getAppointmentApiUrl(appointmentEndpoint) {
  return getApiUrl(API_ENDPOINTS.APPOINTMENT[appointmentEndpoint]);
}

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
export function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return {
    ...apiConfig.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Función para manejar errores de la API
export function handleApiError(error) {
  logger.error("API Error:", error);

  // Si es un error 401, limpiar tokens y redirigir al login
  if (error.message.includes("401")) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    window.location.href = "/users/login";
  }

  // Si es un error 403, mostrar mensaje específico
  if (error.message.includes("403")) {
    logger.error(
      "Error 403 - Acceso denegado. Verificar permisos y autenticación."
    );
    logger.error("Token actual:", localStorage.getItem("authToken"));
    logger.error("Rol actual:", localStorage.getItem("userRole"));
  }

  throw error;
}
