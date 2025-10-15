// Importar el controlador modular de dentistas
import DentistController from "./modules/index.js";
import logger from "../logger.js";

// Variables globales del controlador
let dentistController;
let isInitialized = false;
let currentDentistId = null;

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", async () => {
  logger.info("✏️ Inicializando controlador de editar dentista modular...");

  try {
    // Obtener ID del dentista
  currentDentistId = getDentistId();
  logger.debug(`🔍 ID del dentista a editar: ${currentDentistId}`);

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

    // Cargar datos del dentista para edición
    if (!currentDentistId) {
      logger.warn("⚠️ No se pudo obtener el ID del dentista");
    }

    logger.info("🎉 Controlador de editar dentista modular listo");
  } catch (error) {
    logger.error(
      "❌ Error al inicializar controlador de editar dentista:",
      error
    );
    showErrorMessage(
      "Error al cargar el formulario de edición. Por favor, recargue la página."
    );
  }
});

// Obtener ID del dentista desde diferentes fuentes
function getDentistId() {
  // Desde variable global
  if (window.dentistId) {
    return window.dentistId;
  }

  // Desde URL
  const pathParts = window.location.pathname.split("/");
  const editIndex = pathParts.indexOf("edit");
  if (editIndex !== -1 && pathParts[editIndex + 1]) {
    return pathParts[editIndex + 1];
  }

  // Desde parámetros de consulta
  const urlParams = new URLSearchParams(window.location.search);
  const idParam = urlParams.get("id");
  if (idParam) {
    return idParam;
  }

  // Desde campo oculto en el formulario
  const idField = document.getElementById("dentist_id");
  if (idField && idField.value) {
    return idField.value;
  }

  logger.warn("⚠️ No se pudo obtener el ID del dentista");
  return null;
}

// Cargar datos del dentista para edición
async function loadDentistForEdit(dentistId) {
  try {
  logger.info(`📋 Cargando dentista ${dentistId} para edición...`);

    showMessage("Cargando datos del dentista...", "info");

    // Usar el formManager para cargar los datos
    const dentist = await dentistController.formManager.loadDentistForEdit(
      dentistId
    );

    showMessage("Datos cargados correctamente", "success", 2000);

  logger.info("✅ Dentista cargado para edición:", dentist);
    return dentist;
  } catch (error) {
  logger.error(`❌ Error al cargar dentista ${dentistId}:`, error);
    showErrorMessage(
      `Error al cargar los datos del dentista: ${error.message}`
    );
    throw error;
  }
}

// Configurar funciones globales para compatibilidad
function setupGlobalFunctions() {
  // Función global para procesar edición
  window.processEditDentist = async function (formData) {
    if (
      dentistController &&
      dentistController.formManager &&
      currentDentistId
    ) {
      const mockEvent = {
        preventDefault: () => {},
        target: document.getElementById("edit_dentist_form") || {
          querySelector: () => ({
            disabled: false,
            innerHTML: "Actualizar Dentista",
          }),
        },
      };
      return dentistController.formManager.handleEditSubmit(mockEvent);
    }
    throw new Error("Sistema de edición no disponible");
  };

  // Función global para cancelar edición
  window.cancelDentistEdit = function () {
    if (
      confirm(
        "¿Está seguro de que desea cancelar la edición? Los cambios no guardados se perderán."
      )
    ) {
      window.location.href = "/dentists";
    }
  };

  // Función global para validar formulario de edición
  window.validateEditForm = function (formId = "edit_dentist_form") {
    if (dentistController && dentistController.validationManager) {
      return dentistController.validationManager.validateForm(formId);
    }
    return { isValid: false, errors: ["Sistema de validación no disponible"] };
  };

  // Función global para recargar datos originales
  window.reloadDentistData = async function () {
    if (currentDentistId && dentistController) {
      const confirmed = confirm(
        "¿Desea recargar los datos originales? Los cambios actuales se perderán."
      );
      if (confirmed) {
        await loadDentistForEdit(currentDentistId);
      }
    }
  };

  // Función global para obtener datos actuales del formulario
  window.getCurrentDentistData = function () {
    const form = document.getElementById("edit_dentist_form");
    if (form) {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      if (dentistController && dentistController.validationManager) {
        const validation =
          dentistController.validationManager.validateDentistData(data);
        return { data, validation };
      }

      return { data, validation: null };
    }
    return null;
  };

  // Función global para comparar cambios
  window.hasUnsavedChanges = function () {
    const form = document.getElementById("edit_dentist_form");
    if (form && window.originalDentistData) {
      const currentData = new FormData(form);
      const current = Object.fromEntries(currentData.entries());

      // Comparar con datos originales
      return (
        JSON.stringify(current) !== JSON.stringify(window.originalDentistData)
      );
    }
    return false;
  };

  logger.info("✅ Funciones globales de edición configuradas");
}

// Configurar advertencia antes de salir si hay cambios no guardados
function setupUnsavedChangesWarning() {
  let hasChanges = false;

  const form = document.getElementById("edit_dentist_form");
  if (form) {
    // Marcar cambios cuando el usuario modifica campos
    const inputs = form.querySelectorAll("input, textarea, select");
    inputs.forEach((input) => {
      input.addEventListener("change", () => {
        hasChanges = true;
      });

      input.addEventListener("input", () => {
        hasChanges = true;
      });
    });

    // Advertir antes de salir de la página
    window.addEventListener("beforeunload", (e) => {
      if (hasChanges) {
        const message =
          "Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?";
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    });

    // Limpiar flag cuando se guarda exitosamente
    form.addEventListener("submit", () => {
      hasChanges = false;
    });
  }
}

// Función para mostrar mensajes
function showMessage(message, type = "info", duration = 5000) {
  if (dentistController && dentistController.uiManager) {
    dentistController.uiManager.showMessage(message, type, duration);
  } else {
    // Fallback manual
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
    }
  }
}

function showErrorMessage(message) {
  showMessage(message, "danger");
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

// Configurar advertencia de cambios no guardados después de la inicialización
setTimeout(() => {
  if (isInitialized) {
    setupUnsavedChangesWarning();
  }
}, 1000);

// Función para debugging
window.debugDentistEditController = function () {
  return {
    isInitialized,
    currentDentistId,
    hasDentistController: !!dentistController,
    dentistState: dentistController
      ? {
          currentPage: dentistController.currentPage,
          isEditPage: dentistController.currentPage === "edit",
        }
      : null,
    formElements: {
      editForm: !!document.getElementById("edit_dentist_form"),
      dentistIdField: !!document.getElementById("dentist_id"),
      submitButton: !!document.querySelector(
        "#edit_dentist_form button[type='submit']"
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
      processEditDentist: typeof window.processEditDentist === "function",
      cancelDentistEdit: typeof window.cancelDentistEdit === "function",
      validateEditForm: typeof window.validateEditForm === "function",
      reloadDentistData: typeof window.reloadDentistData === "function",
      getCurrentDentistData: typeof window.getCurrentDentistData === "function",
      hasUnsavedChanges: typeof window.hasUnsavedChanges === "function",
    },
    dataLoading: {
      dentistIdDetected: !!currentDentistId,
      dentistIdSources: {
        window: !!window.dentistId,
        url: window.location.pathname.includes("/edit/"),
        queryParams: new URLSearchParams(window.location.search).has("id"),
        hiddenField: !!document.getElementById("dentist_id")?.value,
      },
    },
  };
};

// Exportar para uso en módulos
export default dentistController;

logger.debug(
  "✏️ Controlador de editar dentista modular cargado - Depuración: window.debugDentistEditController()"
);
