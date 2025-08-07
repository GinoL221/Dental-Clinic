// Importar todos los módulos especializados
import DentistDataManager from "./data-manager.js";
import DentistUIManager from "./ui-manager.js";
import DentistFormManager from "./form-manager.js";
import DentistValidationManager from "./validation-manager.js";

/**
 * Controlador principal de dentistas que coordina todos los módulos especializados
 * Implementa el patrón de separación de responsabilidades:
 * - DataManager: Carga y gestión de datos
 * - UIManager: Operaciones de interfaz y visualización
 * - FormManager: Manejo de formularios y envío de datos
 * - ValidationManager: Validaciones y reglas de negocio
 */
class DentistController {
  constructor() {
    // Inicializar todos los managers
    this.dataManager = new DentistDataManager();
    this.uiManager = new DentistUIManager();
    this.validationManager = new DentistValidationManager();
    this.formManager = new DentistFormManager(this.dataManager, this.uiManager);

    // Estado de la aplicación
    this.state = {
      currentPage: this.getCurrentPage(),
      isAdmin: window.isAdmin || false,
      dentists: [],
      currentDentist: null,
      searchTerm: "",
    };

    console.log("DentistController inicializado:", {
      currentPage: this.state.currentPage,
      isAdmin: this.state.isAdmin,
    });
  }

