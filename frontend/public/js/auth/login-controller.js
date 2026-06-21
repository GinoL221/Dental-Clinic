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
      // Crear instancia local del controlador modular y publicarla
      // ANTES de inicializar, para que ningún otro listener concurrente
      // cree una segunda instancia mientras esta espera su propio init().
      authController = new AuthController();
      window.authController = authController;
      await authController.init();

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
// login/logout/isAuthenticated/getCurrentUser/isAdmin ya los wirea AuthController (auth/modules/index.js)
function setupGlobalFunctions() {
  // Función global de validación de formulario
  window.validateLoginForm = function () {
    if (authController && authController.validationManager) {
      const loginForm = document.getElementById("loginForm");
      const formData = new FormData(loginForm);
      return authController.validationManager.validateLoginData(formData);
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
