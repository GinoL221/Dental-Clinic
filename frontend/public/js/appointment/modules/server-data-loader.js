import logger from "../../logger.js";

// Cargar datos del servidor
// Extraído de AppointmentController.loadServerData() — misma cascada de
// fallback en 3 niveles: (a) reusar window.serverData si existe, (b) si no,
// hacer fetch a /appointments/server-data (o /appointments/server-data/{id}
// cuando currentPage === "edit", usando getAppointmentId()), (c) si todo
// falla, recurrir a los globals de sesión window.isAdmin/window.currentUser.
export async function loadServerData({ currentPage, getAppointmentId }) {
  try {
    // Verificar si ya tenemos datos del servidor en window.serverData
    if (window.serverData) {
      logger.info("✅ Usando datos del servidor existentes:", window.serverData);

      // Configurar variables globales del usuario
      window.currentUser = window.serverData.user;
      window.isAdmin = window.serverData.isAdmin;

      return window.serverData;
    }

    // Si no hay datos en window.serverData, intentar cargar via API como fallback
    let endpoint = "/appointments/server-data";

    // Si estamos en página de editar, incluir el ID de la cita
    if (currentPage === "edit") {
      const appointmentId = getAppointmentId();
      if (appointmentId) {
        endpoint += `/${appointmentId}`;
      }
    }

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const serverData = await response.json();

    // Configurar datos globales
    window.serverData = serverData;

    // Configurar variables globales del usuario
    window.currentUser = serverData.user;
    window.isAdmin = serverData.isAdmin;

    logger.info("✅ Datos del servidor cargados via API:", serverData);
    return serverData;
  } catch (error) {
    logger.error("Error al cargar datos del servidor:", error);

    // Intentar usar datos hardcodeados/predeterminados como último fallback
    if (window.isAdmin !== undefined) {
      logger.warn("⚠️ Usando datos de sesión como fallback final");
      const fallbackData = /** @type {any} */ ({
        user: window.currentUser || {},
        isAdmin: window.isAdmin || false,
        appointmentId: getAppointmentId() || null,
      });

      window.serverData = fallbackData;

      return fallbackData;
    }

    throw error;
  }
}
