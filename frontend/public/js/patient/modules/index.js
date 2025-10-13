import PatientAPI from "../../api/patient-api.js";
import PatientDataManager from "./data-manager.js";
import PatientFormManager from "./form-manager.js";
import PatientValidationManager from "./validation-manager.js";
import PatientUIManager from "./ui-manager.js";
import logger from "../../logger.js";

class PatientController {
  constructor() {
    this.currentPage = this.detectCurrentPage();
    this.dataManager = new PatientDataManager();
    this.formManager = new PatientFormManager(this.dataManager);
    this.validationManager = new PatientValidationManager();
    this.uiManager = new PatientUIManager();
    this.isInitialized = false;
    this.currentPatient = null;
    this.searchTerm = "";
    this.patients = [];

    logger.debug("PatientController inicializado:", {
      currentPage: this.currentPage,
    });
  }

  // Detectar página actual
  detectCurrentPage() {
    const path = window.location.pathname;
    if (path.includes("/patients/add")) return "add";
    if (path.includes("/patients/edit")) return "edit";
    if (path.includes("/patients")) return "list";
    return "unknown";
  }

  // Inicializar controlador
  async init() {
    if (this.isInitialized) {
      logger.warn("PatientController ya está inicializado");
      return;
    }

    try {
  logger.info("Iniciando PatientController...");

      // Inicializar managers
      this.formManager.init();

      // Inicializar según la página
      switch (this.currentPage) {
        case "list":
          await this.initListPage();
          break;
        case "add":
          await this.initAddPage();
          break;
        case "edit":
          await this.initEditPage();
          break;
        default:
      logger.warn(`Página no reconocida: ${this.currentPage}`);
      }

      this.setupGlobalFunctions();
      this.isInitialized = true;

  logger.info("PatientController inicializado correctamente");
    } catch (error) {
      logger.error("❌ Error al inicializar PatientController:", error);
      this.uiManager.showMessage(
        "Error al inicializar la aplicación",
        "danger"
      );
    }
  }

  // Inicializar página de lista
  async initListPage() {
    try {
  logger.info("Inicializando página de lista de pacientes...");

      this.uiManager.showMessage("Cargando pacientes...", "info");

      // Cargar pacientes
      await this.loadList();

      // Configurar búsqueda
      this.setupSearch();

      // Ocultar mensaje de carga
      this.uiManager.hideMessage();

  logger.info("Página de lista inicializada");
    } catch (error) {
      logger.error("❌ Error al inicializar página de lista:", error);
      this.uiManager.showMessage("Error al cargar los pacientes", "danger");
      throw new Error(`Error al inicializar página de lista: ${error.message}`);
    }
  }

  // Inicializar página de agregar
  async initAddPage() {
    try {
  logger.info("Inicializando página de agregar paciente...");

  logger.info("Página de agregar inicializada");
    } catch (error) {
      logger.error("❌ Error al inicializar página de agregar:", error);
      this.uiManager.showMessage(
        "Error al inicializar página de agregar",
        "danger"
      );
      throw new Error(
        `Error al inicializar página de agregar: ${error.message}`
      );
    }
  }

  // Inicializar página de editar
  async initEditPage() {
    try {
  logger.info("Inicializando página de editar paciente...");

      // Obtener ID del paciente desde la URL o variable global
      const patientId = this.getPatientIdFromPage();

      if (!patientId) {
        throw new Error("ID del paciente no encontrado");
      }

      this.uiManager.showMessage("Cargando datos del paciente...", "info");

      // Cargar datos del paciente
      await this.formManager.loadPatientForEdit(patientId);

  logger.info("Página de editar inicializada");
    } catch (error) {
      logger.error("❌ Error al inicializar página de editar:", error);
      this.uiManager.showMessage(
        "Error al cargar los datos del paciente",
        "danger"
      );
      throw new Error(
        `Error al inicializar página de editar: ${error.message}`
      );
    }
  }

