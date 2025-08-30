// API para manejar las llamadas del dashboard
class DashboardAPI {
  
  /**
   * Obtiene las estadísticas generales del dashboard
   */
  async getStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      handleApiError(error);
      throw error;
    }
  }

  /**
   * Obtiene los datos de citas por mes para el gráfico
   */
  async getAppointmentsByMonth() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/appointments-by-month`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener datos de citas por mes:', error);
      handleApiError(error);
      throw error;
    }
  }

  /**
   * Obtiene las próximas citas
   */
  async getUpcomingAppointments() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/upcoming-appointments`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener próximas citas:', error);
      handleApiError(error);
      throw error;
    }
  }
}

// Instancia global
const dashboardAPI = new DashboardAPI();

console.log("📊 Dashboard API cargada correctamente");
