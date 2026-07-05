import DentistValidationManager from "./validation-manager.js";
import DentistUIManager from "./ui-manager.js";
import logger from "../../logger.js";

class DentistFormManager {
  constructor(dataManager = null) {
    this.dataManager = dataManager;
    this.validationManager = new DentistValidationManager();
    this.uiManager = new DentistUIManager();
    this.currentDentistId = null;
    this.isSubmitting = false;
  }

  // Inicializar formularios
  init() {
    logger.info("📝 DentistFormManager - Inicializando...");
    this.setupForms();
    this.setupValidations();
    this.bindFormEvents();
    logger.info("✅ DentistFormManager - Inicializado correctamente");
  }

  // Configurar formularios
  setupForms() {
    // Formulario de agregar
    const addForm = document.getElementById("add_new_dentist");
    if (addForm) {
      logger.info("✅ Formulario de agregar encontrado");
    }

    // Formulario de actualizar
    const updateForm = document.getElementById("update_dentist_form");
    if (updateForm) {
      logger.info("✅ Formulario de actualizar encontrado");
    }

    // Formulario de editar
    const editForm = document.getElementById("edit_dentist_form");
    if (editForm) {
      logger.info("✅ Formulario de editar encontrado");
    }
  }

  // Configurar validaciones
  setupValidations() {
    const formsToCheck = [
      "add_new_dentist",
      "update_dentist_form",
      "edit_dentist_form",
    ];

    formsToCheck.forEach((formId) => {
      if (document.getElementById(formId)) {
        this.validationManager.setupRealTimeValidation(formId);
      } else {
        logger.debug(`Omitiendo configuración de validación; formulario no presente: ${formId}`);
      }
    });
  }

  // Enlazar eventos específicos de formularios
  bindFormEvents() {
    this.bindAddFormEvents();
    this.bindEditFormEvents();
    this.bindSearchEvents();
  }

  // Enlazar eventos del formulario de agregar
  bindAddFormEvents() {
    const addForm = document.getElementById("add_new_dentist");
    if (addForm && !addForm.hasAttribute("data-events-bound")) {
      addForm.addEventListener("submit", (e) => this.handleAddSubmit(e));
      addForm.setAttribute("data-events-bound", "true");
      logger.info("✅ Eventos del formulario de agregar configurados");
    }
  }

  // Enlazar eventos del formulario de editar
  bindEditFormEvents() {
    const editForms = [
      document.getElementById("update_dentist_form"),
      document.getElementById("edit_dentist_form"),
    ];

    editForms.forEach((form) => {
      if (form && !form.hasAttribute("data-events-bound")) {
        form.addEventListener("submit", (e) => this.handleEditSubmit(e));
        form.setAttribute("data-events-bound", "true");
        logger.info(`✅ Eventos del formulario ${form.id} configurados`);
      }
    });

    // Configurar botón de cancelar
    const cancelButton = document.getElementById("btn-cancel-edit");
    if (cancelButton && !cancelButton.hasAttribute("data-events-bound")) {
      cancelButton.addEventListener("click", () => this.cancelEdit());
      cancelButton.setAttribute("data-events-bound", "true");
      logger.info("✅ Botón cancelar configurado");
    }
  }

  // Enlazar eventos de búsqueda
  bindSearchEvents() {
    const searchInput = document.getElementById("searchDentist");
    if (searchInput && !searchInput.hasAttribute("data-events-bound")) {
      searchInput.addEventListener("input", (e) => {
        if (this.dataManager && this.dataManager.searchDentists) {
          const target = /** @type {HTMLInputElement} */ (e.target);
          const results = this.dataManager.searchDentists(target.value);
          logger.info(`🔍 Búsqueda: ${results.length} dentistas encontrados`);
        }
      });
      searchInput.setAttribute("data-events-bound", "true");
      logger.info("✅ Eventos de búsqueda configurados");
    }
  }

