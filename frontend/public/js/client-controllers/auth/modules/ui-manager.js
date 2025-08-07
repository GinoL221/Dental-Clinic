class AuthUIManager {
  constructor() {
    this.messageContainer = null;
    this.currentForm = null;
  }

  // Mostrar mensaje al usuario
  showMessage(message, type = "info", duration = 5000) {
    console.log(`📢 AuthUIManager - Mostrando mensaje: ${message} (${type})`);

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

  // Mostrar mensaje de error
  showError(message, duration = 8000) {
    this.showMessage(message, "danger", duration);
  }

  // Mostrar mensaje de éxito
  showSuccess(message, duration = 4000) {
    this.showMessage(message, "success", duration);
  }

  // Mostrar mensaje informativo
  showInfo(message, duration = 3000) {
    this.showMessage(message, "info", duration);
  }

  // Ocultar mensajes
  hideMessage() {
    this.clearMessages();
  }

  // Limpiar todos los mensajes
  clearMessages() {
    const existingMessages = document.querySelectorAll(".auth-message");
    existingMessages.forEach((msg) => msg.remove());
  }

  // Crear contenedor de mensajes
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

      if (form.tagName === "FORM") {
        form.parentNode.insertBefore(this.messageContainer, form);
      } else {
        form.insertBefore(this.messageContainer, form.firstChild);
      }
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
    };
    return icons[type] || "info-circle";
  }

  // Configurar estado de carga en botón
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
  showFieldError(field, message) {
    if (!field) return;

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
  clearFieldValidation(field) {
    if (!field) return;

    field.classList.remove("is-valid", "is-invalid");

    const feedback = field.parentNode.querySelector(".invalid-feedback");
    if (feedback) {
      feedback.remove();
    }
  }

  // Limpiar validación de todo el formulario
  clearFormValidation(form) {
    if (!form) return;

    const fields = form.querySelectorAll(".form-control");
    fields.forEach((field) => {
      this.clearFieldValidation(field);
    });
  }

  // Configurar efectos visuales para el formulario
  setupVisualEffects(form) {
    if (!form) return;

    // Agregar efecto de enfoque a los campos
    const inputs = form.querySelectorAll(".form-control");
    inputs.forEach((input) => {
      input.addEventListener("focus", () => {
        input.parentNode.classList.add("focused");
      });

      input.addEventListener("blur", () => {
        if (!input.value.trim()) {
          input.parentNode.classList.remove("focused");
        }
      });

      // Si el campo ya tiene valor, mantener el efecto
      if (input.value.trim()) {
        input.parentNode.classList.add("focused");
      }
    });

    // Agregar animación de envío
    form.addEventListener("submit", () => {
      form.classList.add("submitting");
    });
  }

  // Redireccionar después del login exitoso
  redirectAfterLogin(userRole, defaultUrl = "/") {
    console.log(`🔄 AuthUIManager - Redirigiendo usuario ${userRole}...`);

    // Determinar URL de redirección basada en el rol
    let redirectUrl = defaultUrl;

    switch (userRole) {
      case "ADMIN":
        redirectUrl = "/dentists";
        break;
      case "USER":
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
  redirectAfterRegister() {
    console.log(`🔄 AuthUIManager - Redirigiendo después del registro...`);

    this.showSuccess("¡Registro exitoso! Redirigiendo al login...", 2000);

    setTimeout(() => {
      window.location.href = "/users/login";
    }, 2000);
  }

  // Configurar toggle de contraseña (mostrar/ocultar)
  setupPasswordToggle(passwordField, confirmPasswordField = null) {
    const fields = [passwordField, confirmPasswordField].filter(Boolean);

    fields.forEach((field) => {
      if (!field) return;

      // Crear botón de toggle si no existe
      let toggleBtn = field.parentNode.querySelector(".password-toggle");

      if (!toggleBtn) {
        toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = "btn btn-outline-secondary password-toggle";
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
        toggleBtn.setAttribute("aria-label", "Mostrar contraseña");

        // Insertar después del campo
        field.parentNode.style.position = "relative";
        field.style.paddingRight = "45px";
        toggleBtn.style.position = "absolute";
        toggleBtn.style.right = "5px";
        toggleBtn.style.top = "50%";
        toggleBtn.style.transform = "translateY(-50%)";
        toggleBtn.style.border = "none";
        toggleBtn.style.background = "transparent";
        toggleBtn.style.zIndex = "10";

        field.parentNode.appendChild(toggleBtn);
      }

      // Configurar evento de click
      toggleBtn.addEventListener("click", () => {
        const isPassword = field.type === "password";
        field.type = isPassword ? "text" : "password";

        const icon = toggleBtn.querySelector("i");
        icon.className = isPassword ? "fas fa-eye-slash" : "fas fa-eye";

        toggleBtn.setAttribute(
          "aria-label",
          isPassword ? "Ocultar contraseña" : "Mostrar contraseña"
        );
      });
    });
  }

  // Configurar validación en tiempo real para formularios de auth
  setupRealTimeValidation(form, validationManager) {
    if (!form || !validationManager) return;

    const fields = form.querySelectorAll(".form-control");

    fields.forEach((field) => {
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

  // Ocultar indicador de carga global
  hideGlobalLoading() {
    const loader = document.getElementById("auth-global-loader");
    if (loader) {
      loader.remove();
    }
  }
}

export default AuthUIManager;
