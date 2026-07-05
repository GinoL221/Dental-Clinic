import logger from "../../logger.js";
import { parseYMDToLocalDate, formatLocalDate } from "../../utils/date-utils.js";

class PatientUIManager {
  constructor() {
    /** @type {HTMLElement|null} */
    this.messageContainer = null;
    /** @type {any} */
    this.currentEditModal = null;
  }

  // Mostrar mensaje al usuario
  /**
   * @param {string} message
   * @param {string} [type]
   * @param {number} [duration]
   * @returns {void}
   */
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

    if (this.messageContainer) {
      this.messageContainer.appendChild(messageDiv);
    }

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
  /**
   * @returns {void}
   */
  hideMessage() {
    this.clearMessages();
  }

  // Limpiar todos los mensajes
  /**
   * @returns {void}
   */
  clearMessages() {
    const existingMessages = document.querySelectorAll(".patient-message");
    existingMessages.forEach((msg) => msg.remove());
  }

  // Crear contenedor de mensajes
  /**
   * @returns {void}
   */
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
  /**
   * @param {string} type
   * @returns {string}
   */
  getMessageIcon(type) {
    const icons = /** @type {Record<string, string>} */ ({
      success: "check-circle",
      danger: "exclamation-triangle",
      warning: "exclamation-circle",
      info: "info-circle",
      primary: "info-circle",
      secondary: "info-circle",
    });
    return icons[type] || "info-circle";
  }

