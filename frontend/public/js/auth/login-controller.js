import AuthController from "../auth/modules/index.js";
import logger from "../logger.js";

// Variables globales del controlador
let authController;
let isInitialized = false;

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", async () => {
  logger.info("🚀 Inicializando controlador de login modular...");

  try {
    // Verificar si el AuthController global ya está disponible
      if (window.authController) {
      authController = window.authController;
      logger.info("✅ Usando AuthController global existente");
    } else {
      // Crear instancia local del controlador modular
      authController = new AuthController();
      await authController.init();

      // Hacer disponible globalmente
      window.authController = authController;
      logger.info("✅ AuthController modular inicializado");
    }

    isInitialized = true;

    // Configurar funciones globales para compatibilidad
    setupGlobalFunctions();

    logger.info("🎉 Controlador de login modular listo");
  } catch (error) {
    logger.error("❌ Error al inicializar controlador de login:", error);
    showErrorMessage(
      "Error al cargar el sistema de login. Por favor, recargue la página."
    );
  }
});

// Configurar funciones globales para compatibilidad
function setupGlobalFunctions() {
  // Función global de login
  window.login = async function (credentials) {
    if (authController && authController.processLogin) {
      return authController.processLogin(credentials);
    }
    throw new Error("Sistema de login no disponible");
  };

  // Función global de validación de formulario
  window.validateLoginForm = function () {
    if (authController && authController.validationManager) {
      const loginForm = document.getElementById("loginForm");
      const formData = new FormData(loginForm);
      return authController.validationManager.validateLoginData(formData);
    }
    return false;
  };

  // Función para verificar autenticación
  window.isAuthenticated = function () {
    if (authController && authController.isAuthenticated) {
      return authController.isAuthenticated();
    }
    return localStorage.getItem("authToken") !== null;
  };

  // Función para obtener datos del usuario actual
  window.getCurrentUser = function () {
    if (authController && authController.getCurrentUser) {
      return authController.getCurrentUser();
    }
    return null;
  };

  // Función para logout
  window.logout = async function () {
    if (authController && authController.processLogout) {
      return authController.processLogout();
    }
    // Fallback básico
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    window.location.href = "/users/login";
  };

  // Función para verificar si el usuario es admin
  window.isAdmin = function () {
    if (authController && authController.isAdmin) {
      return authController.isAdmin();
    }
    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.isAdmin || false;
      } catch (error) {
        return false;
      }
    }
    return false;
  };

  logger.info("✅ Funciones globales configuradas");
}

// Función para mostrar errores
function showErrorMessage(message) {
  const messageContainer = document.getElementById("message");
  if (messageContainer) {
    messageContainer.textContent = message;
    messageContainer.className = "message error";
    messageContainer.style.display = "block";
  } else {
    alert(message);
  }
}

// Función para debugging
window.debugLoginController = function () {
  return {
    isInitialized,
    hasAuthController: !!authController,
    authState: authController ? authController.getState() : null,
    modulesAvailable: {
      dataManager: !!authController?.dataManager,
      uiManager: !!authController?.uiManager,
      formManager: !!authController?.formManager,
      validationManager: !!authController?.validationManager,
    },
    globalFunctions: {
      login: typeof window.login === "function",
      logout: typeof window.logout === "function",
      isAuthenticated: typeof window.isAuthenticated === "function",
      getCurrentUser: typeof window.getCurrentUser === "function",
      isAdmin: typeof window.isAdmin === "function",
      validateLoginForm: typeof window.validateLoginForm === "function",
    },
  };
};

// Exportar para uso en módulos
export default authController;

logger.debug(
  "📋 Controlador de login modular cargado - Debugging: window.debugLoginController()"
);
