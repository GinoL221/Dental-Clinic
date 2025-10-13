// Importar el controlador modular de dentistas
import DentistController from "./modules/index.js";
import logger from "../logger.js";

// Variables globales del controlador
let dentistController;
let isInitialized = false;

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", async () => {
  logger.info("➕ Inicializando controlador de agregar dentista modular...");

  try {
    // Verificar si el DentistController global ya está disponible
    if (window.dentistController) {
      dentistController = window.dentistController;
  logger.info("✅ Usando DentistController global existente");
    } else {
      // Crear instancia local del controlador modular
      dentistController = new DentistController();
      await dentistController.init();

      // Hacer disponible globalmente
      window.dentistController = dentistController;
  logger.info("✅ DentistController modular inicializado");
    }

    isInitialized = true;

    // Configurar funciones globales para compatibilidad
    setupGlobalFunctions();

    // Configurar formulario específico de agregar
    setupAddForm();

  logger.info("🎉 Controlador de agregar dentista modular listo");
  } catch (error) {
    logger.error(
      "❌ Error al inicializar controlador de agregar dentista:",
      error
    );
    showErrorMessage(
      "Error al cargar el formulario de agregar dentista. Por favor, recargue la página."
    );
  }
});

// Configurar funciones globales para compatibilidad
function setupGlobalFunctions() {
  // Función global para procesar agregar
  window.processAddDentist = async function (formData) {
    if (dentistController && dentistController.formManager) {
      const mockEvent = {
        preventDefault: () => {},
        target: document.getElementById("add_new_dentist") || {
          querySelector: () => ({
            disabled: false,
            innerHTML: "Guardar Dentista",
          }),
        },
      };
      return dentistController.formManager.handleAddSubmit(mockEvent);
    }
    throw new Error("Sistema de dentistas no disponible");
  };

  // Función global para validar formulario
  window.validateDentistForm = function (formId = "add_new_dentist") {
    if (dentistController && dentistController.validationManager) {
      return dentistController.validationManager.validateForm(formId);
    }
    return { isValid: false, errors: ["Sistema de validación no disponible"] };
  };

  // Función global para limpiar formulario
  window.clearDentistForm = function (formId = "add_new_dentist") {
    if (dentistController && dentistController.uiManager) {
      dentistController.uiManager.clearForm(formId);
      dentistController.validationManager.clearFormValidation(formId);
    }
  };

  // Función global para previsualizar datos
  window.previewDentistData = function () {
    const form = document.getElementById("add_new_dentist");
    if (form && dentistController) {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      const validation =
        dentistController.validationManager.validateDentistData(data);

      logger.debug("👀 Vista previa de datos del dentista:", {
        data: data,
        validation: validation,
      });

      return { data, validation };
    }
    return null;
  };

  logger.info("✅ Funciones globales de agregar configuradas");
}

// Configurar formulario específico de agregar
function setupAddForm() {
  const addForm = document.getElementById("add_new_dentist");
  if (!addForm) {
    console.warn("⚠️ Formulario add_new_dentist no encontrado");
    return;
  }

  // Configurar validación en tiempo real específica
  if (dentistController && dentistController.validationManager) {
    dentistController.validationManager.setupRealTimeValidation(
      "add_new_dentist"
    );
  }

  // Configurar eventos adicionales
  const submitButton = addForm.querySelector('button[type="submit"]');
  if (submitButton) {
    // Prevenir doble envío
    let isSubmitting = false;

    addForm.addEventListener("submit", async (e) => {
      if (isSubmitting) {
        e.preventDefault();
        return;
      }

      isSubmitting = true;

      // El formManager se encargará del resto
      setTimeout(() => {
        isSubmitting = false;
      }, 2000);
    });
  }

  // Configurar auto-guardado (opcional)
  setupAutoSave(addForm);

  // Configurar ayuda contextual
  setupContextualHelp(addForm);

  logger.info("Formulario de agregar configurado");
}

// Configurar auto-guardado en localStorage
function setupAutoSave(form) {
  if (!form) return;

  const STORAGE_KEY = "dentist_draft_data";

  // Cargar datos guardados al iniciar
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const data = JSON.parse(savedData);
      Object.entries(data).forEach(([key, value]) => {
        const field = form.querySelector(`[name="${key}"]`);
        if (field && value) {
          field.value = value;
        }
      });

      // Mostrar mensaje de recuperación
      if (Object.keys(data).length > 0) {
        showInfoMessage("Se recuperaron datos de una sesión anterior", 5000);
      }
    }
  } catch (error) {
    console.warn("⚠️ Error al cargar datos guardados:", error);
  }

  // Guardar cambios automáticamente
  const saveTimeout = {};
  const inputs = form.querySelectorAll("input, textarea, select");

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      clearTimeout(saveTimeout[input.name]);
      saveTimeout[input.name] = setTimeout(() => {
        saveFormData(form);
      }, 1000); // Guardar después de 1 segundo de inactividad
    });
  });

  // Limpiar datos guardados al enviar exitosamente
  form.addEventListener("submit", () => {
    setTimeout(() => {
      localStorage.removeItem(STORAGE_KEY);
    }, 5000); // Limpiar después de 5 segundos
  });
}