  // Renderizar tabla de pacientes - CORREGIDO COMPLETAMENTE
  /**
   * @param {any[]} patients
   * @returns {void}
   */
  renderPatientsTable(patients) {
    const tableBody = document.getElementById("patientTableBody");
    const noDataMessage = document.getElementById("noDataMessage");
    const loadingSpinner = document.getElementById("loadingSpinner");

    if (!tableBody) {
      logger.error("❌ Elemento patientTableBody no encontrado");
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

    // Renderizar filas de pacientes (mostrar índice incremental en la primera columna)
    patients.forEach((patient, index) => {
      const row = this.createPatientTableRow(patient, index);
      tableBody.appendChild(row);
    });

    logger.info(`Tabla renderizada con ${patients.length} pacientes`);
  }

  // Crear fila de la tabla para un paciente - CORREGIDO
  /**
   * @param {any} patient
   * @param {number|null} [index]
   * @returns {HTMLTableRowElement}
   */
  createPatientTableRow(patient, index = null) {
    const row = document.createElement("tr");
    row.className = "patient-row";
    row.setAttribute("data-patient-id", patient.id);

    // Formatear datos para mostrar
    const formattedPatient = this.formatPatientForTable(patient);

    const displayIndex = index !== null ? (index + 1).toString() : (patient.id ? patient.id.toString() : "");

    const idCell = document.createElement("td");
    idCell.className = "patient-id";
    idCell.textContent = displayIndex;

    const dniCell = document.createElement("td");
    dniCell.className = "patient-dni";
    dniCell.textContent = formattedPatient.cardIdentityFormatted;

    const nameCell = document.createElement("td");
    nameCell.className = "patient-name";
    const nameContainer = document.createElement("div");
    nameContainer.className = "patient-name-container";
    const nameSpan = document.createElement("span");
    nameSpan.className = "patient-full-name";
    nameSpan.textContent = formattedPatient.fullName;
    nameContainer.appendChild(nameSpan);
    nameCell.appendChild(nameContainer);

    const emailCell = document.createElement("td");
    emailCell.className = "patient-email";
    const emailSpan = document.createElement("span");
    emailSpan.className = "patient-email-text";
    emailSpan.textContent = patient.email || "";
    emailCell.appendChild(emailSpan);

    const admissionCell = document.createElement("td");
    admissionCell.className = "patient-admission";
    const admissionSpan = document.createElement("span");
    admissionSpan.className = "patient-admission-date";
    admissionSpan.textContent = formattedPatient.admissionDateFormatted;
    admissionCell.appendChild(admissionSpan);

    // Static button markup only — no user-controlled data interpolated here,
    // so a single scoped innerHTML on this cell stays safe (ids are numeric).
    const actionsCell = document.createElement("td");
    actionsCell.className = "patient-actions text-center";
    actionsCell.innerHTML = `
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
    `;

    row.append(idCell, dniCell, nameCell, emailCell, admissionCell, actionsCell);

    return row;
  }

  // Formatear datos del paciente para la tabla - CORREGIDO
  /**
   * @param {any} patient
   * @returns {{fullName: string, cardIdentityFormatted: string, admissionDateFormatted: string, emailFormatted: string}}
   */
  formatPatientForTable(patient) {
    if (!patient) {
      return {
        fullName: "",
        cardIdentityFormatted: "No especificado",
        admissionDateFormatted: "No especificada",
        emailFormatted: "No especificado"
      };
    }

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
  /**
   * @param {any} dateString
   * @returns {string}
   */
  formatAdmissionDate(dateString) {
    if (!dateString) return "No especificada";

    // LocalDate viene como YYYY-MM-DD desde el backend
    return formatLocalDate(dateString, 'es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Mostrar resultados de búsqueda - CORREGIDO
  /**
   * @param {any[]} results
   * @param {string} searchTerm
   * @returns {void}
   */
  displaySearchResults(results, searchTerm) {
    if (!results) {
      logger.warn("⚠️ No se proporcionaron resultados de búsqueda");
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
  /**
   * @param {any} patient
   * @param {string} [mode]
   * @returns {void}
   */
  fillForm(patient, mode = "edit") {
    if (!patient) {
      logger.warn("⚠️ No se proporcionaron datos del paciente");
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
  /**
   * @param {string} fieldName
   * @param {any} value
   * @returns {void}
   */
  setFieldValue(fieldName, value) {
    const field = /** @type {HTMLInputElement | null} */ (
      document.getElementById(fieldName) ||
      document.querySelector(`[name="${fieldName}"]`)
    );

    if (field && value !== null && value !== undefined) {
      field.value = value.toString();
    }
  }

  // Método auxiliar para obtener valores de campos
  /**
   * @param {string} fieldName
   * @returns {string|null}
   */
  getFieldValue(fieldName) {
    const field = /** @type {HTMLInputElement | null} */ (
      document.getElementById(fieldName) ||
      document.querySelector(`[name="${fieldName}"]`)
    );

    return field ? field.value : null;
  }

  // Limpiar formulario
  /**
   * @param {string} formId
   * @returns {void}
   */
  clearForm(formId) {
    const form = /** @type {HTMLFormElement | null} */ (document.getElementById(formId));
    if (form) {
      form.reset();
      this.clearValidationStyles(form);
      logger.debug(`Formulario ${formId} limpiado`);
    }
  }

  // Mostrar/ocultar sección de actualización
  /**
   * @param {boolean} [show]
   * @returns {void}
   */
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
  /**
   * @param {any} patient
   * @param {any} onConfirm
   * @returns {boolean}
   */
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
  /**
   * @param {any} button
   * @param {string} [loadingText]
   * @returns {void}
   */
  setLoadingState(button, loadingText = "Procesando...") {
    if (!button) return;

    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = `<i class="bi bi-arrow-clockwise spinning me-2"></i>${loadingText}`;
  }

  // Resetear estado de botón
  /**
   * @param {any} button
   * @param {string|null} [originalText]
   * @returns {void}
   */
  resetLoadingState(button, originalText = null) {
    if (!button) return;

    button.disabled = false;
    button.innerHTML =
      originalText || button.dataset.originalText || button.innerHTML;
    delete button.dataset.originalText;
  }

  // Limpiar estilos de validación
  /**
   * @param {any} form
   * @returns {void}
   */
  clearValidationStyles(form) {
    if (!form) return;

    const fields = form.querySelectorAll(".form-control");
    fields.forEach((/** @type {any} */ field) => {
      field.classList.remove("is-valid", "is-invalid");
    });

    const feedbacks = form.querySelectorAll(".invalid-feedback");
    feedbacks.forEach((/** @type {any} */ feedback) => feedback.remove());
  }

  // Escapar HTML para prevenir XSS
  /**
   * @param {any} text
   * @returns {string}
   */
  escapeHtml(text) {
    if (!text) return "";
    const map = /** @type {Record<string, string>} */ ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    });
    return text.toString().replace(/[&<>"']/g, (/** @type {string} */ m) => map[m]);
  }

  // Mostrar estadísticas de pacientes - CORREGIDO
  /**
   * @param {any} stats
   * @returns {void}
   */
  displayStats(stats) {
    if (!stats) {
      logger.warn("⚠️ No se proporcionaron estadísticas");
      return;
    }

    const statsContainer = document.getElementById("patientStats");
    const statsContent = document.getElementById("statsContent");

    if (!statsContainer || !statsContent) {
      logger.warn("⚠️ Contenedores de estadísticas no encontrados");
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
                    ${this.escapeHtml(province)}: ${count}
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
