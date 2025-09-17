import { API_BASE_URL, getAuthHeaders, handleApiError } from "../api/config.js";

// API para manejar las llamadas del dashboard
class DashboardAPI {
  static async getStats() {
    try {
      // Obtener datos de endpoints existentes
      const [appointmentsResponse, patientsResponse, dentistsResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/appointments`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${API_BASE_URL}/patients`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${API_BASE_URL}/dentists`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

      if (
        !appointmentsResponse.ok ||
        !patientsResponse.ok ||
        !dentistsResponse.ok
      ) {
        throw new Error("Error al obtener datos");
      }

      const appointments = await appointmentsResponse.json();
      const patients = await patientsResponse.json();
      const dentists = await dentistsResponse.json();

      // Calcular estadísticas en el frontend
      const today = new Date().toISOString().split("T")[0];
      const appointmentsToday = appointments.content
        ? appointments.content.filter((apt) => apt.date === today).length
        : 0;

      return {
        totalAppointments:
          appointments.totalElements || appointments.length || 0,
        totalPatients: patients.totalElements || patients.length || 0,
        totalDentists: dentists.totalElements || dentists.length || 0,
        appointmentsToday: appointmentsToday,
      };
    } catch (error) {
      handleApiError(error);
      throw new Error(`Error: ${error.message}`);
    }
  }

  /**
   * Obtiene los datos de citas por mes para el gráfico
   */
  static async getAppointmentsByMonth() {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener citas");
      }

      const appointments = await response.json();
      const appointmentsList = appointments.content || appointments;

      // Procesar datos para el gráfico (últimos 6 meses)
      const monthNames = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
      ];
      const monthCounts = new Array(12).fill(0);

      if (Array.isArray(appointmentsList)) {
        appointmentsList.forEach((appointment) => {
          const date = new Date(appointment.date);
          const month = date.getMonth();
          monthCounts[month]++;
        });
      }

      // Devolver últimos 6 meses
      const currentMonth = new Date().getMonth();
      const last6Months = [];
      const last6MonthsData = [];

      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        last6Months.push(monthNames[monthIndex]);
        last6MonthsData.push(monthCounts[monthIndex]);
      }

      return {
        labels: last6Months,
        data: last6MonthsData,
      };
    } catch (error) {
      handleApiError(error);
      // Datos de ejemplo en caso de error
      return {
        labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
        data: [12, 19, 15, 25, 22, 18],
      };
    }
  }

  /**
   * Obtiene las próximas citas
   */
  static async getUpcomingAppointments() {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener citas");
      }

      const appointments = await response.json();
      const appointmentsList = appointments.content || appointments;

      if (Array.isArray(appointmentsList)) {
        const today = new Date();
        const upcomingAppointments = appointmentsList
          .filter((appointment) => {
            const appointmentDate = new Date(appointment.date);
            return (
              appointmentDate >= today && appointment.status === "SCHEDULED"
            );
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 5); // Solo las próximas 5

        return { appointments: upcomingAppointments };
      }

      return { appointments: [] };
    } catch (error) {
      handleApiError(error);
      return { appointments: [] };
    }
  }
}

export default DashboardAPI;
