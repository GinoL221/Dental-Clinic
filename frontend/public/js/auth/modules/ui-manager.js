import logger from "../../logger.js";

class AuthUIManager {
  constructor() {
    /** @type {HTMLElement|null} */
    this.messageContainer = null;
    /** @type {any} */
    this.currentForm = null;
  }

  // Mostrar mensaje al usuario
  /**
   * @param {string} message
   * @param {string} [type]
   * @param {number} [duration]
   * @returns {void}
   */
  showMessage(message, type = "info", duration = 5000) {
    logger.info(`📢 AuthUIManager - Mostrando mensaje: ${message} (${type})`);

    // Limpiar mensajes anteriores
    this.clearMessages();

    // Crear contenedor de mensajes si no existe
    if (!this.messageContainer) {
      this.createMessageContainer();
    }

    // Crear mensaje
    const messageDiv = document.createElement("div");
    messageDiv.className = `alert alert-${type} alert-dismissible fade show auth-message`;
    messageDiv.innerHTML = `
      <i class="fas fa-${this.getMessageIcon(type)} me-2"></i>
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

  // Mostrar mensaje de error
  /**
   * @param {string} message
   * @param {number} [duration]
   * @returns {void}
   */
  showError(message, duration = 8000) {
    this.showMessage(message, "danger", duration);
  }

  // Mostrar mensaje de éxito
  /**
   * @param {string} message
   * @param {number} [duration]
   * @returns {void}
   */
  showSuccess(message, duration = 4000) {
    this.showMessage(message, "success", duration);
  }

  // Mostrar mensaje informativo
  /**
   * @param {string} message
   * @param {number} [duration]
   * @returns {void}
   */
  showInfo(message, duration = 3000) {
    this.showMessage(message, "info", duration);
  }

  // Ocultar mensajes
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
    const existingMessages = document.querySelectorAll(".auth-message");
    existingMessages.forEach((msg) => msg.remove());
  }

  // Crear contenedor de mensajes
  /**
   * @returns {void}
   */
  createMessageContainer() {
    this.messageContainer = document.getElementById("auth-messages");

    if (!this.messageContainer) {
      this.messageContainer = document.createElement("div");
      this.messageContainer.id = "auth-messages";
      this.messageContainer.className = "message-container mb-3";

      // Insertar después del formulario principal
      const form =
        document.querySelector("form") ||
        document.querySelector(".container") ||
        document.body;

      if (form.tagName === "FORM" && form.parentNode) {
        form.parentNode.insertBefore(this.messageContainer, form);
      } else {
        form.insertBefore(this.messageContainer, form.firstChild);
      }
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
    });
    return icons[type] || "info-circle";
  }

  // Configurar estado de carga en botón
  /**
   * @param {any} button
   * @param {boolean} [isLoading]
   * @param {string|null} [originalText]
   * @returns {void}
   */
  setButtonLoading(button, isLoading = true, originalText = null) {
    if (!button) return;

    if (isLoading) {
      // Guardar texto original
      if (!button.dataset.originalText) {
        button.dataset.originalText = originalText || button.innerHTML;
      }

      button.disabled = true;
      button.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Procesando...
      `;
    } else {
      // Restaurar estado original
      button.disabled = false;
      button.innerHTML =
        button.dataset.originalText || originalText || "Enviar";
      delete button.dataset.originalText;
    }
  }

  // Validar campo visualmente
  /**
   * @param {any} field
   * @param {boolean} isValid
   * @param {string} [errorMessage]
   * @returns {void}
   */
  validateField(field, isValid, errorMessage = "") {
    if (!field) return;

    // Limpiar clases anteriores
    field.classList.remove("is-valid", "is-invalid");

    // Aplicar nueva validación
    if (field.value.trim() !== "") {
      field.classList.add(isValid ? "is-valid" : "is-invalid");
    }

    // Mostrar/ocultar mensaje de error
    this.showFieldError(field, isValid ? "" : errorMessage);
  }

  // Mostrar error en campo específico
  /**
   * @param {any} field
   * @param {string} message
   * @returns {void}
   */
  showFieldError(field, message) {
    if (!field || !field.parentNode) return;

    // Remover feedback anterior
    const existingFeedback =
      field.parentNode.querySelector(".invalid-feedback");
    if (existingFeedback) {
      existingFeedback.remove();
    }

    // Agregar nuevo feedback si hay mensaje
    if (message) {
      const feedback = document.createElement("div");
      feedback.className = "invalid-feedback";
      feedback.textContent = message;
      field.parentNode.appendChild(feedback);
    }
  }

  // Limpiar validación de un campo
  /**
   * @param {any} field
   * @returns {void}
   */
  clearFieldValidation(field) {
    if (!field || !field.parentNode) return;

    field.classList.remove("is-valid", "is-invalid");

    const feedback = field.parentNode.querySelector(".invalid-feedback");
    if (feedback) {
      feedback.remove();
    }
  }

  // Limpiar validación de todo el formulario
  /**
   * @param {any} form
   * @returns {void}
   */
  clearFormValidation(form) {
    if (!form) return;

    const fields = form.querySelectorAll(".form-control");
    fields.forEach((/** @type {any} */ field) => {
      this.clearFieldValidation(field);
    });
  }

  // Configurar efectos visuales para el formulario
  /**
   * @param {any} form
   * @returns {void}
   */
  setupVisualEffects(form) {
    if (!form) return;

    // Agregar efecto de enfoque a los campos
    const inputs = form.querySelectorAll(".form-control");
    inputs.forEach((/** @type {any} */ input) => {
      input.addEventListener("focus", () => {
        if (input.parentNode) {
          input.parentNode.classList.add("focused");
        }
      });

      input.addEventListener("blur", () => {
        if (!input.value.trim() && input.parentNode) {
          input.parentNode.classList.remove("focused");
        }
      });

      // Si el campo ya tiene valor, mantener el efecto
      if (input.value.trim() && input.parentNode) {
        input.parentNode.classList.add("focused");
      }
    });

    // Agregar animación de envío
    form.addEventListener("submit", () => {
      form.classList.add("submitting");
    });
  }

  // Redireccionar después del login exitoso
  /**
   * @param {string} userRole
   * @param {string} [defaultUrl]
   * @returns {void}
   */
  redirectAfterLogin(userRole, defaultUrl = "/") {
    logger.info(`🔄 AuthUIManager - Redirigiendo usuario ${userRole}...`);

    // Determinar URL de redirección basada en el rol
    let redirectUrl = defaultUrl;

    switch (userRole) {
      case "ADMIN":
        redirectUrl = "/dentists";
        break;
      case "PATIENT":
        redirectUrl = "/appointments";
        break;
      default:
        redirectUrl = "/";
    }

    // Verificar si hay una URL de retorno guardada
    const returnUrl = sessionStorage.getItem("returnUrl");
    if (returnUrl) {
      redirectUrl = returnUrl;
      sessionStorage.removeItem("returnUrl");
    }

    // Mostrar mensaje de éxito antes de redireccionar
    this.showSuccess(`¡Bienvenido! Redirigiendo...`, 2000);

    // Redireccionar después de un breve delay
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1500);
  }

  // Redireccionar después del registro exitoso
  /**
   * @returns {void}
   */
  redirectAfterRegister() {
    logger.info(`🔄 AuthUIManager - Redirigiendo después del registro...`);

    this.showSuccess("¡Registro exitoso! Redirigiendo al login...", 2000);

    setTimeout(() => {
      window.location.href = "/users/login";
    }, 2000);
  }

  // Configurar validación en tiempo real para formularios de auth
  /**
   * @param {any} form
   * @param {any} validationManager
   * @returns {void}
   */
  setupRealTimeValidation(form, validationManager) {
    if (!form || !validationManager) return;

    const fields = form.querySelectorAll(".form-control");

    fields.forEach((/** @type {any} */ field) => {
      // Validar en blur (cuando pierde el foco)
      field.addEventListener("blur", () => {
        const fieldName = field.name || field.id;
        const value = field.value.trim();

        if (value) {
          const validation = validationManager.validateField(fieldName, value);
          this.validateField(field, validation.isValid, validation.message);
        }
      });

      // Limpiar validación en input para mejor UX
      field.addEventListener("input", () => {
        if (field.classList.contains("is-invalid")) {
          this.clearFieldValidation(field);
        }
      });
    });

    // Validación especial para confirmación de contraseña
    const passwordField = form.querySelector('input[name="password"]');
    const confirmPasswordField = form.querySelector(
      'input[name="confirmPassword"]'
    );

    if (passwordField && confirmPasswordField) {
      const validatePasswordMatch = () => {
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;

        if (confirmPassword) {
          const isMatch = password === confirmPassword;
          this.validateField(
            confirmPasswordField,
            isMatch,
            isMatch ? "" : "Las contraseñas no coinciden"
          );
        }
      };

      passwordField.addEventListener("input", validatePasswordMatch);
      confirmPasswordField.addEventListener("input", validatePasswordMatch);
    }
  }

  // Mostrar indicador de carga global
  /**
   * @param {string} [message]
   * @returns {void}
   */
  showGlobalLoading(message = "Cargando...") {
    // Remover loader anterior si existe
    this.hideGlobalLoading();

    const loader = document.createElement("div");
    loader.id = "auth-global-loader";
    loader.className = "auth-global-loader";
    loader.innerHTML = `
      <div class="d-flex align-items-center justify-content-center">
        <div class="spinner-border text-primary me-3" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <div class="fw-bold">${message}</div>
      </div>
    `;

    // Estilos inline para el loader
    loader.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.9);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    document.body.appendChild(loader);
  }

  hideGlobalLoading() {
    const loader = document.getElementById("auth-global-loader");
    if (loader) {
      loader.remove();
    }
  }
}

export default AuthUIManager;
