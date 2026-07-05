// Importar el controlador modular de pacientes
import { initPatientController } from "./modules/index.js";
import logger from "../logger.js";

// Variables globales del controlador
/** @type {InstanceType<typeof import("./modules/index.js").default> | undefined} */
let patientController;
let isInitialized = false;

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", async () => {
  logger.info("Inicializando controlador de lista de pacientes modular...");

  try {
    patientController = await initPatientController();

    isInitialized = true;

    // Configurar funciones globales para compatibilidad
    setupGlobalFunctions();
    // No hace falta recargar la lista acá: init() ya la carga internamente
    // (initListPage -> loadList) cuando currentPage === "list".

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
// loadPatientsList/searchPatients/clearPatientSearch/showPatientStats/exportPatients ya los wirea PatientController (modules/index.js)
function setupGlobalFunctions() {
  // Función global para filtrar lista
  window.filterPatients = function (criteria) {
    if (patientController) {
      const results = patientController.dataManager.searchPatients(criteria);
      patientController.uiManager.renderPatientsTable(results);
      return results;
    }
    return [];
  };

  logger.info("Funciones globales de lista configuradas");
}

// Función auxiliar para cargar lista
async function loadPatientsList() {
  try {
  logger.info("Cargando lista de pacientes...");
  if (!patientController) throw new Error("patientController is undefined");
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
/**
 * @param {string} message
 */
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
