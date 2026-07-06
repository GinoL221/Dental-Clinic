// Importar el controlador modular de dentistas
import { initDentistController } from './modules/index.js';
import logger from '../logger.js';

// Variables globales del controlador
/** @type {InstanceType<typeof import("./modules/index.js").default> | undefined} */
let dentistController;
let isInitialized = false;

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', async () => {
  logger.info('🦷 Inicializando controlador de dentistas modular...');

  try {
    dentistController = await initDentistController();

    isInitialized = true;

    // Configurar funciones globales para compatibilidad
    setupGlobalFunctions();

    // Configurar eventos globales
    setupGlobalEvents();

    logger.info('🎉 Controlador de dentistas modular listo');
  } catch (error) {
    logger.error('❌ Error al inicializar controlador de dentistas:', error);
    showErrorMessage('Error al cargar el sistema de dentistas. Por favor, recargue la página.');
  }
});

// Configurar funciones globales para compatibilidad
// editDentist/deleteDentist/cancelDentistEdit/searchDentists/validateDentistData/getDentistById/getAllDentists/clearDentistCache/resetDentistUI ya los wirea DentistController (modules/index.js)
function setupGlobalFunctions() {
  // Función global para refrescar dentistas
  window.refreshDentists = function () {
    if (dentistController && dentistController.loadList) {
      return dentistController.loadList();
    }
    throw new Error('Sistema de dentistas no disponible');
  };

  // Función global para exportar datos
  window.exportDentistData = function (format = 'json') {
    if (dentistController && dentistController.exportDentists) {
      return dentistController.exportDentists(format);
    }
    throw new Error('Sistema de exportación no disponible');
  };

  // Función global para obtener estadísticas
  window.getDentistStats = function () {
    if (dentistController && dentistController.showStats) {
      return dentistController.showStats();
    }
    return null;
  };

  // Función global para agregar dentista
  window.addDentist = async function (/** @type {any} */ dentistData) {
    if (dentistController && dentistController.formManager) {
      return dentistController.formManager.handleAddSubmit(
        /** @type {any} */ ({
          preventDefault: () => {},
          target: { querySelector: () => ({ disabled: false, innerHTML: '' }) },
        }),
      );
    }
    throw new Error('Sistema de dentistas no disponible');
  };

  logger.info('✅ Funciones globales configuradas');
}

// Configurar eventos globales
function setupGlobalEvents() {
  // Atajos de teclado
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N - Nuevo dentista
    const target = /** @type {Element | null} */ (e.target);
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === 'n' &&
      (!target || !target.matches('input, textarea'))
    ) {
      e.preventDefault();
      if (window.location.pathname.includes('/dentists')) {
        window.location.href = '/dentists/add';
      }
    }

    // Ctrl/Cmd + F - Buscar
    if ((e.ctrlKey || e.metaKey) && e.key === 'f' && window.location.pathname === '/dentists') {
      e.preventDefault();
      const searchInput = document.getElementById('searchDentist');
      if (searchInput) {
        searchInput.focus();
      }
    }

    // Escape - Cancelar operaciones
    if (e.key === 'Escape') {
      if (document.getElementById('div_dentist_updating')?.style.display !== 'none') {
        window.cancelDentistEdit();
      }
    }
  });

  // Notificaciones en tiempo real (simulado)
  setupRealtimeNotifications();

  // Eventos de visibilidad de página
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && dentistController) {
      // Revalidar datos cuando la página vuelve a ser visible
      if (dentistController.currentPage === 'list') {
        logger.info('👁️ Página visible - validando datos');
        // Opcional: refrescar datos si han pasado más de 5 minutos
        const lastUpdate = dentistController.dataManager.cache?.get('all-dentists')?.timestamp;
        if (lastUpdate && Date.now() - lastUpdate > 5 * 60 * 1000) {
          logger.info('🔄 Refrescando datos por tiempo transcurrido');
          window.refreshDentists();
        }
      }
    }
  });

  // Gestión de errores globales
  window.addEventListener('error', (e) => {
    if (e.error && e.error.message.includes('dentist')) {
      logger.error('❌ Error global de dentistas:', e.error);
      showErrorMessage('Error inesperado en el sistema de dentistas');
    }
  });

  logger.info('Eventos globales configurados');
}

