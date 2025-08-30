// Controlador principal del dashboard
class DashboardController {
  constructor() {
    this.chart = null;
    this.isLoading = false;
  }

  // Inicializar el dashboard cuando el DOM esté listo
  async init() {
    try {
      console.log("📊 Inicializando Dashboard...");
      
      // Mostrar fecha actual
      this.updateCurrentDate();
      
      // Cargar datos del dashboard
      await Promise.all([
        this.loadStats(),
        this.loadChart(),
        this.loadUpcomingAppointments()
      ]);

      console.log("✅ Dashboard inicializado correctamente");
    } catch (error) {
      console.error("❌ Error al inicializar dashboard:", error);
      this.showError("Error al cargar el dashboard. Por favor, recargue la página.");
    }
  }

  // Actualizar fecha actual
  updateCurrentDate() {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const dateString = now.toLocaleDateString('es-ES', options);
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
      currentDateElement.textContent = dateString;
    }
  }

  // Cargar estadísticas principales
  async loadStats() {
    try {
      const stats = await dashboardAPI.getStats();
      this.renderStatsCards(stats);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      this.showError("Error al cargar las estadísticas");
    }
  }

  // Renderizar tarjetas de estadísticas
  renderStatsCards(stats) {
    const container = document.getElementById('stats-cards');
    const loading = document.getElementById('loading-stats');
    
    if (loading) loading.style.display = 'none';

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
      const data = await dashboardAPI.getAppointmentsByMonth();
      this.renderChart(data);
    } catch (error) {
      console.error("Error al cargar datos del gráfico:", error);
      document.getElementById('loading-chart').innerHTML = 
        '<p class="text-muted">Error al cargar el gráfico</p>';
    }
  }

  // Renderizar gráfico de Chart.js
  renderChart(data) {
    const loadingChart = document.getElementById('loading-chart');
    const canvas = document.getElementById('appointmentsChart');
    
    if (loadingChart) loadingChart.style.display = 'none';
    if (canvas) canvas.style.display = 'block';

    const ctx = canvas.getContext('2d');
    
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.months || [],
        datasets: [{
          label: 'Citas',
          data: data.appointmentCounts || [],
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13, 110, 253, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#0d6efd',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            },
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        elements: {
          point: {
            hoverRadius: 8
          }
        }
      }
    });
  }

  // Cargar próximas citas
  async loadUpcomingAppointments() {
    try {
      const data = await dashboardAPI.getUpcomingAppointments();
      this.renderUpcomingAppointments(data);
    } catch (error) {
      console.error("Error al cargar próximas citas:", error);
      document.getElementById('loading-appointments').innerHTML = 
        '<p class="text-muted p-3">Error al cargar las citas</p>';
    }
  }

  // Renderizar lista de próximas citas
  renderUpcomingAppointments(data) {
    const loading = document.getElementById('loading-appointments');
    const container = document.getElementById('upcoming-appointments');
    
    if (loading) loading.style.display = 'none';
    if (container) container.style.display = 'block';

    const appointments = data.upcomingAppointments || [];
    
    if (appointments.length === 0) {
      container.innerHTML = `
        <div class="text-center p-4">
          <i class="bi bi-calendar-x text-muted fs-1 mb-3"></i>
          <p class="text-muted">No hay citas próximas</p>
        </div>
      `;
      return;
    }

    const appointmentsHTML = appointments.map(appointment => `
      <div class="d-flex align-items-center p-3 border-bottom">
        <div class="flex-grow-1">
          <h6 class="mb-1">${appointment.patientName}</h6>
          <small class="text-muted">Dr/a. ${appointment.dentistName}</small>
          <div class="mt-1">
            <small class="badge bg-light text-dark">
              <i class="bi bi-clock me-1"></i>${appointment.time}
            </small>
            <small class="badge bg-primary ms-1">
              <i class="bi bi-calendar3 me-1"></i>${new Date(appointment.date).toLocaleDateString('es-ES')}
            </small>
          </div>
        </div>
        <div class="ms-2">
          <a href="/appointments/edit/${appointment.id}" class="btn btn-sm btn-outline-primary">
            <i class="bi bi-pencil"></i>
          </a>
        </div>
      </div>
    `).join('');

    container.innerHTML = appointmentsHTML;
  }

  // Mostrar mensaje de error
  showError(message) {
    const errorElement = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    if (errorElement && errorText) {
      errorText.textContent = message;
      errorElement.style.display = 'block';
    } else {
      alert(message);
    }
  }

  // Método para refrescar todos los datos
  async refresh() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    console.log("🔄 Refrescando dashboard...");
    
    try {
      await this.init();
    } finally {
      this.isLoading = false;
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  const dashboardController = new DashboardController();
  await dashboardController.init();
  
  // Hacer disponible globalmente para debugging
  window.dashboardController = dashboardController;
});

console.log("📊 Dashboard Controller cargado correctamente");
