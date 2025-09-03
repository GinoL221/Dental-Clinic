class AuthDataManager {
  constructor() {
    this.currentUser = null;
    this.authToken = null;
    this.sessionData = {};
    this.apiBaseUrl = window.API_BASE_URL || "http://localhost:8080";
  }

  // Procesar login
  async processLogin(credentials) {
    try {
      console.log(
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

      if (response.ok) {
        const responseText = await response.text();

        // Si contiene el script de sincronización, significa que el login fue exitoso
        if (responseText.includes("localStorage.setItem")) {
          console.log("✅ Login exitoso - el servidor configuró localStorage");

          // *** DEBUG: Mostrar exactamente qué recibimos del servidor ***
          console.log("🔍 HTML RESPONSE COMPLETO:", responseText);

          // Extraer y ejecutar manualmente los comandos localStorage del HTML
          const scriptContent = responseText.match(
            /<script>([\s\S]*?)<\/script>/
          )[1];
          const localStorageCommands = scriptContent.match(
            /localStorage\.setItem\([^;]+\);/g
          );

          if (localStorageCommands) {
            console.log(
              "🔧 Ejecutando comandos localStorage manualmente:",
              localStorageCommands
            );
            localStorageCommands.forEach((command) => {
              try {
                eval(command);
              } catch (error) {
                console.error("Error ejecutando comando:", command, error);
              }
            });
          }

          // Dar tiempo adicional para asegurar que se ejecutó
          await new Promise((resolve) => setTimeout(resolve, 200));

          // Leer los datos que el servidor puso en localStorage
          const result = {
            token: localStorage.getItem("authToken"),
            role: localStorage.getItem("userRole"),
            email: localStorage.getItem("userEmail"),
            id: localStorage.getItem("userId"),
            firstName: localStorage.getItem("userFirstName"),
            lastName: localStorage.getItem("userLastName"),
            success: true,
          };

          // *** DEBUG: Mostrar qué se leyó de localStorage ***
          console.log("🔍 DATOS LEIDOS DE LOCALSTORAGE:", result);

          // Actualizar estado local
          await this.handleLoginSuccess(result);

          return result;
        } else {
          // Si no hay script, podría ser una página de error
          throw new Error("Login falló - revisa las credenciales");
        }
      } else {
        throw new Error(`Error de servidor: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Error en login:", error);
      throw new Error(`Error de autenticación: ${error.message}`);
    }
  }

  // Procesar registro
  async processRegister(userData) {
    try {
      console.log(
        "📝 AuthDataManager - Procesando registro para:",
        userData.email
      );

      // Validar datos antes de enviar
      const validation = this.validateRegisterData(userData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      // Usar el endpoint del frontend Node.js
      const response = await fetch("/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: userData.password,
          role: userData.role || "PATIENT",
        }),
      });

      if (response.ok) {
        // El registro fue exitoso, el servidor redirige al login
        console.log("✅ Registro exitoso para:", userData.email);
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
      console.error("❌ Error en registro:", error);
      throw new Error(`Error de registro: ${error.message}`);
    }
  }

  // Manejar respuesta exitosa de login
  async handleLoginSuccess(loginResult) {
    try {
      console.log("🔍 Respuesta procesada:", loginResult);

      // El servidor Node.js ya manejó localStorage y cookies
      // Solo necesitamos actualizar el estado local del controlador

      // Leer datos que ya están en localStorage (puestos por el servidor)
      const userId = localStorage.getItem("userId");
      const userEmail = localStorage.getItem("userEmail");
      const userFirstName = localStorage.getItem("userFirstName");
      const userLastName = localStorage.getItem("userLastName");
      const userRole = localStorage.getItem("userRole");
      const authToken = localStorage.getItem("authToken");

      if (userId && authToken) {
        // Crear objeto de usuario local
        this.currentUser = {
          id: parseInt(userId),
          email: userEmail,
          firstName: userFirstName,
          lastName: userLastName,
          role: userRole,
        };

        this.authToken = authToken;

        // Guardar datos de sesión adicionales
        this.sessionData = {
          loginTime: new Date().toISOString(),
          isAdmin: userRole === "ADMIN",
          token: authToken,
          ...loginResult,
        };

        console.log("✅ Estado local actualizado:", {
          userId: userId,
          userRole: userRole,
          authToken: authToken ? "✅ Token presente" : "❌ No hay token",
          isAdmin: this.sessionData.isAdmin,
        });
      } else {
        throw new Error("No se pudieron leer los datos de localStorage");
      }
    } catch (error) {
      console.error("❌ Error al actualizar estado local:", error);
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
      console.log("🚪 AuthDataManager - Cerrando sesión...");

      // Usar la ruta del frontend que maneja sesiones y cookies
      try {
        const response = await fetch("/users/logout", {
          method: "GET", // El logout del frontend usa GET
        });

        if (response.ok) {
          console.log("✅ Logout notificado al servidor");
        }
      } catch (error) {
        console.warn("⚠️ Error al notificar logout al servidor:", error);
      }

      // El servidor ya limpia las cookies y sesiones
      // Solo necesitamos limpiar el estado local
      this.clearSessionData();

      console.log("✅ Sesión cerrada exitosamente");
      return true;
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
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
      "authToken",
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
  hasActiveSession() {
    const userId = localStorage.getItem("userId");
    const userEmail = localStorage.getItem("userEmail");
    const authToken = localStorage.getItem("authToken");

    return !!(userId && userEmail && authToken);
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
  getAuthToken() {
    return localStorage.getItem("authToken") || this.authToken;
  }

  // Validar sesión con el servidor
  async validateSession() {
    try {
      const token = this.getAuthToken();
      if (!token) {
        return false;
      }

      const response = await fetch(`${this.apiBaseUrl}/auth/validate`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.ok;
    } catch (error) {
      console.error("❌ Error al validar sesión:", error);
      return false;
    }
  }

  // Refrescar token si es necesario
  async refreshToken() {
    try {
      const currentToken = this.getAuthToken();
      if (!currentToken) {
        throw new Error("No hay token para refrescar");
      }

      const response = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al refrescar token");
      }

      const result = await response.json();

      if (result.token) {
        localStorage.setItem("authToken", result.token);
        this.authToken = result.token;
      }

      return result;
    } catch (error) {
      console.error("❌ Error al refrescar token:", error);
      throw error;
    }
  }
}

export default AuthDataManager;
