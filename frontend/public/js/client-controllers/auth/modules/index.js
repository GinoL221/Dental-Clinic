import AuthDataManager from "./data-manager.js";
import AuthUIManager from "./ui-manager.js";
import AuthFormManager from "./form-manager.js";
import AuthValidationManager from "./validation-manager.js";

/**
 * Controlador principal de autenticación que coordina todos los módulos especializados
 * Implementa el patrón de separación de responsabilidades:
 * - DataManager: Procesamiento de login/registro y gestión de sesión
 * - UIManager: Operaciones de interfaz y visualización
 * - FormManager: Manejo de formularios y eventos
 * - ValidationManager: Validaciones y reglas de negocio
 */
class AuthController {
  constructor() {
    // Inicializar todos los managers
    this.dataManager = new AuthDataManager();
    this.uiManager = new AuthUIManager();
    this.validationManager = new AuthValidationManager();
    this.formManager = new AuthFormManager(this.dataManager, this.uiManager);

    // Estado de la aplicación
    this.state = {
      currentPage: this.getCurrentPage(),
      isAuthenticated: false,
      currentUser: null,
      sessionActive: false,
    };

    console.log("AuthController inicializado:", {
      currentPage: this.state.currentPage,
    });
  }

  // Determinar la página actual
  getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes("/users/login")) return "login";
    if (path.includes("/users/register")) return "register";
    if (path.includes("/users/logout")) return "logout";
    return "unknown";
  }

  // Inicialización principal
  async init() {
    try {
      console.log("Iniciando AuthController...");

      // Verificar estado de sesión
      await this.checkAuthenticationState();

      // Inicializar según la página
      switch (this.state.currentPage) {
        case "login":
          await this.initLoginPage();
          break;
        case "register":
          await this.initRegisterPage();
          break;
        case "logout":
          await this.initLogoutPage();
          break;
        default:
          console.warn("Página no reconocida:", this.state.currentPage);
          // Para páginas que no son de auth, verificar autenticación
          await this.checkRouteProtection();
      }
    } catch (error) {
      console.error("Error al inicializar AuthController:", error);
      this.uiManager.showError(
        "Error al cargar la aplicación de autenticación"
      );
    }
  }

  // Verificar estado de autenticación
  async checkAuthenticationState() {
    try {
      this.state.sessionActive = this.dataManager.hasActiveSession();

      if (this.state.sessionActive) {
        this.state.currentUser = this.dataManager.getCurrentUserData();
        this.state.isAuthenticated = true;

        console.log("Estado de autenticación:", {
          isAuthenticated: this.state.isAuthenticated,
          user: this.state.currentUser?.email,
          role: this.state.currentUser?.role,
        });
      }
    } catch (error) {
      console.error("Error al verificar estado de autenticación:", error);
      this.state.isAuthenticated = false;
      this.state.sessionActive = false;
    }
  }

  // Inicializar página de login
  async initLoginPage() {
    console.log("Inicializando página de login...");

    try {
      // Si ya está autenticado, redireccionar
      if (this.state.isAuthenticated) {
        console.log("Usuario ya autenticado, redirigiendo...");
        const defaultUrl = this.state.currentUser.isAdmin
          ? "/dentists"
          : "/appointments";
        window.location.href = defaultUrl;
        return;
      }

      // Configurar validaciones en tiempo real
      this.validationManager.setupRealTimeValidation("loginForm");

      // Configurar validación con UIManager
      const loginForm = document.getElementById("loginForm");
      if (loginForm) {
        this.uiManager.setupRealTimeValidation(
          loginForm,
          this.validationManager
        );
      }

      // Configurar eventos del formulario
      this.formManager.bindLoginFormEvents();

      console.log("Página de login inicializada correctamente");
    } catch (error) {
      console.error("Error al inicializar página de login:", error);
      this.uiManager.showError("Error al cargar el formulario de login");
    }
  }

  // Inicializar página de registro
  async initRegisterPage() {
    console.log("Inicializando página de registro...");

    try {
      // Si ya está autenticado, redireccionar
      if (this.state.isAuthenticated) {
        console.log("Usuario ya autenticado, redirigiendo...");
        const defaultUrl = this.state.currentUser.isAdmin
          ? "/dentists"
          : "/appointments";
        window.location.href = defaultUrl;
        return;
      }

      // Configurar validaciones en tiempo real
      this.validationManager.setupRealTimeValidation("registerForm");

      // Configurar validación con UIManager
      const registerForm = document.getElementById("registerForm");
      if (registerForm) {
        this.uiManager.setupRealTimeValidation(
          registerForm,
          this.validationManager
        );
      }

      // Configurar eventos del formulario
      this.formManager.bindRegisterFormEvents();

      console.log("Página de registro inicializada correctamente");
    } catch (error) {
      console.error("Error al inicializar página de registro:", error);
      this.uiManager.showError("Error al cargar el formulario de registro");
    }
  }

  // Inicializar página de logout
  async initLogoutPage() {
    console.log("Inicializando proceso de logout...");

    try {
      // Mostrar loading
      this.uiManager.showGlobalLoading("Cerrando sesión...");

      // Procesar logout
      await this.formManager.handleLogout();
    } catch (error) {
      console.error("Error al procesar logout:", error);
      this.uiManager.hideGlobalLoading();
      this.uiManager.showError("Error al cerrar sesión");
    }
  }

  // Verificar protección de rutas
  async checkRouteProtection() {
    const currentPath = window.location.pathname;
    const isPublicRoute = this.isPublicRoute(currentPath);

    // Si no es ruta pública y no está autenticado
    if (!isPublicRoute && !this.state.isAuthenticated) {
      console.log("🔒 Acceso denegado a ruta protegida:", currentPath);

      // Guardar URL de retorno
      sessionStorage.setItem("returnUrl", currentPath);

      // Redireccionar a login
      this.uiManager.showInfo("Debe iniciar sesión para acceder a esta página");
      setTimeout(() => {
        window.location.href = "/users/login";
      }, 2000);

      return false;
    }

    return true;
  }

  // Verificar si una ruta es pública
  isPublicRoute(path) {
    const publicRoutes = [
      "/",
      "/users/login",
      "/users/register",
      "/users/logout",
      "/public",
    ];

    return publicRoutes.some(
      (route) => path === route || path.startsWith(route + "/")
    );
  }

  // Procesar login (llamada externa)
  async processLogin(credentials) {
    try {
      console.log("🔐 AuthController - Procesando login...");

      const result = await this.dataManager.processLogin(credentials);

      // Actualizar estado
      await this.checkAuthenticationState();

      return result;
    } catch (error) {
      console.error("Error en AuthController.processLogin:", error);
      throw error;
    }
  }

  // Procesar registro (llamada externa)
  async processRegister(userData) {
    try {
      console.log("📝 AuthController - Procesando registro...");

      const result = await this.dataManager.processRegister(userData);

      return result;
    } catch (error) {
      console.error("Error en AuthController.processRegister:", error);
      throw error;
    }
  }

  // Procesar logout (llamada externa)
  async processLogout() {
    try {
      console.log("🚪 AuthController - Procesando logout...");

      await this.dataManager.logout();

      // Actualizar estado
      this.state.isAuthenticated = false;
      this.state.currentUser = null;
      this.state.sessionActive = false;

      return true;
    } catch (error) {
      console.error("Error en AuthController.processLogout:", error);
      throw error;
    }
  }

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    return this.state.isAuthenticated;
  }

  // Obtener datos del usuario actual
  getCurrentUser() {
    return this.state.currentUser;
  }

  // Verificar si el usuario es admin
  isAdmin() {
    return this.state.currentUser?.isAdmin || false;
  }

  // Obtener token de autenticación
  getAuthToken() {
    return this.dataManager.getAuthToken();
  }

  // Refrescar estado de autenticación
  async refreshAuthState() {
    try {
      console.log("🔄 Refrescando estado de autenticación...");

      await this.checkAuthenticationState();

      if (this.state.isAuthenticated) {
        // Validar sesión con el servidor
        const isValid = await this.dataManager.validateSession();
        if (!isValid) {
          await this.processLogout();
          this.uiManager.showError("Su sesión ha expirado");
          return false;
        }
      }

      return this.state.isAuthenticated;
    } catch (error) {
      console.error("Error al refrescar estado de autenticación:", error);
      return false;
    }
  }

  // Configurar protección automática de rutas
  setupAutomaticRouteProtection() {
    // Verificar autenticación al cambiar de página
    window.addEventListener("beforeunload", () => {
      this.checkRouteProtection();
    });

    // Verificar periódicamente la validez de la sesión
    setInterval(async () => {
      if (this.state.isAuthenticated) {
        const isValid = await this.dataManager.validateSession();
        if (!isValid) {
          await this.processLogout();
          this.uiManager.showError("Su sesión ha expirado");
          window.location.href = "/users/login";
        }
      }
    }, 5 * 60 * 1000); // Cada 5 minutos
  }

  // Método público para obtener el estado actual
  getState() {
    return { ...this.state };
  }

  // Método público para limpiar validaciones
  clearValidations() {
    const forms = ["loginForm", "registerForm"];
    forms.forEach((formId) => {
      const form = document.getElementById(formId);
      if (form) {
        this.validationManager.clearAllValidation(form);
      }
    });
  }

  // Configurar interceptores para peticiones HTTP
  setupHttpInterceptors() {
    // Interceptar fetch para agregar token automáticamente
    const originalFetch = window.fetch;

    window.fetch = async (url, options = {}) => {
      // Solo agregar token a rutas de API
      if (url.startsWith("/api/") || url.startsWith("/auth/")) {
        const token = this.getAuthToken();
        if (token) {
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${token}`,
          };
        }
      }

      const response = await originalFetch(url, options);

      // Si recibimos 401, la sesión expiró
      if (response.status === 401 && this.state.isAuthenticated) {
        await this.processLogout();
        this.uiManager.showError("Su sesión ha expirado");
        window.location.href = "/users/login";
      }

      return response;
    };
  }

  // Obtener configuración de seguridad
  getSecurityConfig() {
    return {
      sessionTimeout: 30 * 60 * 1000, // 30 minutos
      tokenRefreshInterval: 15 * 60 * 1000, // 15 minutos
      maxLoginAttempts: 5,
      passwordMinLength: 6,
      requireStrongPassword: false,
    };
  }
}

// Instancia global del controlador
let authController = null;

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", async () => {
  try {
    authController = new AuthController();
    await authController.init();

    // Hacer disponible globalmente para debugging y funciones externas
    window.authController = authController;

    // Configurar protección automática
    authController.setupAutomaticRouteProtection();

    // Configurar interceptores HTTP
    authController.setupHttpInterceptors();
  } catch (error) {
    console.error(
      "Error fatal al inicializar la aplicación de autenticación:",
      error
    );
    alert("Error al cargar la aplicación. Por favor, recargue la página.");
  }
});

// Funciones globales para compatibilidad con sistema anterior
window.login = async function (credentials) {
  if (window.authController) {
    return window.authController.processLogin(credentials);
  }
  console.error("AuthController no disponible");
  throw new Error("Sistema de autenticación no disponible");
};

window.register = async function (userData) {
  if (window.authController) {
    return window.authController.processRegister(userData);
  }
  console.error("AuthController no disponible");
  throw new Error("Sistema de registro no disponible");
};

window.logout = async function () {
  if (window.authController) {
    return window.authController.processLogout();
  }
  console.error("AuthController no disponible");
  throw new Error("Sistema de logout no disponible");
};

window.isAuthenticated = function () {
  if (window.authController) {
    return window.authController.isAuthenticated();
  }
  return false;
};

window.getCurrentUser = function () {
  if (window.authController) {
    return window.authController.getCurrentUser();
  }
  return null;
};

window.isAdmin = function () {
  if (window.authController) {
    return window.authController.isAdmin();
  }
  return false;
};

// Funciones auxiliares globales
window.refreshAuthState = function () {
  if (window.authController) {
    return window.authController.refreshAuthState();
  }
  console.warn("AuthController no disponible para refrescar estado");
  return Promise.resolve(false);
};

window.getAuthState = function () {
  if (window.authController) {
    return window.authController.getState();
  }
  console.warn("AuthController no disponible para obtener estado");
  return null;
};

// Exportar para uso en módulos
export default AuthController;
