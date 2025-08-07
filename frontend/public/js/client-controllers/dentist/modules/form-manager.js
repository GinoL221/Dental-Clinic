class DentistFormManager {
  constructor(dataManager, uiManager) {
    this.dataManager = dataManager;
    this.uiManager = uiManager;
    this.currentDentistId = null;
  }

  // Obtener datos del formulario de agregar
  getAddFormData() {
    const form = document.getElementById("add_new_dentist");
    if (!form) return null;

    const formData = {
      name: document.getElementById("firstName")?.value?.trim() || "",
      lastName: document.getElementById("lastName")?.value?.trim() || "",
      registrationNumber:
        document.getElementById("registrationNumber")?.value?.trim() || "",
      specialty: document.getElementById("specialty")?.value?.trim() || "",
    };

    console.log("📝 DentistFormManager - getAddFormData:", formData);
    return formData;
  }

  // Obtener datos del formulario de edición
  getEditFormData() {
    const form = document.getElementById("update_dentist_form");
    if (!form) return null;

    // Obtener ID del campo o usar currentDentistId como fallback
    const dentistIdField = document.getElementById("dentist_id");
    const dentistId = dentistIdField?.value
      ? parseInt(dentistIdField.value)
      : this.currentDentistId;

    if (!dentistId) {
      console.error("❌ No se puede obtener ID del dentista para edición");
      this.uiManager.showMessage(
        "Error: ID del dentista es requerido para actualización",
        "danger"
      );
      return null;
    }

    const formData = {
      id: dentistId,
      name: document.getElementById("name")?.value?.trim() || "",
      lastName: document.getElementById("lastName")?.value?.trim() || "",
      registrationNumber:
        document.getElementById("registrationNumber")?.value?.trim() || "",
      specialty: document.getElementById("specialty")?.value?.trim() || "",
    };

    console.log("📝 DentistFormManager - getEditFormData:", formData);
    return formData;
  }

  // Validar datos del formulario
  validateFormData(data) {
    console.log("✅ DentistFormManager - Validando datos:", data);

    const validation = this.dataManager.validateDentistData(data);

    if (!validation.isValid) {
      console.log("❌ Validación fallida:", validation.errors);
      this.uiManager.showMessage(validation.errors.join(", "), "danger");
      return false;
    }

    // Validaciones adicionales específicas del frontend

    // Validar que el nombre no contenga números
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(data.name)) {
      this.uiManager.showMessage(
        "El nombre solo puede contener letras",
        "danger"
      );
      return false;
    }

    // Validar que el apellido no contenga números
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(data.lastName)) {
      this.uiManager.showMessage(
        "El apellido solo puede contener letras",
        "danger"
      );
      return false;
    }

    // Validar formato de matrícula (letras y números)
    if (!/^[a-zA-Z0-9]+$/.test(data.registrationNumber)) {
      this.uiManager.showMessage(
        "La matrícula solo puede contener letras y números",
        "danger"
      );
      return false;
    }

    return true;
  }

  // Manejar envío del formulario de agregar
  async handleAddSubmit(e) {
    e.preventDefault();
    console.log("➕ DentistFormManager - Procesando formulario de agregar");

    const formData = this.getAddFormData();
    if (!formData || !this.validateFormData(formData)) {
      return;
    }

    const submitButton =
      document.getElementById("btn-add-dentist") ||
      e.target.querySelector('button[type="submit"]');

    this.uiManager.setLoadingState(submitButton, "Agregando...");

    try {
      const newDentist = await this.dataManager.createDentist(formData);

      this.uiManager.showMessage(
        `Dr. ${newDentist.name} ${newDentist.lastName} agregado exitosamente`,
        "success"
      );

      // Limpiar formulario
      this.uiManager.clearForm("add_new_dentist");

      // Redirigir a la lista después de un breve delay
      setTimeout(() => {
        window.location.href = "/dentists";
      }, 2000);
    } catch (error) {
      console.error("❌ Error al agregar dentista:", error);
      this.uiManager.showMessage(
        `Error al agregar dentista: ${error.message}`,
        "danger"
      );
    } finally {
      this.uiManager.resetLoadingState(submitButton, "Agregar Dentista");
    }
  }

  // Manejar envío del formulario de edición
  async handleEditSubmit(e) {
    e.preventDefault();
    console.log("🔄 DentistFormManager - Procesando formulario de edición");
    console.log("🔍 currentDentistId:", this.currentDentistId);

    const formData = this.getEditFormData();
    console.log("🔍 formData obtenido:", formData);

    if (!formData) {
      console.error("❌ No se pudieron obtener los datos del formulario");
      return;
    }

    if (!formData.id) {
      console.error("❌ ID del dentista faltante en formData");
      this.uiManager.showMessage(
        "Error: ID del dentista es requerido para actualización",
        "danger"
      );
      return;
    }

    if (!this.validateFormData(formData)) {
      console.error("❌ Validación de datos falló");
      return;
    }

    const submitButton =
      document.getElementById("btn-update-dentist") ||
      e.target.querySelector('button[type="submit"]');

    this.uiManager.setLoadingState(submitButton, "Actualizando...");

    try {
      const updatedDentist = await this.dataManager.updateDentist(
        formData.id,
        formData
      );

      this.uiManager.showMessage(
        `Dr. ${updatedDentist.name} ${updatedDentist.lastName} actualizado exitosamente`,
        "success"
      );

      // Ocultar sección de edición
      this.uiManager.toggleUpdateSection(false);

      // Refrescar la tabla si estamos en la página de lista
      if (window.dentistController && window.dentistController.refreshData) {
        await window.dentistController.refreshData();
      } else {
        // Recargar página si no hay controlador disponible
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error("❌ Error al actualizar dentista:", error);
      this.uiManager.showMessage(
        `Error al actualizar dentista: ${error.message}`,
        "danger"
      );
    } finally {
      this.uiManager.resetLoadingState(submitButton, "Actualizar Dentista");
    }
  }

  // Preparar formulario para edición
  async prepareEditForm(dentistId) {
    try {
      console.log(
        `🔧 DentistFormManager - Preparando edición para dentista ${dentistId}`
      );

      this.currentDentistId = dentistId;
      console.log("🔍 currentDentistId asignado:", this.currentDentistId);

      // Cargar datos del dentista
      const dentist = await this.dataManager.loadDentistById(dentistId);
      console.log("🔍 Dentista cargado:", dentist);

      // Llenar formulario
      this.uiManager.fillForm(dentist, "edit");

      // Verificar que el campo dentist_id se llenó correctamente
      const dentistIdField = document.getElementById("dentist_id");
      console.log(
        "🔍 Campo dentist_id después de llenar:",
        dentistIdField?.value
      );

      // Mostrar sección de edición
      this.uiManager.toggleUpdateSection(true);

      console.log("✅ Formulario de edición preparado");
    } catch (error) {
      console.error("❌ Error al preparar formulario de edición:", error);
      this.uiManager.showMessage(
        `Error al cargar datos del dentista: ${error.message}`,
        "danger"
      );
    }
  }

  // Cancelar edición
  cancelEdit() {
    console.log("❌ DentistFormManager - Cancelando edición");

    this.currentDentistId = null;
    this.uiManager.toggleUpdateSection(false);
    this.uiManager.clearForm("update_dentist_form");

    this.uiManager.showMessage("Edición cancelada", "info", 2000);
  }

  // Manejar eliminación de dentista
  async handleDelete(dentistId) {
    try {
      console.log(
        `🗑️ DentistFormManager - Iniciando eliminación de dentista ${dentistId}`
      );

      // Cargar datos del dentista para mostrar en confirmación
      const dentist = await this.dataManager.loadDentistById(dentistId);

      // Mostrar confirmación
      const confirmed = this.uiManager.showDeleteConfirmation(
        dentist,
        async () => {
          await this.executeDelete(dentistId, dentist);
        }
      );

      if (!confirmed) {
        console.log("❌ Eliminación cancelada por el usuario");
      }
    } catch (error) {
      console.error("❌ Error al preparar eliminación:", error);
      this.uiManager.showMessage(
        `Error al cargar datos del dentista: ${error.message}`,
        "danger"
      );
    }
  }

  // Ejecutar eliminación
  async executeDelete(dentistId, dentist) {
    try {
      console.log(
        `🗑️ DentistFormManager - Ejecutando eliminación de dentista ${dentistId}`
      );

      await this.dataManager.deleteDentist(dentistId);

      this.uiManager.showMessage(
        `Dr. ${dentist.name} ${dentist.lastName} eliminado exitosamente`,
        "success"
      );

      // Si estamos editando este dentista, cancelar la edición
      if (this.currentDentistId === dentistId) {
        this.cancelEdit();
      }

      // Refrescar la tabla si estamos en la página de lista
      if (window.dentistController && window.dentistController.refreshData) {
        setTimeout(async () => {
          await window.dentistController.refreshData();
        }, 1000);
      } else {
        // Recargar página si no hay controlador disponible
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error("❌ Error al eliminar dentista:", error);
      this.uiManager.showMessage(
        `Error al eliminar dentista: ${error.message}`,
        "danger"
      );
    }
  }

  // Configurar eventos del formulario de agregar
  bindAddFormEvents() {
    const form = document.getElementById("add_new_dentist");
    if (form) {
      form.addEventListener("submit", (e) => this.handleAddSubmit(e));
      this.uiManager.setupFormValidation("add_new_dentist");
      console.log("✅ Eventos del formulario de agregar configurados");
    }
  }

  // Configurar eventos del formulario de edición
  bindEditFormEvents() {
    const form = document.getElementById("update_dentist_form");
    if (form) {
      form.addEventListener("submit", (e) => this.handleEditSubmit(e));
      this.uiManager.setupFormValidation("update_dentist_form");
      console.log("✅ Eventos del formulario de edición configurados");
    }

    // Configurar botón de cancelar
    const cancelButton = document.getElementById("btn-cancel-edit");
    if (cancelButton) {
      cancelButton.addEventListener("click", () => this.cancelEdit());
    }
  }

  // Configurar búsqueda
  bindSearchEvents() {
    const searchInput = document.getElementById("searchDentist");
    if (searchInput) {
      let searchTimeout;

      searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.handleSearch(e.target.value);
        }, 300); // Debounce de 300ms
      });

      console.log("✅ Eventos de búsqueda configurados");
    }
  }

  // Manejar búsqueda
  async handleSearch(searchTerm) {
    try {
      console.log(`🔍 DentistFormManager - Buscando: "${searchTerm}"`);

      // Asegurar que tenemos los datos cargados
      if (this.dataManager.getCurrentDentists().length === 0) {
        await this.dataManager.loadAllDentists();
      }

      const results = this.dataManager.searchDentists(searchTerm);
      this.uiManager.displaySearchResults(results, searchTerm);
    } catch (error) {
      console.error("❌ Error en búsqueda:", error);
      this.uiManager.showMessage("Error al realizar la búsqueda", "danger");
    }
  }

  // Obtener ID del dentista actual en edición
  getCurrentDentistId() {
    return this.currentDentistId;
  }
}

export default DentistFormManager;
