import AppointmentAPI from "../../api/appointment-api.js";
import logger from "../../logger.js";

class AppointmentFormManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.isSubmitting = false;
  }

  // Obtener datos del formulario
  getFormData() {
    const dateInput = document.getElementById("appointmentDate");
    const timeInput = document.getElementById("appointmentTime");
    const dentistSelect = document.getElementById("dentistId");
    const descriptionInput = document.getElementById("description");
    const appointmentIdInput = document.getElementById("appointmentId");

    // Debug de localStorage
    logger.debug("FormManager - localStorage debug:", {
      userId: localStorage.getItem("userId"),
      patientId: localStorage.getItem("patientId"),
      userRole: localStorage.getItem("userRole"),
      isAdmin: localStorage.getItem("userRole") === "ADMIN",
    });

    // Obtener datos del paciente
    let patientData = {};

    // Verificar si el usuario es admin usando localStorage
    const isAdmin = localStorage.getItem("userRole") === "ADMIN";

    if (isAdmin) {
      // Si es admin, obtener del select de paciente
  const patientSelect = document.getElementById("patientSelect"); // ✅ ID correcto
  logger.debug("FormManager - patientSelect encontrado:", !!patientSelect);
  logger.debug("FormManager - patientSelect.value:", patientSelect?.value);

      if (patientSelect && patientSelect.value) {
        const selectedOption =
          patientSelect.options[patientSelect.selectedIndex];
        const patientText = selectedOption.textContent;
        const parts = patientText.split(" - ");
        const nameParts = parts[0].split(" ");

        patientData = {
          patient_id: parseInt(patientSelect.value),
          patientFirstName: nameParts[0] || "",
          patientLastName: nameParts.slice(1).join(" ") || "",
          patientEmail: parts[1] || "",
        };
      }
    } else {
      // Si es usuario normal, obtener de los campos de solo lectura o localStorage
      const nameInput = document.getElementById("patientFirstName");
      const lastNameInput = document.getElementById("patientLastName");
      const emailInput = document.getElementById("patientEmail");

      // Intentar obtener el ID del paciente de diferentes fuentes
      const patientId =
        parseInt(localStorage.getItem("patientId")) ||
        parseInt(localStorage.getItem("userId")) ||
        0;

      patientData = {
        patient_id: patientId,
        patientFirstName: nameInput
          ? nameInput.value
          : localStorage.getItem("userFirstName") || "",
        patientLastName: lastNameInput
          ? lastNameInput.value
          : localStorage.getItem("userLastName") || "",
        patientEmail: emailInput
          ? emailInput.value
          : localStorage.getItem("userEmail") || "",
      };
    }

    const formData = {
      ...patientData,
      dentist_id: parseInt(dentistSelect?.value) || 0,
      date: dateInput?.value || "",
      time: timeInput?.value || "",
      description: descriptionInput?.value || "",
    };

    // Agregar ID de la cita si existe (para edición)
    if (appointmentIdInput && appointmentIdInput.value) {
      formData.id = parseInt(appointmentIdInput.value);
      logger.debug(`FormManager - ID de cita encontrado: ${formData.id}`);
    } else {
      logger.debug("FormManager - No se encontró ID de cita:", {
        appointmentIdInputExists: !!appointmentIdInput,
        appointmentIdValue: appointmentIdInput?.value,
        appointmentIdInputType: appointmentIdInput?.type,
      });
    }

    logger.debug("FormManager - getFormData resultado:", formData);
    return formData;
  }

  // Validar datos del formulario
  validateFormData(data, isEditing = false) {
  logger.debug("FormManager - Validando datos:", data);

    // Si estamos editando, validar que tenemos un ID
    if (isEditing && (!data.id || isNaN(data.id))) {
  logger.warn("FormManager - Error: ID de cita no válido para edición");
      this.uiManager.showMessage(
        "Error: ID de la cita no encontrado",
        "danger"
      );
      return false;
    }

    // Validar que se haya seleccionado un dentista
    if (!data.dentist_id || isNaN(data.dentist_id)) {
  logger.warn("FormManager - Error: Dentista no válido");
      this.uiManager.showMessage("Debe seleccionar un odontólogo", "danger");
      return false;
    }

    // Validar que se haya seleccionado un paciente
    if (!data.patient_id || isNaN(data.patient_id)) {
  logger.warn("FormManager - Error: Paciente no válido");
      this.uiManager.showMessage("Debe seleccionar un paciente", "danger");
      return false;
    }

    // Validar fecha
    if (!data.date) {
  logger.warn("FormManager - Error: Fecha vacía o no válida");
      this.uiManager.showMessage(
        "Debe seleccionar una fecha para la cita",
        "danger"
      );
      return false;
    }

    // Validar hora
    if (!data.time) {
  logger.warn("FormManager - Error: Hora vacía o no válida");
      this.uiManager.showMessage(
        "Debe seleccionar una hora para la cita",
        "danger"
      );
      return false;
    }

    // Validar que la fecha no sea en el pasado
    // Usar fecha local sin problemas de zona horaria
    const selectedDateParts = data.date.split("-");
    const selectedDate = new Date(
      parseInt(selectedDateParts[0]),
      parseInt(selectedDateParts[1]) - 1,
      parseInt(selectedDateParts[2])
    );

    const today = new Date();
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    // Validar que la combinación fecha+hora no sea en el pasado
    const [hours, minutes] = data.time.split(":");
    const selectedDateTime = new Date(selectedDate.getTime());
    selectedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  logger.debug("FormManager - Comparación de fechas y horas:", {
      selectedDate: selectedDate,
      todayDate: todayDate,
      selectedDateTime: selectedDateTime,
      now: today,
      selectedDateString: data.date,
      time: data.time,
      isValidDate: !isNaN(selectedDate.getTime()),
      isPastDate: selectedDate < todayDate,
      isPastDateTime: selectedDateTime < today,
    });

    if (
      selectedDate < todayDate ||
      (selectedDate.getTime() === todayDate.getTime() && selectedDateTime < today)
    ) {
      // Si estamos editando, permitir la operación si la fecha y hora no fueron modificadas
      if (isEditing) {
        try {
          const dateInput = document.getElementById("appointmentDate");
          const timeInput = document.getElementById("appointmentTime");
          const originalDate = dateInput?.getAttribute("data-original-date") || "";
          const originalTime = timeInput?.getAttribute("data-original-time") || "";

          const unchangedDate = originalDate && originalDate === data.date;
          const unchangedTime = originalTime && originalTime === data.time;

          if (unchangedDate && unchangedTime) {
            // permitir la edición
          } else {
            logger.warn("FormManager - Error: Fecha y/o hora cambiadas y quedan en el pasado");
            this.uiManager.showMessage(
              "La fecha y hora de la cita no puede ser anterior al momento actual",
              "danger"
            );
            return false;
          }
        } catch (err) {
          console.warn("⚠️ Error comprobando valores originales para edición:", err);
          this.uiManager.showMessage(
            "La fecha y hora de la cita no puede ser anterior al momento actual",
            "danger"
          );
          return false;
        }
      } else {
  logger.warn("FormManager - Error: Fecha y hora en el pasado");
        this.uiManager.showMessage(
          "La fecha y hora de la cita no puede ser anterior al momento actual",
          "danger"
        );
        return false;
      }
    }

    // Si es admin, validar que se haya seleccionado un paciente
    if (window.isAdmin && (!data.patient_id || isNaN(data.patient_id))) {
      this.uiManager.showMessage("Debe seleccionar un paciente", "danger");
      return false;
    }

    // Si es usuario normal, validar que tengamos su ID como paciente
    if (!window.isAdmin && (!data.patient_id || isNaN(data.patient_id))) {
      this.uiManager.showMessage(
        "Error: No se pudieron obtener los datos del usuario",
        "danger"
      );
      return false;
    }

    return true;
  }

  // Configurar fecha mínima
  setupDateInput() {
    const dateInput = document.getElementById("appointmentDate");
    if (dateInput) {
      // Use local date components to avoid timezone issues where ISO string may roll to next day
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const todayLocal = `${yyyy}-${mm}-${dd}`;
      dateInput.min = todayLocal;
    }
  }

  // Manejar envío del formulario de agregar
  async handleAddSubmit(e) {
    e.preventDefault();

    // Prevenir múltiples envíos usando flag de clase
    if (this.isSubmitting) {
  logger.info("FormManager - Envío ya en progreso, ignorando");
      return;
    }

    const formData = this.getFormData();

    // No estamos editando, así que no necesitamos ID
    if (!this.validateFormData(formData, false)) {
      return;
    }

    const submitButton = document.getElementById("btn-add-new-appointment");

    // Marcar como enviando y deshabilitar botón
    this.isSubmitting = true;
    this.uiManager.setLoadingState(submitButton, "Programando...");

    try {
  logger.info("FormManager - Enviando datos de cita:", formData);
      await AppointmentAPI.create(formData);
      this.uiManager.showMessage(
        `Cita programada exitosamente para ${formData.patientFirstName} ${formData.patientLastName}`,
        "success"
      );

      document.getElementById("add_new_appointment").reset();
      this.setupDateInput();

      setTimeout(() => {
        window.location.href = "/appointments";
      }, 2000);
    } catch (error) {
      console.error("Error al programar cita:", error);
      this.uiManager.showMessage(
        `Error al programar la cita: ${error.message}`,
        "danger"
      );
    } finally {
      // Restablecer flag y botón
      this.isSubmitting = false;
      this.uiManager.resetLoadingState(submitButton, "Programar Cita");
    }
  }

  // Manejar envío del formulario de editar
  async handleEditSubmit(e) {
    e.preventDefault();

    // Prevenir múltiples envíos
    if (this.isSubmitting) {
  logger.info("FormManager - Edición ya en progreso, ignorando");
      return;
    }

    // Debug del estado del elemento appointmentId antes de obtener datos
    const appointmentIdElement = document.getElementById("appointmentId");
  logger.debug("🔍 Debug handleEditSubmit - appointmentId element:", {
      exists: !!appointmentIdElement,
      value: appointmentIdElement?.value,
      type: appointmentIdElement?.type,
    });

    const formData = this.getFormData();

    // Detectar si estamos en modo edición basado en la presencia del ID
    const isEditing = !!formData.id;

    if (!this.validateFormData(formData, isEditing)) {
      return;
    }

    const submitButton = document.getElementById("btn-update-appointment");

    // Marcar como enviando
    this.isSubmitting = true;
    this.uiManager.setLoadingState(submitButton, "Actualizando...");

    try {
      await AppointmentAPI.update(formData);
      this.uiManager.showMessage(
        `Cita actualizada exitosamente para ${formData.patientFirstName} ${formData.patientLastName}`,
        "success"
      );

      setTimeout(() => {
        window.location.href = "/appointments";
      }, 2000);
    } catch (error) {
      console.error("Error al actualizar cita:", error);
      this.uiManager.showMessage(
        `Error al actualizar la cita: ${error.message}`,
        "danger"
      );
    } finally {
      // Restablecer flag y botón
      this.isSubmitting = false;
      this.uiManager.resetLoadingState(submitButton, "Actualizar Cita");
    }
  }

  // Enlazar eventos del formulario de agregar
  bindAddFormEvents() {
    const form = document.getElementById("add_new_appointment");
    if (form) {
      // Remover listeners anteriores si existen
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);

      // Agregar el nuevo listener
      newForm.addEventListener("submit", (e) => this.handleAddSubmit(e));

  logger.info("✅ FormManager - Event listeners de agregar cita enlazados");
    }
  }

  // Enlazar eventos del formulario de editar
  bindEditFormEvents() {
    const form = document.getElementById("edit_appointment_form");
    if (form) {
      // Remover listeners anteriores si existen
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);

      // Agregar el nuevo listener
      newForm.addEventListener("submit", (e) => this.handleEditSubmit(e));

      // Re-attach patient select change listener (the cloned form removed inline listeners from templates)
      try {
        const patientSelect = document.getElementById("patientSelect");
        if (patientSelect) {
          patientSelect.addEventListener("change", () => {
            // let UI manager populate the visible patient fields
            this.uiManager.updatePatientInfoFields(patientSelect);
          });
        }
      } catch (err) {
        console.warn("FormManager - No se pudo re-attach patientSelect listener:", err);
      }

  logger.info("✅ FormManager - Event listeners de editar cita enlazados");
    }
  }
}

export default AppointmentFormManager;
