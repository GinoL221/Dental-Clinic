import logger from '../../logger.js';

// Controlador de búsqueda de dentistas.
// Extraído de DentistController para separar la lógica de búsqueda
// (debounce, lectura/escritura del término actual, despacho a dataManager/
// uiManager) de la orquestación general del controlador (SRP).
export default class DentistSearchController {
  /**
   * @param {any} dataManager
   * @param {any} uiManager
   */
  constructor(dataManager, uiManager) {
    this.dataManager = dataManager;
    this.uiManager = uiManager;
    this.searchTerm = '';
  }

  // Configurar búsqueda
  /**
   * @returns {void}
   */
  setup() {
    const searchInput = /** @type {HTMLInputElement | null} */ (
      document.getElementById('searchDentist')
    );
    const clearButton = document.getElementById('clearSearch');

    if (searchInput) {
      /** @type {any} */
      let searchTimeout;

      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          const target = /** @type {HTMLInputElement} */ (e.target);
          this.searchTerm = target.value.trim();
          this.performSearch();
        }, 300);
      });

      logger.info('🔍 Búsqueda de dentistas configurada');
    }

    if (clearButton) {
      clearButton.addEventListener('click', () => {
        this.clearSearch();
      });
    }
  }

  // Establecer término de búsqueda actual
  /**
   * @param {string} term
   * @returns {void}
   */
  setSearchTerm(term) {
    this.searchTerm = term;
  }

  // Obtener término de búsqueda actual
  /**
   * @returns {string}
   */
  getSearchTerm() {
    return this.searchTerm;
  }

  // Realizar búsqueda
  /**
   * @returns {any[]}
   */
  performSearch() {
    logger.info(`🔍 Buscando: "${this.searchTerm}"`);

    const results = this.dataManager.searchDentists(this.searchTerm);
    this.uiManager.displaySearchResults(results, this.searchTerm);

    logger.info(`📋 Resultados de búsqueda: ${results.length} dentistas`);
    return results;
  }

  // Limpiar búsqueda
  /**
   * @param {any[]|null} [dentists]
   * @returns {void}
   */
  clearSearch(dentists = null) {
    const searchInput = /** @type {HTMLInputElement | null} */ (
      document.getElementById('searchDentist')
    );
    if (searchInput) {
      searchInput.value = '';
    }

    this.searchTerm = '';
    const list = dentists || this.dataManager.dentists || [];
    this.uiManager.renderDentistsTable(list);
    this.uiManager.hideMessage();

    logger.info('🧹 Búsqueda limpiada');
  }
}
