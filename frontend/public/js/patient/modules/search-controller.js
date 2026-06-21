import logger from "../../logger.js";

// Controlador de búsqueda de pacientes.
// Extraído de PatientController para separar la lógica de búsqueda
// (debounce, lectura/escritura del término actual, despacho a dataManager/
// uiManager) de la orquestación general del controlador (SRP).
export default class PatientSearchController {
  constructor(dataManager, uiManager) {
    this.dataManager = dataManager;
    this.uiManager = uiManager;
    this.searchTerm = "";
  }

  // Configurar búsqueda
  setup() {
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

  // Establecer término de búsqueda actual
  setSearchTerm(term) {
    this.searchTerm = term;
  }

  // Obtener término de búsqueda actual
  getSearchTerm() {
    return this.searchTerm;
  }

  // Realizar búsqueda
  performSearch() {
    logger.debug(`Buscando: "${this.searchTerm}"`);

    const results = this.dataManager.searchPatients(this.searchTerm);
    this.uiManager.displaySearchResults(results, this.searchTerm);

    logger.debug(`Resultados de búsqueda: ${results.length} pacientes`);
    return results;
  }

  // Limpiar búsqueda
  clearSearch(patients) {
    const searchInput = document.getElementById("searchPatient");
    if (searchInput) {
      searchInput.value = "";
    }

    this.searchTerm = "";
    this.uiManager.renderPatientsTable(patients);
    this.uiManager.hideMessage();

    logger.debug("Búsqueda limpiada");
  }
}
