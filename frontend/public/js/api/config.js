window.API_BASE_URL = "http://localhost:8080";

// Configuración común para todas las peticiones
window.apiConfig = {
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
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

  throw error;
}

// Exportar configuración
if (typeof module !== "undefined" && module.exports) {
  module.exports = { API_BASE_URL, apiConfig, getAuthHeaders, handleApiError };
}
