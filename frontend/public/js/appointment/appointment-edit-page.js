/**
 * Configuración específica para la página de edición de citas
 * Establece variables globales y configuraciones iniciales
 */

// Función para inicializar la página de edición
import logger from "../../logger.js";

function initEditPage() {
  // Establecer el ID de la cita en el input oculto inmediatamente
  document.addEventListener('DOMContentLoaded', function() {
    const appointmentIdInput = document.getElementById('appointmentId');
    if (appointmentIdInput && window.serverData && window.serverData.appointmentId) {
      appointmentIdInput.value = window.serverData.appointmentId;
      logger.info('ID de cita establecido en input oculto:', window.serverData.appointmentId);
    }
  });
}

// Inicializar cuando el script se carga
initEditPage();
