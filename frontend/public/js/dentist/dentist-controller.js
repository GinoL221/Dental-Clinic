// Importar el controlador modular de dentistas
import DentistController from "./modules/index.js";

// Variables globales del controlador
let dentistController;
let isInitialized = false;

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🦷 Inicializando controlador de dentistas modular...");

  try {
    // Verificar si el DentistController global ya está disponible
    if (window.dentistController) {
      dentistController = window.dentistController;
      console.log("✅ Usando DentistController global existente");
    } else {
      // Crear instancia local del controlador modular
      dentistController = new DentistController();
      await dentistController.init();

      // Hacer disponible globalmente
      window.dentistController = dentistController;
      console.log("✅ DentistController modular inicializado");
    }

    isInitialized = true;

    // Configurar funciones globales para compatibilidad
    setupGlobalFunctions();

    // Configurar eventos globales
    setupGlobalEvents();

    console.log("🎉 Controlador de dentistas modular listo");
  } catch (error) {
    console.error("❌ Error al inicializar controlador de dentistas:", error);
    showErrorMessage(
      "Error al cargar el sistema de dentistas. Por favor, recargue la página."
    );
  }
});

// Configurar funciones globales para compatibilidad
function setupGlobalFunctions() {
  // Función global para refrescar dentistas
  window.refreshDentists = function () {
    if (dentistController && dentistController.loadList) {
      return dentistController.loadList();
    }
    throw new Error("Sistema de dentistas no disponible");
  };

  // Función global para exportar datos
  window.exportDentistData = function (format = "json") {
    if (dentistController && dentistController.exportDentists) {
      return dentistController.exportDentists(format);
    }
    throw new Error("Sistema de exportación no disponible");
  };

  // Función global para obtener estadísticas
  window.getDentistStats = function () {
    if (dentistController && dentistController.showStats) {
      return dentistController.showStats();
    }
    return null;
  };

  // Función global para agregar dentista
  window.addDentist = async function (dentistData) {
    if (dentistController && dentistController.formManager) {
      return dentistController.formManager.handleAddSubmit({
        preventDefault: () => {},
        target: { querySelector: () => ({ disabled: false, innerHTML: "" }) },
      });
    }
    throw new Error("Sistema de dentistas no disponible");
  };

  // Función global para editar dentista
  window.editDentist = async function (dentistId) {
    if (dentistController && dentistController.editDentist) {
      return dentistController.editDentist(dentistId);
    }
    throw new Error("Sistema de dentistas no disponible");
  };

  // Función global para eliminar dentista
  window.deleteDentist = async function (dentistId) {
    if (dentistController && dentistController.deleteDentist) {
      return dentistController.deleteDentist(dentistId);
    }
    throw new Error("Sistema de dentistas no disponible");
  };

  // Función global para cancelar edición
  window.cancelDentistEdit = function () {
    if (dentistController && dentistController.cancelEdit) {
      return dentistController.cancelEdit();
    }
  };

  // Función global para buscar dentistas
  window.searchDentists = function (query) {
    if (dentistController && dentistController.performSearch) {
      dentistController.searchTerm = query;
      return dentistController.performSearch();
    }
    return [];
  };

  // Función global para validar datos de dentista
  window.validateDentistData = function (data) {
    if (dentistController && dentistController.validationManager) {
      return dentistController.validationManager.validateDentistData(data);
    }
    return { isValid: false, errors: ["Sistema de validación no disponible"] };
  };

  // Función global para obtener dentista por ID
  window.getDentistById = async function (id) {
    if (dentistController && dentistController.dataManager) {
      return dentistController.dataManager.loadDentistById(id);
    }
    throw new Error("Sistema de dentistas no disponible");
  };

  // Función global para obtener todos los dentistas
  window.getAllDentists = function () {
    if (dentistController && dentistController.dataManager) {
      return dentistController.dataManager.getCurrentDentists();
    }
    return [];
  };

  // Funciones de utilidad
  window.clearDentistCache = function () {
    if (dentistController && dentistController.dataManager) {
      dentistController.dataManager.clearCache();
      console.log("🧹 Cache de dentistas limpiado");
    }
  };

  window.resetDentistUI = function () {
    if (dentistController) {
      dentistController.formManager.clearAllForms();
      dentistController.uiManager.clearMessages();
      dentistController.uiManager.toggleUpdateSection(false);
      console.log("🔄 UI de dentistas resetada");
    }
  };

  console.log("✅ Funciones globales configuradas");
}

