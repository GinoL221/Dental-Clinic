// Importar el controlador modular de dentistas
import DentistController from "./modules/index.js";

// Variables globales del controlador
let dentistController;
let isInitialized = false;

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🦷 Inicializando controlador de dentistas modular...");

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

    console.log("🎉 Controlador de dentistas modular listo");
  } catch (error) {
    console.error("❌ Error al inicializar controlador de dentistas:", error);
    showErrorMessage(
      "Error al cargar el sistema de dentistas. Por favor, recargue la página."
    );
  }
});

// Configurar funciones globales para compatibilidad
function setupGlobalFunctions() {
  // Función global para refrescar dentistas
  window.refreshDentists = function () {
    if (dentistController && dentistController.refreshData) {
      return dentistController.refreshData();
    }
    throw new Error("Sistema de dentistas no disponible");
  };

  // Función global para exportar datos
  window.exportDentistData = function (format = "json") {
    if (dentistController && dentistController.exportDentists) {
      const data = dentistController.exportDentists(format);

      // Crear y descargar archivo
      const blob = new Blob([data], {
        type: format === "csv" ? "text/csv" : "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dentists.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return data;
    }
    throw new Error("Sistema de exportación no disponible");
  };

  // Función global para obtener estadísticas
  window.getDentistStats = function () {
    if (dentistController && dentistController.getStats) {
      return dentistController.getStats();
    }
    return null;
  };

  // Función global para agregar dentista
  window.addDentist = async function (dentistData) {
    if (dentistController && dentistController.processAdd) {
      return dentistController.processAdd(dentistData);
    }
    throw new Error("Sistema de dentistas no disponible");
  };

  // Función global para editar dentista
  window.editDentist = async function (dentistId, dentistData) {
    if (dentistController && dentistController.processEdit) {
      return dentistController.processEdit(dentistId, dentistData);
    }
    throw new Error("Sistema de dentistas no disponible");
  };

  // Función global para eliminar dentista
  window.deleteDentist = async function (dentistId) {
    if (dentistController && dentistController.processDelete) {
      return dentistController.processDelete(dentistId);
    }
    throw new Error("Sistema de dentistas no disponible");
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
window.debugDentistController = function () {
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
      refreshDentists: typeof window.refreshDentists === "function",
      exportDentistData: typeof window.exportDentistData === "function",
      getDentistStats: typeof window.getDentistStats === "function",
      addDentist: typeof window.addDentist === "function",
      editDentist: typeof window.editDentist === "function",
      deleteDentist: typeof window.deleteDentist === "function",
    },
  };
};

// Exportar para uso en módulos
export default dentistController;

console.log(
  "📋 Controlador de dentistas modular cargado - Debugging: window.debugDentistController()"
);
