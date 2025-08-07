// Importar el controlador modular de citas
import AppointmentController from "./modules/index.js";

// Variables globales del controlador de lista
let appointmentController;
let isInitialized = false;

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", async () => {
  console.log("📋 Inicializando controlador de lista de citas modular...");

  try {
    // Verificar si el AppointmentController global ya está disponible
    if (window.appointmentController) {
      appointmentController = window.appointmentController;
      console.log("✅ Usando AppointmentController global existente");
    } else {
      // Crear instancia local del controlador modular
      appointmentController = new AppointmentController();
      await appointmentController.init();

      // Hacer disponible globalmente
      window.appointmentController = appointmentController;
      console.log("✅ AppointmentController modular inicializado");
    }

    isInitialized = true;

    // Configurar funciones globales específicas para listas
    setupGlobalFunctions();

    console.log("🎉 Controlador de lista de citas modular listo");
  } catch (error) {
    console.error(
      "❌ Error al inicializar controlador de lista de citas:",
      error
    );
    showErrorMessage(
      "Error al cargar la lista de citas. Por favor, recargue la página."
    );
  }
});

// Configurar funciones globales específicas para listas
function setupGlobalFunctions() {
  // Función global para cargar lista de citas
  window.loadAppointmentsList = async function () {
    if (appointmentController && appointmentController.loadList) {
      return appointmentController.loadList();
    }
    throw new Error("Sistema de lista de citas no disponible");
  };

  // Función global para filtrar citas
  window.filterAppointments = function (filterData) {
    if (appointmentController && appointmentController.applyFilters) {
      return appointmentController.applyFilters(filterData);
    }
    console.warn("Sistema de filtros no disponible");
    return [];
  };

  // Función global para buscar citas
  window.searchAppointments = function (searchTerm) {
    if (appointmentController && appointmentController.performSearch) {
      return appointmentController.performSearch(searchTerm);
    }
    console.warn("Sistema de búsqueda no disponible");
    return [];
  };

  // Función global para ordenar citas
  window.sortAppointments = function (sortBy, order = "asc") {
    if (appointmentController && appointmentController.sortList) {
      return appointmentController.sortList(sortBy, order);
    }
    console.warn("Sistema de ordenamiento no disponible");
    return [];
  };

  // Función global para paginar citas
  window.paginateAppointments = function (page, limit = 10) {
    if (appointmentController && appointmentController.paginateData) {
      return appointmentController.paginateData(page, limit);
    }
    console.warn("Sistema de paginación no disponible");
    return { data: [], total: 0, page, limit };
  };

  // Función global para refrescar lista
  window.refreshAppointmentsList = async function () {
    if (appointmentController && appointmentController.refreshList) {
      return appointmentController.refreshList();
    }
    return window.loadAppointmentsList();
  };

  // Función global para obtener filtros activos
  window.getActiveFilters = function () {
    if (appointmentController && appointmentController.getActiveFilters) {
      return appointmentController.getActiveFilters();
    }
    return {};
  };

  // Función global para limpiar filtros
  window.clearFilters = function () {
    if (appointmentController && appointmentController.clearFilters) {
      return appointmentController.clearFilters();
    }
    console.warn("Sistema de filtros no disponible");
  };

  // Función global para seleccionar cita
  window.selectAppointment = function (appointmentId) {
    if (appointmentController && appointmentController.selectItem) {
      return appointmentController.selectItem(appointmentId);
    }
    console.warn("Sistema de selección no disponible");
  };

  // Función global para obtener citas seleccionadas
  window.getSelectedAppointments = function () {
    if (appointmentController && appointmentController.getSelectedItems) {
      return appointmentController.getSelectedItems();
    }
    return [];
  };

  // Función global para operaciones en lote
  window.bulkDeleteAppointments = async function (appointmentIds) {
    if (appointmentController && appointmentController.bulkDelete) {
      return appointmentController.bulkDelete(appointmentIds);
    }
    throw new Error("Operación en lote no disponible");
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
window.debugAppointmentListController = function () {
  return {
    isInitialized,
    hasAppointmentController: !!appointmentController,
    appointmentState: appointmentController
      ? appointmentController.getState()
      : null,
    listState: appointmentController
      ? appointmentController.getListState()
      : null,
    modulesAvailable: {
      dataManager: !!appointmentController?.dataManager,
      uiManager: !!appointmentController?.uiManager,
      formManager: !!appointmentController?.formManager,
      validationManager: !!appointmentController?.validationManager,
    },
    globalFunctions: {
      loadAppointmentsList: typeof window.loadAppointmentsList === "function",
      filterAppointments: typeof window.filterAppointments === "function",
      searchAppointments: typeof window.searchAppointments === "function",
      sortAppointments: typeof window.sortAppointments === "function",
      paginateAppointments: typeof window.paginateAppointments === "function",
      refreshAppointmentsList:
        typeof window.refreshAppointmentsList === "function",
      getActiveFilters: typeof window.getActiveFilters === "function",
      clearFilters: typeof window.clearFilters === "function",
      selectAppointment: typeof window.selectAppointment === "function",
      getSelectedAppointments:
        typeof window.getSelectedAppointments === "function",
      bulkDeleteAppointments:
        typeof window.bulkDeleteAppointments === "function",
    },
  };
};

// Exportar para uso en módulos
export default appointmentController;

console.log(
  "📋 Controlador de lista de citas modular cargado - Debugging: window.debugAppointmentListController()"
);
