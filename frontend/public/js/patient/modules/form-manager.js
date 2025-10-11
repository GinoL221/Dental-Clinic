import PatientAPI from "../../api/patient-api.js";
import PatientValidationManager from "./validation-manager.js";
import PatientUIManager from "./ui-manager.js";

class PatientFormManager {
  constructor(dataManager = null) {
    this.dataManager = dataManager;
    this.validationManager = new PatientValidationManager();
    this.uiManager = new PatientUIManager();
    this.currentPatientId = null;
    this.isSubmitting = false;
  }

  // Inicializar formularios
  init() {
    console.log("📝 PatientFormManager - Inicializando...");
    this.setupForms();
    this.setupValidations();
    this.bindFormEvents();
    console.log("✅ PatientFormManager - Inicializado correctamente");
  }

  // Configurar formularios
  setupForms() {
    // Formulario de agregar
    const addForm = document.getElementById("add_new_patient");
    if (addForm) {
      console.log("✅ Formulario de agregar encontrado");
    }

    // Formulario de actualizar
    const updateForm = document.getElementById("update_patient_form");
    if (updateForm) {
      console.log("✅ Formulario de actualizar encontrado");
    }

    // Formulario de editar
    const editForm = document.getElementById("edit_patient_form");
    if (editForm) {
      console.log("✅ Formulario de editar encontrado");
    }
  }

  // Configurar validaciones
  setupValidations() {
    this.validationManager.setupRealTimeValidation("add_new_patient");
    this.validationManager.setupRealTimeValidation("update_patient_form");
    this.validationManager.setupRealTimeValidation("edit_patient_form");
  }

  // Enlazar eventos específicos de formularios
  bindFormEvents() {
    this.bindAddFormEvents();
    this.bindEditFormEvents();
    this.bindSearchEvents();
  }

  // Enlazar eventos del formulario de agregar
  bindAddFormEvents() {
    const addForm = document.getElementById("add_new_patient");
    if (addForm && !addForm.hasAttribute("data-events-bound")) {
      addForm.addEventListener("submit", (e) => this.handleAddSubmit(e));
      addForm.setAttribute("data-events-bound", "true");
      console.log("✅ Eventos del formulario de agregar paciente configurados");
    }
  }

  // Enlazar eventos del formulario de editar
  bindEditFormEvents() {
    const editForms = [
      document.getElementById("update_patient_form"),
      document.getElementById("edit_patient_form"),
    ];

    editForms.forEach((form) => {
      if (form && !form.hasAttribute("data-events-bound")) {
        if (form.id === "update_patient_form") {
          form.addEventListener("submit", (e) => this.handleUpdateSubmit(e));
        } else if (form.id === "edit_patient_form") {
          form.addEventListener("submit", (e) => this.handleEditSubmit(e));
        }
        form.setAttribute("data-events-bound", "true");
        console.log(`✅ Eventos del formulario ${form.id} configurados`);
      }
    });

    // Configurar botón de cancelar
    const cancelButton = document.getElementById("btn-cancel-edit");
    if (cancelButton && !cancelButton.hasAttribute("data-events-bound")) {
      cancelButton.addEventListener("click", () => this.cancelEdit());
      cancelButton.setAttribute("data-events-bound", "true");
      console.log("✅ Botón cancelar configurado");
    }
  }

  // Enlazar eventos de búsqueda
  bindSearchEvents() {
    const searchInput = document.getElementById("searchPatient");
    if (searchInput && !searchInput.hasAttribute("data-events-bound")) {
      searchInput.addEventListener("input", (e) => {
        if (this.dataManager && this.dataManager.searchPatients) {
          const results = this.dataManager.searchPatients(e.target.value);
          console.log(`🔍 Búsqueda: ${results.length} pacientes encontrados`);
        }
      });
      searchInput.setAttribute("data-events-bound", "true");
      console.log("✅ Eventos de búsqueda configurados");
    }
  }