  // Determinar la página actual
  getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes("/dentists/add")) return "add";
    if (path.includes("/dentists/edit")) return "edit";
    if (path.includes("/dentists")) return "list";
    return "unknown";
  }

  // Inicialización principal
  async init() {
    try {
      console.log("Iniciando DentistController...");

      // Inicializar según la página
      switch (this.state.currentPage) {
        case "add":
          await this.initAddPage();
          break;
        case "edit":
          await this.initEditPage();
          break;
        case "list":
          await this.initListPage();
          break;
        default:
          console.warn("Página no reconocida:", this.state.currentPage);
      }
    } catch (error) {
      console.error("Error al inicializar DentistController:", error);
      this.uiManager.showMessage("Error al cargar la aplicación", "danger");
    }
  }

  // Inicializar página de agregar dentista
  async initAddPage() {
    console.log("Inicializando página de agregar dentista...");

    try {
      // Configurar validaciones en tiempo real
      this.validationManager.setupRealTimeValidation("add_new_dentist");

      // Configurar eventos del formulario
      this.formManager.bindAddFormEvents();

      console.log("Página de agregar dentista inicializada correctamente");
    } catch (error) {
      console.error("Error al inicializar página de agregar:", error);
      this.uiManager.showMessage("Error al cargar el formulario", "danger");
    }
  }

  // Inicializar página de editar dentista
  async initEditPage() {
    console.log("Inicializando página de editar dentista...");

    try {
      // Obtener ID del dentista desde la URL o elemento oculto
      const dentistId = this.getDentistIdFromPage();
      if (!dentistId) {
        throw new Error("ID de dentista no encontrado");
      }

      // Mostrar loading
      this.uiManager.showMessage("Cargando datos del dentista...", "info");

      // Cargar datos del dentista
      const dentist = await this.dataManager.loadDentistById(dentistId);
      this.state.currentDentist = dentist;

      // Llenar formulario
      this.uiManager.fillForm(dentist, "edit");

      // Configurar validaciones
      this.validationManager.setupRealTimeValidation("edit_dentist_form");

      // Configurar eventos del formulario
      this.formManager.bindEditFormEvents();

      // Ocultar mensaje de loading
      this.uiManager.hideMessage();

      console.log("Página de editar dentista inicializada correctamente");
    } catch (error) {
      console.error("Error al inicializar página de editar:", error);
      this.uiManager.showMessage(
        "Error al cargar los datos del dentista",
        "danger"
      );
    }
  }

  // Inicializar página de lista de dentistas
  async initListPage() {
    console.log("Inicializando página de lista de dentistas...");

    try {
      // Mostrar loading
      this.uiManager.showMessage("Cargando dentistas...", "info");

      // Cargar todos los dentistas
      const dentists = await this.dataManager.loadAllDentists();
      this.state.dentists = dentists;

      // Mostrar dentistas en la tabla
      this.uiManager.renderDentistsTable(dentists);

      // Configurar eventos del formulario de edición (si existe)
      this.formManager.bindEditFormEvents();

      // Configurar eventos de búsqueda
      this.formManager.bindSearchEvents();

      // Mostrar estadísticas si hay contenedor
      const stats = this.dataManager.getDentistStats();
      this.uiManager.displayStats(stats);

      // Ocultar mensaje de loading
      this.uiManager.hideMessage();

      console.log("Página de lista de dentistas inicializada correctamente");
    } catch (error) {
      console.error("Error al inicializar página de lista:", error);
      this.uiManager.showMessage("Error al cargar los dentistas", "danger");
    }
  }

  // Obtener ID de dentista desde la página
  getDentistIdFromPage() {
    // Intentar obtener desde elemento oculto
    const hiddenInput = document.getElementById("dentist_id");
    if (hiddenInput && hiddenInput.value) {
      return parseInt(hiddenInput.value);
    }

    // Intentar obtener desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    if (id) {
      return parseInt(id);
    }

    // Intentar obtener desde el pathname
    const pathParts = window.location.pathname.split("/");
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && !isNaN(lastPart)) {
      return parseInt(lastPart);
    }

    return null;
  }

  // Preparar edición de dentista (llamada desde botones)
  async editDentist(dentistId) {
    try {
      console.log(
        `✏️ DentistController - Preparando edición de dentista ${dentistId}`
      );

      await this.formManager.prepareEditForm(dentistId);
    } catch (error) {
      console.error("Error al preparar edición:", error);
      this.uiManager.showMessage(
        "Error al cargar datos del dentista",
        "danger"
      );
    }
  }

  // Eliminar dentista (llamada desde botones)
  async deleteDentist(dentistId) {
    try {
      console.log(
        `🗑️ DentistController - Iniciando eliminación de dentista ${dentistId}`
      );

      await this.formManager.handleDelete(dentistId);
    } catch (error) {
      console.error("Error al eliminar dentista:", error);
      this.uiManager.showMessage("Error al eliminar el dentista", "danger");
    }
  }

  // Método público para refrescar datos
  async refreshData() {
    try {
      console.log("🔄 DentistController - Refrescando datos...");

      switch (this.state.currentPage) {
        case "list":
          const dentists = await this.dataManager.loadAllDentists();
          this.state.dentists = dentists;
          this.uiManager.renderDentistsTable(dentists);

          // Actualizar estadísticas
          const stats = this.dataManager.getDentistStats();
          this.uiManager.displayStats(stats);
          break;

        case "edit":
          if (this.state.currentDentist) {
            const updatedDentist = await this.dataManager.loadDentistById(
              this.state.currentDentist.id
            );
            this.state.currentDentist = updatedDentist;
            this.uiManager.fillForm(updatedDentist, "edit");
          }
          break;
      }

      this.uiManager.showMessage("Datos actualizados", "success", 2000);
    } catch (error) {
      console.error("Error al refrescar datos:", error);
      this.uiManager.showMessage("Error al actualizar los datos", "danger");
    }
  }

  // Realizar búsqueda
  async searchDentists(searchTerm) {
    try {
      this.state.searchTerm = searchTerm;

      // Asegurar que tenemos los datos cargados
      if (this.state.dentists.length === 0) {
        await this.dataManager.loadAllDentists();
        this.state.dentists = this.dataManager.getCurrentDentists();
      }

      const results = this.dataManager.searchDentists(searchTerm);
      this.uiManager.displaySearchResults(results, searchTerm);
    } catch (error) {
      console.error("Error en búsqueda:", error);
      this.uiManager.showMessage("Error al realizar la búsqueda", "danger");
    }
  }

  // Limpiar búsqueda
  async clearSearch() {
    this.state.searchTerm = "";
    await this.refreshData();
  }

  // Método público para obtener el estado actual
  getState() {
    return { ...this.state };
  }

  // Método público para limpiar validaciones
  clearValidations() {
    const forms = [
      "add_new_dentist",
      "update_dentist_form",
      "edit_dentist_form",
    ];
    forms.forEach((formId) => {
      const form = document.getElementById(formId);
      if (form) {
        this.validationManager.clearAllValidation(form);
      }
    });
  }

  // Obtener estadísticas de dentistas
  getStats() {
    return this.dataManager.getDentistStats();
  }

  // Exportar datos (funcionalidad adicional)
  exportDentists(format = "json") {
    const dentists = this.dataManager.getCurrentDentists();

    switch (format) {
      case "csv":
        return this.exportToCSV(dentists);
      case "json":
      default:
        return JSON.stringify(dentists, null, 2);
    }
  }

  // Exportar a CSV
  exportToCSV(dentists) {
    const headers = ["ID", "Nombre", "Apellido", "Matrícula", "Especialidad"];
    const csvContent = [
      headers.join(","),
      ...dentists.map((d) =>
        [
          d.id,
          `"${d.name}"`,
          `"${d.lastName}"`,
          `"${d.registrationNumber}"`,
          `"${d.specialty || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    return csvContent;
  }
}

// Instancia global del controlador
let dentistController = null;

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", async () => {
  try {
    dentistController = new DentistController();
    await dentistController.init();

    // Hacer disponible globalmente para debugging y funciones externas
    window.dentistController = dentistController;
  } catch (error) {
    console.error(
      "Error fatal al inicializar la aplicación de dentistas:",
      error
    );
    alert("Error al cargar la aplicación. Por favor, recargue la página.");
  }
});

// Funciones globales para compatibilidad con botones existentes
window.editDentist = function (dentistId) {
  if (window.dentistController) {
    return window.dentistController.editDentist(dentistId);
  }
  console.error("DentistController no disponible");
};

window.deleteDentist = function (dentistId) {
  if (window.dentistController) {
    return window.dentistController.deleteDentist(dentistId);
  }
  console.error("DentistController no disponible");
};

// Funciones auxiliares globales
window.refreshDentistData = function () {
  if (window.dentistController) {
    return window.dentistController.refreshData();
  }
  console.warn("DentistController no disponible para refrescar datos");
};

window.searchDentists = function (searchTerm) {
  if (window.dentistController) {
    return window.dentistController.searchDentists(searchTerm);
  }
  console.warn("DentistController no disponible para búsqueda");
};

window.getDentistState = function () {
  if (window.dentistController) {
    return window.dentistController.getState();
  }
  console.warn("DentistController no disponible para obtener estado");
  return null;
};

// Exportar para uso en módulos
export default DentistController;
