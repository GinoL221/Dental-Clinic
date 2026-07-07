import PatientAPI from '../../api/patient-api.js';
import PatientDataManager from './data-manager.js';
import PatientFormManager from './form-manager.js';
import PatientValidationManager from './validation-manager.js';
import PatientUIManager from './ui-manager.js';
import PatientSearchController from './search-controller.js';
import {
  buildPatientsCSV,
  buildPatientsJSON,
  downloadFile as downloadFileUtil,
} from './export-utils.js';
import logger from '../../logger.js';

class PatientController {
  constructor() {
    this.currentPage = this.detectCurrentPage();
    this.dataManager = new PatientDataManager();
    this.formManager = new PatientFormManager(this.dataManager);
    this.validationManager = new PatientValidationManager();
    this.uiManager = new PatientUIManager();
    this.searchController = new PatientSearchController(this.dataManager, this.uiManager);
    this.isInitialized = false;
    /** @type {any} */
    this.currentPatient = null;
    /** @type {any[]} */
    this.patients = [];

    logger.debug('PatientController inicializado:', {
      currentPage: this.currentPage,
    });
  }

  // Compatibilidad: patient-list-controller.js lee/escribe searchTerm
  // directamente sobre la instancia del controlador. El estado real ahora
  // vive en searchController; este accessor lo expone sin duplicarlo.
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
    if (path.includes('/patients/add')) return 'add';
    if (path.includes('/patients/edit')) return 'edit';
    if (path.includes('/patients')) return 'list';
    return 'unknown';
  }

  // Inicializar controlador
  /**
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isInitialized) {
      logger.warn('PatientController ya está inicializado');
      return;
    }

    try {
      logger.info('Iniciando PatientController...');

      // Inicializar managers
      this.formManager.init();

      // Inicializar según la página
      switch (this.currentPage) {
        case 'list':
          await this.initListPage();
          break;
        case 'add':
          await this.initAddPage();
          break;
        case 'edit':
          await this.initEditPage();
          break;
        default:
          logger.warn(`Página no reconocida: ${this.currentPage}`);
      }

      this.setupGlobalFunctions();
      this.isInitialized = true;

      logger.info('PatientController inicializado correctamente');
    } catch (error) {
      logger.error('❌ Error al inicializar PatientController:', error);
      this.uiManager.showMessage('Error al inicializar la aplicación', 'danger');
    }
  }

  // Inicializar página de lista
  /**
   * @returns {Promise<void>}
   */
  async initListPage() {
    try {
      logger.info('Inicializando página de lista de pacientes...');

      this.uiManager.showMessage('Cargando pacientes...', 'info');

      // Cargar pacientes
      await this.loadList();

      // Configurar búsqueda
      this.setupSearch();

      // Ocultar mensaje de carga
      this.uiManager.hideMessage();

      logger.info('Página de lista inicializada');
    } catch (error) {
      logger.error('❌ Error al inicializar página de lista:', error);
      const message = error instanceof Error ? error.message : String(error);
      this.uiManager.showMessage('Error al cargar los pacientes', 'danger');
      throw new Error(`Error al inicializar página de lista: ${message}`);
    }
  }

  // Inicializar página de agregar
  /**
   * @returns {Promise<void>}
   */
  async initAddPage() {
    try {
      logger.info('Inicializando página de agregar paciente...');

      logger.info('Página de agregar inicializada');
    } catch (error) {
      logger.error('❌ Error al inicializar página de agregar:', error);
      const message = error instanceof Error ? error.message : String(error);
      this.uiManager.showMessage('Error al inicializar página de agregar', 'danger');
      throw new Error(`Error al inicializar página de agregar: ${message}`);
    }
  }

  // Inicializar página de editar
  /**
   * @returns {Promise<void>}
   */
  async initEditPage() {
    try {
      logger.info('Inicializando página de editar paciente...');

      // Obtener ID del paciente desde la URL o variable global
      const patientId = this.getPatientIdFromPage();

      if (!patientId) {
        throw new Error('ID del paciente no encontrado');
      }

      this.uiManager.showMessage('Cargando datos del paciente...', 'info');

      // Cargar datos del paciente
      await this.formManager.loadPatientForEdit(patientId);

      logger.info('Página de editar inicializada');
    } catch (error) {
      logger.error('❌ Error al inicializar página de editar:', error);
      const message = error instanceof Error ? error.message : String(error);
      this.uiManager.showMessage('Error al cargar los datos del paciente', 'danger');
      throw new Error(`Error al inicializar página de editar: ${message}`);
    }
  }

  // Obtener ID del paciente desde la página
  /**
   * @returns {any}
   */
  getPatientIdFromPage() {
    const w = /** @type {any} */ (window);
    // Intentar desde variable global
    if (w.patientId) {
      return w.patientId;
    }

    // Intentar desde URL
    const pathParts = window.location.pathname.split('/');
    const editIndex = pathParts.indexOf('edit');
    if (editIndex !== -1 && pathParts[editIndex + 1]) {
      return pathParts[editIndex + 1];
    }

    // Intentar desde parámetros de consulta
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }

  // Cargar lista de pacientes
  /**
   * @returns {Promise<any[]>}
   */
  async loadList() {
    try {
      logger.info('PatientController - Cargando lista...');

      this.patients = await this.dataManager.loadAllPatients();

      // Renderizar tabla
      this.uiManager.renderPatientsTable(this.patients);

      logger.info(`${this.patients.length} pacientes cargados en la lista`);
      return this.patients;
    } catch (error) {
      logger.error('❌ Error al cargar lista:', error);
      this.uiManager.showMessage('Error al cargar la lista de pacientes', 'danger');
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
    this.searchController.clearSearch(this.patients);
  }

  // Editar paciente
  /**
   * @param {any} id
   * @returns {Promise<void>}
   */
  async editPatient(id) {
    try {
      logger.info(`PatientController - Editando paciente ${id}`);

      // Cargar datos del paciente
      const patient = await this.dataManager.loadPatientById(id);

      // Preparar formulario de actualización
      this.formManager.prepareUpdateForm(patient);

      logger.info('Formulario de edición preparado');
    } catch (error) {
      logger.error(`❌ Error al preparar edición del paciente ${id}:`, error);
      const message = error instanceof Error ? error.message : String(error);
      this.uiManager.showMessage(`Error al cargar el paciente: ${message}`, 'danger');
    }
  }

  // Eliminar paciente
  /**
   * @param {any} id
   * @returns {Promise<void>}
   */
  async deletePatient(id) {
    try {
      logger.info(`PatientController - Eliminando paciente ${id}`);

      // Usar el formManager para manejar la eliminación
      await this.formManager.handleDelete(id);
    } catch (error) {
      logger.error(`❌ Error al eliminar paciente ${id}:`, error);
      const message = error instanceof Error ? error.message : String(error);
      this.uiManager.showMessage(`Error al eliminar el paciente: ${message}`, 'danger');
    }
  }

  // Cancelar edición
  /**
   * @returns {void}
   */
  cancelEdit() {
    logger.info('PatientController - Cancelando edición');

    this.formManager.cancelEdit();
    this.uiManager.hideMessage();
  }

  // Mostrar estadísticas de pacientes
  /**
   * @returns {Promise<any>}
   */
  async showStats() {
    try {
      const stats = this.dataManager.getPatientStats();
      this.uiManager.displayStats(stats);
      logger.info('Estadísticas mostradas:', stats);
      return stats;
    } catch (error) {
      logger.error('❌ Error al mostrar estadísticas:', error);
      this.uiManager.showMessage('Error al cargar estadísticas', 'danger');
    }
  }

  // Exportar pacientes
  /**
   * @param {string} [format]
   * @returns {void}
   */
  exportPatients(format = 'csv') {
    try {
      logger.info(`Exportando pacientes en formato ${format}`);

      if (format === 'csv') {
        this.exportToCSV();
      } else if (format === 'json') {
        this.exportToJSON();
      }
    } catch (error) {
      logger.error('❌ Error al exportar:', error);
      this.uiManager.showMessage('Error al exportar pacientes', 'danger');
    }
  }

  // Exportar a CSV
  /**
   * @returns {void}
   */
  exportToCSV() {
    const csvContent = buildPatientsCSV(this.patients);
    this.downloadFile(csvContent, 'pacientes.csv', 'text/csv');
  }

  // Exportar a JSON
  /**
   * @returns {void}
   */
  exportToJSON() {
    const jsonContent = buildPatientsJSON(this.patients);
    this.downloadFile(jsonContent, 'pacientes.json', 'application/json');
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

    this.uiManager.showMessage(`Archivo ${filename} descargado exitosamente`, 'success');
  }

  // Configurar funciones globales
  /**
   * @returns {void}
   */
  setupGlobalFunctions() {
    // Funciones para usar desde HTML
    window.editPatient = (/** @type {any} */ id) => this.editPatient(id);
    window.deletePatient = (/** @type {any} */ id) => this.deletePatient(id);
    window.cancelPatientEdit = () => this.cancelEdit();
    window.loadPatientsList = () => this.loadList();
    window.searchPatients = (/** @type {any} */ term) => {
      this.searchController.setSearchTerm(term);
      return this.performSearch();
    };
    window.clearPatientSearch = () => this.clearSearch();
    window.showPatientStats = () => this.showStats();
    window.exportPatients = (/** @type {any} */ format) => this.exportPatients(format);

    // Funciones adicionales para compatibilidad
    window.validatePatientData = (/** @type {any} */ data) => {
      if (this.validationManager) {
        return this.validationManager.validatePatientData(data);
      }
      return {
        isValid: false,
        errors: ['Sistema de validación no disponible'],
      };
    };

    window.getPatientById = async (/** @type {any} */ id) => {
      if (this.dataManager) {
        return this.dataManager.loadPatientById(id);
      }
      throw new Error('Sistema de pacientes no disponible');
    };

    window.getAllPatients = () => {
      if (this.dataManager) {
        return this.dataManager.getCurrentPatients();
      }
      return [];
    };

    // Funciones de utilidad
    window.clearPatientCache = () => {
      if (this.dataManager) {
        this.dataManager.clearCache();
        logger.info('Cache de pacientes limpiado');
      }
    };

    window.resetPatientUI = () => {
      if (this.formManager) {
        this.formManager.clearAllForms();
        this.uiManager.clearMessages();
        this.uiManager.toggleUpdateSection(false);
        logger.info('UI de pacientes resetada');
      }
    };

    logger.info('Funciones globales de pacientes configuradas');
  }

  // Obtener instancia del controlador
  /**
   * @returns {any}
   */
  static getInstance() {
    if (!window.patientController) {
      window.patientController = new PatientController();
    }
    return window.patientController;
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
    this.patients = [];
    this.currentPatient = null;
    this.searchController.setSearchTerm('');

    logger.info('PatientController limpiado');
  }
}

/**
 * @returns {Promise<any>}
 */
export async function initPatientController() {
  const controller = PatientController.getInstance(); // already publishes window.patientController
  await controller.init(); // controller.isInitialized guards re-run
  return controller;
}

export default PatientController;
