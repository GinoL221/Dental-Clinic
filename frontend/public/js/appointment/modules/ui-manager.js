import logger from "../../logger.js";

class AppointmentUIManager {
  constructor() {
    this.currentAppointment = null;
  }

  // Poblar select de usuarios (que pueden ser pacientes)
  populateUserSelect(selectElement, users) {
    // Limpiar opciones existentes excepto la primera
    while (selectElement.children.length > 1) {
      selectElement.removeChild(selectElement.lastChild);
    }

    // Agregar opciones de usuarios
    users.forEach((user) => {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = `${user.name || user.firstName || ""} ${
        user.lastName || ""
      } - ${user.email}`.trim();
      selectElement.appendChild(option);
    });
  }

  // Poblar select de pacientes (DEPRECATED - usar populateUserSelect)
  populatePatientSelect(selectElement, patients) {
    // Limpiar opciones existentes excepto la primera
    while (selectElement.children.length > 1) {
      selectElement.removeChild(selectElement.lastChild);
    }

    // Agregar opciones de pacientes
    patients.forEach((patient) => {
      const option = document.createElement("option");
      option.value = patient.id;
      option.textContent = `${patient.firstName} ${patient.lastName} - ${patient.email}`;
      selectElement.appendChild(option);
    });
  }

  // Llenar select de dentistas
  populateDentistSelect(selectElement, dentists, includeEmptyOption = false) {
    logger.debug("UIManager - Poblando select de dentistas:", {
      selectElement: selectElement?.id || "sin ID",
      dentistsCount: dentists?.length || 0,
      includeEmptyOption,
      currentOptionsCount: selectElement?.options?.length || 0,
    });

    // Limpiar todas las opciones existentes primero
    selectElement.innerHTML = "";

    // Agregar opción vacía si se requiere
    if (includeEmptyOption) {
      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "Todos los dentistas";
      selectElement.appendChild(emptyOption);
    } else {
      // Agregar opción de selección por defecto
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Seleccione un odontólogo";
      selectElement.appendChild(defaultOption);
    }

    // Agregar los dentistas
    dentists.forEach((dentist) => {
      const option = document.createElement("option");
      option.value = dentist.id;
      const dentistName = dentist.firstName || "Dentista";
      option.textContent = `Dr/a. ${dentistName} ${dentist.lastName}`;
      selectElement.appendChild(option);
    });

    logger.debug("UIManager - Select de dentistas poblado:", {
      finalOptionsCount: selectElement.options.length,
      selectElement: selectElement?.id || "sin ID",
    });
  }

  // Llenar datos del usuario en el formulario
  fillUserDataInForm(userData) {
    if (userData.patient || userData) {
      const patient = userData.patient || userData;
      const nameInput = document.getElementById("patientFirstName");
      const lastNameInput = document.getElementById("patientLastName");
      const emailInput = document.getElementById("patientEmail");

      if (nameInput) nameInput.value = patient.firstName || "";
      if (lastNameInput) lastNameInput.value = patient.lastName || "";
      if (emailInput) emailInput.value = patient.email || "";
    }
  }

  // Poblar todos los selects de la página
  async populateSelects(dentists, patients = [], isAdmin = false) {
    logger.debug("UIManager - Poblando selects...", { dentists, patients, isAdmin });

    // Poblar select de dentistas
    const dentistSelect = document.getElementById("dentistId");
    if (dentistSelect && dentists) {
      this.populateDentistSelect(dentistSelect, dentists);
  logger.debug("Select de dentistas poblado");
    }

    // Poblar select de pacientes (usuarios que pueden ser pacientes)
    const patientSelect = document.getElementById("patientSelect");
    if (patientSelect && patients) {
      // Crear opción por defecto
      patientSelect.innerHTML = "";
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Seleccione un paciente";
      patientSelect.appendChild(defaultOption);

      // Poblar con pacientes (que en realidad son usuarios registrados)
      this.populatePatientSelect(patientSelect, patients);
  logger.debug("Select de pacientes/usuarios poblado");
    }
  }

