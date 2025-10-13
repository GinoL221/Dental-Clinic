// Importar el controlador modular de pacientes
import PatientController from "./modules/index.js";
import logger from "../logger.js";

// Variables globales del controlador
let patientController;
let isInitialized = false;

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", async () => {
  logger.log("� Inicializando controlador de pacientes modular...");

  try {
    // Verificar si el PatientController global ya está disponible
    if (window.patientController) {
      patientController = window.patientController;
      logger.log("✅ Usando PatientController global existente");
    } else {
      // Crear instancia local del controlador modular
      patientController = new PatientController();
      await patientController.init();

      // Hacer disponible globalmente
      window.patientController = patientController;
      logger.log("✅ PatientController modular inicializado");
    }

    isInitialized = true;

    // Configurar funciones globales para compatibilidad
    setupGlobalFunctions();

    logger.log("🎉 Controlador de pacientes modular listo");
  } catch (error) {
    logger.error("❌ Error al inicializar controlador de pacientes:", error);
    showErrorMessage(
      "Error al cargar el sistema de pacientes. Por favor, recargue la página."
    );
  }
});

// Configurar funciones globales para compatibilidad
function setupGlobalFunctions() {
  // Función global para refrescar pacientes
  window.refreshPatients = function () {
    if (patientController && patientController.loadList) {
      return patientController.loadList();
    }
    throw new Error("Sistema de pacientes no disponible");
  };

  // Función global para exportar datos
  window.exportPatientData = function (format = "json") {
    if (patientController && patientController.exportPatients) {
      return patientController.exportPatients(format);
    }
    throw new Error("Sistema de exportación no disponible");
  };

  // Función global para obtener estadísticas
  window.getPatientStats = function () {
    if (patientController && patientController.showStats) {
      return patientController.showStats();
    }
    return null;
  };

  // Función global para agregar paciente
  window.addPatient = async function (patientData) {
    if (patientController && patientController.formManager) {
      return patientController.formManager.handleAddSubmit({
        preventDefault: () => {},
        target: { querySelector: () => ({ disabled: false, innerHTML: "" }) },
      });
    }
    throw new Error("Sistema de pacientes no disponible");
  };

  // Función global para editar paciente
  window.editPatient = async function (patientId) {
    if (patientController && patientController.editPatient) {
      return patientController.editPatient(patientId);
    }
    throw new Error("Sistema de pacientes no disponible");
  };

  // Función global para eliminar paciente
  window.deletePatient = async function (patientId) {
    if (patientController && patientController.deletePatient) {
      return patientController.deletePatient(patientId);
    }
    throw new Error("Sistema de pacientes no disponible");
  };

  // Función global para cancelar edición
  window.cancelPatientEdit = function () {
    if (patientController && patientController.cancelEdit) {
      return patientController.cancelEdit();
    }
  };

  // Función global para buscar pacientes
  window.searchPatients = function (query) {
    if (patientController && patientController.performSearch) {
      patientController.searchTerm = query;
      return patientController.performSearch();
    }
    return [];
  };

  logger.info("Funciones globales configuradas");
}

// Función para mostrar errores
function showErrorMessage(message) {
  const messageContainer =
    document.getElementById("message") ||
    document.getElementById("patient-messages") ||
    document.getElementById("response");
  if (messageContainer) {
    messageContainer.innerHTML = `
      <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <i class="bi bi-exclamation-triangle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
    messageContainer.style.display = "block";
  } else {
    alert(message);
  }
}

// Función para debugging
window.debugPatientController = function () {
  return {
    isInitialized,
    hasPatientController: !!patientController,
    patientState: patientController
      ? {
          currentPage: patientController.currentPage,
          patientsCount: patientController.patients?.length || 0,
          searchTerm: patientController.searchTerm,
          isInitialized: patientController.isInitialized,
        }
      : null,
    modulesAvailable: {
      dataManager: !!patientController?.dataManager,
      uiManager: !!patientController?.uiManager,
      formManager: !!patientController?.formManager,
      validationManager: !!patientController?.validationManager,
    },
    globalFunctions: {
      refreshPatients: typeof window.refreshPatients === "function",
      exportPatientData: typeof window.exportPatientData === "function",
      getPatientStats: typeof window.getPatientStats === "function",
      addPatient: typeof window.addPatient === "function",
      editPatient: typeof window.editPatient === "function",
      deletePatient: typeof window.deletePatient === "function",
      cancelPatientEdit: typeof window.cancelPatientEdit === "function",
      searchPatients: typeof window.searchPatients === "function",
    },
  };
};

// Exportar para uso en módulos
export default patientController;

logger.debug(
  "Controlador de pacientes modular cargado - Debugging: window.debugPatientController()"
);
