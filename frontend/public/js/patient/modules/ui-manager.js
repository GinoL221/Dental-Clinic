import logger from "../../logger.js";
import { parseYMDToLocalDate, formatLocalDate } from "../../utils/date-utils.js";

class PatientUIManager {
  constructor() {
    this.messageContainer = null;
    this.currentEditModal = null;
  }

  // Mostrar mensaje al usuario
  showMessage(message, type = "info", duration = 5000) {
  logger.info(`PatientUIManager - Mostrando mensaje: ${message} (${type})`);

    // Remover mensajes anteriores
    this.clearMessages();

    // Crear contenedor de mensajes si no existe
    if (!this.messageContainer) {
      this.createMessageContainer();
    }

    // Crear mensaje
    const messageDiv = document.createElement("div");
    messageDiv.className = `alert alert-${type} alert-dismissible fade show patient-message`;
    messageDiv.innerHTML = `
      <i class="bi bi-${this.getMessageIcon(type)} me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    this.messageContainer.appendChild(messageDiv);

    // Auto-remover para mensajes que no sean de error
    if (type !== "danger" && duration > 0) {
      setTimeout(() => {
        if (messageDiv && messageDiv.parentNode) {
          messageDiv.remove();
        }
      }, duration);
    }
  }

  // Ocultar mensaje actual
  hideMessage() {
    this.clearMessages();
  }

  // Limpiar todos los mensajes
  clearMessages() {
    const existingMessages = document.querySelectorAll(".patient-message");
    existingMessages.forEach((msg) => msg.remove());
  }

  // Crear contenedor de mensajes
  createMessageContainer() {
    this.messageContainer = document.getElementById("patient-messages");

    if (!this.messageContainer) {
      this.messageContainer = document.createElement("div");
      this.messageContainer.id = "patient-messages";
      this.messageContainer.className = "message-container mb-3";

      // Insertar al inicio del contenido principal
      const container =
        document.querySelector(".container") ||
        document.querySelector("main") ||
        document.body;
      container.insertBefore(this.messageContainer, container.firstChild);
    }
  }

  // Obtener icono para el tipo de mensaje
  getMessageIcon(type) {
    const icons = {
      success: "check-circle",
      danger: "exclamation-triangle",
      warning: "exclamation-circle",
      info: "info-circle",
      primary: "info-circle",
      secondary: "info-circle",
    };
    return icons[type] || "info-circle";
  }

  // Renderizar tabla de pacientes - CORREGIDO COMPLETAMENTE
  renderPatientsTable(patients) {
    const tableBody = document.getElementById("patientTableBody");
    const noDataMessage = document.getElementById("noDataMessage");
    const loadingSpinner = document.getElementById("loadingSpinner");

    if (!tableBody) {
      console.error("❌ Elemento patientTableBody no encontrado");
      return;
    }

    // Ocultar spinner y mensaje de no datos
    if (loadingSpinner) loadingSpinner.style.display = "none";
    if (noDataMessage) noDataMessage.style.display = "none";

    // Limpiar tabla
    tableBody.innerHTML = "";

    if (!patients || patients.length === 0) {
      if (noDataMessage) {
        noDataMessage.style.display = "block";
      } else {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-4 text-muted">
              <i class="bi bi-inbox" style="font-size: 2rem;"></i>
              <br>No hay pacientes registrados
            </td>
          </tr>
        `;
      }
      return;
    }

    // Renderizar filas de pacientes
    patients.forEach((patient) => {
      const row = this.createPatientTableRow(patient);
      tableBody.appendChild(row);
    });

  logger.info(`Tabla renderizada con ${patients.length} pacientes`);
  }

  // Crear fila de la tabla para un paciente - CORREGIDO
  createPatientTableRow(patient) {
    const row = document.createElement("tr");
    row.className = "patient-row";
    row.setAttribute("data-patient-id", patient.id);

    // Formatear datos para mostrar
    const formattedPatient = this.formatPatientForTable(patient);

    row.innerHTML = `
      <td class="patient-id">${patient.id}</td>
      <td class="patient-dni">${formattedPatient.cardIdentityFormatted}</td>
      <td class="patient-name">
        <div class="patient-name-container">
          <span class="patient-full-name">${formattedPatient.fullName}</span>
        </div>
      </td>
      <td class="patient-email">
        <span class="patient-email-text">${patient.email}</span>
      </td>
      <td class="patient-admission">
        <span class="patient-admission-date">${formattedPatient.admissionDateFormatted}</span>
      </td>
      <td class="patient-actions text-center">
        <div class="btn-group" role="group">
          <button 
            type="button" 
            class="btn btn-outline-primary btn-sm"
            onclick="editPatient(${patient.id})"
            title="Editar paciente"
          >
            <i class="bi bi-pencil"></i>
          </button>
          <button 
            type="button" 
            class="btn btn-outline-danger btn-sm"
            onclick="deletePatient(${patient.id})"
            title="Eliminar paciente"
          >
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;

    return row;
  }

  // Formatear datos del paciente para la tabla - CORREGIDO
  formatPatientForTable(patient) {
    if (!patient) return {};

    return {
      fullName: `${patient.firstName || ""} ${patient.lastName || ""}`.trim(),
      cardIdentityFormatted: patient.cardIdentity
        ? patient.cardIdentity.toLocaleString("es-ES")
        : "No especificado",
      admissionDateFormatted: this.formatAdmissionDate(patient.admissionDate),
      emailFormatted: patient.email || "No especificado",
    };
  }

  // Formatear fecha de admisión - NUEVO MÉTODO
  formatAdmissionDate(dateString) {
    if (!dateString) return "No especificada";

    // LocalDate viene como YYYY-MM-DD desde el backend
    return formatLocalDate(dateString, 'es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Mostrar resultados de búsqueda - CORREGIDO
  displaySearchResults(results, searchTerm) {
    if (!results) {
      console.warn("⚠️ No se proporcionaron resultados de búsqueda");
      return;
    }

  logger.debug(`Mostrando ${results.length} resultados para: "${searchTerm}"`);

    // Renderizar resultados en la tabla
    this.renderPatientsTable(results);

    // Mostrar mensaje de resultados si hay término de búsqueda
    if (searchTerm && searchTerm.trim() !== "") {
      const message =
        results.length > 0
          ? `Se encontraron ${results.length} paciente(s) que coinciden con "${searchTerm}"`
          : `No se encontraron pacientes que coincidan con "${searchTerm}"`;

      this.showMessage(message, results.length > 0 ? "info" : "warning", 5000);
    }
  }

  // Llenar formulario con datos del paciente - CORREGIDO PARA ADDRESS
  fillForm(patient, mode = "edit") {
    if (!patient) {
      console.warn("⚠️ No se proporcionaron datos del paciente");
      return;
    }

    const suffix = mode === "edit" ? "_edit" : "";

    // Campos básicos (heredados de User)
    this.setFieldValue(`firstName${suffix}`, patient.firstName);
    this.setFieldValue(`lastName${suffix}`, patient.lastName);
    this.setFieldValue(`email${suffix}`, patient.email);

    // Campos específicos de Patient
    this.setFieldValue(`cardIdentity${suffix}`, patient.cardIdentity);
    this.setFieldValue(`admissionDate${suffix}`, patient.admissionDate);

    // ✅ CAMPOS DE ADDRESS COMO OBJETO
    if (patient.address) {
      this.setFieldValue(`street${suffix}`, patient.address.street);
      this.setFieldValue(`number${suffix}`, patient.address.number);
      this.setFieldValue(`location${suffix}`, patient.address.location);
      this.setFieldValue(`province${suffix}`, patient.address.province);
    }

    // Campo ID para formularios de edición
    if (patient.id) {
      this.setFieldValue("patient_id", patient.id);
      this.setFieldValue("id", patient.id);
    }

  logger.debug(`Formulario ${mode} llenado con datos del paciente ${patient.id}`);
  }

  // Método auxiliar para establecer valores en campos
  setFieldValue(fieldName, value) {
    const field =
      document.getElementById(fieldName) ||
      document.querySelector(`[name="${fieldName}"]`);

    if (field && value !== null && value !== undefined) {
      field.value = value;
    }
  }

  // Método auxiliar para obtener valores de campos
  getFieldValue(fieldName) {
    const field =
      document.getElementById(fieldName) ||
      document.querySelector(`[name="${fieldName}"]`);

    return field ? field.value : null;
  }

  // Limpiar formulario
  clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
      form.reset();
      this.clearValidationStyles(form);
  logger.debug(`Formulario ${formId} limpiado`);
    }
  }

  // Mostrar/ocultar sección de actualización
  toggleUpdateSection(show = true) {
    const updateDiv = document.getElementById("div_patient_updating");
    if (updateDiv) {
      updateDiv.style.display = show ? "block" : "none";

      if (show) {
        updateDiv.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  // Mostrar modal de confirmación para eliminar
  showDeleteConfirmation(patient, onConfirm) {
    const confirmed = confirm(
      `¿Está seguro de que desea eliminar al paciente ${patient.firstName} ${patient.lastName}?\n\n` +
        `DNI: ${patient.cardIdentity}\n` +
        `Email: ${patient.email}\n` +
        `Admisión: ${this.formatAdmissionDate(patient.admissionDate)}\n\n` +
        `Esta acción no se puede deshacer.`
    );

    if (confirmed && typeof onConfirm === "function") {
      onConfirm();
    }

    return confirmed;
  }

  // Configurar estado de carga en botón
  setLoadingState(button, loadingText = "Procesando...") {
    if (!button) return;

    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = `<i class="bi bi-arrow-clockwise spinning me-2"></i>${loadingText}`;
  }

  // Resetear estado de botón
  resetLoadingState(button, originalText = null) {
    if (!button) return;

    button.disabled = false;
    button.innerHTML =
      originalText || button.dataset.originalText || button.innerHTML;
    delete button.dataset.originalText;
  }

  // Limpiar estilos de validación
  clearValidationStyles(form) {
    if (!form) return;

    const fields = form.querySelectorAll(".form-control");
    fields.forEach((field) => {
      field.classList.remove("is-valid", "is-invalid");
    });

    const feedbacks = form.querySelectorAll(".invalid-feedback");
    feedbacks.forEach((feedback) => feedback.remove());
  }

  // Escapar HTML para prevenir XSS
  escapeHtml(text) {
    if (!text) return "";
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.toString().replace(/[&<>"']/g, (m) => map[m]);
  }

  // Mostrar estadísticas de pacientes - CORREGIDO
  displayStats(stats) {
    if (!stats) {
      console.warn("⚠️ No se proporcionaron estadísticas");
      return;
    }

    const statsContainer = document.getElementById("patientStats");
    const statsContent = document.getElementById("statsContent");

    if (!statsContainer || !statsContent) {
      console.warn("⚠️ Contenedores de estadísticas no encontrados");
      return;
    }

    statsContent.innerHTML = `
      <div class="row">
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Total Pacientes</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-value">${stats.withAddress || 0}</div>
            <div class="stat-label">Con Dirección</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-value">${stats.recentAdmissions || 0}</div>
            <div class="stat-label">Admisiones Recientes</div>
            <small class="text-muted">(últimos 30 días)</small>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-value">${
              Object.keys(stats.byProvince || {}).length
            }</div>
            <div class="stat-label">Provincias</div>
          </div>
        </div>
      </div>
      
      ${
        Object.keys(stats.byProvince || {}).length > 0
          ? `
        <div class="row mt-3">
          <div class="col-12">
            <h6>Distribución por Provincia:</h6>
            <div class="province-stats">
              ${Object.entries(stats.byProvince)
                .map(
                  ([province, count]) => `
                  <span class="badge bg-light text-dark me-2 mb-2">
                    ${province}: ${count}
                  </span>
                `
                )
                .join("")}
            </div>
          </div>
        </div>
      `
          : ""
      }
    `;

    statsContainer.style.display = "block";
  logger.info("Estadísticas mostradas:", stats);
  }
}

export default PatientUIManager;