  // Obtener ID del paciente desde la página
  getPatientIdFromPage() {
    // Intentar desde variable global
    if (window.patientId) {
      return window.patientId;
    }

    // Intentar desde URL
    const pathParts = window.location.pathname.split("/");
    const editIndex = pathParts.indexOf("edit");
    if (editIndex !== -1 && pathParts[editIndex + 1]) {
      return pathParts[editIndex + 1];
    }

    // Intentar desde parámetros de consulta
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("id");
  }

  // Cargar lista de pacientes
  async loadList() {
    try {
  logger.info("PatientController - Cargando lista...");

      this.patients = await this.dataManager.loadAllPatients();

      // Renderizar tabla
      this.uiManager.renderPatientsTable(this.patients);

  logger.info(`${this.patients.length} pacientes cargados en la lista`);
      return this.patients;
    } catch (error) {
      logger.error("❌ Error al cargar lista:", error);
      this.uiManager.showMessage(
        "Error al cargar la lista de pacientes",
        "danger"
      );
      throw error;
    }
  }

  // Configurar búsqueda
  setupSearch() {
    const searchInput = document.getElementById("searchPatient");
    const clearButton = document.getElementById("clearSearch");

    if (searchInput) {
      let searchTimeout;

      searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.searchTerm = e.target.value.trim();
          this.performSearch();
        }, 300);
      });

  logger.debug("Búsqueda de pacientes configurada");
    }

    if (clearButton) {
      clearButton.addEventListener("click", () => {
        this.clearSearch();
      });
    }
  }

  // Realizar búsqueda
  performSearch() {
  logger.debug(`Buscando: "${this.searchTerm}"`);

    const results = this.dataManager.searchPatients(this.searchTerm);
    this.uiManager.displaySearchResults(results, this.searchTerm);

  logger.debug(`Resultados de búsqueda: ${results.length} pacientes`);
  }

  // Limpiar búsqueda
  clearSearch() {
    const searchInput = document.getElementById("searchPatient");
    if (searchInput) {
      searchInput.value = "";
    }

    this.searchTerm = "";
    this.uiManager.renderPatientsTable(this.patients);
    this.uiManager.hideMessage();

  logger.debug("Búsqueda limpiada");
  }

  // Editar paciente
  async editPatient(id) {
    try {
  logger.info(`PatientController - Editando paciente ${id}`);

      // Cargar datos del paciente
      const patient = await this.dataManager.loadPatientById(id);

      // Preparar formulario de actualización
      this.formManager.prepareUpdateForm(patient);

  logger.info("Formulario de edición preparado");
    } catch (error) {
      logger.error(`❌ Error al preparar edición del paciente ${id}:`, error);
      this.uiManager.showMessage(
        `Error al cargar el paciente: ${error.message}`,
        "danger"
      );
    }
  }

  // Eliminar paciente
  async deletePatient(id) {
    try {
  logger.info(`PatientController - Eliminando paciente ${id}`);

      // Usar el formManager para manejar la eliminación
      await this.formManager.handleDelete(id);
    } catch (error) {
      logger.error(`❌ Error al eliminar paciente ${id}:`, error);
      this.uiManager.showMessage(
        `Error al eliminar el paciente: ${error.message}`,
        "danger"
      );
    }
  }

  // Cancelar edición
  cancelEdit() {
  logger.info("PatientController - Cancelando edición");

    this.formManager.cancelEdit();
    this.uiManager.hideMessage();
  }

  // Mostrar estadísticas de pacientes
  async showStats() {
    try {
      const stats = this.dataManager.getPatientStats();
      this.uiManager.displayStats(stats);
  logger.info("Estadísticas mostradas:", stats);
      return stats;
    } catch (error) {
      logger.error("❌ Error al mostrar estadísticas:", error);
      this.uiManager.showMessage("Error al cargar estadísticas", "danger");
    }
  }

  // Exportar pacientes
  exportPatients(format = "csv") {
    try {
  logger.info(`Exportando pacientes en formato ${format}`);

      if (format === "csv") {
        this.exportToCSV();
      } else if (format === "json") {
        this.exportToJSON();
      }
    } catch (error) {
      logger.error("❌ Error al exportar:", error);
      this.uiManager.showMessage("Error al exportar pacientes", "danger");
    }
  }

  // Exportar a CSV
  exportToCSV() {
    const headers = ["ID", "DNI", "Nombre", "Apellido", "Email"];
    const csvContent = [
      headers.join(","),
      ...this.patients.map((patient) =>
        [
          patient.id,
          patient.cardIdentity || "",
          `"${patient.firstName}"`,
          `"${patient.lastName}"`,
          `"${patient.email}"`,
        ].join(",")
      ),
    ].join("\n");

    this.downloadFile(csvContent, "pacientes.csv", "text/csv");
  }

  // Exportar a JSON
  exportToJSON() {
    const jsonContent = JSON.stringify(this.patients, null, 2);
    this.downloadFile(jsonContent, "pacientes.json", "application/json");
  }

  // Descargar archivo
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.uiManager.showMessage(
      `Archivo ${filename} descargado exitosamente`,
      "success"
    );
  }

  // Configurar funciones globales
  setupGlobalFunctions() {
    // Funciones para usar desde HTML
    window.editPatient = (id) => this.editPatient(id);
    window.deletePatient = (id) => this.deletePatient(id);
    window.cancelPatientEdit = () => this.cancelEdit();
    window.loadPatientsList = () => this.loadList();
    window.searchPatients = (term) => {
      this.searchTerm = term;
      this.performSearch();
    };
    window.clearPatientSearch = () => this.clearSearch();
    window.showPatientStats = () => this.showStats();
    window.exportPatients = (format) => this.exportPatients(format);

    // Funciones adicionales para compatibilidad
    window.validatePatientData = (data) => {
      if (this.validationManager) {
        return this.validationManager.validatePatientData(data);
      }
      return {
        isValid: false,
        errors: ["Sistema de validación no disponible"],
      };
    };

    window.getPatientById = async (id) => {
      if (this.dataManager) {
        return this.dataManager.loadPatientById(id);
      }
      throw new Error("Sistema de pacientes no disponible");
    };

    window.getAllPatients = () => {
      if (this.dataManager) {
        return this.dataManager.getCurrentPatients();
      }
      return [];
    };

    // Funciones de utilidad
    window.clearPatientCache = () => {
      if (this.dataManager) {
        this.dataManager.clearCache();
  logger.info("Cache de pacientes limpiado");
      }
    };

    window.resetPatientUI = () => {
      if (this.formManager) {
        this.formManager.clearAllForms();
        this.uiManager.clearMessages();
        this.uiManager.toggleUpdateSection(false);
  logger.info("UI de pacientes resetada");
      }
    };

  logger.info("Funciones globales de pacientes configuradas");
  }

  // Obtener instancia del controlador
  static getInstance() {
    if (!window.PatientControllerInstance) {
      window.PatientControllerInstance = new PatientController();
    }
    return window.PatientControllerInstance;
  }

  // Reinicializar controlador
  async reinit() {
    this.isInitialized = false;
    await this.init();
  }

  // Limpiar recursos
  cleanup() {
    this.dataManager.clearCache();
    this.formManager.clearAllForms();
    this.uiManager.clearMessages();
    this.patients = [];
    this.currentPatient = null;
    this.searchTerm = "";

  logger.info("PatientController limpiado");
  }
}

// Inicialización automática cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const controller = PatientController.getInstance();
    await controller.init();
  logger.info("PatientController inicializado automáticamente");
  } catch (error) {
    logger.error("❌ Error en inicialización automática:", error);
  }
});

export default PatientController;
