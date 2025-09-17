class AuthValidationManager {
  constructor() {
    this.validationRules = {
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        maxLength: 50,
        errorMessage: "Ingrese un email válido",
      },
      password: {
        required: true,
        minLength: 6,
        maxLength: 20,
        errorMessage: "La contraseña debe tener entre 6 y 20 caracteres",
      },
      firstName: {
        required: true,
        minLength: 2,
        maxLength: 15,
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        errorMessage:
          "El nombre debe tener entre 2 y 15 caracteres y solo contener letras",
      },
      lastName: {
        required: true,
        minLength: 2,
        maxLength: 15,
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        errorMessage:
          "El apellido debe tener entre 2 y 15 caracteres y solo contener letras",
      },
      cardIdentity: {
        required: false,
        minLength: 7,
        maxLength: 25,
        pattern: /^[0-9]+$/,
        errorMessage: "La cédula debe tener entre 7 y 25 dígitos",
      },
      street: {
        required: true,
        minLength: 2,
        maxLength: 50,
        errorMessage: "La calle debe tener entre 2 y 50 caracteres",
      },
      number: {
        required: true,
        pattern: /^[0-9A-Za-z\-\s]+$/,
        errorMessage:
          "El número debe contener solo números, letras, guiones y espacios",
      },
      location: {
        required: true,
        minLength: 2,
        maxLength: 50,
        errorMessage: "La localidad debe tener entre 2 y 50 caracteres",
      },
      province: {
        required: true,
        minLength: 2,
        maxLength: 50,
        errorMessage: "La provincia debe tener entre 2 y 50 caracteres",
      },
    };

    this.strengthRules = {
      minLength: 8,
      hasUpperCase: /[A-Z]/,
      hasLowerCase: /[a-z]/,
      hasNumbers: /\d/,
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/,
    };
  }

  // Validar un campo específico
  validateField(fieldName, value) {
    const rule = this.validationRules[fieldName];
    if (!rule) {
      return { isValid: true, message: "" };
    }

    const trimmedValue = value ? value.trim() : "";

    // Campo requerido y vacío
    if (rule.required && !trimmedValue) {
      return {
        isValid: false,
        message: `${this.getFieldDisplayName(fieldName)} es requerido`,
      };
    }

    // Campo opcional y vacío
    if (!rule.required && !trimmedValue) {
      return { isValid: true, message: "" };
    }

    // Validar longitud mínima
    if (rule.minLength && trimmedValue.length < rule.minLength) {
      return {
        isValid: false,
        message: `Debe tener al menos ${rule.minLength} caracteres`,
      };
    }

    // Validar longitud máxima
    if (rule.maxLength && trimmedValue.length > rule.maxLength) {
      return {
        isValid: false,
        message: `No puede exceder ${rule.maxLength} caracteres`,
      };
    }

    // Validar patrón
    if (rule.pattern && !rule.pattern.test(trimmedValue)) {
      return {
        isValid: false,
        message: rule.errorMessage,
      };
    }

    return { isValid: true, message: "" };
  }

  // Validar fortaleza de contraseña
  validatePasswordStrength(password) {
    if (!password) {
      return {
        strength: 0,
        level: "Muy débil",
        suggestions: ["Ingrese una contraseña"],
        isStrong: false,
      };
    }

    let score = 0;
    const suggestions = [];

    // Longitud mínima
    if (password.length >= this.strengthRules.minLength) {
      score += 20;
    } else {
      suggestions.push(
        `Use al menos ${this.strengthRules.minLength} caracteres`
      );
    }

    // Mayúsculas
    if (this.strengthRules.hasUpperCase.test(password)) {
      score += 20;
    } else {
      suggestions.push("Incluya al menos una letra mayúscula");
    }

    // Minúsculas
    if (this.strengthRules.hasLowerCase.test(password)) {
      score += 20;
    } else {
      suggestions.push("Incluya al menos una letra minúscula");
    }

    // Números
    if (this.strengthRules.hasNumbers.test(password)) {
      score += 20;
    } else {
      suggestions.push("Incluya al menos un número");
    }

    // Caracteres especiales
    if (this.strengthRules.hasSpecialChars.test(password)) {
      score += 20;
    } else {
      suggestions.push("Incluya al menos un carácter especial (!@#$%^&*)");
    }

    // Determinar nivel
    let level, isStrong;
    if (score >= 80) {
      level = "Muy fuerte";
      isStrong = true;
    } else if (score >= 60) {
      level = "Fuerte";
      isStrong = true;
    } else if (score >= 40) {
      level = "Moderada";
      isStrong = false;
    } else if (score >= 20) {
      level = "Débil";
      isStrong = false;
    } else {
      level = "Muy débil";
      isStrong = false;
    }

    return {
      strength: score,
      level,
      suggestions,
      isStrong,
    };
  }

  // Validar coincidencia de contraseñas
  validatePasswordMatch(password, confirmPassword) {
    if (!confirmPassword) {
      return {
        isValid: true,
        message: "",
      };
    }

    const isMatch = password === confirmPassword;
    return {
      isValid: isMatch,
      message: isMatch ? "" : "Las contraseñas no coinciden",
    };
  }

  // Validar datos de login
  validateLoginData(data) {
    const errors = [];

    // Validar email
    const emailValidation = this.validateField("email", data.email);
    if (!emailValidation.isValid) {
      errors.push(`Email: ${emailValidation.message}`);
    }

    // Validar password
    const passwordValidation = this.validateField("password", data.password);
    if (!passwordValidation.isValid) {
      errors.push(`Contraseña: ${passwordValidation.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  // Validar datos de registro
  validateRegisterData(data) {
    const errors = [];
    const warnings = [];

    // Validar campos requeridos
    const requiredFields = ["email", "password", "firstName", "lastName"];

    requiredFields.forEach((field) => {
      const validation = this.validateField(field, data[field]);
      if (!validation.isValid) {
        errors.push(
          `${this.getFieldDisplayName(field)}: ${validation.message}`
        );
      }
    });

    // Validar campos opcionales si están presentes
    const optionalFields = ["cardIdentity", "address"];

    optionalFields.forEach((field) => {
      if (data[field]) {
        const validation = this.validateField(field, data[field]);
        if (!validation.isValid) {
          errors.push(
            `${this.getFieldDisplayName(field)}: ${validation.message}`
          );
        }
      }
    });

    // Validar confirmación de contraseña
    const passwordMatch = this.validatePasswordMatch(
      data.password,
      data.confirmPassword
    );
    if (!passwordMatch.isValid) {
      errors.push(passwordMatch.message);
    }

    // Evaluar fortaleza de contraseña
    if (data.password) {
      const strength = this.validatePasswordStrength(data.password);
      if (!strength.isStrong) {
        warnings.push(
          `Contraseña ${strength.level.toLowerCase()}: ${strength.suggestions.join(
            ", "
          )}`
        );
      }
    }

    // Validaciones adicionales de negocio

    // Verificar formato de email común
    if (data.email && this.validateField("email", data.email).isValid) {
      const emailParts = data.email.toLowerCase().split("@");
      const commonDomains = [
        "gmail.com",
        "yahoo.com",
        "hotmail.com",
        "outlook.com",
      ];
      if (
        !commonDomains.some((domain) => emailParts[1] === domain) &&
        !emailParts[1].includes(".edu") &&
        !emailParts[1].includes(".gov")
      ) {
        warnings.push("Verifique que el dominio del email sea correcto");
      }
    }

    // Verificar que nombre y apellido no sean iguales
    if (
      data.name &&
      data.lastName &&
      data.name.trim().toLowerCase() === data.lastName.trim().toLowerCase()
    ) {
      warnings.push(
        "El nombre y apellido son idénticos, verifique que sea correcto"
      );
    }

    // Validar campos de dirección
    const addressFields = [
      { key: "street", label: "Calle" },
      { key: "number", label: "Número" },
      { key: "location", label: "Localidad" },
      { key: "province", label: "Provincia" },
    ];

    if (data.address) {
      addressFields.forEach((field) => {
        const value = data.address[field.key];
        const ruleName = `address_${field.key}`;
        const validation = this.validateField(ruleName, value);
        if (!validation.isValid) {
          errors.push(`${field.label}: ${validation.message}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      warnings: warnings,
      hasWarnings: warnings.length > 0,
    };
  }

  // Configurar validación en tiempo real
  setupRealTimeValidation(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    console.log(
      `🔧 AuthValidationManager - Configurando validación para ${formId}`
    );

    // Configurar validación para cada campo
    Object.keys(this.validationRules).forEach((fieldName) => {
      this.setupFieldValidation(form, fieldName);
    });

    // Configuraciones especiales según el tipo de formulario
    if (formId === "registerForm") {
      this.setupPasswordStrengthIndicator(form);
      this.setupPasswordMatchValidation(form);
    }
  }

  // Configurar validación de campo individual
  setupFieldValidation(form, fieldName) {
    const field = form.querySelector(`#${fieldName}, [name="${fieldName}"]`);
    if (!field) return;

    // Validación en blur
    field.addEventListener("blur", () => {
      this.validateFieldVisually(field, fieldName);
    });

    // Limpiar validación en input para mejor UX
    field.addEventListener("input", () => {
      if (field.classList.contains("is-invalid")) {
        this.clearFieldValidation(field);
      }
    });
  }

  // Configurar indicador de fortaleza de contraseña
  setupPasswordStrengthIndicator(form) {
    const passwordField = form.querySelector('#password, [name="password"]');
    if (!passwordField) return;

    // Crear indicador si no existe
    let indicator = form.querySelector(".password-strength-indicator");
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.className = "password-strength-indicator mt-2";
      passwordField.parentNode.appendChild(indicator);
    }

    // Actualizar indicador en tiempo real
    passwordField.addEventListener("input", () => {
      const password = passwordField.value;
      if (!password) {
        indicator.innerHTML = "";
        return;
      }

      const strength = this.validatePasswordStrength(password);
      this.updatePasswordStrengthDisplay(indicator, strength);
    });
  }

  // Actualizar display de fortaleza de contraseña
  updatePasswordStrengthDisplay(indicator, strength) {
    const colorClass = this.getStrengthColorClass(strength.strength);

    indicator.innerHTML = `
      <div class="d-flex align-items-center">
        <small class="me-2">Fortaleza:</small>
        <div class="progress flex-grow-1 me-2" style="height: 6px;">
          <div class="progress-bar ${colorClass}" 
               style="width: ${strength.strength}%"
               role="progressbar"></div>
        </div>
        <small class="${colorClass.replace("bg-", "text-")}">${
      strength.level
    }</small>
      </div>
      ${
        strength.suggestions.length > 0
          ? `
        <small class="text-muted d-block mt-1">
          ${strength.suggestions.join(", ")}
        </small>
      `
          : ""
      }
    `;
  }

  // Obtener clase de color para fortaleza
  getStrengthColorClass(strength) {
    if (strength >= 80) return "bg-success";
    if (strength >= 60) return "bg-info";
    if (strength >= 40) return "bg-warning";
    if (strength >= 20) return "bg-danger";
    return "bg-secondary";
  }

  // Configurar validación de coincidencia de contraseñas
  setupPasswordMatchValidation(form) {
    const passwordField = form.querySelector('#password, [name="password"]');
    const confirmPasswordField = form.querySelector(
      '#confirmPassword, [name="confirmPassword"]'
    );

    if (!passwordField || !confirmPasswordField) return;

    const validateMatch = () => {
      const password = passwordField.value;
      const confirmPassword = confirmPasswordField.value;

      if (confirmPassword) {
        const validation = this.validatePasswordMatch(
          password,
          confirmPassword
        );
        this.showFieldValidation(
          confirmPasswordField,
          validation.isValid,
          validation.message
        );
      }
    };

    passwordField.addEventListener("input", validateMatch);
    confirmPasswordField.addEventListener("input", validateMatch);
  }

  // Validar campo visualmente
  validateFieldVisually(field, fieldName) {
    const value = field.value;
    const validation = this.validateField(fieldName, value);

    this.showFieldValidation(field, validation.isValid, validation.message);
    return validation.isValid;
  }

  // Mostrar validación de campo
  showFieldValidation(field, isValid, message) {
    // Limpiar clases anteriores
    field.classList.remove("is-valid", "is-invalid");

    // Aplicar nueva validación solo si hay contenido
    if (field.value.trim() !== "") {
      field.classList.add(isValid ? "is-valid" : "is-invalid");
    }

    // Mostrar/ocultar mensaje de error
    this.showFieldError(field, isValid ? "" : message);
  }

  // Mostrar error en campo
  showFieldError(field, message) {
    // Buscar el contenedor de error específico por ID
    const fieldName = field.name || field.id;
    const errorContainer = document.getElementById(`${fieldName}-error`);

    if (errorContainer) {
      // Usar el contenedor específico que ya existe
      if (message) {
        errorContainer.textContent = message;
        errorContainer.style.display = "block";
      } else {
        errorContainer.textContent = "";
        errorContainer.style.display = "none";
      }
    } else {
      // Fallback: método anterior para compatibilidad
      const existingFeedback =
        field.parentNode.querySelector(".invalid-feedback");
      if (existingFeedback) {
        existingFeedback.remove();
      }

      if (message) {
        const feedback = document.createElement("div");
        feedback.className = "invalid-feedback";
        feedback.textContent = message;
        field.parentNode.appendChild(feedback);
      }
    }
  }

  // Limpiar validación de campo
  clearFieldValidation(field) {
    field.classList.remove("is-valid", "is-invalid");

    // Limpiar el contenedor específico de error
    const fieldName = field.name || field.id;
    const errorContainer = document.getElementById(`${fieldName}-error`);

    if (errorContainer) {
      errorContainer.textContent = "";
      errorContainer.style.display = "none";
    }

    // Fallback: limpiar feedback dinámico para compatibilidad
    const feedback = field.parentNode.querySelector(".invalid-feedback");
    if (feedback) {
      feedback.remove();
    }
  }

  // Obtener nombre de campo para mostrar
  getFieldDisplayName(fieldName) {
    const displayNames = {
      email: "Email",
      password: "Contraseña",
      confirmPassword: "Confirmación de contraseña",
      firstName: "Nombre",
      lastName: "Apellido",
      cardIdentity: "Cédula",
      street: "Calle",
      number: "Número",
      location: "Localidad",
      province: "Provincia",
      address: "Dirección",
    };
    return displayNames[fieldName] || fieldName;
  }

  // Validar formulario completo antes del envío
  validateFormBeforeSubmit(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;

    let isValid = true;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validar según el tipo de formulario
    let validation;
    if (formId === "loginForm") {
      validation = this.validateLoginData(data);
    } else if (formId === "registerForm") {
      validation = this.validateRegisterData(data);
    } else {
      return false;
    }

    // Mostrar errores si los hay
    if (!validation.isValid) {
      validation.errors.forEach((error) => {
        console.error("Validation error:", error);
      });
      isValid = false;
    }

    // Mostrar advertencias si las hay
    if (validation.warnings && validation.warnings.length > 0) {
      validation.warnings.forEach((warning) => {
        console.warn("Validation warning:", warning);
      });
    }

    return isValid;
  }

  // Limpiar toda la validación visual del formulario
  clearAllValidation(form) {
    if (!form) return;

    const fields = form.querySelectorAll(".form-control");
    fields.forEach((field) => {
      this.clearFieldValidation(field);
    });

    // Limpiar todos los contenedores de error específicos
    const errorContainers = form.querySelectorAll(
      '.invalid-feedback[id$="-error"]'
    );
    errorContainers.forEach((container) => {
      container.textContent = "";
      container.style.display = "none";
    });

    // Limpiar indicador de fortaleza de contraseña
    const strengthIndicator = form.querySelector(
      ".password-strength-indicator"
    );
    if (strengthIndicator) {
      strengthIndicator.innerHTML = "";
    }
  }

  // Método para inicializar la validación
  init(formId) {
    console.log("🚀 AuthValidationManager - Inicializando validación");

    // Configurar validación en tiempo real
    this.setupRealTimeValidation(formId);

    // Limpiar errores al iniciar
    const form = document.getElementById(formId);
    this.clearAllValidation(form);

    console.log(
      "✅ AuthValidationManager - Validación configurada correctamente"
    );
  }

  // Obtener sugerencias de seguridad
  getSecurityTips() {
    return [
      "Use una contraseña única que no haya usado en otros sitios",
      "Combine letras mayúsculas y minúsculas, números y símbolos",
      "Evite usar información personal como fechas de nacimiento",
      "Considere usar un gestor de contraseñas",
      "Cambie su contraseña regularmente",
      "No comparta su contraseña con otras personas",
    ];
  }
}

export default AuthValidationManager;
