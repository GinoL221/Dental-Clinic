import logger from '../../logger.js';

// Controlador de búsqueda de pacientes.
// Extraído de PatientController para separar la lógica de búsqueda
// (debounce, lectura/escritura del término actual, despacho a dataManager/
// uiManager) de la orquestación general del controlador (SRP).
export default class PatientSearchController {
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
      document.getElementById('searchPatient')
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

      logger.debug('Búsqueda de pacientes configurada');
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
    logger.debug(`Buscando: "${this.searchTerm}"`);

    const results = this.dataManager.searchPatients(this.searchTerm);
    this.uiManager.displaySearchResults(results, this.searchTerm);

    logger.debug(`Resultados de búsqueda: ${results.length} pacientes`);
    return results;
  }

  // Limpiar búsqueda
  /**
   * @param {any[]|null} [patients]
   * @returns {void}
   */
  clearSearch(patients = null) {
    const searchInput = /** @type {HTMLInputElement | null} */ (
      document.getElementById('searchPatient')
    );
    if (searchInput) {
      searchInput.value = '';
    }

    this.searchTerm = '';
    const list = patients || this.dataManager.patients || [];
    this.uiManager.renderPatientsTable(list);
    this.uiManager.hideMessage();

    logger.debug('Búsqueda limpiada');
  }
}
