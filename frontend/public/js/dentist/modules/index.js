// Importar todos los módulos especializados
import DentistDataManager from "./data-manager.js";
import DentistUIManager from "./ui-manager.js";
import DentistFormManager from "./form-manager.js";
import DentistValidationManager from "./validation-manager.js";
import DentistSearchController from "./search-controller.js";
import {
  buildDentistsCSV,
  buildDentistsJSON,
  downloadFile as downloadFileUtil,
} from "./export-utils.js";
import logger from "../../logger.js";

class DentistController {
  constructor() {
    this.currentPage = this.detectCurrentPage();
    this.dataManager = new DentistDataManager();
    this.formManager = new DentistFormManager(this.dataManager);
    this.validationManager = new DentistValidationManager();
    this.uiManager = new DentistUIManager();
    this.searchController = new DentistSearchController(
      this.dataManager,
      this.uiManager
    );
    this.isInitialized = false;
    /** @type {any} */
    this.currentDentist = null;
    /** @type {any[]} */
    this.dentists = [];

    logger.info("DentistController inicializado:", {
      currentPage: this.currentPage,
    });
  }

  // Compatibilidad: dentist-list-controller.js y dentist-controller.js leen/
  // escriben searchTerm directamente sobre la instancia del controlador. El
  // estado real ahora vive en searchController; este accessor lo expone sin
  // duplicarlo.
  /**
   * @returns {string}
   */
  get searchTerm() {
    return this.searchController.getSearchTerm();
  }

  /**
   * @param {string} value
   */
  set searchTerm(value) {
    this.searchController.setSearchTerm(value);
  }

  // Detectar página actual
  /**
   * @returns {string}
   */
  detectCurrentPage() {
    const path = window.location.pathname;
    if (path.includes("/dentists/add")) return "add";
    if (path.includes("/dentists/edit")) return "edit";
    if (path.includes("/dentists")) return "list";
    return "unknown";
  }

  // Inicializar controlador
  /**
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isInitialized) {
      logger.warn("⚠️ DentistController ya está inicializado");
      return;
    }

    try {
      logger.info("🚀 Iniciando DentistController...");

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

      logger.info("✅ DentistController inicializado correctamente");
    } catch (error) {
      logger.error("❌ Error al inicializar DentistController:", error);
      this.uiManager.showMessage(
        "Error al inicializar la aplicación",
        "danger"
      );
    }
  }

  // Inicializar página de lista
  /**
   * @returns {Promise<void>}
   */
  async initListPage() {
    try {
      logger.info("📋 Inicializando página de lista de dentistas...");

      this.uiManager.showMessage("Cargando dentistas...", "info");

      // Cargar dentistas
      await this.loadList();

      // Configurar búsqueda
      this.setupSearch();

      // Ocultar mensaje de carga
      this.uiManager.hideMessage();

      logger.info("✅ Página de lista inicializada");
    } catch (error) {
      logger.error("❌ Error al inicializar página de lista:", error);
      const message = error instanceof Error ? error.message : String(error);
      this.uiManager.showMessage("Error al cargar los dentistas", "danger");
      throw new Error(`Error al inicializar página de lista: ${message}`);
    }
  }

  // Inicializar página de agregar
  /**
   * @returns {Promise<void>}
   */
  async initAddPage() {
    try {
      logger.info("➕ Inicializando página de agregar dentista...");

      logger.info("✅ Página de agregar inicializada");
    } catch (error) {
      logger.error("❌ Error al inicializar página de agregar:", error);
      const message = error instanceof Error ? error.message : String(error);
      this.uiManager.showMessage(
        "Error al inicializar página de agregar",
        "danger"
      );
      throw new Error(
        `Error al inicializar página de agregar: ${message}`
      );
    }
  }

  // Inicializar página de editar
  /**
   * @returns {Promise<void>}
   */
  async initEditPage() {
    try {
      logger.info("✏️ Inicializando página de editar dentista...");

      // Obtener ID del dentista desde la URL o variable global
      const dentistId = this.getDentistIdFromPage();

      if (!dentistId) {
        throw new Error("ID del dentista no encontrado");
      }

      this.uiManager.showMessage("Cargando datos del dentista...", "info");

      // Cargar datos del dentista
      await this.formManager.loadDentistForEdit(dentistId);

      logger.info("✅ Página de editar inicializada");
    } catch (error) {
      logger.error("❌ Error al inicializar página de editar:", error);
      const message = error instanceof Error ? error.message : String(error);
      this.uiManager.showMessage(
        "Error al cargar los datos del dentista",
        "danger"
      );
      throw new Error(
        `Error al inicializar página de editar: ${message}`
      );
    }
  }

