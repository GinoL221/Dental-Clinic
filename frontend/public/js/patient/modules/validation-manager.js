import logger from "../../logger.js";

class PatientValidationManager {
  constructor() {
    this.validationRules = {
      // Campos heredados de User
      firstName: {
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        errorMessage:
          "El nombre debe tener entre 2 y 50 caracteres y solo contener letras",
        required: true,
      },
      lastName: {
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        errorMessage:
          "El apellido debe tener entre 2 y 50 caracteres y solo contener letras",
        required: true,
      },
      email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        errorMessage: "Debe proporcionar un email válido",
        required: true,
      },

      // Campos específicos de Patient
      cardIdentity: {
        minValue: 1,
        maxValue: 999999999,
        pattern: /^\d{7,9}$/,
        errorMessage: "El DNI debe ser un número válido de 7 a 9 dígitos",
        required: true,
      },
      admissionDate: {
        type: "date",
        errorMessage: "Fecha de admisión inválida",
        required: false,
      },
      street: {
        maxLength: 100,
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s,.-]*$/,
        errorMessage: "La calle contiene caracteres inválidos",
        required: false,
      },
      number: {
        minValue: 1,
        maxValue: 99999,
        errorMessage: "El número debe ser válido",
        required: false,
      },
      location: {
        maxLength: 100,
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        errorMessage: "La localidad contiene caracteres inválidos",
        required: false,
      },
      province: {
        maxLength: 50,
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        errorMessage: "La provincia contiene caracteres inválidos",
        required: false,
      },
    };
  }

  // Validar datos del paciente
  validatePatientData(data) {
    const errors = [];
    const warnings = [];

    const requiredFields = ["firstName", "lastName", "email", "cardIdentity"];

    for (const field of requiredFields) {
      if (
        !data[field] ||
        (typeof data[field] === "string" && data[field].trim() === "")
      ) {
        errors.push(`El campo ${this.getFieldLabel(field)} es obligatorio`);
      }
    }

    // Validaciones específicas por campo
    if (data.firstName) {
      const firstNameValidation = this.validateField(
        "firstName",
        data.firstName
      );
      if (!firstNameValidation.isValid) {
        errors.push(...firstNameValidation.errors);
      }
    }

    if (data.lastName) {
      const lastNameValidation = this.validateField("lastName", data.lastName);
      if (!lastNameValidation.isValid) {
        errors.push(...lastNameValidation.errors);
      }
    }

    if (data.email) {
      const emailValidation = this.validateField("email", data.email);
      if (!emailValidation.isValid) {
        errors.push(...emailValidation.errors);
      }
    }

    if (data.cardIdentity) {
      const cardIdentityValidation = this.validateField(
        "cardIdentity",
        data.cardIdentity
      );
      if (!cardIdentityValidation.isValid) {
        errors.push(...cardIdentityValidation.errors);
      }
    }

    if (data.admissionDate && data.admissionDate.trim() !== "") {
      const admissionDateValidation = this.validateAdmissionDate(
        data.admissionDate
      );
      if (!admissionDateValidation.isValid) {
        errors.push(...admissionDateValidation.errors);
      }
      if (admissionDateValidation.warnings) {
        warnings.push(...admissionDateValidation.warnings);
      }
    }

    // ✅ VALIDAR CAMPOS DE ADDRESS SI SE PROPORCIONAN
    if (data.street && data.street.trim() !== "") {
      const streetValidation = this.validateField("street", data.street);
      if (!streetValidation.isValid) {
        errors.push(...streetValidation.errors);
      }
    }

    if (data.number && data.number.toString().trim() !== "") {
      const numberValidation = this.validateField("number", data.number);
      if (!numberValidation.isValid) {
        errors.push(...numberValidation.errors);
      }
    }

    if (data.location && data.location.trim() !== "") {
      const locationValidation = this.validateField("location", data.location);
      if (!locationValidation.isValid) {
        errors.push(...locationValidation.errors);
      }
    }

    if (data.province && data.province.trim() !== "") {
      const provinceValidation = this.validateField("province", data.province);
      if (!provinceValidation.isValid) {
        errors.push(...provinceValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateAdmissionDate(admissionDate) {
    const errors = [];
    const warnings = [];

    if (!admissionDate || admissionDate.trim() === "") {
      // ✅ NO ES OBLIGATORIO, RETORNA VÁLIDO
      return { isValid: true, errors, warnings };
    }

    // Validar formato de fecha (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(admissionDate)) {
      errors.push("La fecha de admisión debe tener formato YYYY-MM-DD");
      return { isValid: false, errors, warnings };
    }

    const date = new Date(admissionDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verificar que sea una fecha válida
    if (isNaN(date.getTime())) {
      errors.push("La fecha de admisión no es válida");
      return { isValid: false, errors, warnings };
    }

    // Verificar que no sea muy antigua (más de 10 años)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    if (date < tenYearsAgo) {
      warnings.push("La fecha de admisión es muy antigua (más de 10 años)");
    }

    // Verificar que no sea futura
    if (date > today) {
      warnings.push("La fecha de admisión está en el futuro");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Obtener etiqueta del campo para mensajes
  getFieldLabel(fieldName) {
    const labels = {
      firstName: "Nombre",
      lastName: "Apellido",
      email: "Email",
      cardIdentity: "DNI",
      admissionDate: "Fecha de Admisión",
      street: "Calle",
      number: "Número",
      location: "Localidad",
      province: "Provincia",
    };
    return labels[fieldName] || fieldName;
  }

  // Validar campo individual
  validateField(fieldName, value) {
    const rule = this.validationRules[fieldName];
    if (!rule) {
      return { isValid: true, errors: [] };
    }

    const errors = [];

    // Verificar longitud mínima
    if (rule.minLength && value.length < rule.minLength) {
      errors.push(rule.errorMessage);
    }

    // Verificar longitud máxima
    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push(rule.errorMessage);
    }

    // Verificar patrón
    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push(rule.errorMessage);
    }

    // Validaciones específicas para números
    if (fieldName === "cardIdentity" || fieldName === "number") {
      const numValue = parseInt(value);
      if (rule.minValue && numValue < rule.minValue) {
        errors.push(rule.errorMessage);
      }
      if (rule.maxValue && numValue > rule.maxValue) {
        errors.push(rule.errorMessage);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validacion en tiempo real
  setupRealTimeValidation(formId) {
    const form = document.getElementById(formId);
    if (!form) {
      logger.warn(`⚠️ Formulario ${formId} no encontrado para validación`);
      return;
    }

    const fieldsToValidate = [
      "firstName",
      "lastName",
      "email",
      "cardIdentity",
      "admissionDate",
      "street",
      "number",
      "location",
      "province",
    ];

    fieldsToValidate.forEach((fieldName) => {
      // ✅ BUSCAR CAMPOS CON Y SIN SUFIJO _edit
      const field =
        form.querySelector(`[name="${fieldName}"]`) ||
        form.querySelector(`[name="${fieldName}_edit"]`) ||
        form.querySelector(`#${fieldName}`) ||
        form.querySelector(`#${fieldName}_edit`);

      if (field) {
        field.addEventListener("blur", () => {
          this.validateFieldRealTime(field, fieldName);
        });

        field.addEventListener("input", () => {
          // Limpiar errores previos en input
          this.clearFieldValidation(field);
        });
      }
    });

  logger.info(`Validación en tiempo real configurada para ${formId}`);
  }

  // Validar campo en tiempo real
  validateFieldRealTime(fieldElement, fieldName) {
    const value = fieldElement.value.trim();

    // Limpiar validación previa
    this.clearFieldValidation(fieldElement);

    if (value === "" && !this.validationRules[fieldName]?.required) {
      return; // Campo opcional vacío
    }

    let validation;
    if (fieldName === "admissionDate") {
      validation = this.validateAdmissionDate(value);
    } else {
      validation = this.validateField(fieldName, value);
    }

    if (!validation.isValid) {
      this.showFieldError(fieldElement, validation.errors[0]);
    } else {
      this.showFieldSuccess(fieldElement);

      // Mostrar advertencias si las hay
      if (validation.warnings && validation.warnings.length > 0) {
        this.showFieldWarning(fieldElement, validation.warnings[0]);
      }
    }
  }

  // Mostrar error en campo
  showFieldError(fieldElement, message) {
    fieldElement.classList.add("is-invalid");
    fieldElement.classList.remove("is-valid");

    let feedback =
      fieldElement.parentElement.querySelector(".invalid-feedback");
    if (!feedback) {
      feedback = document.createElement("div");
      feedback.className = "invalid-feedback";
      fieldElement.parentElement.appendChild(feedback);
    }
    feedback.textContent = message;
  }

  // Mostrar advertencia en campo
  showFieldWarning(fieldElement, message) {
    let warning = fieldElement.parentElement.querySelector(".warning-feedback");
    if (!warning) {
      warning = document.createElement("div");
      warning.className = "warning-feedback text-warning small mt-1";
      fieldElement.parentElement.appendChild(warning);
    }
    warning.textContent = `⚠️ ${message}`;
  }

  // Mostrar éxito en campo
  showFieldSuccess(fieldElement) {
    fieldElement.classList.add("is-valid");
    fieldElement.classList.remove("is-invalid");
  }

  // Limpiar validación del campo
  clearFieldValidation(fieldElement) {
    fieldElement.classList.remove("is-valid", "is-invalid");

    const feedback =
      fieldElement.parentElement.querySelector(".invalid-feedback");
    if (feedback) {
      feedback.remove();
    }

    const warning =
      fieldElement.parentElement.querySelector(".warning-feedback");
    if (warning) {
      warning.remove();
    }
  }

  // Limpiar validación del formulario completo
  clearFormValidation(formId) {
    const form = document.getElementById(formId);
    if (!form) {
      logger.warn(
        `⚠️ Formulario ${formId} no encontrado para limpiar validación`
      );
      return;
    }

    // Limpiar clases de validación
    const fields = form.querySelectorAll(".form-control, .form-select");
    fields.forEach((field) => {
      this.clearFieldValidation(field);
    });

  logger.debug(`Validación del formulario ${formId} limpiada`);
  }

  // Validar formulario completo
  validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) {
      return { isValid: false, errors: ["Formulario no encontrado"] };
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    return this.validatePatientData(data);
  }
}

export default PatientValidationManager;
