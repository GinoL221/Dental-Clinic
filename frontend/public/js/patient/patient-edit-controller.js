// Importar el controlador modular de pacientes
import PatientController from "./modules/index.js";

// Variables globales del controlador
let patientController;
let isInitialized = false;
let currentPatientId = null;

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", async () => {
  console.log("✏️ Inicializando controlador de editar paciente modular...");

  try {
    // Obtener ID del paciente
    currentPatientId = getPatientId();
    console.log(`🔍 ID del paciente a editar: ${currentPatientId}`);

    // Verificar si el PatientController global ya está disponible
    if (window.patientController) {
      patientController = window.patientController;
      console.log("✅ Usando PatientController global existente");
    } else {
      // Crear instancia local del controlador modular
      patientController = new PatientController();
      await patientController.init();

      // Hacer disponible globalmente
      window.patientController = patientController;
      console.log("✅ PatientController modular inicializado");
    }

    isInitialized = true;

    // Configurar funciones globales para compatibilidad
    setupGlobalFunctions();

    // Cargar datos del paciente para edición
    if (currentPatientId) {
      await loadPatientForEdit(currentPatientId);
    }

    console.log("🎉 Controlador de editar paciente modular listo");
  } catch (error) {
    console.error(
      "❌ Error al inicializar controlador de editar paciente:",
      error
    );
    showErrorMessage(
      "Error al cargar el formulario de edición. Por favor, recargue la página."
    );
  }
});

// Obtener ID del paciente desde diferentes fuentes
function getPatientId() {
  // Desde variable global
  if (window.patientId) {
    return window.patientId;
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
  const idField = document.getElementById("patient_id");
  if (idField && idField.value) {
    return idField.value;
  }

  console.warn("⚠️ No se pudo obtener el ID del paciente");
  return null;
}

// Cargar datos del paciente para edición
async function loadPatientForEdit(patientId) {
  try {
    console.log(`📋 Cargando paciente ${patientId} para edición...`);

    showMessage("Cargando datos del paciente...", "info");

    // Usar el formManager para cargar los datos
    const patient = await patientController.formManager.loadPatientForEdit(
      patientId
    );

    showMessage("Datos cargados correctamente", "success", 2000);

    console.log("✅ Paciente cargado para edición:", patient);
    return patient;
  } catch (error) {
    console.error(`❌ Error al cargar paciente ${patientId}:`, error);
    showErrorMessage(
      `Error al cargar los datos del paciente: ${error.message}`
    );
    throw error;
  }
}

// Configurar funciones globales para compatibilidad
function setupGlobalFunctions() {
  // Función global para procesar edición
  window.processEditPatient = async function (formData) {
    if (
      patientController &&
      patientController.formManager &&
      currentPatientId
    ) {
      const mockEvent = {
        preventDefault: () => {},
        target: document.getElementById("edit_patient_form") || {
          querySelector: () => ({
            disabled: false,
            innerHTML: "Actualizar Paciente",
          }),
        },
      };
      return patientController.formManager.handleEditSubmit(mockEvent);
    }
    throw new Error("Sistema de edición no disponible");
  };

  // Función global para cancelar edición
  window.cancelPatientEdit = function () {
    if (
      confirm(
        "¿Está seguro de que desea cancelar la edición? Los cambios no guardados se perderán."
      )
    ) {
      window.location.href = "/patients";
    }
  };

  // Función global para validar formulario de edición
  window.validateEditForm = function (formId = "edit_patient_form") {
    if (patientController && patientController.validationManager) {
      return patientController.validationManager.validateForm(formId);
    }
    return { isValid: false, errors: ["Sistema de validación no disponible"] };
  };

  // Función global para recargar datos originales
  window.reloadPatientData = async function () {
    if (currentPatientId && patientController) {
      const confirmed = confirm(
        "¿Desea recargar los datos originales? Los cambios actuales se perderán."
      );
      if (confirmed) {
        await loadPatientForEdit(currentPatientId);
      }
    }
  };

  // Función global para obtener datos actuales del formulario
  window.getCurrentPatientData = function () {
    const form = document.getElementById("edit_patient_form");
    if (form) {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      if (patientController && patientController.validationManager) {
        const validation =
          patientController.validationManager.validatePatientData(data);
        return { data, validation };
      }

      return { data, validation: null };
    }
    return null;
  };

  // Función global para comparar cambios
  window.hasUnsavedChanges = function () {
    // Esta función podría implementarse para detectar cambios no guardados
    const form = document.getElementById("edit_patient_form");
    if (form && window.originalPatientData) {
      const currentData = new FormData(form);
      const current = Object.fromEntries(currentData.entries());

      // Comparar con datos originales
      return (
        JSON.stringify(current) !== JSON.stringify(window.originalPatientData)
      );
    }
    return false;
  };

  console.log("✅ Funciones globales de edición configuradas");
}

// Configurar advertencia antes de salir si hay cambios no guardados
function setupUnsavedChangesWarning() {
  let hasChanges = false;

  const form = document.getElementById("edit_patient_form");
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
  if (patientController && patientController.uiManager) {
    patientController.uiManager.showMessage(message, type, duration);
  } else {
    // Fallback manual
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
window.debugPatientEditController = function () {
  return {
    isInitialized,
    currentPatientId,
    hasPatientController: !!patientController,
    patientState: patientController
      ? {
          currentPage: patientController.currentPage,
          isEditPage: patientController.currentPage === "edit",
        }
      : null,
    formElements: {
      editForm: !!document.getElementById("edit_patient_form"),
      patientIdField: !!document.getElementById("patient_id"),
      submitButton: !!document.querySelector(
        "#edit_patient_form button[type='submit']"
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
      processEditPatient: typeof window.processEditPatient === "function",
      cancelPatientEdit: typeof window.cancelPatientEdit === "function",
      validateEditForm: typeof window.validateEditForm === "function",
      reloadPatientData: typeof window.reloadPatientData === "function",
      getCurrentPatientData: typeof window.getCurrentPatientData === "function",
      hasUnsavedChanges: typeof window.hasUnsavedChanges === "function",
    },
    dataLoading: {
      patientIdDetected: !!currentPatientId,
      patientIdSources: {
        window: !!window.patientId,
        url: window.location.pathname.includes("/edit/"),
        queryParams: new URLSearchParams(window.location.search).has("id"),
        hiddenField: !!document.getElementById("patient_id")?.value,
      },
    },
  };
};

// Exportar para uso en módulos
export default patientController;

console.log(
  "✏️ Controlador de editar paciente modular cargado - Debugging: window.debugPatientEditController()"
);