  // Obtener ID del dentista desde la página
  /**
   * @returns {any}
   */
  getDentistIdFromPage() {
    const w = /** @type {any} */ (window);
    // Intentar desde variable global
    if (w.dentistId) {
      return w.dentistId;
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

  // Cargar lista de dentistas
  /**
   * @returns {Promise<any[]>}
   */
  async loadList() {
    try {
      logger.info("📊 DentistController - Cargando lista...");

      this.dentists = await this.dataManager.loadAllDentists();

      // Renderizar tabla
      this.uiManager.renderDentistsTable(this.dentists);

      logger.info(`✅ ${this.dentists.length} dentistas cargados en la lista`);
      return this.dentists;
    } catch (error) {
      logger.error("❌ Error al cargar lista:", error);
      this.uiManager.showMessage(
        "Error al cargar la lista de dentistas",
        "danger"
      );
      throw error;
    }
  }

  // Configurar búsqueda
  /**
   * @returns {void}
   */
  setupSearch() {
    this.searchController.setup();
  }

  // Realizar búsqueda
  /**
   * @returns {any[]}
   */
  performSearch() {
    return this.searchController.performSearch();
  }

  // Limpiar búsqueda
  /**
   * @returns {void}
   */
  clearSearch() {
    this.searchController.clearSearch(this.dentists);
  }

  // Editar dentista
  /**
   * @param {any} id
   * @returns {Promise<void>}
   */
  async editDentist(id) {
    try {
      logger.info(`✏️ DentistController - Editando dentista ${id}`);

      const dentist = await this.dataManager.loadDentistById(id);

      // Preparar formulario de actualización
      this.formManager.prepareUpdateForm(dentist);

      logger.info("✅ Formulario de edición preparado");
    } catch (error) {
      logger.error(`❌ Error al preparar edición del dentista ${id}:`, error);
      const message = error instanceof Error ? error.message : String(error);
      this.uiManager.showMessage(`Error al cargar el dentista: ${message}`, "danger");
    }
  }

  // Eliminar dentista
  /**
   * @param {any} id
   * @returns {Promise<void>}
   */
  async deleteDentist(id) {
    try {
      logger.info(`🗑️ DentistController - Eliminando dentista ${id}`);

      // Usar el formManager para manejar la eliminación
      await this.formManager.handleDelete(id);
    } catch (error) {
      logger.error(`❌ Error al eliminar dentista ${id}:`, error);
      const message = error instanceof Error ? error.message : String(error);
      this.uiManager.showMessage(`Error al eliminar el dentista: ${message}`, "danger");
    }
  }

  // Cancelar edición
  /**
   * @returns {void}
   */
  cancelEdit() {
    logger.info("❌ DentistController - Cancelando edición");
    this.formManager.cancelEdit();
    this.uiManager.hideMessage();
  }

  // Mostrar estadísticas de dentistas
  /**
   * @returns {Promise<any>}
   */
  async showStats() {
    try {
      const stats = this.dataManager.getDentistStats();
      this.uiManager.displayStats(stats);
      logger.info("📊 Estadísticas mostradas:", stats);
      return stats;
    } catch (error) {
      logger.error("❌ Error al mostrar estadísticas:", error);
      this.uiManager.showMessage("Error al cargar estadísticas", "danger");
    }
  }

  // Exportar dentistas
  /**
   * @param {string} [format]
   * @returns {void}
   */
  exportDentists(format = "csv") {
    try {
      logger.info(`📤 Exportando dentistas en formato ${format}`);

      if (format === "csv") {
        this.exportToCSV();
      } else if (format === "json") {
        this.exportToJSON();
      }
    } catch (error) {
      logger.error("❌ Error al exportar:", error);
      this.uiManager.showMessage("Error al exportar dentistas", "danger");
    }
  }

  // Exportar a CSV
  /**
   * @returns {void}
   */
  exportToCSV() {
    const csvContent = buildDentistsCSV(this.dentists);
    this.downloadFile(csvContent, "dentistas.csv", "text/csv");
  }

  // Exportar a JSON
  /**
   * @returns {void}
   */
  exportToJSON() {
    const jsonContent = buildDentistsJSON(this.dentists);
    this.downloadFile(jsonContent, "dentistas.json", "application/json");
  }

  // Descargar archivo
  /**
   * @param {string} content
   * @param {string} filename
   * @param {string} mimeType
   * @returns {void}
   */
  downloadFile(content, filename, mimeType) {
    downloadFileUtil(content, filename, mimeType);

    this.uiManager.showMessage(
      `Archivo ${filename} descargado exitosamente`,
      "success"
    );
  }

  // Configurar funciones globales
  /**
   * @returns {void}
   */
  setupGlobalFunctions() {
    // Funciones para usar desde HTML
    window.editDentist = (/** @type {any} */ id) => this.editDentist(id);
    window.deleteDentist = (/** @type {any} */ id) => this.deleteDentist(id);
    window.cancelDentistEdit = () => this.cancelEdit();
    window.loadDentistsList = () => this.loadList();
    window.searchDentists = (/** @type {any} */ term) => {
      this.searchTerm = term;
      return this.performSearch();
    };
    window.clearDentistSearch = () => this.clearSearch();
    window.showDentistStats = () => this.showStats();
    window.exportDentists = (/** @type {any} */ format) => this.exportDentists(format);

    // Funciones adicionales para compatibilidad
    window.validateDentistData = (/** @type {any} */ data) => {
      if (this.validationManager) {
        return this.validationManager.validateDentistData(data);
      }
      return {
        isValid: false,
        errors: ["Sistema de validación no disponible"],
      };
    };
    window.getDentistById = async (/** @type {any} */ id) => {
      if (this.dataManager) {
        return this.dataManager.loadDentistById(id);
      }
      throw new Error("Sistema de dentistas no disponible");
    };

    window.getAllDentists = () => {
      if (this.dataManager) {
        return this.dataManager.getCurrentDentists();
      }
      return [];
    };

    // Funciones de utilidad
    window.clearDentistCache = () => {
      if (this.dataManager) {
        this.dataManager.clearCache();
        logger.info("🧹 Cache de dentistas limpiado");
      }
    };

    window.resetDentistUI = () => {
      if (this.formManager) {
        this.formManager.clearAllForms();
        this.uiManager.clearMessages();
        this.uiManager.toggleUpdateSection(false);
        logger.info("🔄 UI de dentistas resetata");
      }
    };

    logger.info("🌐 Funciones globales de dentistas configuradas");
  }

  // Obtener instancia del controlador (PATRÓN SINGLETON)
  /**
   * @returns {any}
   */
  static getInstance() {
    if (!window.dentistController) {
      window.dentistController = new DentistController();
    }
    return window.dentistController;
  }

  // Reinicializar controlador
  /**
   * @returns {Promise<void>}
   */
  async reinit() {
    this.isInitialized = false;
    await this.init();
  }

  // Limpiar recursos
  /**
   * @returns {void}
   */
  cleanup() {
    this.dataManager.clearCache();
    this.formManager.clearAllForms();
    this.uiManager.clearMessages();
    this.dentists = [];
    this.currentDentist = null;
    this.searchTerm = "";
    logger.info("🧹 DentistController limpiado");
  }

  // Método para debugging
  /**
   * @returns {any}
   */
  debug() {
    return {
      currentPage: this.currentPage,
      dentistsCount: this.dentists?.length || 0,
      searchTerm: this.searchTerm,
      hasDataManager: !!this.dataManager,
      hasFormManager: !!this.formManager,
      hasUIManager: !!this.uiManager,
      hasValidationManager: !!this.validationManager,
      currentDentist: this.currentDentist,
    };
  }
}

/**
 * @returns {Promise<any>}
 */
export async function initDentistController() {
  const controller = DentistController.getInstance(); // ya publica window.dentistController
  await controller.init(); // controller.isInitialized evita reejecutar el init
  return controller;
}

export default DentistController;
