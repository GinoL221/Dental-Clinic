// Importar el controlador modular de citas
import AppointmentController from "./modules/index.js";

// Variables globales del controlador
let appointmentController;
let isInitialized = false;

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🏥 Inicializando controlador de citas modular...");

  try {
    // Verificar si el AppointmentController global ya está disponible
    if (window.appointmentController) {
      appointmentController = window.appointmentController;
      console.log("✅ Usando AppointmentController global existente");
    } else {
      // Crear instancia local del controlador modular
      appointmentController = new AppointmentController();
      await appointmentController.init();

      // Hacer disponible globalmente
      window.appointmentController = appointmentController;
      console.log("✅ AppointmentController modular inicializado");
    }

    isInitialized = true;

    // Configurar funciones globales para compatibilidad
    setupGlobalFunctions();

    console.log("🎉 Controlador de citas modular listo");
  } catch (error) {
    console.error("❌ Error al inicializar controlador de citas:", error);
    showErrorMessage(
      "Error al cargar el sistema de citas. Por favor, recargue la página."
    );
  }
});

// Configurar funciones globales para compatibilidad
function setupGlobalFunctions() {
  // Función global para refrescar citas
  window.refreshAppointments = function () {
    if (appointmentController && appointmentController.refreshData) {
      return appointmentController.refreshData();
    }
    throw new Error("Sistema de citas no disponible");
  };

  // Función global para exportar datos
  window.exportAppointmentData = function (format = "json") {
    if (appointmentController && appointmentController.exportAppointments) {
      const data = appointmentController.exportAppointments(format);

      // Crear y descargar archivo
      const blob = new Blob([data], {
        type: format === "csv" ? "text/csv" : "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `appointments.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return data;
    }
    throw new Error("Sistema de exportación no disponible");
  };

  // Función global para obtener estadísticas
  window.getAppointmentStats = function () {
    if (appointmentController && appointmentController.getStats) {
      return appointmentController.getStats();
    }
    return null;
  };

  // Función global para agregar cita
  window.addAppointment = async function (appointmentData) {
    if (appointmentController && appointmentController.processAdd) {
      return appointmentController.processAdd(appointmentData);
    }
    throw new Error("Sistema de citas no disponible");
  };

  // Función global para editar cita
  window.editAppointment = async function (appointmentId, appointmentData) {
    if (appointmentController && appointmentController.processEdit) {
      return appointmentController.processEdit(appointmentId, appointmentData);
    }
    throw new Error("Sistema de citas no disponible");
  };

  // Función global para eliminar cita
  window.deleteAppointment = async function (appointmentId) {
    if (appointmentController && appointmentController.processDelete) {
      return appointmentController.processDelete(appointmentId);
    }
    throw new Error("Sistema de citas no disponible");
  };

  // Función global para confirmar eliminación
  window.confirmDeleteAppointment = function (appointmentId, patientName) {
    if (appointmentController && appointmentController.confirmDelete) {
      return appointmentController.confirmDelete(appointmentId, patientName);
    }
    // Fallback básico
    if (
      confirm(`¿Está seguro de que desea eliminar la cita de ${patientName}?`)
    ) {
      return window.deleteAppointment(appointmentId);
    }
    return Promise.resolve(false);
  };

  console.log("✅ Funciones globales configuradas");
}

// Función para mostrar errores
function showErrorMessage(message) {
  const messageContainer = document.getElementById("message");
  if (messageContainer) {
    messageContainer.textContent = message;
    messageContainer.className = "message error";
    messageContainer.style.display = "block";
  } else {
    alert(message);
  }
}

// Función para debugging
window.debugAppointmentController = function () {
  return {
    isInitialized,
    hasAppointmentController: !!appointmentController,
    appointmentState: appointmentController
      ? appointmentController.getState()
      : null,
    modulesAvailable: {
      dataManager: !!appointmentController?.dataManager,
      uiManager: !!appointmentController?.uiManager,
      formManager: !!appointmentController?.formManager,
      validationManager: !!appointmentController?.validationManager,
    },
    globalFunctions: {
      refreshAppointments: typeof window.refreshAppointments === "function",
      exportAppointmentData: typeof window.exportAppointmentData === "function",
      getAppointmentStats: typeof window.getAppointmentStats === "function",
      addAppointment: typeof window.addAppointment === "function",
      editAppointment: typeof window.editAppointment === "function",
      deleteAppointment: typeof window.deleteAppointment === "function",
      confirmDeleteAppointment:
        typeof window.confirmDeleteAppointment === "function",
    },
  };
};

// Exportar para uso en módulos
export default appointmentController;

console.log(
  "📋 Controlador de citas modular cargado - Debugging: window.debugAppointmentController()"
);
