import logger from "../../logger.js";

class AuthFormManager {
  constructor(dataManager, uiManager) {
    this.dataManager = dataManager;
    this.uiManager = uiManager;
    this.currentForm = null;
  }

  // Obtener datos del formulario de login
  getLoginFormData() {
    const form = document.getElementById("loginForm");
    if (!form) return null;

    const formData = {
      email: document.getElementById("email")?.value?.trim() || "",
      password: document.getElementById("password")?.value || "",
    };

    logger.debug("AuthFormManager - getLoginFormData:", {
      email: formData.email,
      password: formData.password ? "***" : "",
    });

    return formData;
  }

  // Obtener datos del formulario de registro
  getRegisterFormData() {
    const form = document.getElementById("registerForm");
    if (!form) return null;

    const formData = {
      firstName: document.getElementById("firstName")?.value?.trim() || "",
      lastName: document.getElementById("lastName")?.value?.trim() || "",
      email: document.getElementById("email")?.value?.trim() || "",
      password: document.getElementById("password")?.value || "",
      confirmPassword: document.getElementById("confirmPassword")?.value || "",
      cardIdentity:
        document.getElementById("cardIdentity")?.value?.trim() || "",
      address: {
        street: document.getElementById("street")?.value?.trim() || "",
        number: Number(document.getElementById("number")?.value) || 0,
        location: document.getElementById("location")?.value?.trim() || "",
        province: document.getElementById("province")?.value?.trim() || "",
      },
    };

    logger.debug("AuthFormManager - getRegisterFormData:", {
      ...formData,
      password: formData.password ? "***" : "",
      confirmPassword: formData.confirmPassword ? "***" : "",
    });

    return formData;
  }

  // Manejar envío del formulario de login
  async handleLoginSubmit(e) {
    e.preventDefault();
  logger.debug("AuthFormManager - Procesando login...");

    const formData = this.getLoginFormData();
    if (!formData) {
      this.uiManager.showError("Error al obtener datos del formulario");
      return;
    }

    const submitButton = document.querySelector(
      '#loginForm button[type="submit"]'
    );
    this.uiManager.setButtonLoading(submitButton, true, "Ingresar");

    try {
      // Procesar login a través del DataManager
      const result = await this.dataManager.processLogin(formData);

      // Mostrar mensaje de éxito
      this.uiManager.showSuccess("¡Login exitoso!");

      // Redireccionar según el rol del usuario
      const userRole = result.user?.role || "PATIENT";
      this.uiManager.redirectAfterLogin(userRole);
    } catch (error) {
      logger.error("❌ Error en login:", error);
      this.uiManager.showError(error.message);

      // Enfocar campo de email para reintento
      const emailField = document.getElementById("email");
      if (emailField) {
        emailField.focus();
      }
    } finally {
      this.uiManager.setButtonLoading(submitButton, false, "Ingresar");
    }
  }

  // Manejar envío del formulario de registro
  async handleRegisterSubmit(e) {
    e.preventDefault();
  logger.debug("AuthFormManager - Procesando registro...");

    const formData = this.getRegisterFormData();
    if (!formData) {
      this.uiManager.showError("Error al obtener datos del formulario");
      return;
    }

    const submitButton = document.querySelector(
      '#registerForm button[type="submit"]'
    );
    this.uiManager.setButtonLoading(submitButton, true, "Registrarse");

    try {
      // Procesar registro a través del DataManager
      const result = await this.dataManager.processRegister(formData);

      // Mostrar mensaje de éxito
      this.uiManager.showSuccess(
        "¡Registro exitoso! Será redirigido al login..."
      );

      // Limpiar formulario
      this.clearForm("registerForm");

      // Redireccionar al login
      this.uiManager.redirectAfterRegister();
    } catch (error) {
      logger.error("❌ Error en registro:", error);
      this.uiManager.showError(error.message);

      // Enfocar primer campo con error o email
      const emailField = document.getElementById("email");
      if (emailField) {
        emailField.focus();
      }
    } finally {
      this.uiManager.setButtonLoading(submitButton, false, "Registrarse");
    }
  }

  // Manejar logout
  async handleLogout() {
    try {
  logger.debug("AuthFormManager - Procesando logout...");

      this.uiManager.showGlobalLoading("Cerrando sesión...");

      // Procesar logout a través del DataManager
      await this.dataManager.logout();

      // Redireccionar al login
      this.uiManager.hideGlobalLoading();
      this.uiManager.showSuccess("Sesión cerrada exitosamente");

      setTimeout(() => {
        window.location.href = "/users/login";
      }, 1000);
    } catch (error) {
      logger.error("❌ Error en logout:", error);
      this.uiManager.hideGlobalLoading();
      this.uiManager.showError("Error al cerrar sesión");
    }
  }