// Configurar notificaciones en tiempo real (simulado)
function setupRealtimeNotifications() {
  // Simular notificaciones periódicas
  if (window.location.pathname.includes('/dentists')) {
    setInterval(() => {
      // Verificar si hay actualizaciones pendientes
      if (dentistController && dentistController.dataManager) {
        // Simulación de verificación de actualizaciones
        const shouldNotify = Math.random() < 0.1; // 10% de probabilidad cada 30 segundos

        if (shouldNotify && dentistController.dentists?.length > 0) {
          showNotification('Hay actualizaciones disponibles', 'info', {
            action: 'Actualizar',
            onclick: () => window.refreshDentists(),
          });
        }
      }
    }, 30000); // Cada 30 segundos
  }
}

// Mostrar notificación con acción
/**
 * @param {string} message
 * @param {string} [type]
 * @param {{ action?: string; onclick?: () => void }} [options]
 */
function showNotification(message, type = 'info', options = {}) {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
  notification.style.cssText = `
    top: 20px;
    right: 20px;
    z-index: 1060;
    min-width: 300px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  `;

  notification.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <div>
        <i class="bi bi-${getNotificationIcon(type)} me-2"></i>
        ${message}
      </div>
      <div>
        ${
          options.action
            ? `
          <button type="button" class="btn btn-sm btn-outline-${type} me-2" onclick="this.closest('.alert').remove(); (${options.onclick})();">
            ${options.action}
          </button>
        `
            : ''
        }
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Auto-remover después de 10 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 10000);
}

/**
 * @param {string} type
 */
function getNotificationIcon(type) {
  /** @type {Record<string, string>} */
  const icons = {
    success: 'check-circle',
    danger: 'exclamation-triangle',
    warning: 'exclamation-circle',
    info: 'info-circle',
    primary: 'info-circle',
  };
  return icons[type] || 'info-circle';
}

// Función para mostrar errores
/**
 * @param {string} message
 */
function showErrorMessage(message) {
  if (dentistController && dentistController.uiManager) {
    dentistController.uiManager.showMessage(message, 'danger');
  } else {
    const messageContainer =
      document.getElementById('message') ||
      document.getElementById('dentist-messages') ||
      document.getElementById('response');
    if (messageContainer) {
      messageContainer.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
          <i class="bi bi-exclamation-triangle me-2"></i>
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
      messageContainer.style.display = 'block';
    } else {
      alert(message);
    }
  }
}

// Función para debugging completo
window.debugDentistController = function () {
  return {
    isInitialized,
    hasDentistController: !!dentistController,
    dentistState: dentistController
      ? {
          currentPage: dentistController.currentPage,
          dentistsCount: dentistController.dentists?.length || 0,
          searchTerm: dentistController.searchTerm,
          isInitialized: dentistController.isInitialized,
        }
      : null,
    modulesAvailable: {
      dataManager: !!dentistController?.dataManager,
      uiManager: !!dentistController?.uiManager,
      formManager: !!dentistController?.formManager,
      validationManager: !!dentistController?.validationManager,
    },
    globalFunctions: {
      refreshDentists: typeof window.refreshDentists === 'function',
      exportDentistData: typeof window.exportDentistData === 'function',
      getDentistStats: typeof window.getDentistStats === 'function',
      addDentist: typeof window.addDentist === 'function',
      editDentist: typeof window.editDentist === 'function',
      deleteDentist: typeof window.deleteDentist === 'function',
      cancelDentistEdit: typeof window.cancelDentistEdit === 'function',
      searchDentists: typeof window.searchDentists === 'function',
      validateDentistData: typeof window.validateDentistData === 'function',
      getDentistById: typeof window.getDentistById === 'function',
      getAllDentists: typeof window.getAllDentists === 'function',
      clearDentistCache: typeof window.clearDentistCache === 'function',
      resetDentistUI: typeof window.resetDentistUI === 'function',
    },
    pageFeatures: {
      keyboardShortcuts: true,
      realtimeNotifications: window.location.pathname.includes('/dentists'),
      errorHandling: true,
      cacheManagement: true,
    },
    performance: {
      lastCacheUpdate:
        dentistController?.dataManager?.cache?.get('all-dentists')?.timestamp || null,
      cacheSize: dentistController?.dataManager?.cache?.size || 0,
      memoryUsage: {
        dentists: dentistController?.dentists?.length || 0,
        currentPatient: !!dentistController?.currentDentist,
      },
    },
  };
};

// Exportar para uso en módulos
export default dentistController;

logger.debug(
  '🦷 Controlador de dentistas modular cargado - Depuración: window.debugDentistController()',
);
