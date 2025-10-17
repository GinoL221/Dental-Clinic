// Importar el controlador modular de pacientes
import PatientController from "./modules/index.js";
import logger from "../logger.js";

// Variables globales del controlador
let patientController;
let isInitialized = false;

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", async () => {
  logger.info("Inicializando controlador de lista de pacientes modular...");

  try {
    // Verificar si el PatientController global ya está disponible
    if (window.patientController) {
  patientController = window.patientController;
  logger.info("Usando PatientController global existente");
    } else {
      // Crear instancia local del controlador modular
      patientController = new PatientController();
      await patientController.init();

      // Hacer disponible globalmente
  window.patientController = patientController;
  logger.info("PatientController modular inicializado");
    }

    isInitialized = true;

    // Configurar funciones globales para compatibilidad
    setupGlobalFunctions();

    // Cargar la lista automáticamente
    if (patientController.currentPage === "list") {
      await loadPatientsList();
    }

  logger.info("Controlador de lista de pacientes modular listo");
  } catch (error) {
    logger.error(
      "❌ Error al inicializar controlador de lista de pacientes:",
      error
    );
    showErrorMessage(
      "Error al cargar la lista de pacientes. Por favor, recargue la página."
    );
  }
});

// Configurar funciones globales para compatibilidad
function setupGlobalFunctions() {
  // Función global para cargar lista
  window.loadPatientsList = async function () {
    if (patientController && patientController.loadList) {
      return await patientController.loadList();
    }
    throw new Error("Sistema de pacientes no disponible");
  };

  // Función global para filtrar lista
  window.filterPatients = function (criteria) {
    if (patientController && patientController.performSearch) {
      const results = patientController.dataManager.searchPatients(criteria);
      patientController.uiManager.renderPatientsTable(results);
      return results;
    }
    return [];
  };

  // Función global para buscar pacientes
  window.searchPatients = function (query) {
    if (patientController) {
      patientController.searchTerm = query || "";
      patientController.performSearch();
      return patientController.dataManager.searchPatients(query);
    }
    return [];
  };

  // Función global para limpiar búsqueda
  window.clearPatientSearch = function () {
    if (patientController && patientController.clearSearch) {
      return patientController.clearSearch();
    }
  };

  // Función global para mostrar estadísticas
  window.showPatientStats = function () {
    if (patientController && patientController.showStats) {
      return patientController.showStats();
    }
  };

  // Función global para exportar
  window.exportPatients = function (format = "csv") {
    if (patientController && patientController.exportPatients) {
      return patientController.exportPatients(format);
    }
  };

  logger.info("Funciones globales de lista configuradas");
}

// Función auxiliar para cargar lista
async function loadPatientsList() {
  try {
  logger.info("Cargando lista de pacientes...");
  const patients = await patientController.loadList();
  logger.info(`${patients.length} pacientes cargados`);
    return patients;
  } catch (error) {
    logger.error("❌ Error al cargar lista:", error);
    showErrorMessage("Error al cargar la lista de pacientes");
    throw error;
  }
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
window.debugPatientListController = function () {
  return {
    isInitialized,
    hasPatientController: !!patientController,
    patientState: patientController
      ? {
          currentPage: patientController.currentPage,
          patientsCount: patientController.patients?.length || 0,
          searchTerm: patientController.searchTerm,
          isListPage: patientController.currentPage === "list",
        }
      : null,
    modulesAvailable: {
      dataManager: !!patientController?.dataManager,
      uiManager: !!patientController?.uiManager,
      formManager: !!patientController?.formManager,
      validationManager: !!patientController?.validationManager,
    },
    globalFunctions: {
      loadPatientsList: typeof window.loadPatientsList === "function",
      filterPatients: typeof window.filterPatients === "function",
      searchPatients: typeof window.searchPatients === "function",
      clearPatientSearch: typeof window.clearPatientSearch === "function",
      showPatientStats: typeof window.showPatientStats === "function",
      exportPatients: typeof window.exportPatients === "function",
    },
    tableElements: {
      patientTable: !!document.getElementById("patientTable"),
      patientTableBody: !!document.getElementById("patientTableBody"),
      searchInput: !!document.getElementById("searchPatient"),
    },
  };
};

// Exportar para uso en módulos
export default patientController;

logger.debug(
  "Controlador de lista de pacientes modular cargado - Depuración: window.debugPatientListController()"
);
