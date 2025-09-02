class AppointmentDataManager {
  constructor() {
    this.dentists = [];
    this.patients = [];
    this.appointments = [];
  }

  // Verificar que las APIs estén disponibles
  ensureAPIsLoaded() {
    if (typeof DentistAPI === "undefined") {
      throw new Error("DentistAPI no está disponible");
    }
    if (typeof AppointmentAPI === "undefined") {
      throw new Error("AppointmentAPI no está disponible");
    }
  }

  // Cargar dentistas
  async loadDentists() {
    try {
      this.ensureAPIsLoaded();
      this.dentists = await DentistAPI.getAll();
      return this.dentists;
    } catch (error) {
      console.error("Error al cargar dentistas:", error);
      throw new Error("Error al cargar la lista de dentistas");
    }
  }

  // Cargar pacientes (usuarios que pueden ser pacientes)
  async loadPatients() {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const response = await fetch(`${API_BASE_URL}/patients`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      this.patients = await response.json();
      console.log("DataManager - Pacientes/usuarios cargados:", this.patients);
      return this.patients;
    } catch (error) {
      console.error("Error al cargar pacientes:", error);
      throw new Error("Error al cargar la lista de usuarios/pacientes");
    }
  }

  // Cargar todos los usuarios que pueden ser pacientes (alias para loadPatients)
  async loadUsers() {
    return await this.loadPatients();
  }

  // Cargar datos del usuario actual (para usuarios no admin)
  async loadCurrentUserData() {
    try {
      const token = localStorage.getItem("authToken");
      const userEmail = localStorage.getItem("userEmail");
      const userRole = localStorage.getItem("userRole");

      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      if (!userEmail) {
        throw new Error("No hay email de usuario");
      }

      // Si el usuario es ADMIN, no necesita tener un paciente asociado
      if (userRole === "ADMIN") {
        console.log(
          "DataManager - Usuario ADMIN detectado, saltando búsqueda de paciente"
        );

        // Configurar datos básicos para el admin
        localStorage.setItem("patientId", "");
        localStorage.setItem("userName", "Administrador");
        localStorage.setItem("userLastName", "");
        localStorage.setItem("userEmail", userEmail);

        return {
          id: null,
          name: "Administrador",
          lastName: "",
          email: userEmail,
          isAdmin: true,
        };
      }

      console.log("DataManager - Buscando paciente por email:", userEmail);

      // Hacer una llamada al backend para obtener el paciente por email
      const response = await fetch(`${API_BASE_URL}/patients`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const allPatients = await response.json();
      console.log("DataManager - Todos los pacientes:", allPatients);

      // Buscar el paciente que coincida con el email del usuario
      const currentPatient = allPatients.find(
        (patient) => patient.email === userEmail
      );

      if (currentPatient) {
        console.log("DataManager - Paciente encontrado:", currentPatient);

        // Guardar los datos del paciente en localStorage (sin el objeto user que es inseguro)
        localStorage.setItem("patientId", currentPatient.id);
        localStorage.setItem("userName", currentPatient.name || "");
        localStorage.setItem("userLastName", currentPatient.lastName || "");
        localStorage.setItem("userEmail", currentPatient.email || "");

        return currentPatient;
      } else {
        throw new Error("No se encontró el paciente asociado al usuario");
      }
    } catch (error) {
      console.error("Error al cargar datos del paciente:", error);
      throw error;
    }
  }

  // Cargar todas las citas con filtros opcionales
  async loadAppointments(filters = {}) {
    try {
      this.ensureAPIsLoaded();
      const result = await AppointmentAPI.getAll(filters);
      this.appointments = Array.isArray(result) ? result : result.content || [];
      return this.appointments;
    } catch (error) {
      console.error("Error al cargar citas:", error);
      throw new Error("Error al cargar las citas: " + error.message);
    }
  }

  // Cargar una cita específica por ID
  async loadAppointmentById(id) {
    try {
      this.ensureAPIsLoaded();
      const appointment = await AppointmentAPI.getById(id);
      if (!appointment) {
        throw new Error("Cita no encontrada");
      }
      return appointment;
    } catch (error) {
      console.error("Error al cargar la cita:", error);
      throw error;
    }
  }

  // Obtener nombre del dentista por ID
  getDentistName(dentistId) {
    const dentist = this.dentists.find((d) => d.id === dentistId);
    if (dentist) {
      const firstName = dentist.firstName || dentist.name || "Dentista";
      return `Dr/a. ${firstName} ${dentist.lastName}`;
    }
    return "Dentista no encontrado";
  }
}

export default AppointmentDataManager;
