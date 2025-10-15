// SOLUCIÓN: Definir la URL directamente
export const API_BASE_URL = "http://localhost:8080";
export const OTHER_ENV_VAR = "valor";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login", // Cambiado de /auth/login
    REGISTER: "/auth/register", // Cambiado de /auth/register
    LOGOUT: "/auth/logout", // Cambiado de /auth/logout
    VALIDATE: "/auth/validate", // Cambiado de /auth/validate
    REFRESH: "/auth/refresh", // Cambiado de /auth/refresh
    CHECK_EMAIL: "/auth/check-email", // Cambiado de /auth/check-email
  },
  DENTIST: {
    FIND_ALL: "/dentists", // Cambiado de /dentist/findAll
    SAVE: "/dentists", // Cambiado de /dentist/save
    UPDATE: "/dentists", // Cambiado de /dentist/update
    DELETE: "/dentists", // Cambiado de /dentist/delete
    FIND_BY_ID: "/dentists", // Cambiado de /dentist/findById
  },
  PATIENT: {
    FIND_ALL: "/patients", // Ya correcto
    SAVE: "/patients", // Ya correcto
    UPDATE: "/patients", // Ya correcto
    DELETE: "/patients", // Ya correcto
    FIND_BY_ID: "/patients", // Ya correcto
    CHECK_CARD_IDENTITY: "/patients/check-card-identity",
  },
  APPOINTMENT: {
    FIND_ALL: "/appointments", // Cambiado de /appointment/findAll
    SAVE: "/appointments", // Cambiado de /appointment/save
    UPDATE: "/appointments", // Cambiado de /appointment/update
    DELETE: "/appointments", // Cambiado de /appointment/delete
    FIND_BY_ID: "/appointments", // Cambiado de /appointment/findById
    SEARCH: "/appointments/search", // Nuevo endpoint de búsqueda
  },
  // Nuevos endpoints para dashboard usando datos existentes
  DASHBOARD: {
    STATS: "/appointments", // Usar appointments para calcular stats
    APPOINTMENTS_BY_MONTH: "/appointments",
    UPCOMING: "/appointments",
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
import logger from '../logger.js';

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
