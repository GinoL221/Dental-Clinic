// Importar el controlador modular de pacientes
import PatientController from "./modules/index.js";
import logger from "../logger.js";

// Variables globales del controlador
let patientController;
let isInitialized = false;

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", async () => {
  logger.info("Inicializando controlador de agregar paciente modular...");

  try {
    // Verificar si el PatientController global ya está disponible
    if (window.patientController) {
  patientController = window.patientController;
  logger.info("Usando PatientController global existente");
    } else {
      // Crear instancia local del controlador modular
      patientController = new PatientController();
      await patientController.init();

      // Hacer disponible globalmente
  window.patientController = patientController;
  logger.info("PatientController modular inicializado");
    }

    isInitialized = true;

    // Configurar funciones globales para compatibilidad
    setupGlobalFunctions();

    // Configurar formulario específico de agregar
    setupAddForm();
    logger.info("Controlador de agregar paciente modular listo");
  } catch (error) {
    logger.error("Error al inicializar controlador de agregar paciente:", error);
    showErrorMessage(
      "Error al cargar el formulario de agregar paciente. Por favor, recargue la página."
    );
  }
});

// Configurar funciones globales para compatibilidad
function setupGlobalFunctions() {
  // Función global para procesar agregar
  window.processAddPatient = async function (formData) {
    if (patientController && patientController.formManager) {
      const mockEvent = {
        preventDefault: () => {},
        target: document.getElementById("add_new_patient") || {
          querySelector: () => ({
            disabled: false,
            innerHTML: "Guardar Paciente",
          }),
        },
      };
      return patientController.formManager.handleAddSubmit(mockEvent);
    }
    throw new Error("Sistema de pacientes no disponible");
  };

  // Función global para validar formulario
  window.validatePatientForm = function (formId = "add_new_patient") {
    if (patientController && patientController.validationManager) {
      return patientController.validationManager.validateForm(formId);
    }
    return { isValid: false, errors: ["Sistema de validación no disponible"] };
  };

  // Función global para limpiar formulario
  window.clearPatientForm = function (formId = "add_new_patient") {
    if (patientController && patientController.uiManager) {
      patientController.uiManager.clearForm(formId);
      patientController.validationManager.clearFormValidation(formId);
    }
  };

  // Función global para previsualizar datos
  window.previewPatientData = function () {
    const form = document.getElementById("add_new_patient");
    if (form && patientController) {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      const validation =
        patientController.validationManager.validatePatientData(data);

      logger.debug("Vista previa de datos del paciente:", { data, validation });

      return { data, validation };
    }
    return null;
  };

  logger.info("Funciones globales de agregar configuradas");
}

// Configurar formulario específico de agregar
function setupAddForm() {
  const addForm = document.getElementById("add_new_patient");
  if (!addForm) {
    logger.warn("⚠️ Formulario add_new_patient no encontrado");
    return;
  }

  // Configurar validación en tiempo real específica
  if (patientController && patientController.validationManager) {
    patientController.validationManager.setupRealTimeValidation(
      "add_new_patient"
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

  // Si la página se carga recién y el formulario está vacío, eliminar cualquier borrador anterior para evitar repoblar campos tras navegar.
  try {
    const STORAGE_KEY = "patient_draft_data";
    const draft = localStorage.getItem(STORAGE_KEY);
  if (draft) {
      // Si el formulario está vacío (sin valores), podemos eliminar el borrador
      const hasValues = Array.from(addForm.elements).some((el) => {
        if (!el.name) return false;
        const v = el.value;
        return v !== null && v !== undefined && v.toString().trim() !== "";
      });
        if (!hasValues) {
        localStorage.removeItem(STORAGE_KEY);
        logger.info("Borrador detectado y eliminado al cargar la página de agregar paciente");
      }
    }
  } catch (err) {
    logger.warn("⚠️ Error comprobando/limpiando borrador al cargar add patient:", err);
  }

  // Configurar ayuda contextual
  setupContextualHelp(addForm);

  logger.debug("✅ Formulario de agregar configurado");
}

// Configurar auto-guardado en localStorage
function setupAutoSave(form) {
  if (!form) return;

  const STORAGE_KEY = "patient_draft_data";

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
    logger.warn("⚠️ Error al cargar datos guardados:", error);
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
    }, 5000); // Limpiar después de 5 segundos (tiempo para mostrar éxito)
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
      localStorage.setItem("patient_draft_data", JSON.stringify(filteredData));
    }
  } catch (error) {
    logger.warn("⚠️ Error al guardar datos:", error);
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
    cardIdentity:
      "Ingrese solo números, sin puntos ni espacios. Ejemplo: 12345678",
    email: "Asegúrese de ingresar un email válido para futuras comunicaciones",
    phoneNumber: "Puede incluir código de área. Ejemplo: +54911234567",
    dateOfBirth:
      "Formato: DD/MM/AAAA. Esta información ayuda a calcular la edad",
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
    document.getElementById("patient-messages");

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
window.debugPatientAddController = function () {
  return {
    isInitialized,
    hasPatientController: !!patientController,
    patientState: patientController
      ? {
          currentPage: patientController.currentPage,
          isAddPage: patientController.currentPage === "add",
        }
      : null,
    formElements: {
      addForm: !!document.getElementById("add_new_patient"),
      submitButton: !!document.querySelector(
        "#add_new_patient button[type='submit']"
      ),
      responseContainer: !!document.getElementById("response"),
    },
    modulesAvailable: {
      dataManager: !!patientController?.dataManager,
      uiManager: !!patientController?.uiManager,
      formManager: !!patientController?.formManager,
      validationManager: !!patientController?.validationManager,
    },
    globalFunctions: {
      processAddPatient: typeof window.processAddPatient === "function",
      validatePatientForm: typeof window.validatePatientForm === "function",
      clearPatientForm: typeof window.clearPatientForm === "function",
      previewPatientData: typeof window.previewPatientData === "function",
    },
    autoSave: {
      hasDraftData: !!localStorage.getItem("patient_draft_data"),
    },
  };
};

// Exportar para uso en módulos
export default patientController;

logger.debug(
  "Controlador de agregar paciente modular cargado - Depuración: window.debugPatientAddController()"
);
