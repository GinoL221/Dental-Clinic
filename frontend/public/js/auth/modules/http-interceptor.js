/**
 * Configura los interceptores de fetch para inyectar el token de auth en
 * las peticiones a /auth/ y disparar el flujo de sesión expirada cuando el
 * servidor responde 401. Extraído de AuthController para separar esta
 * responsabilidad (Chapter 1 SRP audit). Función plana: no tiene estado
 * propio, solo coordina callbacks que sí lo tienen (AuthController).
 */
export function setupHttpInterceptors({
  getAuthToken,
  isAuthenticated,
  onUnauthorized,
}) {
  // Interceptar fetch para agregar token automáticamente
  const originalFetch = window.fetch;

  window.fetch = async (url, options = {}) => {
    // Solo agregar token a rutas de API
    const urlStr = typeof url === "string" ? url : (url && "url" in url ? /** @type {any} */ (url).url : String(url));
    if (urlStr.startsWith("/auth/")) {
      const token = getAuthToken();
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    const response = await originalFetch(url, options);

    // Si recibimos 401, la sesión expiró
    if (response.status === 401 && isAuthenticated()) {
      await onUnauthorized();
    }

    return response;
  };
}