  // Manejar envío del formulario de agregar
  async handleAddSubmit(event) {
    event.preventDefault();

    if (this.isSubmitting) {
      logger.info("⏳ Formulario ya se está enviando...");
      return;
    }

    logger.info("📤 DentistFormManager - Procesando nuevo dentista...");

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    try {
      this.isSubmitting = true;
      this.uiManager.setLoadingState(submitButton, "Guardando dentista...");
      this.uiManager.clearMessages();

      // Validar formulario
      const validation = this.validationManager.validateForm(form.id);
      if (!validation.isValid) {
        this.uiManager.showMessage(
          `Errores en el formulario: ${validation.errors.join(", ")}`,
          "danger"
        );
        return;
      }

      // Obtener datos del formulario
      const formData = new FormData(form);
      const dentistData = this.processFormData(formData);

      logger.debug("📊 Datos del dentista a crear:", dentistData);

      // Crear dentista
      let result;
      if (this.dataManager) {
        result = await this.dataManager.createDentist(dentistData);
      } else {
        throw new Error("DataManager no disponible");
      }

      logger.info("✅ Dentista creado exitosamente:", result);

      // Mostrar mensaje de éxito
      this.uiManager.showMessage(
        `Dr. ${dentistData.firstName} ${dentistData.lastName} creado exitosamente`,
        "success"
      );

      // Limpiar formulario
      this.uiManager.clearForm(form.id);
      this.validationManager.clearFormValidation(form.id);

      // Redireccionar después de un tiempo
      setTimeout(() => {
        window.location.href = "/dentists";
      }, 2000);
    } catch (error) {
      logger.error("❌ Error al crear dentista:", error);

      let errorMessage = "Error desconocido";
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      this.uiManager.showMessage(
        `Error al crear el dentista: ${errorMessage}`,
        "danger"
      );
    } finally {
      this.isSubmitting = false;
      this.uiManager.resetLoadingState(submitButton, "Guardar Dentista");
    }
  }

  // Manejar envío del formulario de editar
  async handleEditSubmit(event) {
    event.preventDefault();

    if (this.isSubmitting) {
      logger.info("⏳ Formulario ya se está enviando...");
      return;
    }

    logger.info("🔄 DentistFormManager - Actualizando dentista...");

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    try {
      this.isSubmitting = true;
      this.uiManager.setLoadingState(submitButton, "Actualizando dentista...");
      this.uiManager.clearMessages();

      // Validar formulario
      const validation = this.validationManager.validateForm(form.id);
      if (!validation.isValid) {
        this.uiManager.showMessage(
          `Errores en el formulario: ${validation.errors.join(", ")}`,
          "danger"
        );
        return;
      }

      // Obtener ID del dentista
      const dentistId = this.getDentistId(form);
      if (!dentistId) {
        throw new Error("ID del dentista no encontrado");
      }

      // Obtener datos del formulario
      const formData = new FormData(form);
      const dentistData = this.processFormData(formData);
      dentistData.id = parseInt(dentistId);

      logger.debug("📊 Datos del dentista a actualizar:", dentistData);

      // Actualizar dentista
      let result;
      if (this.dataManager) {
        result = await this.dataManager.updateDentist(dentistId, dentistData);
      } else {
        throw new Error("DataManager no disponible");
      }

      logger.info("✅ Dentista actualizado exitosamente:", result);

      // Mostrar mensaje de éxito
      this.uiManager.showMessage(
        `Dr. ${dentistData.firstName} ${dentistData.lastName} actualizado exitosamente`,
        "success"
      );

      // Ocultar formulario de actualización si es necesario
      this.uiManager.toggleUpdateSection(false);

      // Recargar la lista si existe una función global
      if (typeof window.loadDentistsList === "function") {
        setTimeout(() => {
          window.loadDentistsList();
        }, 1000);
      } else if (typeof window.refreshDentistData === "function") {
        setTimeout(() => {
          window.refreshDentistData();
        }, 1000);
      }
    } catch (error) {
      logger.error("❌ Error al actualizar dentista:", error);

      let errorMessage = "Error desconocido";
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      this.uiManager.showMessage(
        `Error al actualizar el dentista: ${errorMessage}`,
        "danger"
      );
    } finally {
      this.isSubmitting = false;
      this.uiManager.resetLoadingState(submitButton, "Actualizar Dentista");
    }
  }

