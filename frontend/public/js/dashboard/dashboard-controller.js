import logger from "../logger.js";
import DashboardAPI from "./dashboard-api.js";
import AppointmentAPI from "../api/appointment-api.js";
import { parseYMDToLocalDate, formatLocalDate } from "../utils/date-utils.js";

// Controlador principal del dashboard
class DashboardController {
  constructor() {
    this.chart = null;
    this.isLoading = false;
    this._controlsAttached = false;
  }

  // Inicializar el dashboard cuando el DOM esté listo
  async init() {
    try {
  logger.debug("Inicializando Dashboard...");

  // Mostrar fecha actual
      this.updateCurrentDate();

  // Cargar datos del dashboard
      await Promise.all([
        this.loadStats(),
        this.loadChart(),
        this.loadUpcomingAppointments(),
      ]);

  // Adjuntar controles (botones) una vez inicializado
      this.attachControls();

  logger.info("Dashboard inicializado correctamente");
    } catch (error) {
      console.error("❌ Error al inicializar dashboard:", error);
      this.showError(
        "Error al cargar el dashboard. Por favor, recargue la página."
      );
    }
  }

  // Actualizar fecha actual
  updateCurrentDate() {
    const now = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const dateString = now.toLocaleDateString("es-ES", options);
    const currentDateElement = document.getElementById("current-date");
    if (currentDateElement) {
      currentDateElement.textContent = dateString;
    }
  }

  // Cargar estadísticas principales
  async loadStats() {
    try {
      const stats = await DashboardAPI.getStats();
      this.renderStatsCards(stats);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      this.showError("Error al cargar las estadísticas");
    }
  }

