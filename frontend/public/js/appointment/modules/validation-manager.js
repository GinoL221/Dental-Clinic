class AppointmentValidationManager {
  constructor() {
    this.workingHours = {
      start: "08:00",
      end: "18:00",
    };
  }

  // Validar horario laboral
  isValidWorkingHour(time) {
    if (!time) return false;

    const [hour, minute] = time.split(":").map(Number);
    const timeInMinutes = hour * 60 + minute;

    const [startHour, startMinute] = this.workingHours.start
      .split(":")
      .map(Number);
    const startInMinutes = startHour * 60 + startMinute;

    const [endHour, endMinute] = this.workingHours.end.split(":").map(Number);
    const endInMinutes = endHour * 60 + endMinute;

    return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes;
  }

  // Validar día laboral (lunes a viernes)
  isValidWorkingDay(date) {
    if (!date) return false;

    const dateObj = new Date(date + "T00:00:00");
    const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 6 = Sábado

    return dayOfWeek >= 1 && dayOfWeek <= 5; // Lunes a Viernes
  }

  // Validar formato de fecha
  isValidDateFormat(dateString) {
    if (!dateString) return false;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const date = new Date(dateString + "T00:00:00");
    return !isNaN(date.getTime());
  }

  // Validar formato de hora
  isValidTimeFormat(timeString) {
    if (!timeString) return false;

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(timeString);
  }

  // Validar que la fecha no sea en el pasado
  isNotPastDate(date) {
    if (!date) return false;

    const selectedDate = new Date(date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return selectedDate >= today;
  }

  // Validar que la hora no sea en el pasado (solo para el día actual)
  isNotPastTime(date, time) {
    if (!date || !time) return false;

    const selectedDate = new Date(date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Si no es hoy, cualquier hora es válida
    if (selectedDate.getTime() !== today.getTime()) {
      return true;
    }

    // Si es hoy, verificar que la hora no sea en el pasado
    const [hours, minutes] = time.split(":").map(Number);
    const selectedDateTime = new Date();
    selectedDateTime.setHours(hours, minutes, 0, 0);

    return selectedDateTime > new Date();
  }

  // Validar ID de dentista
  isValidDentistId(dentistId) {
    return dentistId && !isNaN(dentistId) && parseInt(dentistId) > 0;
  }

  // Validar ID de paciente
  isValidPatientId(patientId) {
    return patientId && !isNaN(patientId) && parseInt(patientId) > 0;
  }

  // Validar descripción
  isValidDescription(description) {
    if (!description) return true; // Descripción es opcional

    return description.trim().length <= 500; // Máximo 500 caracteres
  }

  // Validar email
  isValidEmail(email) {
    if (!email) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validar nombre
  isValidName(name) {
    if (!name) return false;

    return name.trim().length >= 2 && name.trim().length <= 50;
  }

  // Validación completa de datos de cita
  validateAppointmentData(data) {
    const errors = [];

    // Validar dentista
    if (!this.isValidDentistId(data.dentist_id)) {
      errors.push("Debe seleccionar un odontólogo válido");
    }

    // Validar paciente
    if (!this.isValidPatientId(data.patient_id)) {
      errors.push("Debe seleccionar un paciente válido");
    }

    // Validar fecha
    if (!this.isValidDateFormat(data.date)) {
      errors.push("Formato de fecha inválido");
    } else if (!this.isNotPastDate(data.date)) {
      errors.push("La fecha no puede ser anterior a hoy");
    } else if (!this.isValidWorkingDay(data.date)) {
      errors.push("Solo se pueden programar citas de lunes a viernes");
    }

    // Validar hora
    if (!this.isValidTimeFormat(data.time)) {
      errors.push("Formato de hora inválido");
    } else if (!this.isValidWorkingHour(data.time)) {
      errors.push(
        `La hora debe estar entre ${this.workingHours.start} y ${this.workingHours.end}`
      );
    } else if (!this.isNotPastTime(data.date, data.time)) {
      errors.push("La hora no puede ser anterior al momento actual");
    }

    // Validar descripción
    if (!this.isValidDescription(data.description)) {
      errors.push("La descripción no puede exceder 500 caracteres");
    }

    // Validar datos del paciente si están presentes
    if (data.patientFirstName && !this.isValidName(data.patientFirstName)) {
      errors.push("Nombre del paciente inválido");
    }

    if (data.patientLastName && !this.isValidName(data.patientLastName)) {
      errors.push("Apellido del paciente inválido");
    }

    if (data.patientEmail && !this.isValidEmail(data.patientEmail)) {
      errors.push("Email del paciente inválido");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  // Validación en tiempo real para campos de entrada
  setupRealTimeValidation() {
    // Validación de fecha
    const dateInput = document.getElementById("appointmentDate");
    if (dateInput) {
      dateInput.addEventListener("change", (e) => {
        const date = e.target.value;
        const errorDiv = document.getElementById("dateError");

        if (date) {
          if (!this.isValidWorkingDay(date)) {
            this.showFieldError(
              errorDiv,
              "Solo se pueden programar citas de lunes a viernes"
            );
            e.target.classList.add("is-invalid");
          } else if (!this.isNotPastDate(date)) {
            this.showFieldError(
              errorDiv,
              "La fecha no puede ser anterior a hoy"
            );
            e.target.classList.add("is-invalid");
          } else {
            this.hideFieldError(errorDiv);
            e.target.classList.remove("is-invalid");
            e.target.classList.add("is-valid");
          }
        }
      });
    }

    // Validación de hora
    const timeInput = document.getElementById("appointmentTime");
    if (timeInput) {
      timeInput.addEventListener("change", (e) => {
        const time = e.target.value;
        const date = dateInput ? dateInput.value : null;
        const errorDiv = document.getElementById("timeError");

        if (time) {
          if (!this.isValidWorkingHour(time)) {
            this.showFieldError(
              errorDiv,
              `La hora debe estar entre ${this.workingHours.start} y ${this.workingHours.end}`
            );
            e.target.classList.add("is-invalid");
          } else if (date && !this.isNotPastTime(date, time)) {
            this.showFieldError(
              errorDiv,
              "La hora no puede ser anterior al momento actual"
            );
            e.target.classList.add("is-invalid");
          } else {
            this.hideFieldError(errorDiv);
            e.target.classList.remove("is-invalid");
            e.target.classList.add("is-valid");
          }
        }
      });
    }

    // Validación de descripción
    const descriptionInput = document.getElementById("description");
    if (descriptionInput) {
      descriptionInput.addEventListener("input", (e) => {
        const description = e.target.value;
        const errorDiv = document.getElementById("descriptionError");
        const counter = document.getElementById("descriptionCounter");

        if (counter) {
          counter.textContent = `${description.length}/500`;
        }

        if (description.length > 500) {
          this.showFieldError(
            errorDiv,
            "La descripción no puede exceder 500 caracteres"
          );
          e.target.classList.add("is-invalid");
        } else {
          this.hideFieldError(errorDiv);
          e.target.classList.remove("is-invalid");
          if (description.length > 0) {
            e.target.classList.add("is-valid");
          }
        }
      });
    }
  }

  // Mostrar error en campo específico
  showFieldError(errorDiv, message) {
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = "block";
    }
  }

  // Ocultar error en campo específico
  hideFieldError(errorDiv) {
    if (errorDiv) {
      errorDiv.style.display = "none";
    }
  }

  // Limpiar todas las validaciones visuales
  clearValidationStyles() {
    const inputs = document.querySelectorAll(".form-control");
    inputs.forEach((input) => {
      input.classList.remove("is-valid", "is-invalid");
    });

    const errorDivs = document.querySelectorAll(
      ".invalid-feedback, .text-danger"
    );
    errorDivs.forEach((div) => {
      div.style.display = "none";
    });
  }
}

export default AppointmentValidationManager;
