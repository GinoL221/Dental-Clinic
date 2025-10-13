import logger from "../../logger.js";

class DentistUIManager {
  constructor() {
    this.messageContainer = null;
    this.currentEditModal = null;
  }

  // Mostrar mensaje al usuario
  showMessage(message, type = "info", duration = 5000) {
    logger.info(`📢 DentistUIManager - Mostrando mensaje: ${message} (${type})`);

    // Remover mensajes anteriores
    this.clearMessages();

    // Crear contenedor de mensajes si no existe
    if (!this.messageContainer) {
      this.createMessageContainer();
    }

    // Crear mensaje
    const messageDiv = document.createElement("div");
    messageDiv.className = `alert alert-${type} alert-dismissible fade show dentist-message`;
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
    const existingMessages = document.querySelectorAll(".dentist-message");
    existingMessages.forEach((msg) => msg.remove());
  }

  // Crear contenedor de mensajes
  createMessageContainer() {
    this.messageContainer = document.getElementById("dentist-messages");

    if (!this.messageContainer) {
      this.messageContainer = document.createElement("div");
      this.messageContainer.id = "dentist-messages";
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

  // Renderizar tabla de dentistas
  renderDentistsTable(dentists) {
  logger.debug("DentistUIManager - Renderizando tabla de dentistas...");

    const tableBody = document.getElementById("dentistTableBody");
    if (!tableBody) {
      logger.warn("⚠️ No se encontró la tabla de dentistas");
      return;
    }

    if (!dentists || dentists.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">
            <div class="alert alert-info mb-0">
              <i class="bi bi-info-circle me-2"></i>
              No hay dentistas registrados
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = "";

    dentists.forEach((dentist, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${this.escapeHtml(dentist.registrationNumber)}</td>
        <td>${this.escapeHtml(dentist.firstName)}</td>
        <td>${this.escapeHtml(dentist.lastName)}</td>
        <td>
          <div class="btn-group" role="group">
            <button type="button" class="btn btn-sm btn-outline-primary" 
                    onclick="editDentist(${dentist.id})"
                    title="Editar dentista">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button type="button" class="btn btn-sm btn-outline-danger" 
                    onclick="deleteDentist(${dentist.id})"
                    title="Eliminar dentista">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(row);
    });

  logger.info(`✅ ${dentists.length} dentistas mostrados en la tabla`);
  }

  // Llenar formulario con datos de dentista
  fillForm(dentist, formType = "edit") {
    logger.debug(`📝 DentistUIManager - Llenando formulario ${formType}:`, dentist);

    const fields = {
      edit: {
        id: "dentist_id",
        firstName: "firstName",
        lastName: "lastName",
        registrationNumber: "registrationNumber",
      },
      add: {
        firstName: "firstName",
        lastName: "lastName",
        registrationNumber: "registrationNumber",
      },
    };

    const fieldMapping = fields[formType] || fields.edit;

    // Llenar campos
    Object.entries(fieldMapping).forEach(([dataKey, fieldId]) => {
      const field = document.getElementById(fieldId);
      if (field && dentist[dataKey] !== undefined) {
        field.value = dentist[dataKey] || "";
      }
    });

  logger.info(`✅ Formulario ${formType} llenado correctamente`);
  }

  // Limpiar formulario
  clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
      form.reset();
      this.clearValidationStyles(form);
  logger.info(`🧹 Formulario ${formId} limpiado`);
    }
  }

  // Mostrar/ocultar sección de actualización
  toggleUpdateSection(show = true) {
    const updateDiv = document.getElementById("div_dentist_updating");
    if (updateDiv) {
      updateDiv.style.display = show ? "block" : "none";

      if (show) {
        updateDiv.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  // Mostrar modal de confirmación para eliminar
  showDeleteConfirmation(dentist, onConfirm) {
    const confirmed = confirm(
      `¿Está seguro de que desea eliminar al Dr. ${dentist.firstName} ${dentist.lastName}?\n\n` +
        `Matrícula: ${dentist.registrationNumber}\n\n` +
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

  // Validación visual en tiempo real
  setupFormValidation(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    // Validación para el nombre
    const nameField = form.querySelector(
      'input[name="firstName"], input[id="firstName"]'
    );
    if (nameField) {
      nameField.addEventListener("input", (e) => {
        this.validateField(
          e.target,
          (value) => value.trim().length >= 2,
          "El nombre debe tener al menos 2 caracteres"
        );
      });
    }

    // Validación para el apellido
    const lastNameField = form.querySelector('input[name="lastName"]');
    if (lastNameField) {
      lastNameField.addEventListener("input", (e) => {
        this.validateField(
          e.target,
          (value) => value.trim().length >= 2,
          "El apellido debe tener al menos 2 caracteres"
        );
      });
    }

    // Validación para la matrícula
    const regNumberField = form.querySelector(
      'input[name="registrationNumber"]'
    );
    if (regNumberField) {
      regNumberField.addEventListener("input", (e) => {
        this.validateField(
          e.target,
          (value) => value.trim().length >= 3,
          "La matrícula debe tener al menos 3 caracteres"
        );
      });
    }
  }

  // Validar campo individual
  validateField(field, validator, errorMessage) {
    const value = field.value;
    const isValid = validator(value);

    // Remover clases anteriores
    field.classList.remove("is-valid", "is-invalid");

    // Aplicar nueva clase
    if (value.trim() !== "") {
      field.classList.add(isValid ? "is-valid" : "is-invalid");
    }

    // Mostrar/ocultar mensaje de error
    let feedback = field.parentNode.querySelector(".invalid-feedback");
    if (!isValid && value.trim() !== "") {
      if (!feedback) {
        feedback = document.createElement("div");
        feedback.className = "invalid-feedback";
        field.parentNode.appendChild(feedback);
      }
      feedback.textContent = errorMessage;
    } else if (feedback) {
      feedback.remove();
    }

    return isValid;
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

  // Mostrar estadísticas de dentistas
  displayStats(stats) {
    const statsContainer = document.getElementById("dentist-stats");
    if (!statsContainer || !stats) return;

    statsContainer.innerHTML = `
      <div class="row">
        <div class="col-md-4">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <h5 class="card-title">Total Dentistas</h5>
              <h2>${stats.total}</h2>
            </div>
          </div>
        </div>
        <div class="col-md-8">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Por Especialidad</h5>
              <div class="row">
                ${Object.entries(stats.bySpecialty)
                  .map(
                    ([specialty, count]) => `
                  <div class="col-6">
                    <small class="text-muted">${this.escapeHtml(
                      specialty
                    )}</small><br>
                    <strong>${count}</strong>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Mostrar resultados de búsqueda
  displaySearchResults(results, searchTerm) {
    this.renderDentistsTable(results);

    if (searchTerm && searchTerm.trim() !== "") {
      const message =
        results.length > 0
          ? `Se encontraron ${results.length} dentista(s) que coinciden con "${searchTerm}"`
          : `No se encontraron dentistas que coincidan con "${searchTerm}"`;

      this.showMessage(message, results.length > 0 ? "info" : "warning", 3000);
    }
  }
}

export default DentistUIManager;
