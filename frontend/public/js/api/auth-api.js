import logger from '../logger.js';

const AuthAPI = {
  // Login de usuario
  async login(email, password) {
    try {
      const response = await fetch(getAuthApiUrl("LOGIN"), {
        method: "POST",
        headers: apiConfig.headers,
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Credenciales incorrectas");
        } else if (response.status === 404) {
          throw new Error("Usuario no encontrado");
        } else {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
      }

      const authResponse = await response.json();

      // Guardar token en localStorage
      if (authResponse.token) {
        localStorage.setItem("authToken", authResponse.token);
        localStorage.setItem("userRole", authResponse.role);
      }

      return authResponse;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Registro de usuario
  async register(firstName, lastName, email, password, role = "PATIENT") {
    try {
      const response = await fetch(getAuthApiUrl("REGISTER"), {
        method: "POST",
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
          throw new Error("El email ya está registrado");
        } else if (response.status === 400) {
          throw new Error("Datos de registro inválidos");
        } else {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
      }

      const authResponse = await response.json();

      // Guardar token en localStorage
      if (authResponse.token) {
        localStorage.setItem("authToken", authResponse.token);
        localStorage.setItem("userRole", authResponse.role);
      }

      return authResponse;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Registro específico de paciente
  async registerPatient(patientData) {
    try {
      const response = await fetch(getAuthApiUrl("REGISTER"), {
        method: "POST",
        headers: window.apiConfig.headers,
        body: JSON.stringify({
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          email: patientData.email,
          password: patientData.password,
          role: "PATIENT",
          // Datos específicos del paciente
          dni: patientData.dni,
          phone: patientData.phone,
          birthDate: patientData.birthDate,
          address: patientData.address,
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("El email o DNI ya está registrado");
        } else if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Datos de registro inválidos");
        } else {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
      }

      const authResponse = await response.json();
      return authResponse;
    } catch (error) {
      logger.error("Error en registerPatient:", error);
      throw error;
    }
  },

  // Logout
  logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    window.location.href = "/";
  },

  // Verificar si está autenticado
  isAuthenticated() {
    // Verificar si existe token en localStorage
    const hasToken = localStorage.getItem("authToken") !== null;

    // También verificar si hay indicios de sesión activa en cookies
    const hasCookieToken = document.cookie.includes("authToken=");

    return hasToken || hasCookieToken;
  },

  // Limpiar datos de autenticación
  clearAuth() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
  },

  // Obtener token
  getToken() {
    return localStorage.getItem("authToken");
  },

  // Obtener rol del usuario
  getUserRole() {
    return localStorage.getItem("userRole");
  },

    // Verificar si el email ya está registrado
    async checkEmailExists(email) {
      try {
        const response = await fetch(getAuthApiUrl("CHECK_EMAIL") + `?email=${encodeURIComponent(email)}`);
        if (!response.ok) {
          throw new Error("Error al verificar email");
        }
        const data = await response.json();
        return data === true;
      } catch (error) {
        logger.error("Error en checkEmailExists:", error);
        return false;
      }
    },

    // Verificar si el DNI ya está registrado
    async checkCardIdentityExists(cardIdentity) {
      try {
        const response = await fetch(getPatientApiUrl("CHECK_CARD_IDENTITY") + `?cardIdentity=${encodeURIComponent(cardIdentity)}`);
        if (!response.ok) {
          throw new Error("Error al verificar cardIdentity");
        }
        const data = await response.json();
        return data === true;
      } catch (error) {
        logger.error("Error en checkCardIdentityExists:", error);
        return false;
      }
    },

  // Verificar si el usuario es admin
  isAdmin() {
    return this.getUserRole() === "ADMIN";
  },

  // Obtener datos del usuario actual (futuro endpoint)
  async getCurrentUser() {
    try {
      const response = await fetch(getAuthApiUrl("VALIDATE"), {
        // Usando VALIDATE como endpoint genérico
        method: "GET",
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
      const response = await fetch(getAuthApiUrl("VALIDATE"), {
        method: "GET",
        headers: getAuthHeaders(),
      });

      return response.ok;
    } catch (error) {
      logger.warn("Error validating token:", error);
      return false;
    }
  },
};

// Exportar para uso en otros archivos y navegador
if (typeof window !== "undefined") {
  window.AuthAPI = AuthAPI;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { AuthAPI };
}