// Guardar datos del formulario
function saveFormData(form) {
  try {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Solo guardar campos con contenido
    const filteredData = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value && value.trim() !== "") {
        filteredData[key] = value;
      }
    });

    if (Object.keys(filteredData).length > 0) {
      localStorage.setItem("dentist_draft_data", JSON.stringify(filteredData));
    }
  } catch (error) {
    console.warn("⚠️ Error al guardar datos:", error);
  }
}

// Configurar ayuda contextual
function setupContextualHelp(form) {
  const helpButtons = form.querySelectorAll("[data-help]");

  helpButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const helpText = button.getAttribute("data-help");
      showHelpMessage(helpText);
    });
  });

  // Agregar tooltips a campos importantes
  const importantFields = {
    licenseNumber: "Número de matrícula profesional. Solo números",
    firstName: "Nombre del dentista. Solo letras y espacios",
    lastName: "Apellido del dentista. Solo letras y espacios",
    email: "Email profesional para comunicaciones",
    phoneNumber: "Teléfono de contacto. Puede incluir código de área",
  };

  Object.entries(importantFields).forEach(([fieldName, helpText]) => {
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (field) {
      field.setAttribute("title", helpText);
      field.setAttribute("data-bs-toggle", "tooltip");
      field.setAttribute("data-bs-placement", "top");
    }
  });

  // Inicializar tooltips de Bootstrap si está disponible
  if (window.bootstrap && window.bootstrap.Tooltip) {
    const tooltips = form.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach((tooltip) => {
      new window.bootstrap.Tooltip(tooltip);
    });
  }
}

// Funciones auxiliares para mensajes
function showErrorMessage(message) {
  showMessage(message, "danger");
}

function showInfoMessage(message, duration = 3000) {
  showMessage(message, "info", duration);
}

function showHelpMessage(message) {
  showMessage(message, "primary", 8000);
}

function showMessage(message, type = "info", duration = 5000) {
  const messageContainer =
    document.getElementById("response") ||
    document.getElementById("message") ||
    document.getElementById("dentist-messages");

  if (messageContainer) {
    messageContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        <i class="bi bi-${getMessageIcon(type)} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
    messageContainer.style.display = "block";

    if (duration > 0) {
      setTimeout(() => {
        const alert = messageContainer.querySelector(".alert");
        if (alert) {
          alert.classList.remove("show");
          setTimeout(() => alert.remove(), 150);
        }
      }, duration);
    }
  } else {
    alert(message);
  }
}

function getMessageIcon(type) {
  const icons = {
    success: "check-circle",
    danger: "exclamation-triangle",
    warning: "exclamation-circle",
    info: "info-circle",
    primary: "info-circle",
  };
  return icons[type] || "info-circle";
}

// Función para debugging
window.debugDentistAddController = function () {
  return {
    isInitialized,
    hasDentistController: !!dentistController,
    dentistState: dentistController
      ? {
          currentPage: dentistController.currentPage,
          isAddPage: dentistController.currentPage === "add",
        }
      : null,
    formElements: {
      addForm: !!document.getElementById("add_new_dentist"),
      submitButton: !!document.querySelector(
        "#add_new_dentist button[type='submit']"
      ),
      responseContainer: !!document.getElementById("response"),
    },
    modulesAvailable: {
      dataManager: !!dentistController?.dataManager,
      uiManager: !!dentistController?.uiManager,
      formManager: !!dentistController?.formManager,
      validationManager: !!dentistController?.validationManager,
    },
    globalFunctions: {
      processAddDentist: typeof window.processAddDentist === "function",
      validateDentistForm: typeof window.validateDentistForm === "function",
      clearDentistForm: typeof window.clearDentistForm === "function",
      previewDentistData: typeof window.previewDentistData === "function",
    },
    autoSave: {
      hasDraftData: !!localStorage.getItem("dentist_draft_data"),
    },
  };
};

// Exportar para uso en módulos
export default dentistController;

logger.debug(
  "➕ Controlador de agregar dentista modular cargado - Debugging: window.debugDentistAddController()"
);
