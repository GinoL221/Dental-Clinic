// Importar todos los módulos especializados
import DentistDataManager from "./data-manager.js";
import DentistUIManager from "./ui-manager.js";
import DentistFormManager from "./form-manager.js";
import DentistValidationManager from "./validation-manager.js";

class DentistController {
  constructor() {
    this.currentPage = this.detectCurrentPage();
    this.dataManager = new DentistDataManager();
    this.formManager = new DentistFormManager(this.dataManager);
    this.validationManager = new DentistValidationManager();
    this.uiManager = new DentistUIManager();
    this.isInitialized = false;
    this.currentDentist = null;
    this.searchTerm = "";
    this.dentists = [];

    console.log("DentistController inicializado:", {
      currentPage: this.currentPage,
    });
  }

  // Detectar página actual
  detectCurrentPage() {
    const path = window.location.pathname;
    if (path.includes("/dentists/add")) return "add";
    if (path.includes("/dentists/edit")) return "edit";
    if (path.includes("/dentists")) return "list";
    return "unknown";
  }

  // Inicializar controlador
  async init() {
    if (this.isInitialized) {
      console.log("⚠️ DentistController ya está inicializado");
      return;
    }

    try {
      console.log("🚀 Iniciando DentistController...");

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
          console.warn(`Página no reconocida: ${this.currentPage}`);
      }

      this.setupGlobalFunctions();
      this.isInitialized = true;

      console.log("✅ DentistController inicializado correctamente");
    } catch (error) {
      console.error("❌ Error al inicializar DentistController:", error);
      this.uiManager.showMessage(
        "Error al inicializar la aplicación",
        "danger"
      );
    }
  }

  // Inicializar página de lista
  async initListPage() {
    try {
      console.log("📋 Inicializando página de lista de dentistas...");

      this.uiManager.showMessage("Cargando dentistas...", "info");

      // Cargar dentistas
      await this.loadList();

      // Configurar búsqueda
      this.setupSearch();

      // Ocultar mensaje de carga
      this.uiManager.hideMessage();

      console.log("✅ Página de lista inicializada");
    } catch (error) {
      console.error("❌ Error al inicializar página de lista:", error);
      this.uiManager.showMessage("Error al cargar los dentistas", "danger");
      throw new Error(`Error al inicializar página de lista: ${error.message}`);
    }
  }

  // Inicializar página de agregar
  async initAddPage() {
    try {
      console.log("➕ Inicializando página de agregar dentista...");

      console.log("✅ Página de agregar inicializada");
    } catch (error) {
      console.error("❌ Error al inicializar página de agregar:", error);
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
      console.log("✏️ Inicializando página de editar dentista...");

      // Obtener ID del dentista desde la URL o variable global
      const dentistId = this.getDentistIdFromPage();

      if (!dentistId) {
        throw new Error("ID del dentista no encontrado");
      }

      this.uiManager.showMessage("Cargando datos del dentista...", "info");

      // Cargar datos del dentista
      await this.formManager.loadDentistForEdit(dentistId);

      console.log("✅ Página de editar inicializada");
    } catch (error) {
      console.error("❌ Error al inicializar página de editar:", error);
      this.uiManager.showMessage(
        "Error al cargar los datos del dentista",
        "danger"
      );
      throw new Error(
        `Error al inicializar página de editar: ${error.message}`
      );
    }
  }

  // Obtener ID del dentista desde la página
  getDentistIdFromPage() {
    // Intentar desde variable global
    if (window.dentistId) {
      return window.dentistId;
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
  async loadList() {
    try {
      console.log("📊 DentistController - Cargando lista...");

      this.dentists = await this.dataManager.loadAllDentists();

      // Renderizar tabla
      this.uiManager.renderDentistsTable(this.dentists);

      console.log(`✅ ${this.dentists.length} dentistas cargados en la lista`);
      return this.dentists;
    } catch (error) {
      console.error("❌ Error al cargar lista:", error);
      this.uiManager.showMessage(
        "Error al cargar la lista de dentistas",
        "danger"
      );
      throw error;
    }
  }

  // Configurar búsqueda
  setupSearch() {
    const searchInput = document.getElementById("searchDentist");
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

      console.log("🔍 Búsqueda de dentistas configurada");
    }

    if (clearButton) {
      clearButton.addEventListener("click", () => {
        this.clearSearch();
      });
    }
  }

  // Realizar búsqueda
  performSearch() {
    console.log(`🔍 Buscando: "${this.searchTerm}"`);

    const results = this.dataManager.searchDentists(this.searchTerm);
    this.uiManager.displaySearchResults(results, this.searchTerm);

    console.log(`📋 Resultados de búsqueda: ${results.length} dentistas`);
    return results;
  }

  // Limpiar búsqueda
  clearSearch() {
    const searchInput = document.getElementById("searchDentist");
    if (searchInput) {
      searchInput.value = "";
    }

    this.searchTerm = "";
    this.uiManager.renderDentistsTable(this.dentists);
    this.uiManager.hideMessage();

    console.log("🧹 Búsqueda limpiada");
  }

  // Editar dentista
  async editDentist(id) {
    try {
      console.log(`✏️ DentistController - Editando dentista ${id}`);

      // Cargar datos del dentista
      const dentist = await this.dataManager.loadDentistById(id);

      // Preparar formulario de actualización
      this.formManager.prepareUpdateForm(dentist);

      console.log("✅ Formulario de edición preparado");
    } catch (error) {
      console.error(`❌ Error al preparar edición del dentista ${id}:`, error);
      this.uiManager.showMessage(
        `Error al cargar el dentista: ${error.message}`,
        "danger"
      );
    }
  }

  // Eliminar dentista
  async deleteDentist(id) {
    try {
      console.log(`🗑️ DentistController - Eliminando dentista ${id}`);

      // Usar el formManager para manejar la eliminación
      await this.formManager.handleDelete(id);
    } catch (error) {
      console.error(`❌ Error al eliminar dentista ${id}:`, error);
      this.uiManager.showMessage(
        `Error al eliminar el dentista: ${error.message}`,
        "danger"
      );
    }
  }

  // Cancelar edición
  cancelEdit() {
    console.log("❌ DentistController - Cancelando edición");

    this.formManager.cancelEdit();
    this.uiManager.hideMessage();
  }

  // Mostrar estadísticas de dentistas
  async showStats() {
    try {
      const stats = this.dataManager.getDentistStats();
      this.uiManager.displayStats(stats);
      console.log("📊 Estadísticas mostradas:", stats);
      return stats;
    } catch (error) {
      console.error("❌ Error al mostrar estadísticas:", error);
      this.uiManager.showMessage("Error al cargar estadísticas", "danger");
    }
  }

  // Exportar dentistas
  exportDentists(format = "csv") {
    try {
      console.log(`📤 Exportando dentistas en formato ${format}`);

      if (format === "csv") {
        this.exportToCSV();
      } else if (format === "json") {
        this.exportToJSON();
      }
    } catch (error) {
      console.error("❌ Error al exportar:", error);
      this.uiManager.showMessage("Error al exportar dentistas", "danger");
    }
  }

  // Exportar a CSV
  exportToCSV() {
    const headers = ["ID", "Matrícula", "Nombre", "Apellido", "Especialidad"];
    const csvContent = [
      headers.join(","),
      ...this.dentists.map((dentist) =>
        [
          dentist.id,
          dentist.registrationNumber || "",
          `"${dentist.firstName}"`,
          `"${dentist.lastName}"`,
          `"${dentist.specialty || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    this.downloadFile(csvContent, "dentistas.csv", "text/csv");
  }

  // Exportar a JSON
  exportToJSON() {
    const jsonContent = JSON.stringify(this.dentists, null, 2);
    this.downloadFile(jsonContent, "dentistas.json", "application/json");
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
    window.editDentist = (id) => this.editDentist(id);
    window.deleteDentist = (id) => this.deleteDentist(id);
    window.cancelDentistEdit = () => this.cancelEdit();
    window.loadDentistsList = () => this.loadList();
    window.searchDentists = (term) => {
      this.searchTerm = term;
      this.performSearch();
    };
    window.clearDentistSearch = () => this.clearSearch();
    window.showDentistStats = () => this.showStats();
    window.exportDentists = (format) => this.exportDentists(format);

    // Funciones adicionales para compatibilidad
    window.validateDentistData = (data) => {
      if (this.validationManager) {
        return this.validationManager.validateDentistData(data);
      }
      return {
        isValid: false,
        errors: ["Sistema de validación no disponible"],
      };
    };

    window.getDentistById = async (id) => {
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
        console.log("🧹 Cache de dentistas limpiado");
      }
    };

    window.resetDentistUI = () => {
      if (this.formManager) {
        this.formManager.clearAllForms();
        this.uiManager.clearMessages();
        this.uiManager.toggleUpdateSection(false);
        console.log("🔄 UI de dentistas resetata");
      }
    };

    console.log("🌐 Funciones globales de dentistas configuradas");
  }

  // Obtener instancia del controlador (PATRÓN SINGLETON)
  static getInstance() {
    if (!window.DentistControllerInstance) {
      window.DentistControllerInstance = new DentistController();
    }
    return window.DentistControllerInstance;
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
    this.dentists = [];
    this.currentDentist = null;
    this.searchTerm = "";

    console.log("🧹 DentistController limpiado");
  }

  // Método para debugging
  debug() {
    return {
      isInitialized: this.isInitialized,
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

// Inicialización automática cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const controller = DentistController.getInstance();
    await controller.init();
    console.log("✅ DentistController inicializado automáticamente");
  } catch (error) {
    console.error("❌ Error en inicialización automática:", error);
  }
});

export default DentistController;