  // Obtener ID del dentista desde el formulario
  getDentistId(form) {
    // Buscar campo oculto en el formulario
    const idField = /** @type {HTMLInputElement | null} */ (form.querySelector(
      'input[name="dentist_id"], input[name="id"], #dentist_id'
    ));
    if (idField && idField.value) {
      return idField.value;
    }

    // Buscar en el documento global
    const globalIdField = /** @type {HTMLInputElement | null} */ (document.getElementById("dentist_id"));
    if (globalIdField && globalIdField.value) {
      return globalIdField.value;
    }

    // Si hay currentDentistId guardado
    if (this.currentDentistId) {
      return this.currentDentistId;
    }

    // Intentar desde URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlId = urlParams.get("id");
    if (urlId) {
      return urlId;
    }

    // Intentar desde el pathname
    const pathParts = window.location.pathname.split("/");
    const editIndex = pathParts.indexOf("edit");
    if (editIndex !== -1 && pathParts[editIndex + 1]) {
      return pathParts[editIndex + 1];
    }

    return null;
  }

  // Procesar datos del formulario
  processFormData(formData) {
    const data = {};

    // Campos de texto básicos
    const textFields = [
      "firstName",
      "lastName",
      "registrationNumber",
      "specialty",
      "email",
      "phoneNumber",
    ];
    textFields.forEach((field) => {
      const value = formData.get(field);
      if (value !== null && value !== undefined) {
        data[field] = value.toString().trim();
      }
    });

    // Convertir matrícula a número si es posible (backend puede esperar Integer)
    if (data.registrationNumber) {
      const num = parseInt(data.registrationNumber.replace(/\D+/g, ""), 10);
      data.registrationNumber = Number.isNaN(num)
        ? data.registrationNumber
        : num;
    }

    // Limpiar campos vacíos (convertir strings vacíos a null)
    Object.keys(data).forEach((key) => {
      if (data[key] === "" || data[key] === undefined) {
        data[key] = null;
      }
    });

    return data;
  }

  // Cargar datos en formulario de edición
  async loadDentistForEdit(dentistId) {
    try {
      logger.info(`📋 DentistFormManager - Cargando dentista ${dentistId} para editar`);

      this.uiManager.showMessage("Cargando datos del dentista...", "info");

      // Guardar ID actual
      this.currentDentistId = dentistId;

      let dentist;
      if (this.dataManager) {
        dentist = await this.dataManager.loadDentistById(dentistId);
      } else {
        throw new Error("DataManager no disponible");
      }

      logger.info("✅ Dentista cargado para editar:", dentist);

      // Llenar formulario de edición
      this.uiManager.fillForm(dentist, "edit");

      // Mostrar sección de actualización si existe
      this.uiManager.toggleUpdateSection(true);

      // Ocultar mensaje de carga
      this.uiManager.hideMessage();

      return dentist;
    } catch (error) {
      logger.error(`❌ Error al cargar dentista ${dentistId}:`, error);
       this.uiManager.showMessage(
         `Error al cargar los datos del dentista: ${error.message}`,
         "danger"
       );
       throw error;
     }
   }

  // Preparar formulario para actualización (llamado desde botones de la lista)
  async prepareUpdateForm(dentist) {
    try {
      logger.info(
        "📝 DentistFormManager - Preparando formulario de actualización"
      );

      this.currentDentistId = dentist.id;

      // Llenar el formulario de actualización
      this.uiManager.fillForm(dentist, "update");

      // Mostrar la sección de actualización
      this.uiManager.toggleUpdateSection(true);

      // Limpiar validaciones previas
      this.validationManager.clearFormValidation("update_dentist_form");

      logger.info("✅ Formulario de actualización preparado");
    } catch (error) {
      logger.error("❌ Error al preparar formulario de actualización:", error);
      this.uiManager.showMessage(
        "Error al preparar el formulario de edición",
        "danger"
      );
    }
  }

  // Preparar formulario para edición (método más genérico)
  async prepareEditForm(dentistId) {
    try {
      logger.info(
        `📝 DentistFormManager - Preparando edición para dentista ${dentistId}`
      );

      // Cargar datos del dentista
      const dentist = await this.loadDentistForEdit(dentistId);

      // Preparar el formulario de actualización
      await this.prepareUpdateForm(dentist);

      logger.info("✅ Formulario de edición preparado completamente");
    } catch (error) {
      logger.error(
        `❌ Error al preparar edición del dentista ${dentistId}:`,
        error
      );
      throw error;
    }
  }

