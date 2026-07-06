// Importar el controlador modular de citas
import AppointmentController, { initAppointmentController } from '../appointment/modules/index.js';
import logger from '../logger.js';

// Variables globales del controlador
/** @type {InstanceType<typeof import("./modules/index.js").default> | undefined} */
let appointmentController;
let isInitialized = false;

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', async () => {
  logger.info('Inicializando controlador de citas modular...');

  try {
    appointmentController = await initAppointmentController();

    isInitialized = true;

    // Configurar funciones globales para compatibilidad
    setupGlobalFunctions();

    logger.info('Controlador de citas modular listo');
  } catch (error) {
    logger.error('Error al inicializar controlador de citas:', error);
    showErrorMessage('Error al cargar el sistema de citas. Por favor, recargue la página.');
  }
});

// Configurar funciones globales para compatibilidad
function setupGlobalFunctions() {
  // Función global para refrescar citas
  window.refreshAppointments = function () {
    if (appointmentController && appointmentController.refreshData) {
      return appointmentController.refreshData();
    }
    throw new Error('Sistema de citas no disponible');
  };

  // Función global para exportar datos
  window.exportAppointmentData = function (format = 'json') {
    if (appointmentController && appointmentController.exportAppointments) {
      const data = appointmentController.exportAppointments(format);

      // Crear y descargar archivo
      const blob = new Blob([data], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appointments.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return data;
    }
    throw new Error('Sistema de exportación no disponible');
  };

  // Función global para obtener estadísticas
  window.getAppointmentStats = function () {
    if (appointmentController && appointmentController.getStats) {
      return appointmentController.getStats();
    }
    return null;
  };

  // Función global para agregar cita
  window.addAppointment = async function (/** @type {any} */ appointmentData) {
    if (appointmentController && appointmentController.processAdd) {
      return appointmentController.processAdd(appointmentData);
    }
    throw new Error('Sistema de citas no disponible');
  };

  // Función global para editar cita
  window.editAppointment = async function (
    /** @type {any} */ appointmentId,
    /** @type {any} */ appointmentData,
  ) {
    if (appointmentController && appointmentController.processEdit) {
      return appointmentController.processEdit(appointmentId, appointmentData);
    }
    throw new Error('Sistema de citas no disponible');
  };

  // Función global para eliminar cita
  window.deleteAppointment = async function (/** @type {any} */ appointmentId) {
    if (appointmentController && appointmentController.processDelete) {
      return appointmentController.processDelete(appointmentId);
    }
    throw new Error('Sistema de citas no disponible');
  };

  logger.info('Funciones globales configuradas');
}

// Función para mostrar errores
/**
 * @param {string} message
 */
function showErrorMessage(message) {
  const messageContainer = document.getElementById('message');
  if (messageContainer) {
    messageContainer.textContent = message;
    messageContainer.className = 'message error';
    messageContainer.style.display = 'block';
  } else {
    alert(message);
  }
}

// Función para debugging
window.debugAppointmentController = function () {
  return {
    isInitialized,
    hasAppointmentController: !!appointmentController,
    appointmentState: appointmentController ? appointmentController.getState() : null,
    modulesAvailable: {
      dataManager: !!appointmentController?.dataManager,
      uiManager: !!appointmentController?.uiManager,
      formManager: !!appointmentController?.formManager,
      validationManager: !!appointmentController?.validationManager,
    },
    globalFunctions: {
      refreshAppointments: typeof window.refreshAppointments === 'function',
      exportAppointmentData: typeof window.exportAppointmentData === 'function',
      getAppointmentStats: typeof window.getAppointmentStats === 'function',
      addAppointment: typeof window.addAppointment === 'function',
      editAppointment: typeof window.editAppointment === 'function',
      deleteAppointment: typeof window.deleteAppointment === 'function',
      confirmDeleteAppointment: typeof window.confirmDeleteAppointment === 'function',
    },
  };
};

// Exportar para uso en módulos
export default appointmentController;

logger.debug(
  'Controlador de citas modular cargado - Debugging: window.debugAppointmentController()',
);
