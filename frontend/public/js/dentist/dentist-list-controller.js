// Importar el controlador modular de dentistas
import DentistController from "./modules/index.js";
import logger from "../logger.js";

// Variables globales del controlador
let dentistController;
let isInitialized = false;

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", async () => {
  logger.info("📋 Inicializando controlador de lista de dentistas modular...");

  try {
    // Verificar si el DentistController global ya está disponible
    if (window.dentistController) {
      dentistController = window.dentistController;
  logger.info("✅ Usando DentistController global existente");
    } else {
      // Crear instancia local del controlador modular
      dentistController = new DentistController();
      await dentistController.init();

      // Hacer disponible globalmente
      window.dentistController = dentistController;
  logger.info("✅ DentistController modular inicializado");
    }

    isInitialized = true;

    // Configurar funciones globales para compatibilidad
    setupGlobalFunctions();

    // Cargar la lista automáticamente
    if (dentistController.currentPage === "list") {
      await loadDentistsList();
    }

  logger.info("🎉 Controlador de lista de dentistas modular listo");
  } catch (error) {
    logger.error(
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
  window.loadDentistsList = async function () {
    if (dentistController && dentistController.loadList) {
      return await dentistController.loadList();
    }
    throw new Error("Sistema de dentistas no disponible");
  };

  // Función global para filtrar lista
  window.filterDentists = function (criteria) {
    if (dentistController && dentistController.performSearch) {
      const results = dentistController.dataManager.searchDentists(criteria);
      dentistController.uiManager.renderDentistsTable(results);
      return results;
    }
    return [];
  };

  // Función global para buscar dentistas
  window.searchDentists = function (query) {
    if (dentistController) {
      dentistController.searchTerm = query || "";
      dentistController.performSearch();
      return dentistController.dataManager.searchDentists(query);
    }
    return [];
  };

  // Función global para limpiar búsqueda
  window.clearDentistSearch = function () {
    if (dentistController && dentistController.clearSearch) {
      return dentistController.clearSearch();
    }
  };

  // Función global para mostrar estadísticas
  window.showDentistStats = function () {
    if (dentistController && dentistController.showStats) {
      return dentistController.showStats();
    }
  };

  // Función global para exportar
  window.exportDentists = function (format = "csv") {
    if (dentistController && dentistController.exportDentists) {
      return dentistController.exportDentists(format);
    }
  };

  // Función global para editar dentista (desde tabla)
  window.editDentist = async function (dentistId) {
    if (dentistController && dentistController.editDentist) {
      return dentistController.editDentist(dentistId);
    }
    throw new Error("Sistema de edición no disponible");
  };

  // Función global para eliminar dentista (desde tabla)
  window.deleteDentist = async function (dentistId) {
    if (dentistController && dentistController.deleteDentist) {
      return dentistController.deleteDentist(dentistId);
    }
    throw new Error("Sistema de eliminación no disponible");
  };

  // Función global para cancelar edición
  window.cancelDentistEdit = function () {
    if (dentistController && dentistController.cancelEdit) {
      return dentistController.cancelEdit();
    }
  };

  // Función global para refrescar tabla
  window.refreshDentistsTable = async function () {
    try {
      logger.info("🔄 Refrescando tabla de dentistas...");
      await loadDentistsList();
      showInfoMessage("Lista actualizada", 2000);
    } catch (error) {
      logger.error("❌ Error al refrescar:", error);
      showErrorMessage("Error al actualizar la lista");
    }
  };

  // Función global para configurar filtros avanzados
  window.setupAdvancedFilters = function () {
    setupAdvancedFiltering();
  };

  logger.info("✅ Funciones globales de lista configuradas");
}

// Función auxiliar para cargar lista
async function loadDentistsList() {
  try {
    logger.info("📊 Cargando lista de dentistas...");
    const dentists = await dentistController.loadList();

    // Configurar eventos de tabla después de cargar
    setupTableEvents();

    logger.info(`✅ ${dentists.length} dentistas cargados`);
    return dentists;
  } catch (error) {
    logger.error("❌ Error al cargar lista:", error);
    showErrorMessage("Error al cargar la lista de dentistas");
    throw error;
  }
}

// Configurar eventos de la tabla
function setupTableEvents() {
  const table = document.getElementById("dentistTable");
  if (!table) return;

  // Ordenamiento por columnas
  const headers = table.querySelectorAll("th[data-sort]");
  headers.forEach((header) => {
    header.style.cursor = "pointer";
    header.addEventListener("click", () => {
      const sortField = header.getAttribute("data-sort");
      sortTable(sortField);
    });
  });

  // Selección múltiple
  const checkboxes = table.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", updateSelectedCount);
  });

  // Acciones en hover
  const rows = table.querySelectorAll("tbody tr");
  rows.forEach((row) => {
    row.addEventListener("mouseenter", () => {
      row.classList.add("table-hover-highlight");
    });

    row.addEventListener("mouseleave", () => {
      row.classList.remove("table-hover-highlight");
    });
  });
}