  // Llenar datos del usuario desde localStorage como fallback
  fillUserDataFromLocalStorage() {
    const nameInput = document.getElementById("patientName");
    const lastNameInput = document.getElementById("patientLastName");
    const emailInput = document.getElementById("patientEmail");

    if (nameInput)
      nameInput.value = localStorage.getItem("userFirstName") || "";
    if (lastNameInput)
      lastNameInput.value = localStorage.getItem("userLastName") || "";
    if (emailInput) emailInput.value = localStorage.getItem("userEmail") || "";
  }

  // Llenar datos del usuario (alias para fillUserDataInForm para compatibilidad)
  fillUserData(userData) {
  logger.debug("UIManager - Llenando datos de usuario:", userData);
    this.fillUserDataInForm(userData);
  }

  // Mostrar mensajes (método unificado)
  showMessage(message, type = "info") {
    logger.info(`AppointmentUIManager - Mostrando mensaje: ${message} (${type})`);

    // Limpiar mensajes existentes
    this.clearMessages();

    // Crear o encontrar contenedor de mensajes
    let messageContainer = document.getElementById("appointment-messages");
    if (!messageContainer) {
      messageContainer = document.createElement("div");
      messageContainer.id = "appointment-messages";
      messageContainer.className = "message-container mb-3";

      // Insertar al inicio del contenido principal
      const container =
        document.querySelector(".container") ||
        document.querySelector("main") ||
        document.body;
      container.insertBefore(messageContainer, container.firstChild);
    }

    // Crear mensaje
    const alertClass = `alert alert-${type} alert-dismissible fade show`;
    messageContainer.innerHTML = `
      <div class="${alertClass}" role="alert">
        <i class="bi bi-${this.getMessageIcon(type)} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
    messageContainer.style.display = "block";
  }

  // Ocultar mensajes
  hideMessage() {
    const messageContainer = document.getElementById("appointment-messages");
    if (messageContainer) {
      messageContainer.style.display = "none";
      messageContainer.innerHTML = "";
    }
  }

  // Limpiar todos los mensajes existentes
  clearMessages() {
    const existingMessages = document.querySelectorAll(
      "#appointment-messages .alert"
    );
    existingMessages.forEach((msg) => msg.remove());
  }

  // Obtener icono para el tipo de mensaje
  getMessageIcon(type) {
    const icons = {
      success: "check-circle",
      danger: "exclamation-triangle",
      warning: "exclamation-circle",
      info: "info-circle",
      primary: "info-circle",
      secondary: "info-circle",
    };
    return icons[type] || "info-circle";
  }

  // Cargar datos de pacientes individualmente cuando no tenemos lista completa
  async loadPatientDataForAppointments(appointments) {
    const token = localStorage.getItem("authToken");
    if (!token) {
      logger.error("No hay token de autenticación");
      return;
    }

    try {
      // Obtener IDs únicos de pacientes
      const patientIds = [
        ...new Set(appointments.map((apt) => apt.patient_id)),
      ];

      // Cargar datos de cada paciente
      const patientPromises = patientIds.map(async (patientId) => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/patients/${patientId}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            return await response.json();
          } else {
            logger.warn(`No se pudo cargar paciente ID ${patientId}`);
            return null;
          }
        } catch (error) {
          logger.warn(`Error al cargar paciente ID ${patientId}:`, error);
          return null;
        }
      });

      const patientDataList = await Promise.all(patientPromises);

      // Asignar datos de paciente a cada cita
      appointments.forEach((appointment) => {
        const patientData = patientDataList.find(
          (p) => p && p.id === appointment.patient_id
        );
        if (patientData) {
          appointment.patientData = patientData;
        }
      });

  logger.info("Datos de pacientes cargados individualmente");
    } catch (error) {
      logger.error("Error al cargar datos de pacientes:", error);
    }
  }

  // Mostrar citas en la tabla
  async displayAppointments(appointments, dentists, patients = []) {
    const tbody = document.getElementById("appointments-table-body");
    const noAppointments = document.getElementById("no-appointments");

    if (!tbody) {
      logger.error("No se encontró el elemento tbody con id 'appointments-table-body'");
      return;
    }

    if (!appointments || appointments.length === 0) {
      tbody.innerHTML = "";
      if (noAppointments) noAppointments.style.display = "block";
  logger.debug("No hay citas para mostrar");
      return;
    }

    if (noAppointments) noAppointments.style.display = "none";

    // Si no tenemos lista de pacientes, cargar los datos individualmente
    if (patients.length === 0) {
      await this.loadPatientDataForAppointments(appointments);
    }

    const htmlContent = appointments
      .map((appointment, index) => {
        // El backend envía solo IDs, no objetos completos
        const dentistId = appointment.dentist_id;
        const patientId = appointment.patient_id;

        // Buscar información del dentista por ID
        const dentist = dentists.find((d) => d.id === dentistId);
        const dentistName = dentist
          ? `Dr/a. ${dentist.firstName} ${dentist.lastName}`
          : "Dentista no encontrado";

        // Buscar información del paciente por ID
        let patientName = "Sin nombre";
        let patientEmail = "Sin email";

        if (patients.length > 0) {
          // Si tenemos lista de pacientes (admin), buscar ahí
          const patient = patients.find((p) => p.id === patientId);
          if (patient) {
            patientName = `${patient.firstName || ""} ${
              patient.lastName || ""
            }`.trim();
            patientEmail = patient.email || "Sin email";
          }
        } else {
          // Usar datos cargados individualmente
          if (appointment.patientData) {
            patientName = `${
              appointment.patientData.firstName || appointment.patientData.firstName
            } ${appointment.patientData.lastName || ""}`.trim();
            patientEmail = appointment.patientData.email || "Sin email";
          }
        }

        // Datos de la cita
        const appointmentDate = appointment.date;
        const appointmentTime = appointment.time;
        const description = appointment.description || "Sin descripción";

        const rowHTML = `
          <tr>
            <td>${index + 1}</td>
            <td><strong>${patientName}</strong></td>
            <td>${patientEmail}</td>
            <td>${dentistName}</td>
            <td>${this.formatDate(appointmentDate)}</td>
            <td>${this.formatTime(appointmentTime)}</td>
            <td>${description}</td>
            <td>
              <div class="btn-group btn-group-sm" role="group">
                <a href="/appointments/edit/${
                  appointment.id
                }" class="btn btn-outline-primary" title="Editar">
                  <i class="bi bi-pencil-square"></i>
                </a>
                <button class="btn btn-outline-danger" onclick="window.confirmDeleteAppointment(${
                  appointment.id
                }, '${patientName.replace(/'/g, "\\'")}!')" title="Eliminar">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;

        return rowHTML;
      })
      .join("");

    tbody.innerHTML = htmlContent;
  logger.info("Tabla de citas actualizada correctamente");
  }

  // Llenar formulario de edición
  fillEditForm(appointment) {
    logger.debug("UIManager - Llenando formulario de edición con datos:", appointment);

    // Primero, asegurar que el appointmentId se establezca correctamente
    const appointmentIdInput = document.getElementById("appointmentId");
    if (appointmentIdInput && appointment.id) {
      appointmentIdInput.value = appointment.id.toString();
      // Forzar el atributo value también
      appointmentIdInput.setAttribute("value", appointment.id.toString());
      logger.debug(`UIManager - appointmentId establecido: ${appointment.id}`);
      logger.debug(`UIManager - appointmentId verificación DOM: "${appointmentIdInput.value}"`);
      logger.debug(`UIManager - appointmentId atributo value: "${appointmentIdInput.getAttribute("value")}"`);
    } else {
      logger.error("❌ UIManager - No se pudo establecer appointmentId:", {
        inputExists: !!appointmentIdInput,
        appointmentId: appointment.id,
      });
    }

    // Mapear los datos enriquecidos a los campos del formulario
    const fields = [
      { id: "patientName", value: appointment.patientName || "" },
      { id: "patientLastName", value: appointment.patientLastName || "" },
      { id: "patientEmail", value: appointment.patientEmail || "" },
      {
        id: "dentistId",
        value: appointment.dentistId || appointment.dentist_id || "",
      },
      {
        id: "appointmentDate",
        value: appointment.appointmentDate || appointment.date || "",
      },
      {
        id: "appointmentTime",
        value: appointment.appointmentTime || appointment.time || "",
      },
      { id: "description", value: appointment.description || "" },
    ];

  logger.debug("UIManager - Campos adicionales a llenar:", fields);

    // Llenar todos los campos del formulario
    fields.forEach((field) => {
      let element = document.getElementById(field.id);

      // Si no existe el elemento con el ID esperado, intentar IDs alternativos por compatibilidad
      if (!element) {
        const alternates = {
          patientName: ["patientFirstName", "patientFullName"],
          patientLastName: ["patientLastName", "patientSurname"],
          patientEmail: ["patientEmail", "email"],
          dentistId: ["dentistId"],
          appointmentDate: ["appointmentDate", "date"],
          appointmentTime: ["appointmentTime", "time"],
          description: ["description"]
        };

        const candidates = alternates[field.id] || [field.id];
        for (const altId of candidates) {
          const altEl = document.getElementById(altId);
          if (altEl) {
            element = altEl;
            logger.debug(`UIManager - Usando ID alternativo "${altId}" para campo "${field.id}"`);
            break;
          }
        }
      }

      if (element) {
        // Si el campo alternativo es patientFirstName y la información disponible es el nombre completo,
        // guardar solo el primer nombre para mantener compatibilidad con campos individuales.
        if (element.id === "patientFirstName" && field.id === "patientName") {
          const firstName = (field.value || "").toString().trim().split(" ")[0] || "";
          element.value = firstName;
          logger.debug(`Campo ${element.id} (alternativo) llenado con: "${element.value}"`);
        } else {
          element.value = field.value;
          logger.debug(`Campo ${element.id} llenado con: "${field.value}"`);
        }
      } else {
        logger.warn(`No se encontró elemento con ID: ${field.id} (y no se hallaron alternativos)`);
      }
    });

    // Establecer el dentista seleccionado usando la función modular
    const dentistId = appointment.dentistId || appointment.dentist_id;
    if (dentistId) {
      this.setSelectedDentist(dentistId);
    }

    // Establecer el paciente seleccionado en el select de pacientes
    const patientId = appointment.patientId || appointment.patient_id;
    if (patientId) {
      logger.debug(`Intentando seleccionar paciente ${patientId} inmediatamente (retry interno si es necesario)`);
      this.setSelectedPatient(patientId);
    }

    // Además, rellenar explícitamente los campos visibles del paciente (compatibilidad)
    // Esto cubre casos en que el select aún no esté poblado o la selección programática falle
    try {
      const pf = document.getElementById("patientFirstName");
      const pl = document.getElementById("patientLastName");
      const pe = document.getElementById("patientEmail");
      const patientInfoFields = document.getElementById("patientInfoFields");

      if (appointment.patientName || appointment.patientLastName || appointment.patientEmail) {
        // patientName puede contener nombre completo; separar primer nombre cuando corresponda
        const fullName = appointment.patientName || "";
        const firstName = fullName.toString().trim().split(" ")[0] || "";

        if (pf) pf.value = firstName;
        if (pl) pl.value = appointment.patientLastName || "";
        if (pe) pe.value = appointment.patientEmail || "";
        if (patientInfoFields) patientInfoFields.style.display = "flex";

  logger.info("Campos visibles de paciente rellenados explícitamente desde datos de la cita");
      }
    } catch (err) {
      logger.warn("⚠️ No se pudo rellenar explícitamente los campos visibles del paciente:", err);
    }

    // Guardar los valores originales de fecha/hora en atributos data-original-*
    try {
      const dateInput = document.getElementById("appointmentDate");
      const timeInput = document.getElementById("appointmentTime");
      const originalDate = appointment.appointmentDate || appointment.date || "";
      const originalTime = appointment.appointmentTime || appointment.time || "";
      if (dateInput && originalDate) {
        dateInput.setAttribute("data-original-date", originalDate);
      }
      if (timeInput && originalTime) {
        timeInput.setAttribute("data-original-time", originalTime);
      }
    } catch (err) {
      logger.warn("⚠️ No se pudieron setear atributos originales de fecha/hora:", err);
    }

  logger.info("UIManager - Formulario de edición llenado completamente");
  }

  // Función específica para establecer el dentista seleccionado
  setSelectedDentist(dentistId) {
    if (!dentistId) return;

    const dentistSelect = document.getElementById("dentistId");
    if (!dentistSelect) {
      logger.warn("⚠️ No se encontró el select de dentistas");
      return;
    }

  logger.debug(`Estableciendo dentista seleccionado: ${dentistId}`);

    // Intentar establecer el valor
    dentistSelect.value = dentistId.toString();

    // Verificar que se estableció correctamente
    if (dentistSelect.value === dentistId.toString()) {
  logger.info(`Dentista ${dentistId} seleccionado exitosamente`);
    } else {
    logger.warn(`No se pudo seleccionar dentista ${dentistId}`);
        logger.debug("Valor actual del select:", dentistSelect.value);
        logger.debug(
        "Opciones disponibles:",
        Array.from(dentistSelect.options).map((opt) => ({ value: opt.value, text: opt.text }))
      );

      // Intentar forzar la selección buscando la opción manualmente
      const targetOption = Array.from(dentistSelect.options).find(
        (opt) => opt.value === dentistId.toString()
      );
      if (targetOption) {
        targetOption.selected = true;
        logger.info(`Forzada selección del dentista ${dentistId}`);
      }
    }
  }

  // Función específica para establecer el paciente seleccionado
  setSelectedPatient(patientId) {
    if (!patientId) return;

    const patientSelect = document.getElementById("patientSelect");
    if (!patientSelect) {
      logger.warn("⚠️ No se encontró el select de pacientes");
      return;
    }

  logger.debug(`Estableciendo paciente seleccionado: ${patientId}`);

    // Retry logic: options may not be populated yet. Try up to N times with delay.
    const trySelect = (attempt = 1, maxAttempts = 10, delay = 50) => {
      // Attempt to set value
      patientSelect.value = patientId.toString();

      if (patientSelect.value === patientId.toString()) {
  logger.info(`Paciente ${patientId} seleccionado exitosamente (intento ${attempt})`);
        this.updatePatientInfoFields(patientSelect);
        return;
      }

      // If option exists but value didn't set, try to select option manually
      const targetOption = Array.from(patientSelect.options).find(
        (opt) => opt.value === patientId.toString()
      );
      if (targetOption) {
        targetOption.selected = true;
  logger.info(`Forzada selección del paciente ${patientId} (intento ${attempt})`);
        this.updatePatientInfoFields(patientSelect);
        return;
      }

      // If not found and we can retry, wait and retry
      if (attempt < maxAttempts) {
  logger.warn(`Intento ${attempt} - opción paciente ${patientId} no encontrada aún, reintentando en ${delay}ms...`);
        setTimeout(() => trySelect(attempt + 1, maxAttempts, delay * 1.5), delay);
      } else {
        logger.error(`No se pudo seleccionar paciente ${patientId} tras ${maxAttempts} intentos. Opciones actuales:`,
          Array.from(patientSelect.options).map(o => ({ value: o.value, text: o.text })));
      }
    };

    trySelect();
  }

  // Actualizar campos de información del paciente basado en la selección
  updatePatientInfoFields(patientSelect) {
    const patientInfoFields = document.getElementById("patientInfoFields");
    const patientNameField = document.getElementById("patientName");
    const patientLastNameField = document.getElementById("patientLastName");
    const patientEmailField = document.getElementById("patientEmail");

    if (patientSelect && patientSelect.value && patientInfoFields) {
      // Mostrar campos de información
      patientInfoFields.style.display = "flex";

      // Extraer información del texto de la opción seleccionada
      const selectedOption = patientSelect.options[patientSelect.selectedIndex];
      const patientText = selectedOption.textContent;
      const parts = patientText.split(" - ");
      const nameParts = parts[0].trim().split(" ");

  // Llenar campos de solo lectura (compatibilidad: patientName y patientFirstName)
  const patientFirstNameField = document.getElementById("patientFirstName");
  const patientLastNameShortField = document.getElementById("patientLastName");

  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  if (patientNameField) patientNameField.value = `${firstName} ${lastName}`.trim();
  if (patientFirstNameField) patientFirstNameField.value = firstName;
  if (patientLastNameShortField) patientLastNameShortField.value = lastName;
  if (patientEmailField) patientEmailField.value = parts[1] || "";

  // Also update any alternate patient name fields for compatibility
  const altPatientName = document.getElementById("patientName");
  const altPatientFirst = document.getElementById("patientFirstName");
  if (altPatientName) altPatientName.value = `${firstName} ${lastName}`.trim();
  if (altPatientFirst) altPatientFirst.value = firstName;

  logger.info("Campos de información del paciente actualizados");
    } else if (patientInfoFields) {
      // Ocultar campos si no hay selección
      patientInfoFields.style.display = "none";
    }
  }

  // Función específica para establecer el usuario/paciente seleccionado (alias para compatibilidad)
  setSelectedUser(userId) {
    return this.setSelectedPatient(userId);
  }

  // Mostrar formulario de edición
  showEditForm() {
    const loading = document.getElementById("loading");
    const form = document.getElementById("edit_appointment_form");

    if (loading) loading.style.display = "none";
    if (form) form.style.display = "block";
  }

  // Mostrar error de carga
  showLoadingError(message = "No se pudo cargar la información de la cita") {
    const loading = document.getElementById("loading");
    const errorDiv = document.getElementById("error-loading");

    if (loading) loading.style.display = "none";
    if (errorDiv) {
      errorDiv.innerHTML = `
        <strong>Error:</strong> ${message}
        <br>
        <a href="/appointments" class="btn btn-outline-primary mt-2">
          ← Volver a la lista de citas
        </a>
      `;
      errorDiv.style.display = "block";
    }
  }

  // Formatear fecha
  formatDate(dateString) {
    if (!dateString) return "Sin fecha";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  }

  // Formatear hora
  formatTime(timeString) {
    if (!timeString) return "No especificada";
    return timeString.slice(0, 5); // Mostrar solo HH:MM
  }

  // Helper para obtener nombre del dentista desde la lista
  getDentistNameFromList(dentistId, dentists) {
    const dentist = dentists.find((d) => d.id === dentistId);
    if (dentist) {
      const firstName = dentist.firstName || dentist.name || "Dentista";
      return `Dr/a. ${firstName} ${dentist.lastName}`;
    }
    return "Dentista no encontrado";
  }

  // Mostrar mensaje de error específico para la lista (usando el método unificado)
  showError(message) {
    this.showMessage(message, "danger");
  }

  // Mostrar mensaje de éxito (usando el método unificado)
  showSuccessMessage(message) {
    this.showMessage(message, "success");
  }

  // Ocultar mensajes y pantalla de carga
  hideMessage() {
  logger.debug("UIManager - Ocultando mensajes y loading");
    this.clearMessages();
    this.hideLoadingScreen();
  }

  // Limpiar mensajes existentes
  clearMessages() {
    const messageContainer = document.getElementById("appointment-messages");
    if (messageContainer) {
      messageContainer.remove();
    }
  }

  // Ocultar pantalla de carga y mostrar formulario
  hideLoadingScreen() {
    const loadingDiv = document.getElementById("loading");
    const errorDiv = document.getElementById("error-loading");
    const form =
      document.getElementById("edit_appointment_form") ||
      document.getElementById("add_appointment_form") ||
      document.querySelector("form");

    if (loadingDiv) {
      loadingDiv.style.display = "none";
    }

    if (errorDiv) {
      errorDiv.style.display = "none";
    }

    if (form) {
      form.style.display = "block";
    }
  }

  // Mostrar pantalla de error
  showErrorScreen() {
    const loadingDiv = document.getElementById("loading");
    const errorDiv = document.getElementById("error-loading");
    const form =
      document.getElementById("edit_appointment_form") ||
      document.getElementById("add_appointment_form") ||
      document.querySelector("form");

    if (loadingDiv) {
      loadingDiv.style.display = "none";
    }

    if (errorDiv) {
      errorDiv.style.display = "block";
    }

    if (form) {
      form.style.display = "none";
    }
  }

  // Establecer estado de carga
  setLoadingState(button, text) {
    button.disabled = true;
    button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ${text}`;
  }

  // Restablecer estado del botón
  resetLoadingState(button, text) {
    button.disabled = false;
    button.innerHTML = text;
  }
}

export default AppointmentUIManager;
