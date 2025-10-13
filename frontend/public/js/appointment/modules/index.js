import AppointmentDataManager from "./data-manager.js";
import AppointmentUIManager from "./ui-manager.js";
import AppointmentFormManager from "./form-manager.js";
import AppointmentValidationManager from "./validation-manager.js";
import logger from "../../logger.js";
import AppointmentAPI from "../../api/appointment-api.js";

/**
 * Controlador principal de citas que coordina todos los módulos especializados
 * Implementa el patrón de separación de responsabilidades:
 * - DataManager: Carga y gestión de datos
 * - UIManager: Operaciones de interfaz y visualización
 * - FormManager: Manejo de formularios y envío de datos
 * - ValidationManager: Validaciones y reglas de negocio
 */
class AppointmentController {
  constructor() {
    // Inicializar todos los managers
    this.dataManager = new AppointmentDataManager();
    this.uiManager = new AppointmentUIManager();
    this.validationManager = new AppointmentValidationManager();
    this.formManager = new AppointmentFormManager(this.uiManager);

    // Estado de la aplicación
    this.state = {
      currentPage: this.getCurrentPage(),
      isAdmin: window.isAdmin || false,
      userData: null,
      dentists: [],
      patients: [], // Renombrado de vuelta a patients (que actúan como usuarios seleccionables)
      appointments: [],
    };

        logger.info("AppointmentController inicializado:", {
          currentPage: this.state.currentPage,
          isAdmin: this.state.isAdmin,
        });
  }

