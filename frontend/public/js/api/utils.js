const UIUtils = {
  // Mostrar mensaje de éxito
  /**
   * @param {string} message
   * @returns {void}
   */
  showSuccess(message) {
    // Crear un elemento de alerta de éxito
    const alertDiv = document.createElement("div");
    alertDiv.className = "alert alert-success alert-dismissible fade show";
    alertDiv.innerHTML = `
            <strong>¡Éxito!</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

    // Insertar al principio del contenido principal
    const mainContent = document.querySelector(".main-content .container");
    if (mainContent) {
      mainContent.insertBefore(alertDiv, mainContent.firstChild);
    }

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 5000);
  },

  // Mostrar mensaje de error
  /**
   * @param {string} message
   * @returns {void}
   */
  showError(message) {
    // Crear un elemento de alerta de error
    const alertDiv = document.createElement("div");
    alertDiv.className = "alert alert-danger alert-dismissible fade show";
    alertDiv.innerHTML = `
            <strong>Error:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

    // Insertar al principio del contenido principal
    const mainContent = document.querySelector(".main-content .container");
    if (mainContent) {
      mainContent.insertBefore(alertDiv, mainContent.firstChild);
    }

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 5000);
  },

  // Mostrar mensaje de información
  /**
   * @param {string} message
   * @returns {void}
   */
  showInfo(message) {
    const alertDiv = document.createElement("div");
    alertDiv.className = "alert alert-info alert-dismissible fade show";
    alertDiv.innerHTML = `
            <strong>Información:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

    const mainContent = document.querySelector(".main-content .container");
    if (mainContent) {
      mainContent.insertBefore(alertDiv, mainContent.firstChild);
    }

    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 5000);
  },

  // Limpiar formulario
  /**
   * @param {string} formId
   * @returns {void}
   */
  clearForm(formId) {
    const form = /** @type {HTMLFormElement | null} */ (document.getElementById(formId));
    if (form) {
      form.reset();
      // Remover clases de validación
      form.querySelectorAll(".is-invalid, .is-valid").forEach((element) => {
        element.classList.remove("is-invalid", "is-valid");
      });
    }
  },

  // Deshabilitar botón con loading
  /**
   * @param {HTMLButtonElement} button
   * @param {boolean} [loading]
   * @param {string} [originalText]
   * @returns {void}
   */
  setButtonLoading(button, loading = true, originalText = "Enviar") {
    if (loading) {
      button.disabled = true;
      button.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Procesando...
            `;
    } else {
      button.disabled = false;
      button.innerHTML = originalText;
    }
  },
};

// Exportar para uso en otros archivos (Jest/Node CJS) y navegador (ESM)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { UIUtils };
}

export default UIUtils;