  // Manejar eliminación de dentista
  async handleDelete(dentistId) {
    try {
      logger.info(
        `🗑️ DentistFormManager - Procesando eliminación de dentista ${dentistId}`
      );

      // Cargar datos del dentista para mostrar en la confirmación
      let dentist;
      if (this.dataManager) {
        dentist = await this.dataManager.loadDentistById(dentistId);
      } else {
        throw new Error("DataManager no disponible");
      }

      // Mostrar confirmación de eliminación
      const confirmed = confirm(
        `¿Está seguro de que desea eliminar al Dr. ${dentist.firstName} ${dentist.lastName}?\n` +
          `Matrícula: ${dentist.registrationNumber}\n\n` +
          `Esta acción no se puede deshacer.`
      );

      if (!confirmed) {
        logger.info("❌ Eliminación cancelada por el usuario");
        return;
      }

      // Mostrar loading
      this.uiManager.showMessage("Eliminando dentista...", "info");

      // Eliminar dentista
      if (this.dataManager) {
        await this.dataManager.deleteDentist(dentistId);
      } else {
        throw new Error("DataManager no disponible");
      }

      logger.info("✅ Dentista eliminado exitosamente");

      // Mostrar mensaje de éxito
      this.uiManager.showMessage(
        `Dr. ${dentist.firstName} ${dentist.lastName} eliminado exitosamente`,
        "success"
      );

      // Ocultar formulario de actualización si estaba visible
      this.uiManager.toggleUpdateSection(false);

      // Recargar la lista
      if (typeof window.loadDentistsList === "function") {
        setTimeout(() => {
          window.loadDentistsList();
        }, 1000);
      } else if (typeof window.refreshDentistData === "function") {
        setTimeout(() => {
          window.refreshDentistData();
        }, 1000);
      }
    } catch (error) {
      logger.error(`❌ Error al eliminar dentista ${dentistId}:`, error);
      this.uiManager.showMessage(
        `Error al eliminar el dentista: ${error.message}`,
        "danger"
      );
    }
  }

  // Cancelar edición
  cancelEdit() {
    logger.info("❌ DentistFormManager - Cancelando edición");

    this.currentDentistId = null;

    // Ocultar sección de actualización
    this.uiManager.toggleUpdateSection(false);

    // Limpiar formularios
    this.uiManager.clearForm("update_dentist_form");
    this.uiManager.clearForm("edit_dentist_form");

    // Limpiar validaciones
    this.validationManager.clearFormValidation("update_dentist_form");
    this.validationManager.clearFormValidation("edit_dentist_form");

    // Mostrar mensaje de cancelación
    this.uiManager.showMessage("Edición cancelada", "info", 2000);

    logger.info("✅ Edición cancelada correctamente");
  }

  // Limpiar todos los formularios
  clearAllForms() {
    logger.info("🧹 DentistFormManager - Limpiando todos los formularios");

    const formIds = [
      "add_new_dentist",
      "update_dentist_form",
      "edit_dentist_form",
    ];

    formIds.forEach((formId) => {
      this.uiManager.clearForm(formId);
      this.validationManager.clearFormValidation(formId);
    });

    // Ocultar sección de actualización
    this.uiManager.toggleUpdateSection(false);

    // Limpiar mensajes
    this.uiManager.clearMessages();

    // Resetear estado
    this.currentDentistId = null;
    this.isSubmitting = false;

    logger.info("✅ Todos los formularios limpiados");
  }

  // Obtener estado actual del form manager
  getCurrentState() {
    return {
      currentDentistId: this.currentDentistId,
      isSubmitting: this.isSubmitting,
      hasDataManager: !!this.dataManager,
      formsFound: {
        addForm: !!document.getElementById("add_new_dentist"),
        updateForm: !!document.getElementById("update_dentist_form"),
        editForm: !!document.getElementById("edit_dentist_form"),
      },
    };
  }

  // Validar si el FormManager está listo para usar
  isReady() {
    return !!(this.validationManager && this.uiManager);
  }

  // Método para debugging
  debug() {
    logger.debug("🐛 DentistFormManager Debug:", {
      currentDentistId: this.currentDentistId,
      isSubmitting: this.isSubmitting,
      hasDataManager: !!this.dataManager,
      hasValidationManager: !!this.validationManager,
      hasUIManager: !!this.uiManager,
      state: this.getCurrentState(),
    });
  }
}

export default DentistFormManager;
