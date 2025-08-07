import AuthController from "./modules/index.js";

// Variables globales del controlador
let authController;
let isInitialized = false;

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Inicializando controlador de registro modular...");

  try {
    // Verificar si el AuthController global ya está disponible
    if (window.authController) {
      authController = window.authController;
      console.log("✅ Usando AuthController global existente");
    } else {
      // Crear instancia local del controlador modular
      authController = new AuthController();
      await authController.init();

      // Hacer disponible globalmente
      window.authController = authController;
      console.log("✅ AuthController modular inicializado");
    }

    isInitialized = true;

    // Configurar funciones globales para compatibilidad
    setupGlobalFunctions();

    console.log("🎉 Controlador de registro modular listo");
  } catch (error) {
    console.error("❌ Error al inicializar controlador de registro:", error);
    showErrorMessage(
      "Error al cargar el sistema de registro. Por favor, recargue la página."
    );
  }
});

// Configurar funciones globales para compatibilidad
function setupGlobalFunctions() {
  // Función global de registro
  window.register = async function (userData) {
    if (authController && authController.processRegister) {
      return authController.processRegister(userData);
    }
    throw new Error("Sistema de registro no disponible");
  };

  // Función global de validación de formulario
  window.validateRegisterForm = function () {
    if (authController && authController.validationManager) {
      const registerForm = document.getElementById("registerForm");
      const formData = new FormData(registerForm);
      return authController.validationManager.validateRegisterData(formData);
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

  console.log("✅ Funciones globales configuradas");
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
window.debugRegisterController = function () {
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
  };
};

// Exportar para uso en módulos
export default authController;

console.log(
  "📋 Controlador de registro modular cargado - Debugging: window.debugRegisterController()"
);