  // Renderizar tarjetas de estadísticas
  renderStatsCards(stats) {
    const container = document.getElementById("stats-cards");
    const loading = document.getElementById("loading-stats");

    if (loading) loading.style.display = "none";

    const cardsHTML = `
      <div class="col-lg-3 col-md-6 mb-4">
        <div class="card border-0 shadow-sm bg-primary text-white">
          <div class="card-body d-flex align-items-center">
            <div class="flex-grow-1">
              <h4 class="mb-0">${stats.totalAppointments || 0}</h4>
              <p class="mb-0">Total Citas</p>
            </div>
            <div class="ms-3">
              <i class="bi bi-calendar-check fs-1 opacity-75"></i>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-lg-3 col-md-6 mb-4">
        <div class="card border-0 shadow-sm bg-success text-white">
          <div class="card-body d-flex align-items-center">
            <div class="flex-grow-1">
              <h4 class="mb-0">${stats.totalDentists || 0}</h4>
              <p class="mb-0">Dentistas</p>
            </div>
            <div class="ms-3">
              <i class="bi bi-person-badge fs-1 opacity-75"></i>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-lg-3 col-md-6 mb-4">
        <div class="card border-0 shadow-sm bg-info text-white">
          <div class="card-body d-flex align-items-center">
            <div class="flex-grow-1">
              <h4 class="mb-0">${stats.totalPatients || 0}</h4>
              <p class="mb-0">Pacientes</p>
            </div>
            <div class="ms-3">
              <i class="bi bi-people fs-1 opacity-75"></i>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-lg-3 col-md-6 mb-4">
        <div class="card border-0 shadow-sm bg-warning text-white">
          <div class="card-body d-flex align-items-center">
            <div class="flex-grow-1">
              <h4 class="mb-0">${stats.todayAppointments || 0}</h4>
              <p class="mb-0">Citas Hoy</p>
            </div>
            <div class="ms-3">
              <i class="bi bi-calendar-event fs-1 opacity-75"></i>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = cardsHTML;
  }

  // Cargar y renderizar gráfico
  async loadChart() {
    try {
      // Pedir datos sin cache para evitar sobreescrituras por datos antiguos
      const data = await DashboardAPI.getAppointmentsByMonthWithOptions({ cacheBust: true });
      this.renderChart(data);
    } catch (error) {
      console.error("Error al cargar datos del gráfico:", error);
      const el = document.getElementById("loading-chart");
      if (el)
        el.innerHTML = '<p class="text-muted">Error al cargar el gráfico</p>';
    }
  }

  // Renderizar gráfico de Chart.js
  renderChart(data) {
    const loadingChart = document.getElementById("loading-chart");
    const canvas = document.getElementById("appointmentsChart");

    if (loadingChart) loadingChart.style.display = "none";
    if (!canvas) return;

    // Mostrar canvas (se ocultaba y nunca se mostraba)
    canvas.style.display = "block";

    // destruir chart anterior si existe
    if (this.chart) {
      try {
        this.chart.destroy();
      } catch (e) {}
      this.chart = null;
    }

    if (typeof Chart === "undefined") {
      console.error("Chart.js no está cargado");
      canvas.style.display = "none";
      return;
    }

    // Validar forma de datos esperada
    const labels = data && data.months ? data.months : [];
    const values = data && data.appointmentCounts ? data.appointmentCounts : [];

    if (!labels.length || !values.length) {
      // Mostrar mensaje amigable si no hay datos
      canvas.style.display = "none";
      if (loadingChart) {
        loadingChart.innerHTML =
          '<p class="text-muted">No hay datos suficientes para mostrar el gráfico</p>';
        loadingChart.style.display = "block";
      }
      return;
    }

    const ctx = canvas.getContext("2d");

    this.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Citas",
            data: values,
            borderColor: "#0d6efd",
            backgroundColor: "rgba(13, 110, 253, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#0d6efd",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
            grid: { color: "rgba(0,0,0,0.1)" },
          },
          x: { grid: { display: false } },
        },
      },
    });
  }

  // Cargar próximas citas
  async loadUpcomingAppointments() {
    try {
      // Pedir próximas citas sin cache para obtener la versión más reciente
      const data = await DashboardAPI.getUpcomingAppointments({ cacheBust: true });
      this.renderUpcomingAppointments(data);
    } catch (error) {
      console.error("Error al cargar próximas citas:", error);
      const el = document.getElementById("loading-appointments");
      if (el)
        el.innerHTML =
          '<p class="text-muted p-3">Error al cargar las citas</p>';
    }
  }

  // Renderizar lista de próximas citas
  renderUpcomingAppointments(data) {
    const loading = document.getElementById("loading-appointments");
    const container = document.getElementById("upcoming-appointments");

    if (loading) loading.style.display = "none";
    if (container) container.style.display = "block";
    // Aceptar tanto un array directo como un objeto { upcomingAppointments: [...] }
    let appointments = [];
    if (Array.isArray(data)) appointments = data;
    else if (data && Array.isArray(data.upcomingAppointments))
      appointments = data.upcomingAppointments;

  // Guardar para export
    window._lastUpcoming = appointments || [];

    if (!appointments || appointments.length === 0) {
      container.innerHTML = `
        <div class="text-center p-4">
          <i class="bi bi-calendar-x text-muted fs-1 mb-3"></i>
          <p class="text-muted">No hay citas próximas</p>
        </div>
      `;
      return;
    }

    const appointmentsHTML = appointments
      .map((appointment) => {
        const status = appointment.status || appointment.state || 'SCHEDULED';
        const STATUS_LABELS = {
          SCHEDULED: 'Programada',
          IN_PROGRESS: 'En curso',
          COMPLETED: 'Completada',
          CANCELLED: 'Cancelada',
          CANCELED: 'Cancelada',
        };
        const statusLabel = STATUS_LABELS[status] || status;
        const statusClass = {
          SCHEDULED: 'bg-secondary',
          IN_PROGRESS: 'bg-info',
          COMPLETED: 'bg-success',
          CANCELLED: 'bg-danger',
          CANCELED: 'bg-danger',
        }[status] || 'bg-secondary';

        return `
      <div class="d-flex align-items-center p-3 border-bottom appointment-item" data-id="${appointment.id}">
        <div class="flex-grow-1">
          <h6 class="mb-1">${appointment.patientName}</h6>
          <small class="text-muted">Dr/a. ${appointment.dentistName}</small>
          <div class="mt-1">
            <small class="badge bg-light text-dark">
              <i class="bi bi-clock me-1"></i>${appointment.time}
            </small>
              <small class="badge bg-primary ms-1">
              <i class="bi bi-calendar3 me-1"></i>${(() => {
                const ds = appointment.date;
                if (!ds) return "";
                return formatLocalDate(ds);
              })()}
            </small>
            <small class="badge ms-1 ${statusClass} text-white appointment-status">${statusLabel}</small>
          </div>
        </div>
        <div class="ms-2 d-flex align-items-center gap-2">
          <a href="/appointments/edit/${appointment.id}" class="btn btn-sm btn-outline-primary">
            <i class="bi bi-pencil"></i>
          </a>
          <div class="dropdown">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              Estado
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><a class="dropdown-item change-status" href="#" data-status="IN_PROGRESS">Marcar en progreso</a></li>
              <li><a class="dropdown-item change-status" href="#" data-status="COMPLETED">Marcar completada</a></li>
              <li><a class="dropdown-item change-status text-danger" href="#" data-status="CANCELLED">Cancelar</a></li>
            </ul>
          </div>
        </div>
      </div>
    `;
      })
      .join('');

    container.innerHTML = appointmentsHTML;

    // Attach handlers for changing status
    const items = container.querySelectorAll('.appointment-item');
    items.forEach((el) => {
      const id = el.getAttribute('data-id');
      el.querySelectorAll('.change-status').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const status = btn.getAttribute('data-status');
            try {
            btn.classList.add('disabled');

            // Optimistic UI update: cambiar badge inmediatamente
            const STATUS_LABELS = {
              SCHEDULED: 'Programada',
              IN_PROGRESS: 'En curso',
              COMPLETED: 'Completada',
              CANCELLED: 'Cancelada',
              CANCELED: 'Cancelada',
            };
            const STATUS_CLASSES = {
              SCHEDULED: 'bg-secondary',
              IN_PROGRESS: 'bg-info',
              COMPLETED: 'bg-success',
              CANCELLED: 'bg-danger',
              CANCELED: 'bg-danger',
            };

            const itemEl = el;
            const badge = itemEl.querySelector('.appointment-status');
            if (badge) {
              // actualizar texto
              badge.textContent = STATUS_LABELS[status] || status;
              // limpiar clases de color conocidas
              ['bg-secondary', 'bg-info', 'bg-success', 'bg-danger'].forEach((c) => badge.classList.remove(c));
              // añadir la nueva clase
              badge.classList.add(STATUS_CLASSES[status] || 'bg-secondary');
            }

            // Intentar obtener la cita actualizada del servidor y actualizar la cache local
            // Use the authoritative response from the PATCH call to update local cache and UI.
            // DashboardAPI.updateAppointmentStatus ahora devuelve el AppointmentDTO actualizado.
            try {
              const updatedAppointment = await DashboardAPI.updateAppointmentStatus(id, status);
              if (updatedAppointment) {
                if (Array.isArray(window._lastUpcoming)) {
                  const idx = window._lastUpcoming.findIndex((a) => String(a.id) === String(id));
                  if (idx >= 0) {
                    window._lastUpcoming[idx] = { ...window._lastUpcoming[idx], ...updatedAppointment };
                  } else {
                    window._lastUpcoming.unshift(updatedAppointment);
                  }
                } else {
                  window._lastUpcoming = [updatedAppointment];
                }
                // Re-render upcoming appointments from the local cache
                try {
                  this.renderUpcomingAppointments(window._lastUpcoming);
                } catch (e) {
                  console.warn('No se pudo re-renderizar próximas citas localmente:', e);
                }
              }
            } catch (e) {
              console.warn('Error al aplicar la respuesta del servidor tras PATCH:', e);
              // Fallback: update local status field and re-render
              try {
                if (Array.isArray(window._lastUpcoming)) {
                  const idx = window._lastUpcoming.findIndex((a) => String(a.id) === String(id));
                  if (idx >= 0) {
                    window._lastUpcoming[idx] = { ...window._lastUpcoming[idx], status };
                    this.renderUpcomingAppointments(window._lastUpcoming);
                  }
                }
              } catch (ee) {
                console.warn('Error actualizando cache local tras fallback:', ee);
              }
            }

            // refrescar dashboard en background con pequeño delay para sincronizar contadores/ gráfico
            setTimeout(() => {
              this.refreshDashboard().catch((err) => {
                console.warn('refreshDashboard fallo (background):', err);
              });
            }, 2000);
          } catch (err) {
            console.error('Error cambiando estado:', err);
            this.showError('No se pudo cambiar el estado de la cita');
          } finally {
            btn.classList.remove('disabled');
          }
        });
      });
    });
  }

  // Actualizar datos del chart sin recrearlo
  updateChartData(labels = [], values = []) {
    if (!this.chart) {
      this.renderChart({ months: labels, appointmentCounts: values });
      return;
    }
    try {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = values;
      this.chart.update();
    } catch (e) {
      console.warn("updateChartData failed, recreating chart", e);
      this.renderChart({ months: labels, appointmentCounts: values });
    }
  }

  // Exportar CSV de una lista de objetos (static)
  static exportCsv(filename = "data.csv", items = []) {
    if (!items || !items.length) return alert("No hay datos para exportar");
    const keys = Object.keys(items[0]);
    const rows = items.map((it) =>
      keys.map((k) => `"${String(it[k] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [keys.join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Mostrar mensaje de error
  showError(message) {
    const errorElement = document.getElementById("error-message");
    const errorText = document.getElementById("error-text");

    if (errorElement && errorText) {
      errorText.textContent = message;
      errorElement.style.display = "block";
    } else {
      alert(message);
    }
  }

  // Refrescar los datos del dashboard sin reinicializar todo
  async refreshDashboard() {
    if (this.isLoading) return;
    this.isLoading = true;
  logger.debug("Refrescando dashboard...");
    try {
      await this.loadStats();
      // actualizar gráfico
      const byMonth = await DashboardAPI.getAppointmentsByMonth();
      const labels =
        byMonth.months ||
        (byMonth.monthlySeries && byMonth.monthlySeries.map((s) => s.label)) ||
        [];
      const values =
        byMonth.appointmentCounts ||
        (byMonth.monthlySeries && byMonth.monthlySeries.map((s) => s.count)) ||
        [];
      // si chart existe, actualizar, sino renderizar
      if (this.chart) this.updateChartData(labels, values);
      else this.renderChart({ months: labels, appointmentCounts: values });
      await this.loadUpcomingAppointments();
    } catch (err) {
      console.error("Error durante refreshDashboard", err);
      this.showError("No se pudo refrescar el dashboard");
    } finally {
      this.isLoading = false;
    }
  }

  // Compatibilidad: método refresh antiguo llamará a refreshDashboard
  async refresh() {
    return this.refreshDashboard();
  }

  // Adjuntar controles de la vista (botones)
  attachControls() {
    if (this._controlsAttached) return;
    this._controlsAttached = true;

    const btn = document.getElementById("btn-refresh-dashboard");
    if (btn) btn.addEventListener("click", () => this.refreshDashboard());

    const btnXlsx = document.getElementById("btn-export-xlsx");
    if (btnXlsx)
      btnXlsx.addEventListener("click", async () => {
        const items = window._lastUpcoming || [];
        try {
          await this.exportXlsx("upcoming_appointments.xlsx", items);
        } catch (err) {
          console.error("XLSX export failed, falling back to CSV", err);
          DashboardController.exportCsv("upcoming_appointments.csv", items);
        }
      });
  }

  // Cargar script dinámicamente
  static loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Error loading " + src));
      document.head.appendChild(s);
    });
  }

  // Exportar a .xlsx (SheetJS) con id primero y estilo simple
  async exportXlsx(filename = "data.xlsx", items = []) {
    if (!items || !items.length) throw new Error("No hay datos para exportar");
    if (typeof window.XLSX === "undefined") {
      await DashboardController.loadScript(
        "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"
      );
      if (typeof window.XLSX === "undefined")
        throw new Error("No se pudo cargar XLSX");
    }
    // Normalize items: ensure objects and convert dates
    const normalized = items.map((it) => {
      const copy = { ...it };
      for (const k in copy) {
        if (copy[k] instanceof Date) copy[k] = copy[k].toLocaleString();
      }
      return copy;
    });
    const keys = Object.keys(normalized[0] || {});
    const ordered = [];
    if (keys.includes("id")) ordered.push("id");
    keys.forEach((k) => {
      if (k !== "id") ordered.push(k);
    });

    const header = ordered;
    const rows = normalized.map((obj) => ordered.map((k) => obj[k] ?? ""));
    const aoa = [header, ...rows];
    const ws = window.XLSX.utils.aoa_to_sheet(aoa);
    // set column widths
    ws["!cols"] = ordered.map((k) => ({
      wch: Math.max(10, Math.min(30, String(k).length + 8)),
    }));
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Upcoming");
    const wbout = window.XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", async () => {
  const dashboardController = new DashboardController();
  await dashboardController.init();

  // Hacer disponible globalmente para debugging
  window.dashboardController = dashboardController;
});

  logger.info("Dashboard Controller cargado correctamente");
