// Importar el controlador modular de dentistas
import DentistController from "./modules/index.js";

// Variables globales del controlador
let dentistController;
let isInitialized = false;

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", async () => {
  console.log("📋 Inicializando controlador de lista de dentistas modular...");

  try {
    // Verificar si el DentistController global ya está disponible
    if (window.dentistController) {
      dentistController = window.dentistController;
      console.log("✅ Usando DentistController global existente");
    } else {
      // Crear instancia local del controlador modular
      dentistController = new DentistController();
      await dentistController.init();

      // Hacer disponible globalmente
      window.dentistController = dentistController;
      console.log("✅ DentistController modular inicializado");
    }

    isInitialized = true;

    // Configurar funciones globales para compatibilidad
    setupGlobalFunctions();

    console.log("🎉 Controlador de lista de dentistas modular listo");
  } catch (error) {
    console.error(
      "❌ Error al inicializar controlador de lista de dentistas:",
      error
    );
    showErrorMessage(
      "Error al cargar la lista de dentistas. Por favor, recargue la página."
    );
  }
});

// Configurar funciones globales para compatibilidad
function setupGlobalFunctions() {
  // Función global para cargar lista
  window.loadDentistsList = function () {
    if (dentistController && dentistController.loadList) {
      return dentistController.loadList();
    }
    throw new Error("Sistema de dentistas no disponible");
  };

  // Función global para filtrar lista
  window.filterDentists = function (criteria) {
    if (dentistController && dentistController.filterList) {
      return dentistController.filterList(criteria);
    }
    return [];
  };

  // Función global para buscar dentistas
  window.searchDentists = function (query) {
    if (dentistController && dentistController.searchList) {
      return dentistController.searchList(query);
    }
    return [];
  };

  console.log("✅ Funciones globales de lista configuradas");
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
window.debugDentistListController = function () {
  return {
    isInitialized,
    hasDentistController: !!dentistController,
    dentistState: dentistController ? dentistController.getState() : null,
    modulesAvailable: {
      dataManager: !!dentistController?.dataManager,
      uiManager: !!dentistController?.uiManager,
      formManager: !!dentistController?.formManager,
      validationManager: !!dentistController?.validationManager,
    },
    globalFunctions: {
      loadDentistsList: typeof window.loadDentistsList === "function",
      filterDentists: typeof window.filterDentists === "function",
      searchDentists: typeof window.searchDentists === "function",
    },
  };
};

// Exportar para uso en módulos
export default dentistController;

console.log(
  "📋 Controlador de lista de dentistas modular cargado - Debugging: window.debugDentistListController()"
);