// Configurar eventos globales
function setupGlobalEvents() {
  // Atajos de teclado
  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + N - Nuevo dentista
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === "n" &&
      !e.target.matches("input, textarea")
    ) {
      e.preventDefault();
      if (window.location.pathname.includes("/dentists")) {
        window.location.href = "/dentists/add";
      }
    }

    // Ctrl/Cmd + F - Buscar
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === "f" &&
      window.location.pathname === "/dentists"
    ) {
      e.preventDefault();
      const searchInput = document.getElementById("searchDentist");
      if (searchInput) {
        searchInput.focus();
      }
    }

    // Escape - Cancelar operaciones
    if (e.key === "Escape") {
      if (
        document.getElementById("div_dentist_updating")?.style.display !==
        "none"
      ) {
        window.cancelDentistEdit();
      }
    }
  });

  // Notificaciones en tiempo real (simulado)
  setupRealtimeNotifications();

  // Eventos de visibilidad de página
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && dentistController) {
      // Revalidar datos cuando la página vuelve a ser visible
      if (dentistController.currentPage === "list") {
        console.log("👁️ Página visible - validando datos");
        // Opcional: refrescar datos si han pasado más de 5 minutos
        const lastUpdate =
          dentistController.dataManager.cache?.get("all-dentists")?.timestamp;
        if (lastUpdate && Date.now() - lastUpdate > 5 * 60 * 1000) {
          console.log("🔄 Refrescando datos por tiempo transcurrido");
          window.refreshDentists();
        }
      }
    }
  });

  // Gestión de errores globales
  window.addEventListener("error", (e) => {
    if (e.error && e.error.message.includes("dentist")) {
      console.error("❌ Error global de dentistas:", e.error);
      showErrorMessage("Error inesperado en el sistema de dentistas");
    }
  });

  console.log("✅ Eventos globales configurados");
}

// Configurar notificaciones en tiempo real (simulado)
function setupRealtimeNotifications() {
  // Simular notificaciones periódicas
  if (window.location.pathname.includes("/dentists")) {
    setInterval(() => {
      // Verificar si hay actualizaciones pendientes
      if (dentistController && dentistController.dataManager) {
        // Simulación de verificación de actualizaciones
        const shouldNotify = Math.random() < 0.1; // 10% de probabilidad cada 30 segundos

        if (shouldNotify && dentistController.dentists?.length > 0) {
          showNotification("Hay actualizaciones disponibles", "info", {
            action: "Actualizar",
            onclick: () => window.refreshDentists(),
          });
        }
      }
    }, 30000); // Cada 30 segundos
  }
}

// Mostrar notificación con acción
function showNotification(message, type = "info", options = {}) {
  const notification = document.createElement("div");
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
            : ""
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

function getNotificationIcon(type) {
  const icons = {
    success: "check-circle",
    danger: "exclamation-triangle",
    warning: "exclamation-circle",
    info: "info-circle",
    primary: "info-circle",
  };
  return icons[type] || "info-circle";
}

// Función para mostrar errores
function showErrorMessage(message) {
  if (dentistController && dentistController.uiManager) {
    dentistController.uiManager.showMessage(message, "danger");
  } else {
    const messageContainer =
      document.getElementById("message") ||
      document.getElementById("dentist-messages") ||
      document.getElementById("response");
    if (messageContainer) {
      messageContainer.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
          <i class="bi bi-exclamation-triangle me-2"></i>
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
      messageContainer.style.display = "block";
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
      refreshDentists: typeof window.refreshDentists === "function",
      exportDentistData: typeof window.exportDentistData === "function",
      getDentistStats: typeof window.getDentistStats === "function",
      addDentist: typeof window.addDentist === "function",
      editDentist: typeof window.editDentist === "function",
      deleteDentist: typeof window.deleteDentist === "function",
      cancelDentistEdit: typeof window.cancelDentistEdit === "function",
      searchDentists: typeof window.searchDentists === "function",
      validateDentistData: typeof window.validateDentistData === "function",
      getDentistById: typeof window.getDentistById === "function",
      getAllDentists: typeof window.getAllDentists === "function",
      clearDentistCache: typeof window.clearDentistCache === "function",
      resetDentistUI: typeof window.resetDentistUI === "function",
    },
    pageFeatures: {
      keyboardShortcuts: true,
      realtimeNotifications: window.location.pathname.includes("/dentists"),
      errorHandling: true,
      cacheManagement: true,
    },
    performance: {
      lastCacheUpdate:
        dentistController?.dataManager?.cache?.get("all-dentists")?.timestamp ||
        null,
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

console.log(
  "🦷 Controlador de dentistas modular cargado - Debugging: window.debugDentistController()"
);
