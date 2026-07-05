import logger from "../../logger.js";

// Controlador de búsqueda de dentistas.
// Extraído de DentistController para separar la lógica de búsqueda
// (debounce, lectura/escritura del término actual, despacho a dataManager/
// uiManager) de la orquestación general del controlador (SRP).
export default class DentistSearchController {
  constructor(dataManager, uiManager) {
    this.dataManager = dataManager;
    this.uiManager = uiManager;
    this.searchTerm = "";
  }

  // Configurar búsqueda
  setup() {
    const searchInput = /** @type {HTMLInputElement | null} */ (document.getElementById("searchDentist"));
    const clearButton = document.getElementById("clearSearch");

    if (searchInput) {
      let searchTimeout;

      searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          const target = /** @type {HTMLInputElement} */ (e.target);
          this.searchTerm = target.value.trim();
          this.performSearch();
        }, 300);
      });

      logger.info("🔍 Búsqueda de dentistas configurada");
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
    logger.info(`🔍 Buscando: "${this.searchTerm}"`);

    const results = this.dataManager.searchDentists(this.searchTerm);
    this.uiManager.displaySearchResults(results, this.searchTerm);

    logger.info(`📋 Resultados de búsqueda: ${results.length} dentistas`);
    return results;
  }

  // Limpiar búsqueda
  clearSearch(dentists) {
    const searchInput = /** @type {HTMLInputElement | null} */ (document.getElementById("searchDentist"));
    if (searchInput) {
      searchInput.value = "";
    }

    this.searchTerm = "";
    this.uiManager.renderDentistsTable(dentists);
    this.uiManager.hideMessage();

    logger.info("🧹 Búsqueda limpiada");
  }
}