  // Manejar envío de formulario de agregar
  async handleAddSubmit(event) {
    event.preventDefault();

    if (this.isSubmitting) {
      console.log("⏳ Formulario ya se está enviando...");
      return;
    }

    console.log("📤 PatientFormManager - Procesando nuevo paciente...");

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    try {
      this.isSubmitting = true;
      this.uiManager.setLoadingState(submitButton, "Guardando paciente...");
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

      // Mostrar advertencias si las hay
      if (validation.warnings && validation.warnings.length > 0) {
        this.uiManager.showMessage(
          `Advertencias: ${validation.warnings.join(", ")}`,
          "warning",
          8000
        );
      }

      // Obtener datos del formulario
      const formData = new FormData(form);
      const patientData = this.processFormData(formData);

      console.log("📊 Datos del paciente a crear:", patientData);

      // Crear paciente
      let result;
      if (this.dataManager) {
        result = await this.dataManager.createPatient(patientData);
      } else {
        result = await PatientAPI.create(patientData);
      }

      console.log("✅ Paciente creado exitosamente:", result);

      // Mostrar mensaje de éxito
      this.uiManager.showMessage(
        `Paciente ${patientData.firstName} ${patientData.lastName} creado exitosamente`,
        "success"
      );

      // Limpiar formulario
      this.uiManager.clearForm(form.id);
      this.validationManager.clearFormValidation(form.id);
      // Eliminar borrador guardado en localStorage para evitar que el formulario
      // vuelva a rellenarse si el usuario navega fuera y regresa a la página de agregar.
      try {
        localStorage.removeItem("patient_draft_data");
        console.log("🧹 Borrador de paciente eliminado de localStorage");
      } catch (err) {
        console.warn("⚠️ No se pudo eliminar patient_draft_data de localStorage:", err);
      }

      // Redireccionar después de un tiempo
      setTimeout(() => {
        window.location.href = "/patients";
      }, 2000);
    } catch (error) {
      console.error("❌ Error al crear paciente:", error);

      let errorMessage = "Error desconocido";
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      this.uiManager.showMessage(
        `Error al crear el paciente: ${errorMessage}`,
        "danger"
      );
    } finally {
      this.isSubmitting = false;
      this.uiManager.resetLoadingState(submitButton, "Guardar Paciente");
    }
  }

  // Manejar envío de formulario de actualizar
  async handleUpdateSubmit(event) {
    event.preventDefault();

    if (this.isSubmitting) {
      console.log("⏳ Formulario ya se está enviando...");
      return;
    }

    console.log("🔄 PatientFormManager - Actualizando paciente...");

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    try {
      this.isSubmitting = true;
      this.uiManager.setLoadingState(submitButton, "Actualizando paciente...");
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

      // Obtener ID del paciente
      const patientId = this.getPatientId(form);
      if (!patientId) {
        throw new Error("ID del paciente no encontrado");
      }

      // Obtener datos del formulario
      const formData = new FormData(form);
      const patientData = this.processFormData(formData);
      patientData.id = parseInt(patientId);

      console.log("📊 Datos del paciente a actualizar:", patientData);

      // Actualizar paciente
      let result;
      if (this.dataManager) {
        result = await this.dataManager.updatePatient(patientId, patientData);
      } else {
        result = await PatientAPI.update(patientId, patientData);
      }

      console.log("✅ Paciente actualizado exitosamente:", result);

      // Mostrar mensaje de éxito
      this.uiManager.showMessage(
        `Paciente ${patientData.firstName} ${patientData.lastName} actualizado exitosamente`,
        "success"
      );

      // Ocultar formulario de actualización
      this.uiManager.toggleUpdateSection(false);

      // Recargar la lista si existe una función global
      if (typeof window.loadPatientsList === "function") {
        setTimeout(() => {
          window.loadPatientsList();
        }, 1000);
      } else if (typeof window.refreshPatientData === "function") {
        setTimeout(() => {
          window.refreshPatientData();
        }, 1000);
      }
    } catch (error) {
      console.error("❌ Error al actualizar paciente:", error);

      let errorMessage = "Error desconocido";
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      this.uiManager.showMessage(
        `Error al actualizar el paciente: ${errorMessage}`,
        "danger"
      );
    } finally {
      this.isSubmitting = false;
      this.uiManager.resetLoadingState(submitButton, "Actualizar Paciente");
    }
  }

