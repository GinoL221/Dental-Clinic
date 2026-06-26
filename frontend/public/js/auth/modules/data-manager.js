import logger from "../../logger.js";
class AuthDataManager {
  constructor() {
    this.currentUser = null;
    this.authToken = null;
    this.sessionData = {};
    this.apiBaseUrl = window.__ENV__?.API_BASE_URL || "http://localhost:8080";
  }

  // Procesar login
  async processLogin(credentials) {
    try {
      logger.info(
        "🔐 AuthDataManager - Procesando login para:",
        credentials.email
      );

      // Validar credenciales antes de enviar
      const validation = this.validateLoginCredentials(credentials);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // Usar el endpoint del frontend Node.js que maneja sesiones y cookies
      const response = await fetch("/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Requested-With": "ModularAuth", // Identificar como petición modular
        },
        body: new URLSearchParams({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error("Login falló - revisa las credenciales");
      }

      logger.info("✅ Login exitoso - parseando respuesta JSON del servidor");

      // Write session data to localStorage explicitly — no dynamic execution, no regex.
      // authToken is NEVER written here: the httpOnly cookie set server-side
      // (postLogin.js) already carries the JWT; storing it in localStorage
      // would make it readable by any XSS payload.
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("userId", data.id);
      localStorage.setItem("userFirstName", data.firstName || "");
      localStorage.setItem("userLastName", data.lastName || "");

      const result = { ...data, success: true };

      logger.debug("🔍 DATOS ESCRITOS EN LOCALSTORAGE:", {
        userRole: data.role,
        userEmail: data.email,
        userId: data.id,
        userFirstName: data.firstName,
        userLastName: data.lastName,
      });

      // Update local controller state
      await this.handleLoginSuccess(result);

      return result;
    } catch (error) {
      logger.error("❌ Error en login:", error);
      throw new Error(`Error de autenticación: ${error.message}`);
    }
  }

  // Procesar registro
  async processRegister(userData) {
    try {
      logger.info(
        "📝 AuthDataManager - Procesando registro para:",
        userData.email
      );

      // Validar datos antes de enviar
      const validation = this.validateRegisterData(userData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      // Usar el endpoint del frontend Node.js enviando JSON completo
      const response = await fetch("/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData), // Enviar todo el objeto, incluyendo address
      });

      if (response.ok) {
        // El registro fue exitoso, el servidor redirige al login
        logger.info("✅ Registro exitoso para:", userData.email);
        return { success: true, message: "Registro exitoso" };
      } else {
        const errorText = await response.text();
        if (errorText.includes("email ya está registrado")) {
          throw new Error("El email ya está registrado");
        } else if (errorText.includes("Datos de registro inválidos")) {
          throw new Error("Datos de registro inválidos");
        } else {
          throw new Error(`Error de servidor: ${response.status}`);
        }
      }
    } catch (error) {
      logger.error("❌ Error en registro:", error);
      throw new Error(`Error de registro: ${error.message}`);
    }
  }

  // Manejar respuesta exitosa de login
  async handleLoginSuccess(loginResult) {
    try {
      logger.debug("🔍 Respuesta procesada:", loginResult);

      // El servidor Node.js ya manejó localStorage y cookies
      // Solo necesitamos actualizar el estado local del controlador

      // Leer datos que ya están en localStorage (puestos por el servidor)
      // authToken NUNCA se lee de localStorage: la cookie httpOnly ya
      // identifica la sesión ante el backend en cada request.
      const userId = localStorage.getItem("userId");
      const userEmail = localStorage.getItem("userEmail");
      const userFirstName = localStorage.getItem("userFirstName");
      const userLastName = localStorage.getItem("userLastName");
      const userRole = localStorage.getItem("userRole");

      if (userId) {
        // Crear objeto de usuario local
        this.currentUser = {
          id: parseInt(userId),
          email: userEmail,
          firstName: userFirstName,
          lastName: userLastName,
          role: userRole,
        };

        // Guardar datos de sesión adicionales
        this.sessionData = {
          loginTime: new Date().toISOString(),
          isAdmin: userRole === "ADMIN",
          ...loginResult,
        };

        logger.info("✅ Estado local actualizado:", {
          userId: userId,
          userRole: userRole,
          isAdmin: this.sessionData.isAdmin,
        });
      } else {
        throw new Error("No se pudieron leer los datos de localStorage");
      }
    } catch (error) {
      logger.error("❌ Error al actualizar estado local:", error);
      throw error;
    }
  }

  // Validar credenciales de login
  validateLoginCredentials(credentials) {
    const errors = [];

    // Validar email
    if (!credentials.email || credentials.email.trim() === "") {
      errors.push("El email es requerido");
    } else if (!this.isValidEmail(credentials.email)) {
      errors.push("El formato del email no es válido");
    }

    // Validar password
    if (!credentials.password || credentials.password.trim() === "") {
      errors.push("La contraseña es requerida");
    } else if (credentials.password.length < 6) {
      errors.push("La contraseña debe tener al menos 6 caracteres");
    }

    return {
      isValid: errors.length === 0,
      message: errors.length > 0 ? errors[0] : "",
    };
  }

  // Validar datos de registro
  validateRegisterData(userData) {
    const errors = [];

    // Validar nombre
    if (!userData.firstName || userData.firstName.trim().length < 2) {
      errors.push("El nombre debe tener al menos 2 caracteres");
    }

    // Validar apellido
    if (!userData.lastName || userData.lastName.trim().length < 2) {
      errors.push("El apellido debe tener al menos 2 caracteres");
    }

    // Validar email
    if (!userData.email || userData.email.trim() === "") {
      errors.push("El email es requerido");
    } else if (!this.isValidEmail(userData.email)) {
      errors.push("El formato del email no es válido");
    }

    // Validar password
    if (!userData.password || userData.password.length < 6) {
      errors.push("La contraseña debe tener al menos 6 caracteres");
    }

    // Validar confirmación de password
    if (userData.password !== userData.confirmPassword) {
      errors.push("Las contraseñas no coinciden");
    }

    // Validar cédula
    if (!userData.cardIdentity || userData.cardIdentity.trim() === "") {
      errors.push("La cédula es requerida");
    } else if (userData.cardIdentity.trim().length < 7) {
      errors.push("La cédula debe tener al menos 7 caracteres");
    }

    // Validar dirección
    if (userData.address) {
      if (!userData.address.street || userData.address.street.length < 2) {
        errors.push("La calle debe tener al menos 2 caracteres");
      }
      if (!userData.address.number || isNaN(userData.address.number)) {
        errors.push("El número de calle es obligatorio y debe ser numérico");
      }
      if (!userData.address.location || userData.address.location.length < 2) {
        errors.push("La localidad debe tener al menos 2 caracteres");
      }
      if (!userData.address.province || userData.address.province.length < 2) {
        errors.push("La provincia debe tener al menos 2 caracteres");
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  // Validar formato de email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Cerrar sesión
  async logout() {
    try {
      logger.info("🚪 AuthDataManager - Cerrando sesión...");

      // Usar la ruta del frontend que maneja sesiones y cookies
      try {
        const response = await fetch("/users/logout", {
          method: "GET", // El logout del frontend usa GET
        });

        if (response.ok) {
          logger.info("✅ Logout notificado al servidor");
        }
      } catch (error) {
        logger.warn("⚠️ Error al notificar logout al servidor:", error);
      }

      // El servidor ya limpia las cookies y sesiones
      // Solo necesitamos limpiar el estado local
      this.clearSessionData();

      logger.info("✅ Sesión cerrada exitosamente");
      return true;
    } catch (error) {
      logger.error("❌ Error al cerrar sesión:", error);
      throw error;
    }
  }

  // Limpiar datos de sesión
  clearSessionData() {
    // Limpiar localStorage
    const keysToRemove = [
      "userId",
      "userEmail",
      "userFirstName",
      "userLastName",
      "userRole",
      "patientId",
    ];

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    // Limpiar estado interno
    this.currentUser = null;
    this.authToken = null;
    this.sessionData = {};
  }

  // Verificar si hay sesión activa
  // authToken ya no se usa como señal: la sesión vive en la cookie httpOnly,
  // invisible para este código. userId + userEmail en localStorage son la
  // única señal de cliente disponible.
  hasActiveSession() {
    const userId = localStorage.getItem("userId");
    const userEmail = localStorage.getItem("userEmail");

    return !!(userId && userEmail);
  }

  // Obtener datos del usuario actual desde localStorage
  getCurrentUserData() {
    if (!this.hasActiveSession()) {
      return null;
    }

    return {
      id: parseInt(localStorage.getItem("userId")) || 0,
      email: localStorage.getItem("userEmail") || "",
      name: localStorage.getItem("userFirstName") || "",
      lastName: localStorage.getItem("userLastName") || "",
      role: localStorage.getItem("userRole") || "PATIENT",
      patientId: parseInt(localStorage.getItem("patientId")) || null,
      isAdmin: localStorage.getItem("userRole") === "ADMIN",
    };
  }

  // Verificar si el usuario es admin
  isAdmin() {
    const userRole = localStorage.getItem("userRole");
    return userRole === "ADMIN";
  }

  // Obtener token de autenticación
  // Deprecated: el JWT vive solo en la cookie httpOnly (inaccesible desde
  // JS por diseño). Ya no hay ningún token legible en localStorage ni en
  // memoria que este método pueda devolver con sentido.
  getAuthToken() {
    return null;
  }

  // Validar sesión con el servidor
  async validateSession() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/validate`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.ok;
    } catch (error) {
      logger.error("❌ Error al validar sesión:", error);
      return false;
    }
  }

  // Refrescar token si es necesario
  // La cookie httpOnly se renueva server-side; este método solo dispara el
  // endpoint de refresh y deja que la cookie Set-Cookie de la respuesta
  // reemplace la anterior — no hay token que leer ni escribir aquí.
  async refreshToken() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al refrescar token");
      }

      return await response.json();
    } catch (error) {
      logger.error("❌ Error al refrescar token:", error);
      throw error;
    }
  }
}

export default AuthDataManager;
