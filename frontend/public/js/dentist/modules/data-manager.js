import DentistAPI from "../../api/dentist-api.js";

class DentistDataManager {
  constructor() {
    this.dentists = [];
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // Cargar todos los dentistas
  async loadAllDentists() {
    try {
      console.log("📊 DentistDataManager - Cargando lista de dentistas...");

      // Verificar cache
      const cacheKey = "all-dentists";
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        console.log("✅ Dentistas cargados desde cache");
        this.dentists = cached;
        return cached;
      }

      const response = await DentistAPI.getAll();
      this.dentists = response;
      this.setCachedData(cacheKey, response);

      console.log(`✅ ${this.dentists.length} dentistas cargados desde API`);
      return this.dentists;
    } catch (error) {
      console.error("❌ Error al cargar dentistas:", error);
      throw new Error(`Error al cargar dentistas: ${error.message}`);
    }
  }

  // Obtener dentista por ID
  async loadDentistById(id) {
    try {
      console.log(`🔍 DentistDataManager - Buscando dentista ID: ${id}`);

      // Verificar cache
      const cacheKey = `dentist-${id}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        console.log("✅ Dentista cargado desde cache");
        return cached;
      }

      // Intentar encontrar en la lista cargada
      if (this.dentists.length > 0) {
        const found = this.dentists.find((d) => d.id === parseInt(id));
        if (found) {
          this.setCachedData(cacheKey, found);
          console.log("✅ Dentista encontrado en lista local");
          return found;
        }
      }

      // Cargar desde API
      const dentist = await DentistAPI.findById(id);
      this.setCachedData(cacheKey, dentist);

      console.log("✅ Dentista cargado desde API");
      return dentist;
    } catch (error) {
      console.error(`❌ Error al cargar dentista ${id}:`, error);
      throw new Error(`Error al cargar dentista: ${error.message}`);
    }
  }

  // Crear nuevo dentista
  async createDentist(dentistData) {
    try {
      console.log(
        "➕ DentistDataManager - Creando nuevo dentista:",
        dentistData
      );

      const newDentist = await DentistAPI.create(dentistData);

      // Actualizar cache local
      this.dentists.push(newDentist);
      this.invalidateCache("all-dentists");

      console.log("✅ Dentista creado exitosamente:", newDentist);
      return newDentist;
    } catch (error) {
      console.error("❌ Error al crear dentista:", error);
      throw new Error(`Error al crear dentista: ${error.message}`);
    }
  }

  // Actualizar dentista
  async updateDentist(id, dentistData) {
    try {
      console.log(
        `🔄 DentistDataManager - Actualizando dentista ${id}:`,
        dentistData
      );

      const updatedDentist = await DentistAPI.update(id, dentistData);

      // Actualizar cache local
      const index = this.dentists.findIndex((d) => d.id === parseInt(id));
      if (index !== -1) {
        this.dentists[index] = updatedDentist;
      }

      this.invalidateCache("all-dentists");
      this.invalidateCache(`dentist-${id}`);

      console.log("✅ Dentista actualizado exitosamente:", updatedDentist);
      return updatedDentist;
    } catch (error) {
      console.error(`❌ Error al actualizar dentista ${id}:`, error);
      throw new Error(`Error al actualizar dentista: ${error.message}`);
    }
  }

  // Eliminar dentista
  async deleteDentist(id) {
    try {
      console.log(`🗑️ DentistDataManager - Eliminando dentista ${id}`);

      await DentistAPI.delete(id);

      // Actualizar cache local
      this.dentists = this.dentists.filter((d) => d.id !== parseInt(id));
      this.invalidateCache("all-dentists");
      this.invalidateCache(`dentist-${id}`);

      console.log("✅ Dentista eliminado exitosamente");
      return true;
    } catch (error) {
      console.error(`❌ Error al eliminar dentista ${id}:`, error);
      throw new Error(`Error al eliminar dentista: ${error.message}`);
    }
  }

  // Validar datos de dentista
  validateDentistData(data) {
    const errors = [];

    // Validar nombre
    if (!data.firstName || data.firstName.trim().length < 2) {
      errors.push("El nombre debe tener al menos 2 caracteres");
    }

    // Validar apellido
    if (!data.lastName || data.lastName.trim().length < 2) {
      errors.push("El apellido debe tener al menos 2 caracteres");
    }

    // Validar matrícula
    if (!data.registrationNumber || data.registrationNumber.trim().length < 3) {
      errors.push("La matrícula debe tener al menos 3 caracteres");
    }

    // Validar especialidad si está presente
    if (data.specialty && data.specialty.trim().length > 100) {
      errors.push("La especialidad no puede exceder 100 caracteres");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  // Buscar dentistas por criterio
  searchDentists(searchTerm) {
    if (!searchTerm || searchTerm.trim() === "") {
      return this.dentists;
    }

    const term = searchTerm.toLowerCase().trim();

    return this.dentists.filter((dentist) => {
      return (
        dentist.firstName.toLowerCase().includes(term) ||
        dentist.lastName.toLowerCase().includes(term) ||
        dentist.registrationNumber.toLowerCase().includes(term) ||
        (dentist.specialty && dentist.specialty.toLowerCase().includes(term))
      );
    });
  }

  // Obtener estadísticas de dentistas
  getDentistStats() {
    return {
      total: this.dentists.length,
      bySpecialty: this.groupBySpecialty(),
      recentlyAdded: this.getRecentlyAdded(),
    };
  }

  // Agrupar por especialidad
  groupBySpecialty() {
    const specialties = {};

    this.dentists.forEach((dentist) => {
      const specialty = dentist.specialty || "Sin especialidad";
      specialties[specialty] = (specialties[specialty] || 0) + 1;
    });

    return specialties;
  }

  // Obtener dentistas agregados recientemente
  getRecentlyAdded(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.dentists.filter((dentist) => {
      if (!dentist.createdAt) return false;
      return new Date(dentist.createdAt) > cutoffDate;
    });
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
  getCurrentDentists() {
    return [...this.dentists];
  }
}

export default DentistDataManager;