  // Manejar envío de formulario de editar
  async handleEditSubmit(event) {
    event.preventDefault();

    if (this.isSubmitting) {
      console.log("⏳ Formulario ya se está enviando...");
      return;
    }

    console.log("✏️ PatientFormManager - Editando paciente...");

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    try {
      this.isSubmitting = true;
      this.uiManager.setLoadingState(submitButton, "Guardando cambios...");
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

      // Obtener ID del paciente
      const patientId = this.getPatientId(form);
      if (!patientId) {
        throw new Error("ID del paciente no encontrado");
      }

      // Obtener datos del formulario
      const formData = new FormData(form);
      const patientData = this.processFormData(formData);
      patientData.id = parseInt(patientId);

      console.log("📊 Datos del paciente a editar:", patientData);

      // Actualizar paciente
      let result;
      if (this.dataManager) {
        result = await this.dataManager.updatePatient(patientId, patientData);
      } else {
        result = await PatientAPI.update(patientId, patientData);
      }

      console.log("✅ Paciente editado exitosamente:", result);

      // Mostrar mensaje de éxito
      this.uiManager.showMessage(
        `Paciente ${patientData.firstName} ${patientData.lastName} actualizado exitosamente`,
        "success"
      );

      // Redireccionar después de un tiempo
      setTimeout(() => {
        window.location.href = "/patients";
      }, 2000);
    } catch (error) {
      console.error("❌ Error al editar paciente:", error);

      let errorMessage = "Error desconocido";
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      this.uiManager.showMessage(
        `Error al actualizar el paciente: ${errorMessage}`,
        "danger"
      );
    } finally {
      this.isSubmitting = false;
      this.uiManager.resetLoadingState(submitButton, "Guardar Cambios");
    }
  }

