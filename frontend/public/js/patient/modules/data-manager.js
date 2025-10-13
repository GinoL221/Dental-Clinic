import PatientAPI from "../../api/patient-api.js";
import logger from "../../logger.js";

class PatientDataManager {
  constructor() {
    this.patients = [];
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // Cargar todos los pacientes
  async loadAllPatients() {
    try {
  logger.info("PatientDataManager - Cargando lista de pacientes...");

      // Verificar cache
      const cacheKey = "all-patients";
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        logger.info("Pacientes cargados desde cache");
        this.patients = cached;
        return cached;
      }

      const response = await PatientAPI.getAll();
      this.patients = response;
      this.setCachedData(cacheKey, response);

  logger.info(`${this.patients.length} pacientes cargados desde API`);
      return this.patients;
    } catch (error) {
      console.error("❌ Error al cargar pacientes:", error);
      throw new Error(`Error al cargar pacientes: ${error.message}`);
    }
  }

  // Obtener paciente por ID
  async loadPatientById(id) {
    try {
  logger.debug(`PatientDataManager - Buscando paciente ID: ${id}`);

      // Verificar cache
      const cacheKey = `patient-${id}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
  logger.info("Paciente cargado desde cache");
        return cached;
      }

      // Intentar encontrar en la lista cargada
      if (this.patients.length > 0) {
        const found = this.patients.find((p) => p.id === parseInt(id));
        if (found) {
          this.setCachedData(cacheKey, found);
          logger.info("Paciente encontrado en lista local");
          return found;
        }
      }

      // Cargar desde API
      const patient = await PatientAPI.findById(id);
      this.setCachedData(cacheKey, patient);

  logger.info("Paciente cargado desde API");
      return patient;
    } catch (error) {
      console.error(`❌ Error al cargar paciente ${id}:`, error);
      throw new Error(`Error al cargar paciente: ${error.message}`);
    }
  }

  // Crear nuevo paciente
  async createPatient(patientData) {
    try {
  logger.info("PatientDataManager - Creando nuevo paciente:", patientData);

      const newPatient = await PatientAPI.create(patientData);

      // Actualizar cache local
      this.patients.push(newPatient);
      this.invalidateCache("all-patients");

  logger.info("Paciente creado exitosamente:", newPatient);
      return newPatient;
    } catch (error) {
      console.error("❌ Error al crear paciente:", error);
      throw new Error(`Error al crear paciente: ${error.message}`);
    }
  }

  // Actualizar paciente
  async updatePatient(id, patientData) {
    try {
  logger.info(`PatientDataManager - Actualizando paciente ${id}:`, patientData);

      const updatedPatient = await PatientAPI.update(id, patientData);

      // Actualizar cache local
      const index = this.patients.findIndex((p) => p.id === parseInt(id));
      if (index !== -1) {
        this.patients[index] = updatedPatient;
      }

      this.invalidateCache("all-patients");
      this.invalidateCache(`patient-${id}`);

  logger.info("Paciente actualizado exitosamente:", updatedPatient);
      return updatedPatient;
    } catch (error) {
      console.error(`❌ Error al actualizar paciente ${id}:`, error);
      throw new Error(`Error al actualizar paciente: ${error.message}`);
    }
  }

  // Eliminar paciente
  async deletePatient(id) {
    try {
  logger.info(`PatientDataManager - Eliminando paciente ${id}`);

      await PatientAPI.delete(id);

      // Actualizar cache local
      this.patients = this.patients.filter((p) => p.id !== parseInt(id));
      this.invalidateCache("all-patients");
      this.invalidateCache(`patient-${id}`);

  logger.info("Paciente eliminado exitosamente");
      return true;
    } catch (error) {
      console.error(`❌ Error al eliminar paciente ${id}:`, error);
      throw new Error(`Error al eliminar paciente: ${error.message}`);
    }
  }

  // Validar datos de paciente
  validatePatientData(data) {
    const errors = [];

    // Validar campos requeridos
    if (!data.firstName || data.firstName.trim().length < 2) {
      errors.push("El nombre debe tener al menos 2 caracteres");
    }

    if (!data.lastName || data.lastName.trim().length < 2) {
      errors.push("El apellido debe tener al menos 2 caracteres");
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push("Debe proporcionar un email válido");
    }

    if (!data.cardIdentity || data.cardIdentity.toString().trim().length < 7) {
      errors.push("El DNI debe tener al menos 7 caracteres");
    }

    // Validar teléfono si está presente
    if (data.phoneNumber && !this.isValidPhone(data.phoneNumber)) {
      errors.push("El formato del teléfono no es válido");
    }

    // Validar fecha de nacimiento si está presente
    if (data.dateOfBirth && !this.isValidDate(data.dateOfBirth)) {
      errors.push("La fecha de nacimiento no es válida");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  // Validar email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validar fecha
  isValidDate(dateString) {
    // Construir fecha local segura si viene en formato YYYY-MM-DD
    try {
      let date;
      if (typeof dateString === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const parts = dateString.split("-");
        const y = Number(parts[0]);
        const m = Number(parts[1]) - 1;
        const d = Number(parts[2]);
        date = new Date(y, m, d);
      } else {
        date = new Date(dateString);
      }
      const today = new Date();
      // Verificar que la fecha sea válida y no sea futura
      return date instanceof Date && !isNaN(date) && date <= today && date > new Date(1900, 0, 1);
    } catch (e) {
      return false;
    }
  }

  // Buscar pacientes por criterio - CORREGIDO
  searchPatients(searchTerm) {
    if (!searchTerm || searchTerm.trim() === "") {
      return this.patients;
    }

    const term = searchTerm.toLowerCase().trim();

    return this.patients.filter((patient) => {
      return (
        patient.firstName.toLowerCase().includes(term) ||
        patient.lastName.toLowerCase().includes(term) ||
        patient.email.toLowerCase().includes(term) ||
        (patient.cardIdentity &&
          patient.cardIdentity.toString().includes(term)) ||
        (patient.admissionDate && patient.admissionDate.includes(term))
      );
    });
  }

  // Obtener estadísticas de pacientes - CORREGIDO
  getPatientStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      total: this.patients.length,
      withAddress: this.patients.filter(
        (p) =>
          p.address &&
          ((typeof p.address === "object" &&
            (p.address.street || p.address.city)) ||
            (typeof p.address === "string" && p.address.trim() !== ""))
      ).length,
      recentAdmissions: 0,
      byProvince: {},
    };

    // Contar admisiones recientes (últimos 30 días)
    stats.recentAdmissions = this.patients.filter((patient) => {
      if (!patient.admissionDate) return false;
      const ad = patient.admissionDate;
      let admissionDate;
      if (typeof ad === "string" && /^\d{4}-\d{2}-\d{2}$/.test(ad)) {
        const parts = ad.split("-");
        admissionDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        admissionDate = new Date(ad);
      }
      return admissionDate >= thirtyDaysAgo;
    }).length;

    // Agrupar por provincia
    this.patients.forEach((patient) => {
      let province = "No especificada";

      if (patient.address) {
        if (typeof patient.address === "object" && patient.address.province) {
          province = patient.address.province;
        } else if (typeof patient.address === "string") {
          province = "Dirección especificada";
        }
      }

      stats.byProvince[province] = (stats.byProvince[province] || 0) + 1;
    });

    return stats;
  }

  // Agrupar por rango de edad
  groupByAgeRange() {
    const ageRanges = {
      "0-17": 0,
      "18-30": 0,
      "31-50": 0,
      "51-70": 0,
      "70+": 0,
      "Sin edad": 0,
    };

    this.patients.forEach((patient) => {
      if (!patient.dateOfBirth) {
        ageRanges["Sin edad"]++;
        return;
      }

      const age = this.calculateAge(patient.dateOfBirth);

      if (age < 18) ageRanges["0-17"]++;
      else if (age <= 30) ageRanges["18-30"]++;
      else if (age <= 50) ageRanges["31-50"]++;
      else if (age <= 70) ageRanges["51-70"]++;
      else ageRanges["70+"]++;
    });

    return ageRanges;
  }

  // Calcular edad
  calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  }

  // Obtener pacientes agregados recientemente
  getRecentlyAdded(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.patients.filter((patient) => {
      if (!patient.admissionDate) return false;
      return new Date(patient.admissionDate) > cutoffDate;
    });
  }

  // Obtener pacientes con citas
  getPatientsWithAppointments() {
    return this.patients.filter(
      (patient) => patient.appointments && patient.appointments.length > 0
    ).length;
  }

  // Gestión de cache
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now(),
    });
  }

  invalidateCache(key) {
    this.cache.delete(key);
  }

  clearCache() {
    this.cache.clear();
  }

  // Obtener lista actual en memoria
  getCurrentPatients() {
    return [...this.patients];
  }
}

export default PatientDataManager;
