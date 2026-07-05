// Importar el controlador modular de citas
import AppointmentController, {
  initAppointmentController,
} from "../appointment/modules/index.js";
import logger from "../logger.js";

// Variables globales del controlador de lista
let appointmentController;
let isInitialized = false;

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", async () => {
  logger.info("Inicializando controlador de lista de citas modular...");

  try {
    appointmentController = await initAppointmentController();

    // Inicialización
    isInitialized = true;

    // Configuración de funciones globales específicas para la lista de citas
    setupGlobalFunctions();

    // Inputs de filtro
    const searchPatient = /** @type {HTMLInputElement | null} */ (document.getElementById("searchPatient"));
    const filterDentist = /** @type {HTMLInputElement | null} */ (document.getElementById("filterDentist"));
    const filterDate = /** @type {HTMLInputElement | null} */ (document.getElementById("filterDate"));
    const clearFiltersBtn = document.getElementById("clearFilters");

    // --- AUTOCOMPLETE DE PACIENTES ---
    const suggestionsBox = document.createElement("div");
    suggestionsBox.id = "patientSuggestions";
    suggestionsBox.className = "list-group position-absolute";
    suggestionsBox.style.zIndex = "10";
    suggestionsBox.style.width = searchPatient ? searchPatient.offsetWidth + "px" : "0px";
    if (searchPatient && searchPatient.parentNode) {
      searchPatient.parentNode.appendChild(suggestionsBox);
    }

    if (searchPatient) {
      searchPatient.addEventListener("input", function () {
        const query = this.value.toLowerCase();
        suggestionsBox.innerHTML = "";
        if (!query) {
          suggestionsBox.style.display = "none";
          return;
        }

        // Accede a la lista de pacientes del controlador
        const patients = window.appointmentController?.state?.patients || [];
        const matches = patients.filter(
          (p) =>
            (p.firstName && p.firstName.toLowerCase().includes(query)) ||
            (p.lastName && p.lastName.toLowerCase().includes(query)) ||
            (p.email && p.email.toLowerCase().includes(query))
        );

        if (matches.length === 0) {
          suggestionsBox.style.display = "none";
          return;
        }

        matches.slice(0, 5).forEach((patient) => {
          const item = document.createElement("button");
          item.type = "button";
          item.className = "list-group-item list-group-item-action";
          item.textContent = `${patient.firstName || ""} ${
            patient.lastName || ""
          } (${patient.email || ""})`;
          item.addEventListener("click", () => {
            searchPatient.value = `${patient.firstName || ""} ${
              patient.lastName || ""
            }`;
            const selectedPatientId = /** @type {HTMLInputElement | null} */ (document.getElementById("selectedPatientId"));
            if (selectedPatientId) selectedPatientId.value = String(patient.id);
            suggestionsBox.innerHTML = "";
            suggestionsBox.style.display = "none";
            applyFilters();
          });
          suggestionsBox.appendChild(item);
        });

        suggestionsBox.style.display = "block";
      });
    }

    // Ocultar sugerencias si se hace click fuera
    document.addEventListener("click", (event) => {
      if (
        !suggestionsBox.contains(/** @type {Node | null} */ (event.target)) &&
        event.target !== searchPatient
      ) {
        suggestionsBox.innerHTML = "";
        suggestionsBox.style.display = "none";
      }
    });

    // --- AUTOCOMPLETE DE ODONTÓLOGOS ---
    const dentistInput = filterDentist;
    const dentistSuggestionsBox = document.createElement("div");
    dentistSuggestionsBox.id = "dentistSuggestions";
    dentistSuggestionsBox.className = "list-group position-absolute";
    dentistSuggestionsBox.style.zIndex = "10";
    dentistSuggestionsBox.style.width = dentistInput ? dentistInput.offsetWidth + "px" : "0px";
    if (dentistInput && dentistInput.parentNode) {
      dentistInput.parentNode.appendChild(dentistSuggestionsBox);
    }

    if (dentistInput) {
      dentistInput.addEventListener("input", function () {
        const query = this.value.toLowerCase();
        dentistSuggestionsBox.innerHTML = "";
        if (!query) {
          dentistSuggestionsBox.style.display = "none";
          return;
        }

        // Accede a la lista de odontólogos del controlador
        const dentists = window.appointmentController?.state?.dentists || [];
        const matches = dentists.filter(
          (d) =>
            (d.firstName && d.firstName.toLowerCase().includes(query)) ||
            (d.lastName && d.lastName.toLowerCase().includes(query)) ||
            (d.email && d.email.toLowerCase().includes(query))
        );

        if (matches.length === 0) {
          dentistSuggestionsBox.style.display = "none";
          return;
        }

        matches.slice(0, 5).forEach((dentist) => {
          const item = document.createElement("button");
          item.type = "button";
          item.className = "list-group-item list-group-item-action";
          item.textContent = `${dentist.firstName || ""} ${
            dentist.lastName || ""
          } (Matrícula: ${dentist.registrationNumber || ""})`;
          item.addEventListener("click", () => {
            dentistInput.value = `${dentist.firstName || ""} ${
              dentist.lastName || ""
            }`;
            const selectedDentistId = /** @type {HTMLInputElement | null} */ (document.getElementById("selectedDentistId"));
            if (selectedDentistId) selectedDentistId.value = String(dentist.id);
            dentistSuggestionsBox.innerHTML = "";
            dentistSuggestionsBox.style.display = "none";
            applyFilters();
          });
          dentistSuggestionsBox.appendChild(item);
        });

        dentistSuggestionsBox.style.display = "block";
      });
    }

    // Ocultar sugerencias si se hace click fuera
    document.addEventListener("click", (event) => {
      if (
        !dentistSuggestionsBox.contains(/** @type {Node | null} */ (event.target)) &&
        event.target !== dentistInput
      ) {
        dentistSuggestionsBox.innerHTML = "";
        dentistSuggestionsBox.style.display = "none";
      }
    });

    // Aplica filtros al cambiar cualquier input
    function applyFilters() {
      const selectedPatientIdInput = /** @type {HTMLInputElement | null} */ (document.getElementById("selectedPatientId"));
      const selectedDentistIdInput = /** @type {HTMLInputElement | null} */ (document.getElementById("selectedDentistId"));
      const filterStatusSelect = /** @type {HTMLSelectElement | null} */ (document.getElementById("filterStatus"));
      const selectedPatientId = selectedPatientIdInput ? selectedPatientIdInput.value : "";
      const selectedDentistId = selectedDentistIdInput ? selectedDentistIdInput.value : "";
      const filters = {
        patient: selectedPatientId || (searchPatient ? searchPatient.value : ""),
        dentist: selectedDentistId || (filterDentist ? filterDentist.value : ""),
        date: filterDate ? filterDate.value : "",
        status: filterStatusSelect ? filterStatusSelect.value : "",
      };
      logger.debug("Filtros aplicados:", filters);
      window.filterAppointments(filters);
    }

    // Limpia los filtros y recarga la lista
    function clearFilters() {
      if (searchPatient) searchPatient.value = "";
      const selectedPatientId = /** @type {HTMLInputElement | null} */ (document.getElementById("selectedPatientId"));
      if (selectedPatientId) selectedPatientId.value = "";
      if (filterDentist) filterDentist.value = "";
      const selectedDentistId = /** @type {HTMLInputElement | null} */ (document.getElementById("selectedDentistId"));
      if (selectedDentistId) selectedDentistId.value = "";
      if (filterDate) filterDate.value = "";
      const filterStatus = /** @type {HTMLSelectElement | null} */ (document.getElementById("filterStatus"));
      if (filterStatus) filterStatus.value = "SCHEDULED";
      window.clearFilters();
      window.filterAppointments({ status: "SCHEDULED" });
    }

    // ...después de obtener los elementos...
    const searchBtn = document.getElementById("searchAppointmentsBtn");

    // Aplica filtros solo al hacer clic en el botón
    searchBtn.addEventListener("click", applyFilters);

    // Si quieres, puedes seguir limpiando con el botón de limpiar
    clearFiltersBtn.addEventListener("click", clearFilters);

    // No hace falta carga inicial acá: init() ya carga la lista
    // internamente (initListPage -> loadList) cuando currentPage === "list".

    logger.info("Controlador de lista de citas modular listo");
  } catch (error) {
    logger.error("Error al inicializar controlador de lista de citas:", error);
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
    logger.warn("Sistema de filtros no disponible");
    return [];
  };

  // Función global para buscar citas
  window.searchAppointments = function (searchTerm) {
    if (appointmentController && appointmentController.performSearch) {
      return appointmentController.performSearch(searchTerm);
    }
    logger.warn("Sistema de búsqueda no disponible");
    return [];
  };

  // Función global para ordenar citas
  window.sortAppointments = function (sortBy, order = "asc") {
    if (appointmentController && appointmentController.sortList) {
      return appointmentController.sortList(sortBy, order);
    }
    logger.warn("Sistema de ordenamiento no disponible");
    return [];
  };

  // Función global para paginar citas
  window.paginateAppointments = function (page, limit = 10) {
    if (appointmentController && appointmentController.paginateData) {
      return appointmentController.paginateData(page, limit);
    }
    logger.warn("Sistema de paginación no disponible");
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
    logger.warn("Sistema de filtros no disponible");
    return {};
  };

  // Función global para limpiar filtros
  window.clearFilters = function () {
    if (appointmentController && appointmentController.clearFilters) {
      return appointmentController.clearFilters();
    }
    logger.warn("Sistema de filtros no disponible");
  };

  // Función global para seleccionar cita
  window.selectAppointment = function (appointmentId) {
    if (appointmentController && appointmentController.selectItem) {
      return appointmentController.selectItem(appointmentId);
    }
    logger.warn("Sistema de selección no disponible");
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

  // Función global para confirmar eliminación
  window.confirmDeleteAppointment = async function (appointmentId, patientName) {
    try {
      if (confirm(`¿Está seguro de que desea eliminar la cita de ${patientName}?`)) {
        if (appointmentController && appointmentController.deleteAppointment) {
          await appointmentController.deleteAppointment(appointmentId);
          return true;
        } else {
          logger.error("AppointmentController no disponible para eliminación");
          alert("Error: Sistema de citas no disponible");
          return false;
        }
      }
      return false;
    } catch (error) {
      logger.error("Error en confirmDeleteAppointment:", error);
      alert("Error al eliminar la cita");
      return false;
    }
  };

  logger.info("Funciones globales de lista configuradas");
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
      confirmDeleteAppointment:
        typeof window.confirmDeleteAppointment === "function",
    },
  };
};

// Exportar para uso en módulos
export default appointmentController;

logger.debug(
  "Controlador de lista de citas modular cargado - Debugging: window.debugAppointmentListController()"
);