  // Determinar la página actual
  getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes("/appointments/add")) return "add";
    if (path.includes("/appointments/edit")) return "edit";
    if (path.includes("/appointments")) return "list";
    return "unknown";
  }

  // Inicialización principal
  async init() {
    try {
      logger.info("Iniciando AppointmentController...");

      // Cargar datos del usuario actual
      await this.loadUserData();

      // Inicializar según la página
      switch (this.state.currentPage) {
        case "add":
          await this.initAddPage();
          break;
        case "edit":
          await this.initEditPage();
          break;
        case "list":
          await this.initListPage();
          break;
        default:
          logger.warn("Página no reconocida:", this.state.currentPage);
      }
    } catch (error) {
      logger.error("Error al inicializar AppointmentController:", error);
      this.uiManager.showMessage("Error al cargar la aplicación", "danger");
    }
  }

  // Cargar datos del servidor
  async loadServerData() {
    try {
      // Verificar si ya tenemos datos del servidor en window.serverData
      if (window.serverData) {
        logger.info("✅ Usando datos del servidor existentes:", window.serverData);

        // Configurar variables globales del usuario
        window.currentUser = window.serverData.user;
        window.isAdmin = window.serverData.isAdmin;

        // Actualizar estado del controlador
        this.state.isAdmin = window.serverData.isAdmin;

        return window.serverData;
      }

      // Si no hay datos en window.serverData, intentar cargar via API como fallback
      let endpoint = "/appointments/server-data";

      // Si estamos en página de editar, incluir el ID de la cita
      if (this.state.currentPage === "edit") {
        const appointmentId = this.getAppointmentIdFromPage();
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

      // Actualizar estado del controlador
      this.state.isAdmin = serverData.isAdmin;

      logger.info("✅ Datos del servidor cargados via API:", serverData);
      return serverData;
    } catch (error) {
      logger.error("Error al cargar datos del servidor:", error);

      // Intentar usar datos hardcodeados/predeterminados como último fallback
      if (window.isAdmin !== undefined) {
        console.warn("⚠️ Usando datos de sesión como fallback final");
        const fallbackData = {
          user: window.currentUser || {},
          isAdmin: window.isAdmin || false,
          appointmentId: this.getAppointmentIdFromPage() || null,
        };

        window.serverData = fallbackData;
        this.state.isAdmin = fallbackData.isAdmin;

        return fallbackData;
      }

      throw error;
    }
  }

  // Cargar datos del usuario
  async loadUserData() {
    try {
      // Primero cargar datos del servidor
      const serverData = await this.loadServerData();

      // Luego cargar datos específicos del usuario para el sistema de citas
      this.state.userData = await this.dataManager.loadCurrentUserData();
      logger.info("Datos de usuario cargados:", this.state.userData);
    } catch (error) {
      logger.error("Error al cargar datos de usuario:", error);
      throw error;
    }
  }

  // Inicializar página de agregar cita
  async initAddPage() {
  logger.info("Inicializando página de agregar cita...");

    try {
      // Mostrar loading
      this.uiManager.showMessage("Cargando datos...", "info");

      // Cargar datos necesarios en paralelo
      const [dentists, patients] = await Promise.all([
        this.dataManager.loadDentists(),
        this.dataManager.loadPatients(), // Cargar pacientes que actúan como usuarios seleccionables
      ]);

      this.state.dentists = dentists;
      this.state.patients = patients;

      // Configurar la interfaz
      this.uiManager.populateSelects(dentists, patients, this.state.isAdmin);

      // Si no es admin, llenar datos del usuario
      if (!this.state.isAdmin && this.state.userData) {
        this.uiManager.fillUserData(this.state.userData);
      }

      // Configurar validaciones
      this.validationManager.setupRealTimeValidation();

      // Configurar eventos del formulario
      this.formManager.setupDateInput();
      this.formManager.bindAddFormEvents();

      // Ocultar mensaje de loading
      this.uiManager.hideMessage();

      logger.info("Página de agregar cita inicializada correctamente");
    } catch (error) {
      logger.error("Error al inicializar página de agregar:", error);
      this.uiManager.showMessage(
        "Error al cargar los datos necesarios",
        "danger"
      );
    }
  }

  // Inicializar página de editar cita
  async initEditPage() {
  logger.info("Inicializando página de editar cita...");

    try {
      // Obtener ID de la cita desde la URL o elemento oculto
      const appointmentId = this.getAppointmentIdFromPage();
      if (!appointmentId) {
        throw new Error("ID de cita no encontrado");
      }

      logger.debug("📋 ID de cita obtenido:", appointmentId);

      // Cargar datos necesarios
      const [dentists, patients, appointment] = await Promise.all([
        this.dataManager.loadDentists(),
        this.dataManager.loadPatients(), // Cargar pacientes que actúan como usuarios seleccionables
        this.dataManager.loadAppointmentById(appointmentId),
      ]);

      logger.info("✅ Datos cargados:", {
        dentists: dentists.length,
        patients: patients.length,
        appointment: appointment,
      });

      // Log detallado de la cita para debugging
      logger.debug("🔍 Estructura completa de la cita:", JSON.stringify(appointment, null, 2));

      this.state.dentists = dentists;
      this.state.patients = patients;

      // Enriquecer los datos de la cita con información completa del paciente
      const enrichedAppointment = await this.enrichAppointmentData(
        appointment,
        dentists,
        patients
      );

      logger.debug("🔍 Cita enriquecida con datos completos:", enrichedAppointment);

      // Configurar la interfaz
      this.uiManager.populateSelects(
        dentists,
        patients,
        this.state.isAdmin,
        enrichedAppointment.dentistId || enrichedAppointment.dentist_id
      );
      this.uiManager.fillEditForm(enrichedAppointment);

      // Como paso final, asegurar que el dentista esté seleccionado
      setTimeout(() => {
        this.uiManager.setSelectedDentist(
          enrichedAppointment.dentistId || enrichedAppointment.dentist_id
        );
      }, 200);

      // Configurar validaciones
      this.validationManager.setupRealTimeValidation();

      // Configurar eventos del formulario
      this.formManager.bindEditFormEvents();

      // Ocultar mensaje de loading
      this.uiManager.hideMessage();

      logger.info("✅ Página de editar cita inicializada correctamente");
    } catch (error) {
      logger.error("❌ Error al inicializar página de editar:", error);
      this.uiManager.showErrorScreen();
      this.uiManager.showMessage(
        `Error al cargar los datos de la cita: ${error.message}`,
        "danger"
      );
    }
  }

  // Inicializar página de lista de citas
  async initListPage() {
  logger.info("Inicializando página de lista de citas...");

    try {
      // Mostrar loading
      this.uiManager.showMessage("Cargando citas...", "info");

      // Cargar dentistas, pacientes y citas
      const [appointments, dentists, patients] = await Promise.all([
        this.dataManager.loadAppointments(),
        this.dataManager.loadDentists(),
        this.dataManager.loadPatients(), // Cargar pacientes que actúan como usuarios seleccionables
      ]);

      this.state.appointments = appointments;
      this.state.dentists = dentists;
      this.state.patients = patients;

      // Mostrar las citas en la interfaz con todos los datos necesarios
      await this.uiManager.displayAppointments(
        appointments,
        dentists,
        patients
      );

      // Configurar eventos de la lista (editar, eliminar)
      this.bindListEvents();

      // Ocultar mensaje de loading
      this.uiManager.hideMessage();

      logger.info("Página de lista de citas inicializada correctamente");
    } catch (error) {
      logger.error("Error al inicializar página de lista:", error);
      this.uiManager.showMessage("Error al cargar las citas", "danger");
    }
  }

  // Obtener ID de cita desde la página
  getAppointmentIdFromPage() {
    // Intentar obtener desde serverData
    if (window.serverData && window.serverData.appointmentId) {
      const id = parseInt(window.serverData.appointmentId);
      if (!isNaN(id)) {
        logger.debug("ID de cita obtenido desde serverData:", id);
        return id;
      }
    }

    // Intentar obtener desde elemento oculto
    const hiddenInput = document.getElementById("appointmentId");
    if (hiddenInput && hiddenInput.value) {
      const id = parseInt(hiddenInput.value);
      logger.debug("ID de cita obtenido desde input oculto:", id);
      return id;
    }

    // Intentar obtener desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    if (id) {
      const parsedId = parseInt(id);
      logger.debug("ID de cita obtenido desde URL params:", parsedId);
      return parsedId;
    }

    // Intentar obtener desde el pathname
    const pathParts = window.location.pathname.split("/");
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && !isNaN(lastPart)) {
      const parsedId = parseInt(lastPart);
      logger.debug("ID de cita obtenido desde pathname:", parsedId);
      return parsedId;
    }

    console.warn("No se pudo obtener ID de cita desde ninguna fuente");
    return null;
  }

  // Enriquecer datos de cita con información completa del paciente
  async enrichAppointmentData(appointment, dentists, patients) {
    try {
  logger.debug("Enriqueciendo datos de la cita...");

      // Crear copia del appointment original
      const enrichedAppointment = { ...appointment };

      // Obtener datos del paciente por ID desde la lista de pacientes
      if (appointment.patient_id) {
        let patientData = null;

        // Buscar en la lista de pacientes cargados
        if (patients && patients.length > 0) {
          patientData = patients.find((p) => p.id === appointment.patient_id);
        }

        // Si no encontramos en la lista, cargar individualmente
        if (!patientData) {
          try {
            const token = localStorage.getItem("authToken");
            const apiBaseUrl = window.API_BASE_URL || "http://localhost:8080";
            const response = await fetch(
              `${apiBaseUrl}/patients/${appointment.patient_id}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (response.ok) {
              patientData = await response.json();
              logger.info("✅ Datos del paciente cargados:", patientData);
            }
          } catch (error) {
            logger.error("Error al cargar datos del paciente:", error);
          }
        }

        // Agregar datos del paciente al appointment
        if (patientData) {
          enrichedAppointment.patientName =
            patientData.name || patientData.firstName || "";
          enrichedAppointment.patientLastName = patientData.lastName || "";
          enrichedAppointment.patientEmail = patientData.email || "";
          enrichedAppointment.patientId = patientData.id; // ID del paciente
        }
      }

      // Los datos del dentista y cita ya están correctos
      enrichedAppointment.dentistId = appointment.dentist_id;
      enrichedAppointment.appointmentDate = appointment.date;
      enrichedAppointment.appointmentTime = appointment.time;

      return enrichedAppointment;
    } catch (error) {
      logger.error("Error al enriquecer datos de la cita:", error);
      return appointment; // Devolver original si hay error
    }
  }

  // Configurar eventos de la lista de citas
  bindListEvents() {
    // Eventos para botones de editar
    document.querySelectorAll(".btn-edit-appointment").forEach((button) => {
      button.addEventListener("click", (e) => {
        const appointmentId = e.target.dataset.appointmentId;
        if (appointmentId) {
          window.location.href = `/appointments/edit/${appointmentId}`;
        }
      });
    });

    // Eventos para botones de eliminar
    document.querySelectorAll(".btn-delete-appointment").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const appointmentId = e.target.dataset.appointmentId;
        if (
          appointmentId &&
          confirm("¿Está seguro de que desea eliminar esta cita?")
        ) {
          await this.deleteAppointment(appointmentId);
        }
      });
    });
  }

  // Eliminar cita
  async deleteAppointment(appointmentId) {
    try {
      await AppointmentAPI.delete(appointmentId);
      this.uiManager.showMessage("Cita eliminada exitosamente", "success");

      // Recargar la lista
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      logger.error("Error al eliminar cita:", error);
      this.uiManager.showMessage("Error al eliminar la cita", "danger");
    }
  }

  // Método público para refrescar datos
  async refreshData() {
    try {
      switch (this.state.currentPage) {
        case "list":
          const appointments = await this.dataManager.loadAppointments();
          this.state.appointments = appointments;
          this.uiManager.displayAppointments(appointments, this.state.isAdmin);
          break;
        case "add":
        case "edit":
          const [dentists, patients] = await Promise.all([
            this.dataManager.loadDentists(),
            this.dataManager.loadPatients(), // Cargar pacientes que actúan como usuarios seleccionables
          ]);
          this.state.dentists = dentists;
          this.state.patients = patients;
          this.uiManager.populateSelects(
            dentists,
            patients,
            this.state.isAdmin
          );
          break;
      }

      this.uiManager.showMessage("Datos actualizados", "success");
    } catch (error) {
      console.error("Error al refrescar datos:", error);
      this.uiManager.showMessage("Error al actualizar los datos", "danger");
    }
  }

  // Método público para obtener el estado actual
  getState() {
    return { ...this.state };
  }

  // Método público para limpiar validaciones
  clearValidations() {
    this.validationManager.clearValidationStyles();
  }

  // Cargar la lista de citas (con o sin filtros)
  async loadList(filters = {}) {
    const appointments = await this.dataManager.loadAppointments(filters);
    this.state.appointments = appointments;
    await this.uiManager.displayAppointments(
      appointments,
      this.state.dentists,
      this.state.patients
    );
    return appointments;
  }

  // Aplicar filtros a la lista de citas
  async applyFilters(filters = {}) {
    return this.loadList(filters);
  }

  // Limpiar filtros y recargar la lista completa
  async clearFilters() {
    return this.loadList({});
  }
}

// Instancia global del controlador
let appointmentController = null;
let initializationCount = 0;

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", async () => {
  initializationCount++;
  logger.debug(`🚀 AppointmentController - Intento de inicialización #${initializationCount}`);

  try {
    if (appointmentController) {
      logger.warn("⚠️ AppointmentController ya existe, reutilizando instancia");
      return;
    }

    appointmentController = new AppointmentController();
    await appointmentController.init();

    // Hacer disponible globalmente para debugging
    window.appointmentController = appointmentController;

    logger.info("✅ AppointmentController inicializado correctamente");
  } catch (error) {
    logger.error("Error fatal al inicializar la aplicación:", error);
    alert("Error al cargar la aplicación. Por favor, recargue la página.");
  }
});

// Exportar para uso en módulos
export default AppointmentController;
