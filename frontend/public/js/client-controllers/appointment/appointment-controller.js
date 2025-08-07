class AppointmentController {
  constructor() {
    this.currentAppointment = null;
    this.dentists = [];
    this.appointments = [];
    this.appointmentToDeleteId = null;
  }

  // Inicializar controlador basado en la página actual
  init() {
    const path = window.location.pathname;

    if (path.includes("/appointments/add")) {
      this.initAddForm();
    } else if (path.includes("/appointments/edit")) {
      this.initEditForm();
    } else if (path.includes("/appointments")) {
      this.initListView();
    }
  }

  // Inicializar formulario de agregar cita
  async initAddForm() {
    try {
      await this.loadDentists();
      
      // Si es admin, cargar pacientes
      if (window.isAdmin) {
        await this.loadPatients();
      }
      
      this.setupDateInput();
      this.bindAddFormEvents();
    } catch (error) {
      console.error("Error al inicializar formulario de agregar:", error);
    }
  }

  // Inicializar formulario de editar cita
  async initEditForm() {
    try {
      await this.loadDentists();
      this.setupDateInput();
      await this.loadAppointmentData();
      this.bindEditFormEvents();
    } catch (error) {
      console.error("Error al inicializar formulario de editar:", error);
    }
  }

  // Inicializar vista de lista
  async initListView() {
    try {
      await this.loadDentists();
      await this.loadAppointments();
      this.bindListEvents();
    } catch (error) {
      console.error("Error al inicializar lista de citas:", error);
    }
  }

  // Cargar dentistas
  async loadDentists() {
    try {
      this.dentists = await DentistAPI.getAll();
      const dentistSelect = document.getElementById("dentistId");
      const filterSelect = document.getElementById("filterDentist");

      if (dentistSelect) {
        this.populateDentistSelect(dentistSelect);
      }

      if (filterSelect) {
        this.populateDentistSelect(filterSelect, true);
      }
    } catch (error) {
      console.error("Error al cargar dentistas:", error);
      this.showMessage("Error al cargar la lista de dentistas", "warning");
    }
  }

  // Cargar pacientes (solo para admins)
  async loadPatients() {
    if (!window.isAdmin) {
      console.warn("Solo los administradores pueden cargar la lista de pacientes");
      return;
    }

    try {
      this.patients = await getAllPatients();
      const patientSelect = document.getElementById("patientSelect");

      if (patientSelect) {
        this.populatePatientSelect(patientSelect);
      }
    } catch (error) {
      console.error("Error al cargar pacientes:", error);
      this.showMessage("Error al cargar la lista de pacientes", "warning");
    }
  }

  // Poblar select de pacientes
  populatePatientSelect(selectElement) {
    // Limpiar opciones existentes excepto la primera
    while (selectElement.children.length > 1) {
      selectElement.removeChild(selectElement.lastChild);
    }

    // Agregar opciones de pacientes
    this.patients.forEach((patient) => {
      const option = document.createElement("option");
      option.value = patient.id;
      option.textContent = `${patient.name} ${patient.lastName} - ${patient.email}`;
      selectElement.appendChild(option);
    });
  }

  // Llenar select de dentistas
  populateDentistSelect(selectElement, includeEmptyOption = false) {
    if (includeEmptyOption) {
      selectElement.innerHTML = '<option value="">Todos los dentistas</option>';
    }

    this.dentists.forEach((dentist) => {
      const option = document.createElement("option");
      option.value = dentist.id;
      const dentistName = dentist.firstName || dentist.name || "Dentista";
      option.textContent = `Dr/a. ${dentistName} ${dentist.lastName}`;
      selectElement.appendChild(option);
    });
  }

  // Obtener nombre del dentista por ID
  getDentistName(dentistId) {
    const dentist = this.dentists.find((d) => d.id === dentistId);
    if (dentist) {
      const firstName = dentist.firstName || dentist.name || "Dentista";
      return `Dr/a. ${firstName} ${dentist.lastName}`;
    }
    return "Dentista no encontrado";
  }

  // Cargar todas las citas (para la lista)
  async loadAppointments() {
    const loading = document.getElementById("loading");
    const container = document.getElementById("appointments-container");

    if (loading) loading.style.display = "block";
    if (container) container.style.display = "none";

    try {
      this.appointments = await AppointmentAPI.getAll();
      this.displayAppointments(this.appointments);
    } catch (error) {
      console.error("Error al cargar citas:", error);
      this.showError("Error al cargar las citas: " + error.message);
    } finally {
      if (loading) loading.style.display = "none";
      if (container) container.style.display = "block";
    }
  }

  // Mostrar citas en la tabla
  displayAppointments(appointments) {
    const tbody = document.getElementById("appointments-table-body");
    const noAppointments = document.getElementById("no-appointments");

    if (!tbody) return;

    if (!appointments || appointments.length === 0) {
      tbody.innerHTML = "";
      if (noAppointments) noAppointments.style.display = "block";
      return;
    }

    if (noAppointments) noAppointments.style.display = "none";

    tbody.innerHTML = appointments
      .map(
        (appointment, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${appointment.patientName || "Sin nombre"} ${
          appointment.patientLastName || ""
        }</strong></td>
        <td>${appointment.patientEmail || "Sin email"}</td>
        <td>${this.getDentistName(appointment.dentistId)}</td>
        <td>${this.formatDate(appointment.appointmentDate)}</td>
        <td>${this.formatTime(appointment.appointmentTime)}</td>
        <td>${appointment.description || "Sin descripción"}</td>
        <td>
          <div class="btn-group btn-group-sm" role="group">
            <a href="/appointments/edit/${
              appointment.id
            }" class="btn btn-outline-primary" title="Editar">
              <i class="fas fa-edit"></i>
            </a>
            <button class="btn btn-outline-danger" onclick="appointmentController.confirmDeleteAppointment(${
              appointment.id
            }, '${appointment.patientName} ${
          appointment.patientLastName
        }')" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `
      )
      .join("");
  }

  // Filtrar citas
  filterAppointments() {
    const searchPatient =
      document.getElementById("searchPatient")?.value.toLowerCase() || "";
    const filterDentist = document.getElementById("filterDentist")?.value || "";
    const filterDate = document.getElementById("filterDate")?.value || "";

    let filteredAppointments = this.appointments.filter((appointment) => {
      // Filtro por paciente
      const patientMatch =
        !searchPatient ||
        (appointment.patientName &&
          appointment.patientName.toLowerCase().includes(searchPatient)) ||
        (appointment.patientLastName &&
          appointment.patientLastName.toLowerCase().includes(searchPatient)) ||
        (appointment.patientEmail &&
          appointment.patientEmail.toLowerCase().includes(searchPatient));

      // Filtro por dentista
      const dentistMatch =
        !filterDentist || appointment.dentistId.toString() === filterDentist;

      // Filtro por fecha
      const dateMatch =
        !filterDate || appointment.appointmentDate === filterDate;

      return patientMatch && dentistMatch && dateMatch;
    });

    this.displayAppointments(filteredAppointments);
  }

  // Limpiar filtros
  clearFilters() {
    const searchInput = document.getElementById("searchPatient");
    const dentistFilter = document.getElementById("filterDentist");
    const dateFilter = document.getElementById("filterDate");

    if (searchInput) searchInput.value = "";
    if (dentistFilter) dentistFilter.value = "";
    if (dateFilter) dateFilter.value = "";

    this.displayAppointments(this.appointments);
  }

  // Cargar datos de una cita específica (para editar)
  async loadAppointmentData() {
    const appointmentId = this.getAppointmentIdFromUrl();

    if (!appointmentId) {
      this.showLoadingError();
      return;
    }

    try {
      this.currentAppointment = await AppointmentAPI.getById(appointmentId);

      if (!this.currentAppointment) {
        throw new Error("Cita no encontrada");
      }

      this.fillEditForm(this.currentAppointment);
      this.showEditForm();
    } catch (error) {
      console.error("Error al cargar la cita:", error);
      this.showLoadingError(error.message);
    }
  }

  // Llenar formulario de edición
  fillEditForm(appointment) {
    const fields = [
      { id: "appointmentId", value: appointment.id },
      { id: "patientName", value: appointment.patientName || "" },
      { id: "patientLastName", value: appointment.patientLastName || "" },
      { id: "patientEmail", value: appointment.patientEmail || "" },
      { id: "dentistId", value: appointment.dentistId || "" },
      { id: "appointmentDate", value: appointment.appointmentDate || "" },
      { id: "appointmentTime", value: appointment.appointmentTime || "" },
      { id: "description", value: appointment.description || "" },
    ];

    fields.forEach((field) => {
      const element = document.getElementById(field.id);
      if (element) element.value = field.value;
    });
  }

  // Mostrar formulario de edición
  showEditForm() {
    const loading = document.getElementById("loading");
    const form = document.getElementById("edit_appointment_form");

    if (loading) loading.style.display = "none";
    if (form) form.style.display = "block";
  }

  // Mostrar error de carga
  showLoadingError(message = "No se pudo cargar la información de la cita") {
    const loading = document.getElementById("loading");
    const errorDiv = document.getElementById("error-loading");

    if (loading) loading.style.display = "none";
    if (errorDiv) {
      errorDiv.innerHTML = `
        <strong>Error:</strong> ${message}
        <br>
        <a href="/appointments" class="btn btn-outline-primary mt-2">
          ← Volver a la lista de citas
        </a>
      `;
      errorDiv.style.display = "block";
    }
  }

  // Obtener ID de la cita desde la URL
  getAppointmentIdFromUrl() {
    const pathParts = window.location.pathname.split("/");
    const editIndex = pathParts.indexOf("edit");
    if (editIndex !== -1 && pathParts[editIndex + 1]) {
      return parseInt(pathParts[editIndex + 1]);
    }
    return null;
  }

  // Configurar fecha mínima
  setupDateInput() {
    const dateInput = document.getElementById("appointmentDate");
    if (dateInput) {
      const today = new Date().toISOString().split("T")[0];
      dateInput.min = today;
    }
  }

  // Enlazar eventos del formulario de agregar
  bindAddFormEvents() {
    const form = document.getElementById("add_new_appointment");
    if (form) {
      form.addEventListener("submit", (e) => this.handleAddSubmit(e));
    }
  }

  // Enlazar eventos del formulario de editar
  bindEditFormEvents() {
    const form = document.getElementById("edit_appointment_form");
    if (form) {
      form.addEventListener("submit", (e) => this.handleEditSubmit(e));
    }
  }

  // Enlazar eventos de la lista
  bindListEvents() {
    // Filtros
    const searchInput = document.getElementById("searchPatient");
    const dentistFilter = document.getElementById("filterDentist");
    const dateFilter = document.getElementById("filterDate");
    const clearButton = document.getElementById("clearFilters");

    if (searchInput) {
      searchInput.addEventListener("input", () => this.filterAppointments());
    }

    if (dentistFilter) {
      dentistFilter.addEventListener("change", () => this.filterAppointments());
    }

    if (dateFilter) {
      dateFilter.addEventListener("change", () => this.filterAppointments());
    }

    if (clearButton) {
      clearButton.addEventListener("click", () => this.clearFilters());
    }

    // Confirmación de eliminación
    const confirmDelete = document.getElementById("confirmDelete");
    if (confirmDelete) {
      confirmDelete.addEventListener("click", () => this.deleteAppointment());
    }
  }

  // Manejar envío del formulario de agregar
  async handleAddSubmit(e) {
    e.preventDefault();

    const formData = this.getFormData();
    if (!this.validateFormData(formData)) {
      return;
    }

    const submitButton = document.getElementById("btn-add-new-appointment");
    this.setLoadingState(submitButton, "Programando...");

    try {
      await AppointmentAPI.create(formData);
      this.showMessage(
        `Cita programada exitosamente para ${formData.patientName} ${formData.patientLastName}`,
        "success"
      );

      document.getElementById("add_new_appointment").reset();
      this.setupDateInput();

      setTimeout(() => {
        window.location.href = "/appointments";
      }, 2000);
    } catch (error) {
      console.error("Error al programar cita:", error);
      this.showMessage(
        `Error al programar la cita: ${error.message}`,
        "danger"
      );
    } finally {
      this.resetLoadingState(submitButton, "Programar Cita");
    }
  }

  // Manejar envío del formulario de editar
  async handleEditSubmit(e) {
    e.preventDefault();

    const formData = this.getFormData();
    formData.id = parseInt(document.getElementById("appointmentId").value);

    if (!this.validateFormData(formData)) {
      return;
    }

    const submitButton = document.getElementById("btn-update-appointment");
    this.setLoadingState(submitButton, "Actualizando...");

    try {
      await AppointmentAPI.update(formData.id, formData);
      this.showMessage(
        `Cita actualizada exitosamente para ${formData.patientName} ${formData.patientLastName}`,
        "success"
      );

      setTimeout(() => {
        window.location.href = "/appointments";
      }, 2000);
    } catch (error) {
      console.error("Error al actualizar cita:", error);
      this.showMessage(
        `Error al actualizar la cita: ${error.message}`,
        "danger"
      );
    } finally {
      this.resetLoadingState(submitButton, "Actualizar Cita");
    }
  }

  // Obtener datos del formulario
  getFormData() {
    const data = {
      dentistId: parseInt(document.getElementById("dentistId").value),
      appointmentDate: document.getElementById("appointmentDate").value,
      appointmentTime: document.getElementById("appointmentTime").value,
      description: document.getElementById("description")?.value?.trim() || "",
    };

    // Si es admin, obtener el paciente seleccionado
    if (window.isAdmin) {
      const patientSelect = document.getElementById("patientSelect");
      if (patientSelect && patientSelect.value) {
        data.patientId = parseInt(patientSelect.value);
      }
    } else {
      // Si es usuario normal, usar sus propios datos
      data.isUserAppointment = true;
      data.userId = window.currentUser?.id;
    }

    return data;
  }

  // Validar datos del formulario
  validateFormData(data) {
    // Validar que se haya seleccionado un dentista
    if (!data.dentistId || isNaN(data.dentistId)) {
      this.showMessage("Debe seleccionar un odontólogo", "danger");
      return false;
    }

    // Validar fecha
    if (!data.appointmentDate) {
      this.showMessage("Debe seleccionar una fecha para la cita", "danger");
      return false;
    }

    // Validar que la fecha no sea en el pasado
    const selectedDate = new Date(data.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      this.showMessage("La fecha de la cita no puede ser anterior a hoy", "danger");
      return false;
    }

    // Validar hora
    if (!data.appointmentTime) {
      this.showMessage("Debe seleccionar una hora para la cita", "danger");
      return false;
    }

    // Si es admin, validar que se haya seleccionado un paciente
    if (window.isAdmin && (!data.patientId || isNaN(data.patientId))) {
      this.showMessage("Debe seleccionar un paciente", "danger");
      return false;
    }

    // Si es usuario normal, validar que tengamos los datos del usuario
    if (!window.isAdmin && !data.userId) {
      this.showMessage("Error: No se pudieron obtener los datos del usuario", "danger");
      return false;
    }

    return true;
  }

  // Configurar fecha mínima
  setupDateInput() {
    const dateInput = document.getElementById("appointmentDate");
    if (dateInput) {
      const today = new Date().toISOString().split("T")[0];
      dateInput.min = today;
    }
  }

  // Formatear fecha
  formatDate(dateString) {
    if (!dateString) return "Sin fecha";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  // Formatear hora
  formatTime(timeString) {
    if (!timeString) return "No especificada";
    return timeString.slice(0, 5); // Mostrar solo HH:MM
  }

  // Enlazar eventos del formulario de agregar
  bindAddFormEvents() {
    const form = document.getElementById("add_new_appointment");
    if (form) {
      form.addEventListener("submit", (e) => this.handleAddSubmit(e));
    }
  }

  // Enlazar eventos del formulario de editar
  bindEditFormEvents() {
    const form = document.getElementById("edit_appointment_form");
    if (form) {
      form.addEventListener("submit", (e) => this.handleEditSubmit(e));
    }
  }

  // Enlazar eventos de la lista
  bindListEvents() {
    // Filtros
    const searchInput = document.getElementById("searchPatient");
    const dentistFilter = document.getElementById("filterDentist");
    const dateFilter = document.getElementById("filterDate");
    const clearButton = document.getElementById("clearFilters");

    if (searchInput) {
      searchInput.addEventListener("input", () => this.filterAppointments());
    }

    if (dentistFilter) {
      dentistFilter.addEventListener("change", () => this.filterAppointments());
    }

    if (dateFilter) {
      dateFilter.addEventListener("change", () => this.filterAppointments());
    }

    if (clearButton) {
      clearButton.addEventListener("click", () => this.clearFilters());
    }

    // Confirmación de eliminación
    const confirmDelete = document.getElementById("confirmDelete");
    if (confirmDelete) {
      confirmDelete.addEventListener("click", () => this.deleteAppointment());
    }
  }

  // Confirmar eliminación de cita
  confirmDeleteAppointment(id, patientName) {
    this.appointmentToDeleteId = id;
    const deleteInfo = document.getElementById("appointmentToDelete");
    if (deleteInfo) {
      deleteInfo.innerHTML = `<strong>Paciente:</strong> ${patientName}`;
    }

    const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
    modal.show();
  }

  // Eliminar cita
  async deleteAppointment() {
    if (!this.appointmentToDeleteId) return;

    const confirmButton = document.getElementById("confirmDelete");
    if (confirmButton) {
      confirmButton.disabled = true;
      confirmButton.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status"></span> Eliminando...';
    }

    try {
      await AppointmentAPI.delete(this.appointmentToDeleteId);

      // Actualizar la lista
      await this.loadAppointments();

      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("deleteModal")
      );
      if (modal) modal.hide();

      // Mostrar mensaje de éxito
      this.showSuccessMessage("Cita eliminada exitosamente");
    } catch (error) {
      console.error("Error al eliminar cita:", error);
      this.showError("Error al eliminar la cita: " + error.message);
    } finally {
      if (confirmButton) {
        confirmButton.disabled = false;
        confirmButton.innerHTML = "Eliminar";
      }
      this.appointmentToDeleteId = null;
    }
  }

  // Mostrar mensaje de error específico para la lista
  showError(message) {
    const errorDiv = document.getElementById("error-message");
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = "block";

      setTimeout(() => {
        errorDiv.style.display = "none";
      }, 5000);
    }
  }

  // Mostrar mensaje de éxito
  showSuccessMessage(message) {
    const successMessage = document.createElement("div");
    successMessage.className =
      "alert alert-success alert-dismissible fade show";
    successMessage.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    const container = document.querySelector(".container");
    const contentCard = document.querySelector(".content-card");
    if (container && contentCard) {
      container.insertBefore(successMessage, contentCard);

      setTimeout(() => {
        successMessage.remove();
      }, 5000);
    }
  }

  // Mostrar mensajes
  showMessage(message, type) {
    const responseDiv = document.getElementById("response");
    if (responseDiv) {
      responseDiv.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
      responseDiv.style.display = "block";

      setTimeout(() => {
        responseDiv.style.display = "none";
      }, 5000);
    }
  }

  // Establecer estado de carga
  setLoadingState(button, text) {
    button.disabled = true;
    button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ${text}`;
  }

  // Restablecer estado del botón
  resetLoadingState(button, text) {
    button.disabled = false;
    button.innerHTML = text;
  }
}

// Instancia global del controlador
const appointmentController = new AppointmentController();

// Inicializar cuando se carga el DOM
document.addEventListener("DOMContentLoaded", () => {
  appointmentController.init();
});

// Exportar para uso en otros scripts si es necesario
if (typeof module !== "undefined" && module.exports) {
  module.exports = AppointmentController;
}