// Ordenar tabla
function sortTable(field) {
  if (!dentistController || !dentistController.dentists) return;

  const currentSort = window.currentSort || { field: null, direction: "asc" };
  const direction =
    currentSort.field === field && currentSort.direction === "asc"
      ? "desc"
      : "asc";

  const sortedDentists = [...dentistController.dentists].sort((a, b) => {
    let aValue = a[field] || "";
    let bValue = b[field] || "";

    // Conversión de tipos según el campo
    if (field === "licenseNumber") {
      aValue = parseInt(aValue) || 0;
      bValue = parseInt(bValue) || 0;
    } else if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (direction === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Actualizar indicadores visuales
  updateSortIndicators(field, direction);

  // Renderizar tabla ordenada
  dentistController.uiManager.renderDentistsTable(sortedDentists);

  // Guardar estado de ordenamiento
  window.currentSort = { field, direction };

  logger.debug(`Tabla ordenada por ${field} (${direction})`);
}

// Actualizar indicadores de ordenamiento
function updateSortIndicators(field, direction) {
  const headers = document.querySelectorAll("th[data-sort]");
  headers.forEach((header) => {
    const icon = header.querySelector(".sort-icon");
    if (icon) icon.remove();

    if (header.getAttribute("data-sort") === field) {
      const iconClass = direction === "asc" ? "bi-arrow-up" : "bi-arrow-down";
      header.innerHTML += ` <i class="bi ${iconClass} sort-icon"></i>`;
    }
  });
}

// Actualizar contador de seleccionados
function updateSelectedCount() {
  const selected = document.querySelectorAll(
    '#dentistTable input[type="checkbox"]:checked'
  );
  const counter = document.getElementById("selectedCount");

  if (counter) {
    counter.textContent = `${selected.length} seleccionado(s)`;
  }

  // Mostrar/ocultar acciones masivas
  const bulkActions = document.getElementById("bulkActions");
  if (bulkActions) {
    bulkActions.style.display = selected.length > 0 ? "block" : "none";
  }
}

// Configurar filtrado avanzado
function setupAdvancedFiltering() {
  const filterForm = document.getElementById("advancedFilters");
  if (!filterForm) return;

  filterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    applyAdvancedFilters();
  });

  // Filtros en tiempo real
  const filterInputs = filterForm.querySelectorAll("input, select");
  filterInputs.forEach((input) => {
    input.addEventListener(
      "input",
      debounce(() => {
        if (document.getElementById("realtimeFilter").checked) {
          applyAdvancedFilters();
        }
      }, 500)
    );
  });
}

// Aplicar filtros avanzados
function applyAdvancedFilters() {
  if (!dentistController || !dentistController.dentists) return;

  const formData = new FormData(document.getElementById("advancedFilters"));
  const filters = Object.fromEntries(formData.entries());

  const filteredDentists = dentistController.dentists.filter((dentist) => {
    // Filtro por nombre
    if (
      filters.name &&
      !dentist.firstName.toLowerCase().includes(filters.name.toLowerCase()) &&
      !dentist.lastName.toLowerCase().includes(filters.name.toLowerCase())
    ) {
      return false;
    }

    // Filtro por matrícula
    if (
      filters.license &&
      !dentist.licenseNumber.toString().includes(filters.license)
    ) {
      return false;
    }

    // Filtro por email
    if (
      filters.email &&
      !dentist.email.toLowerCase().includes(filters.email.toLowerCase())
    ) {
      return false;
    }

    // Filtro por teléfono
    if (
      filters.phone &&
      dentist.phoneNumber &&
      !dentist.phoneNumber.includes(filters.phone)
    ) {
      return false;
    }

    return true;
  });

  dentistController.uiManager.renderDentistsTable(filteredDentists);
  showInfoMessage(`${filteredDentists.length} dentistas encontrados`, 3000);
}

// Función debounce para optimizar búsquedas
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Funciones auxiliares para mensajes
function showErrorMessage(message) {
  showMessage(message, "danger");
}

function showInfoMessage(message, duration = 3000) {
  showMessage(message, "info", duration);
}

function showMessage(message, type = "info", duration = 5000) {
  if (dentistController && dentistController.uiManager) {
    dentistController.uiManager.showMessage(message, type, duration);
  } else {
    // Fallback manual
    const messageContainer =
      document.getElementById("message") ||
      document.getElementById("dentist-messages") ||
      document.getElementById("response");

    if (messageContainer) {
      messageContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
          <i class="bi bi-${getMessageIcon(type)} me-2"></i>
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
      messageContainer.style.display = "block";

      if (duration > 0) {
        setTimeout(() => {
          const alert = messageContainer.querySelector(".alert");
          if (alert) {
            alert.classList.remove("show");
            setTimeout(() => alert.remove(), 150);
          }
        }, duration);
      }
    } else {
      alert(message);
    }
  }
}

function getMessageIcon(type) {
  const icons = {
    success: "check-circle",
    danger: "exclamation-triangle",
    warning: "exclamation-circle",
    info: "info-circle",
    primary: "info-circle",
  };
  return icons[type] || "info-circle";
}

// Función para debugging
window.debugDentistListController = function () {
  return {
    isInitialized,
    hasDentistController: !!dentistController,
    dentistState: dentistController
      ? {
          currentPage: dentistController.currentPage,
          dentistsCount: dentistController.dentists?.length || 0,
          searchTerm: dentistController.searchTerm,
          isListPage: dentistController.currentPage === "list",
        }
      : null,
    tableElements: {
      dentistTable: !!document.getElementById("dentistTable"),
      dentistTableBody: !!document.getElementById("dentistTableBody"),
      searchInput: !!document.getElementById("searchDentist"),
      advancedFilters: !!document.getElementById("advancedFilters"),
    },
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
      clearDentistSearch: typeof window.clearDentistSearch === "function",
      showDentistStats: typeof window.showDentistStats === "function",
      exportDentists: typeof window.exportDentists === "function",
      editDentist: typeof window.editDentist === "function",
      deleteDentist: typeof window.deleteDentist === "function",
      refreshDentistsTable: typeof window.refreshDentistsTable === "function",
    },
    tableFeatures: {
      currentSort: window.currentSort || null,
      selectedCount: document.querySelectorAll(
        '#dentistTable input[type="checkbox"]:checked'
      ).length,
      hasAdvancedFilters: !!document.getElementById("advancedFilters"),
      hasBulkActions: !!document.getElementById("bulkActions"),
    },
  };
};

// Exportar para uso en módulos
export default dentistController;

logger.debug(
  "📋 Controlador de lista de dentistas modular cargado - Depuración: window.debugDentistListController()"
);