  // Obtener ID del paciente desde el formulario
  getPatientId(form) {
    // Buscar campo oculto en el formulario
    const idField = form.querySelector(
      'input[name="patient_id"], input[name="id"], #patient_id'
    );
    if (idField && idField.value) {
      return idField.value;
    }

    // Buscar en el documento global
    const globalIdField = document.getElementById("patient_id");
    if (globalIdField && globalIdField.value) {
      return globalIdField.value;
    }

    // Si hay currentPatientId guardado
    if (this.currentPatientId) {
      return this.currentPatientId;
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

    // Campos de texto básicos (heredados de User)
    const textFields = ["firstName", "lastName", "email"];

    textFields.forEach((field) => {
      const value = formData.get(field);
      if (value !== null && value !== undefined) {
        data[field] = value.toString().trim();
      }
    });

    const cardIdentity = formData.get("cardIdentity");
    if (cardIdentity) {
      data.cardIdentity = parseInt(cardIdentity.toString().replace(/\D/g, ""));
    }

    const admissionDate = formData.get("admissionDate");
    if (admissionDate && admissionDate.trim() !== "") {
      data.admissionDate = admissionDate; // Ya viene en formato YYYY-MM-DD
    }

    const street = formData.get("street");
    const number = formData.get("number");
    const location = formData.get("location");
    const province = formData.get("province");

    // Solo crear address si al menos un campo tiene valor
    if (street || number || location || province) {
      data.address = {
        street: street?.trim() || "",
        number: number ? parseInt(number) : null,
        location: location?.trim() || "",
        province: province?.trim() || "",
      };
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
  async loadPatientForEdit(patientId) {
    try {
      console.log(
        `📋 PatientFormManager - Cargando paciente ${patientId} para editar`
      );

      this.uiManager.showMessage("Cargando datos del paciente...", "info");

      // Guardar ID actual
      this.currentPatientId = patientId;

      let patient;
      if (this.dataManager) {
        patient = await this.dataManager.loadPatientById(patientId);
      } else {
        patient = await PatientAPI.findById(patientId);
      }

      console.log("✅ Paciente cargado para editar:", patient);

      // Llenar formulario de edición
      this.uiManager.fillForm(patient, "edit");

      // Mostrar sección de actualización si existe
      this.uiManager.toggleUpdateSection(true);

      // Ocultar mensaje de carga
      this.uiManager.hideMessage();

      return patient;
    } catch (error) {
      console.error(`❌ Error al cargar paciente ${patientId}:`, error);
      this.uiManager.showMessage(
        `Error al cargar los datos del paciente: ${error.message}`,
        "danger"
      );
      throw error;
    }
  }

  // Preparar formulario para actualización (llamado desde botones de la lista)
  async prepareUpdateForm(patient) {
    try {
      console.log(
        "📝 PatientFormManager - Preparando formulario de actualización"
      );

      this.currentPatientId = patient.id;

      // Llenar el formulario de actualización
      this.uiManager.fillForm(patient, "edit");

      // Mostrar la sección de actualización
      this.uiManager.toggleUpdateSection(true);

      // Limpiar validaciones previas
      this.validationManager.clearFormValidation("update_patient_form");

      console.log("✅ Formulario de actualización preparado");
    } catch (error) {
      console.error("❌ Error al preparar formulario de actualización:", error);
      this.uiManager.showMessage(
        "Error al preparar el formulario de edición",
        "danger"
      );
    }
  }

  // Preparar formulario para edición (método más genérico)
  async prepareEditForm(patientId) {
    try {
      console.log(
        `📝 PatientFormManager - Preparando edición para paciente ${patientId}`
      );

      // Cargar datos del paciente
      const patient = await this.loadPatientForEdit(patientId);

      // Preparar el formulario de actualización
      await this.prepareUpdateForm(patient);

      console.log("✅ Formulario de edición preparado completamente");
    } catch (error) {
      console.error(
        `❌ Error al preparar edición del paciente ${patientId}:`,
        error
      );
      throw error;
    }
  }

  // Manejar eliminación de paciente
  async handleDelete(patientId) {
    try {
      console.log(
        `🗑️ PatientFormManager - Procesando eliminación de paciente ${patientId}`
      );

      // Cargar datos del paciente para mostrar en la confirmación
      let patient;
      if (this.dataManager) {
        patient = await this.dataManager.loadPatientById(patientId);
      } else {
        patient = await PatientAPI.findById(patientId);
      }

      // Mostrar confirmación de eliminación
      const confirmed = this.uiManager.showDeleteConfirmation(
        patient,
        async () => {
          await this.performDelete(patientId, patient);
        }
      );

      if (!confirmed) {
        console.log("❌ Eliminación cancelada por el usuario");
        return;
      }
    } catch (error) {
      console.error(`❌ Error al eliminar paciente ${patientId}:`, error);
      this.uiManager.showMessage(
        `Error al eliminar el paciente: ${error.message}`,
        "danger"
      );
    }
  }

  // Realizar eliminación
  async performDelete(patientId, patient) {
    try {
      // Mostrar loading
      this.uiManager.showMessage("Eliminando paciente...", "info");

      // Eliminar paciente
      if (this.dataManager) {
        await this.dataManager.deletePatient(patientId);
      } else {
        await PatientAPI.delete(patientId);
      }

      console.log("✅ Paciente eliminado exitosamente");

      // Mostrar mensaje de éxito
      this.uiManager.showMessage(
        `Paciente ${patient.firstName} ${patient.lastName} eliminado exitosamente`,
        "success"
      );

      // Ocultar formulario de actualización si estaba visible
      this.uiManager.toggleUpdateSection(false);

      // Recargar la lista
      if (typeof window.loadPatientsList === "function") {
        setTimeout(() => {
          window.loadPatientsList();
        }, 1000);
      } else if (typeof window.refreshPatientData === "function") {
        setTimeout(() => {
          window.refreshPatientData();
        }, 1000);
      }
    } catch (error) {
      console.error(
        `❌ Error en eliminación del paciente ${patientId}:`,
        error
      );
      this.uiManager.showMessage(
        `Error al eliminar el paciente: ${error.message}`,
        "danger"
      );
    }
  }

  // Cancelar edición
  cancelEdit() {
    console.log("❌ PatientFormManager - Cancelando edición");

    this.currentPatientId = null;

    // Ocultar sección de actualización
    this.uiManager.toggleUpdateSection(false);

    // Limpiar formularios
    this.uiManager.clearForm("update_patient_form");
    this.uiManager.clearForm("edit_patient_form");

    // Limpiar validaciones
    this.validationManager.clearFormValidation("update_patient_form");
    this.validationManager.clearFormValidation("edit_patient_form");

    // Mostrar mensaje de cancelación
    this.uiManager.showMessage("Edición cancelada", "info", 2000);

    console.log("✅ Edición cancelada correctamente");
  }

  // Limpiar todos los formularios
  clearAllForms() {
    console.log("🧹 PatientFormManager - Limpiando todos los formularios");

    const formIds = [
      "add_new_patient",
      "update_patient_form",
      "edit_patient_form",
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
    this.currentPatientId = null;
    this.isSubmitting = false;

    console.log("✅ Todos los formularios limpiados");
  }

  // Obtener estado actual del form manager
  getCurrentState() {
    return {
      currentPatientId: this.currentPatientId,
      isSubmitting: this.isSubmitting,
      hasDataManager: !!this.dataManager,
      formsFound: {
        addForm: !!document.getElementById("add_new_patient"),
        updateForm: !!document.getElementById("update_patient_form"),
        editForm: !!document.getElementById("edit_patient_form"),
      },
    };
  }

  // Validar si el FormManager está listo para usar
  isReady() {
    return !!(this.validationManager && this.uiManager);
  }

  // Método para debugging
  debug() {
    console.log("🐛 PatientFormManager Debug:", {
      currentPatientId: this.currentPatientId,
      isSubmitting: this.isSubmitting,
      hasDataManager: !!this.dataManager,
      hasValidationManager: !!this.validationManager,
      hasUIManager: !!this.uiManager,
      state: this.getCurrentState(),
    });
  }
}

export default PatientFormManager;
