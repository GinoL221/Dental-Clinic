import logger from "../../logger.js";

/**
 * Encapsula la lógica de protección de rutas: qué rutas son públicas y
 * qué hacer cuando se intenta acceder a una ruta protegida sin sesión.
 * Extraído de AuthController para separar esta responsabilidad
 * (Chapter 1 SRP audit).
 */
export default class AuthRouteGuard {
  /**
   * @param {any} uiManager
   */
  constructor(uiManager) {
    this.uiManager = uiManager;
  }

  // Verificar si una ruta es pública
  /**
   * @param {string} path
   * @returns {boolean}
   */
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

  // Verificar protección de rutas
  /**
   * @param {string} currentPath
   * @param {boolean} isAuthenticated
   * @returns {boolean}
   */
  checkRouteProtection(currentPath, isAuthenticated) {
    const isPublicRoute = this.isPublicRoute(currentPath);

    // Si no es ruta pública y no está autenticado
    if (!isPublicRoute && !isAuthenticated) {
      logger.warn("Acceso denegado a ruta protegida:", currentPath);

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
}