  // Limpiar formulario
  clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
      form.reset();
      this.uiManager.clearFormValidation(form);
  logger.debug(`Formulario ${formId} limpiado`);
    }
  }

  // Configurar eventos del formulario de login
  bindLoginFormEvents() {
    const form = document.getElementById("loginForm");
    if (form) {
      form.addEventListener("submit", (e) => this.handleLoginSubmit(e));

      // Configurar efectos visuales
      this.uiManager.setupVisualEffects(form);

      // Configurar toggle de contraseña - COMENTAR ESTA LÍNEA:
      // this.uiManager.setupPasswordToggle(passwordField);

  logger.info("Eventos del formulario de login configurados");
    }
  }

  // Configurar eventos del formulario de registro
  bindRegisterFormEvents() {
    const form = document.getElementById("registerForm");
    if (form) {
      form.addEventListener("submit", (e) => this.handleRegisterSubmit(e));

      // Configurar efectos visuales
      this.uiManager.setupVisualEffects(form);

      // Configurar toggle de contraseña - COMENTAR ESTAS LÍNEAS:
      // const passwordField = document.getElementById("password");
      // const confirmPasswordField = document.getElementById("confirmPassword");
      // this.uiManager.setupPasswordToggle(passwordField, confirmPasswordField);

  logger.info("Eventos del formulario de registro configurados");
    }
  }

  // Configurar eventos de logout
  bindLogoutEvents() {
    // Buscar botones de logout
    const logoutButtons = document.querySelectorAll(
      '.logout-btn, [data-action="logout"], .btn-logout'
    );

    logoutButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    });

    // Evento para cerrar sesión con Ctrl+Alt+L
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.altKey && e.key === "l") {
        e.preventDefault();
        this.handleLogout();
      }
    });

    if (logoutButtons.length > 0) {
      logger.info(`${logoutButtons.length} botones de logout configurados`);
    }
  }

  // Validar formulario antes del envío
  validateForm(formType, data) {
    let validation;

    switch (formType) {
      case "login":
        validation = this.dataManager.validateLoginCredentials(data);
        if (!validation.isValid) {
          this.uiManager.showError(validation.message);
          return false;
        }
        break;

      case "register":
        validation = this.dataManager.validateRegisterData(data);
        if (!validation.isValid) {
          this.uiManager.showError(validation.errors.join(", "));
          return false;
        }
        break;

      default:
        this.uiManager.showError("Tipo de formulario no válido");
        return false;
    }

    return true;
  }

  // Verificar sesión activa
  checkActiveSession() {
    const hasSession = this.dataManager.hasActiveSession();

    if (hasSession) {
      const userData = this.dataManager.getCurrentUserData();
      logger.debug("Sesión activa detectada:", {
        userId: userData.id,
        email: userData.email,
        role: userData.role,
      });

      // Si estamos en login/register y hay sesión, redireccionar
      const currentPath = window.location.pathname;
      if (
        currentPath.includes("/auth/login") ||
        currentPath.includes("/auth/register")
      ) {
  logger.debug("Redirigiendo desde auth a dashboard...");
        const defaultUrl = userData.isAdmin ? "/dentists" : "/appointments";
        window.location.href = defaultUrl;
      }
    }

    return hasSession;
  }

  // Configurar protección de rutas
  setupRouteProtection() {
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.includes("/users/");
    const hasSession = this.dataManager.hasActiveSession();

    // Si no es página de auth y no hay sesión, redireccionar a login
    if (!isAuthPage && !hasSession) {
  logger.warn("Acceso denegado - redirigiendo a login");
      sessionStorage.setItem("returnUrl", currentPath);
      window.location.href = "/users/login";
      return false;
    }

    // Si es página de auth y hay sesión, redireccionar a dashboard
    if (isAuthPage && hasSession) {
  logger.debug("Ya autenticado - redirigiendo a dashboard");
      const userData = this.dataManager.getCurrentUserData();
      const defaultUrl = userData.isAdmin ? "/dentists" : "/appointments";
      window.location.href = defaultUrl;
      return false;
    }

    return true;
  }

  // Configurar actualización automática de token
  setupTokenRefresh() {
    const refreshInterval = 15 * 60 * 1000; // 15 minutos

    setInterval(async () => {
      try {
        if (this.dataManager.hasActiveSession()) {
          await this.dataManager.refreshToken();
          logger.debug("Token refrescado automáticamente");
        }
      } catch (error) {
  logger.warn("⚠️ Error al refrescar token:", error);
        // Si falla el refresh, cerrar sesión
        await this.handleLogout();
      }
    }, refreshInterval);
  }

  // Configurar manejo de eventos de ventana
  setupWindowEvents() {
    // Cerrar sesión al cerrar ventana (opcional)
    window.addEventListener("beforeunload", () => {
      // Solo limpiar datos de sesión temporales, no hacer logout completo
      // para permitir múltiples pestañas
    });

    // Verificar sesión al enfocar ventana
    window.addEventListener("focus", async () => {
      if (this.dataManager.hasActiveSession()) {
        const isValid = await this.dataManager.validateSession();
        if (!isValid) {
          this.uiManager.showError("Su sesión ha expirado");
          await this.handleLogout();
        }
      }
    });
  }

  // Inicializar todas las funcionalidades del FormManager
  init() {
  logger.debug("AuthFormManager - Inicializando...");

    // Verificar sesión activa
    this.checkActiveSession();

    // Configurar protección de rutas
    this.setupRouteProtection();

    // Configurar eventos de formularios
    this.bindLoginFormEvents();
    this.bindRegisterFormEvents();
    this.bindLogoutEvents();

    // Configurar actualizaciones automáticas
    this.setupTokenRefresh();
    this.setupWindowEvents();

  logger.info("AuthFormManager inicializado");
  }
}

export default AuthFormManager;
