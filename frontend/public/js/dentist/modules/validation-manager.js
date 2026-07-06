import logger from '../../logger.js';

class DentistValidationManager {
  constructor() {
    this.validationRules = {
      firstName: {
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        errorMessage: 'El nombre debe tener entre 2 y 50 caracteres y solo contener letras',
      },
      lastName: {
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        errorMessage: 'El apellido debe tener entre 2 y 50 caracteres y solo contener letras',
      },
      registrationNumber: {
        minLength: 3,
        maxLength: 20,
        pattern: /^[a-zA-Z0-9]+$/,
        errorMessage: 'La matrícula debe tener entre 3 y 20 caracteres alfanuméricos',
      },
      specialty: {
        maxLength: 100,
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/,
        errorMessage: 'La especialidad no puede exceder 100 caracteres y solo contener letras',
        required: false,
      },
    };
  }

  // Validar un campo específico
  /**
   * @param {string} fieldName
   * @param {string} value
   * @returns {{isValid: boolean, message: string}}
   */
  validateField(fieldName, value) {
    const rule = /** @type {Record<string, any>} */ (this.validationRules)[fieldName];
    if (!rule) {
      return { isValid: true, message: '' };
    }

    // Campo opcional y vacío
    if (!rule.required && (!value || value.trim() === '')) {
      return { isValid: true, message: '' };
    }

    const trimmedValue = value ? value.trim() : '';

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
    if (rule.pattern && trimmedValue && !rule.pattern.test(trimmedValue)) {
      return {
        isValid: false,
        message: rule.errorMessage,
      };
    }

    return { isValid: true, message: '' };
  }

  // Validar todos los datos del dentista
  /**
   * @param {any} data
   * @returns {{isValid: boolean, errors: string[], warnings: string[]}}
   */
  validateDentistData(data) {
    const errors = [];
    const warnings = [];

    // Validar campos requeridos
    const requiredFields = ['firstName', 'lastName', 'registrationNumber'];

    requiredFields.forEach((field) => {
      if (!data[field] || data[field].trim() === '') {
        errors.push(`${this.getFieldDisplayName(field)} es requerido`);
        return;
      }

      const validation = this.validateField(field, data[field]);
      if (!validation.isValid) {
        errors.push(`${this.getFieldDisplayName(field)}: ${validation.message}`);
      }
    });

    // Validar campos opcionales
    if (data.specialty) {
      const specialtyValidation = this.validateField('specialty', data.specialty);
      if (!specialtyValidation.isValid) {
        errors.push(`Especialidad: ${specialtyValidation.message}`);
      }
    }

    // Verificar que el nombre y apellido no sean iguales
    if (
      data.firstName &&
      data.lastName &&
      data.firstName.trim().toLowerCase() === data.lastName.trim().toLowerCase()
    ) {
      warnings.push('El nombre y apellido son iguales, verifique que sea correcto');
    }

    // Verificar longitud de matrícula común
    if (data.registrationNumber && data.registrationNumber.trim().length < 5) {
      warnings.push('La matrícula parece ser muy corta, verifique que sea correcta');
    }

    // Verificar formato típico de matrícula (letras seguidas de números)
    if (data.registrationNumber && !/^[A-Z]+\d+$/i.test(data.registrationNumber.trim())) {
      warnings.push('El formato de matrícula no sigue el patrón típico (letras + números)');
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      warnings: warnings,
    };
  }

  // Obtener nombre de campo para mostrar
  /**
   * @param {string} fieldName
   * @returns {string}
   */
  getFieldDisplayName(fieldName) {
    const displayNames = /** @type {Record<string, string>} */ ({
      firstName: 'Nombre',
      lastName: 'Apellido',
      registrationNumber: 'Matrícula',
      specialty: 'Especialidad',
    });
    return displayNames[fieldName] || fieldName;
  }

  // Validar duplicado de matrícula
  /**
   * @param {string} registrationNumber
   * @param {number|null} [currentDentistId]
   * @param {any} [dataManager]
   * @returns {Promise<{isValid: boolean, message: string}>}
   */
  async validateUniqueRegistrationNumber(registrationNumber, currentDentistId = null, dataManager) {
    try {
      // Validar que registrationNumber sea válido
      if (!registrationNumber || typeof registrationNumber !== 'string') {
        return { isValid: true, message: '' };
      }

      const dentists = await dataManager.loadAllDentists();

      const duplicate = dentists.find(
        (/** @type {any} */ dentist) =>
          dentist.registrationNumber &&
          typeof dentist.registrationNumber === 'string' &&
          dentist.registrationNumber.toLowerCase() === registrationNumber.toLowerCase() &&
          dentist.id !== currentDentistId,
      );

      if (duplicate) {
        return {
          isValid: false,
          message: `La matrícula ${registrationNumber} ya está registrada para Dr. ${duplicate.firstName} ${duplicate.lastName}`,
        };
      }

      return { isValid: true, message: '' };
    } catch (error) {
      logger.error('Error al validar matrícula única:', error);
      return {
        isValid: false,
        message: 'Error al verificar duplicados de matrícula',
      };
    }
  }

  // Configurar validación en tiempo real
  /**
   * @param {string} formId
   * @returns {void}
   */
  setupRealTimeValidation(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    logger.debug(`🔧 DentistValidationManager - Configurando validación para ${formId}`);

    // Configurar validación para cada campo
    Object.keys(this.validationRules).forEach((fieldName) => {
      this.setupFieldValidation(form, fieldName);
    });

    // Validación de matrícula única con debounce
    this.setupUniqueValidation(form);
  }

  // Configurar validación de campo individual
  /**
   * @param {any} form
   * @param {string} fieldName
   * @returns {void}
   */
  setupFieldValidation(form, fieldName) {
    // Buscar el campo por diferentes nombres posibles
    const possibleSelectors = [`#${fieldName}`, `[name="${fieldName}"]`];

    let field = null;
    for (const selector of possibleSelectors) {
      field = form.querySelector(selector);
      if (field) break;
    }

    if (!field) return;

    // Eventos de validación
    field.addEventListener('blur', (/** @type {any} */ e) => {
      this.validateFieldVisually(e.target, fieldName);
    });

    field.addEventListener('input', (/** @type {any} */ e) => {
      // Limpiar validación anterior en input para mejor UX
      if (e.target.classList.contains('is-invalid')) {
        this.validateFieldVisually(e.target, fieldName);
      }
    });
  }

  // Configurar validación única (matrícula)
  /**
   * @param {any} form
   * @returns {void}
   */
  setupUniqueValidation(form) {
    const regNumberField = form.querySelector('#registrationNumber, [name="registrationNumber"]');
    if (!regNumberField) return;

    /** @type {any} */
    let validationTimeout;

    regNumberField.addEventListener('input', (/** @type {any} */ e) => {
      clearTimeout(validationTimeout);

      // Remover validación de unicidad anterior
      this.clearUniqueValidationMessage(e.target);

      // Validar después de 1 segundo de inactividad
      validationTimeout = setTimeout(async () => {
        await this.validateUniqueFieldVisually(e.target);
      }, 1000);
    });
  }

  // Validar campo visualmente
  /**
   * @param {any} field
   * @param {string} fieldName
   * @returns {boolean}
   */
  validateFieldVisually(field, fieldName) {
    const value = field.value;
    const validation = this.validateField(fieldName, value);

    // Limpiar clases anteriores
    field.classList.remove('is-valid', 'is-invalid');

    // Aplicar nueva validación solo si hay contenido
    if (value.trim() !== '') {
      field.classList.add(validation.isValid ? 'is-valid' : 'is-invalid');

      // Mostrar mensaje de error
      this.showFieldError(field, validation.isValid ? '' : validation.message);
    } else {
      this.hideFieldError(field);
    }

    return validation.isValid;
  }

  // Validar unicidad visualmente
  /**
   * @param {any} field
   * @returns {Promise<void>}
   */
  async validateUniqueFieldVisually(field) {
    if (!field.value.trim()) return;

    const formElement = field.closest('form');
    if (!formElement) return;
    const currentDentistIdInput = formElement.querySelector('#dentist_id');
    const currentDentistId =
      currentDentistIdInput && currentDentistIdInput.value
        ? Number(currentDentistIdInput.value)
        : null;

    try {
      // Usar el dataManager global si está disponible
      const dataManager = /** @type {any} */ (window).dentistController?.dataManager;
      if (!dataManager) return;

      const validation = await this.validateUniqueRegistrationNumber(
        field.value.trim(),
        currentDentistId,
        dataManager,
      );

      if (!validation.isValid) {
        field.classList.remove('is-valid');
        field.classList.add('is-invalid');
        this.showFieldError(field, validation.message, 'unique-error');
      } else if (field.classList.contains('is-invalid')) {
        // Solo cambiar a válido si no hay otros errores
        const basicValidation = this.validateField('registrationNumber', field.value);
        if (basicValidation.isValid) {
          field.classList.remove('is-invalid');
          field.classList.add('is-valid');
          this.hideFieldError(field);
        }
      }
    } catch (error) {
      logger.error('Error en validación única:', error);
    }
  }

  // Mostrar error en campo
  /**
   * @param {any} field
   * @param {string} message
   * @param {string} [className]
   * @returns {void}
   */
  showFieldError(field, message, className = 'invalid-feedback') {
    if (!message) {
      this.hideFieldError(field);
      return;
    }

    let feedback = field.parentNode.querySelector(`.${className}`);

    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = className;
      field.parentNode.appendChild(feedback);
    }

    feedback.textContent = message;
    feedback.style.display = 'block';
  }

  // Ocultar error de campo
  /**
   * @param {any} field
   * @param {string} [className]
   * @returns {void}
   */
  hideFieldError(field, className = 'invalid-feedback') {
    if (!field || !field.parentNode) return;
    const feedback = field.parentNode.querySelector(`.${className}`);
    if (feedback) {
      feedback.style.display = 'none';
    }
  }

  // Limpiar mensaje de validación única
  /**
   * @param {any} field
   * @returns {void}
   */
  clearUniqueValidationMessage(field) {
    this.hideFieldError(field, 'unique-error');
  }

  // Limpiar toda la validación visual
  /**
   * @param {any} form
   * @returns {void}
   */
  clearAllValidation(form) {
    if (!form) return;

    const fields = form.querySelectorAll('.form-control');
    fields.forEach((/** @type {any} */ field) => {
      field.classList.remove('is-valid', 'is-invalid');
    });

    const feedbacks = form.querySelectorAll('.invalid-feedback, .unique-error');
    feedbacks.forEach((/** @type {any} */ feedback) => {
      feedback.style.display = 'none';
    });
  }

  // Validar formulario completo antes del envío
  /**
   * @param {string} formId
   * @returns {boolean}
   */
  validateFormBeforeSubmit(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;

    let isValid = true;
    const fields = form.querySelectorAll('.form-control');

    fields.forEach((/** @type {any} */ field) => {
      const fieldName = this.getFieldNameFromElement(field);
      if (fieldName && /** @type {Record<string, any>} */ (this.validationRules)[fieldName]) {
        const fieldValid = this.validateFieldVisually(field, fieldName);
        if (!fieldValid) {
          isValid = false;
        }
      }
    });

    return isValid;
  }

  // Obtener nombre de campo desde elemento
  /**
   * @param {any} element
   * @returns {string|null}
   */
  getFieldNameFromElement(element) {
    // Intentar obtener por ID
    if (element.id && /** @type {Record<string, any>} */ (this.validationRules)[element.id]) {
      return element.id;
    }

    // Intentar obtener por name
    if (element.name && /** @type {Record<string, any>} */ (this.validationRules)[element.name]) {
      return element.name;
    }

    return null;
  }

  // Validar datos completos con warnings
  /**
   * @param {any} data
   * @returns {{isValid: boolean, errors: string[], warnings: string[], hasWarnings: boolean, allMessages: string[]}}
   */
  validateWithWarnings(data) {
    const validation = this.validateDentistData(data);

    return {
      ...validation,
      hasWarnings: validation.warnings.length > 0,
      allMessages: [...validation.errors, ...validation.warnings],
    };
  }

  // Limpiar validación del formulario
  /**
   * @param {string} formId
   * @returns {void}
   */
  clearFormValidation(formId) {
    const form = document.getElementById(formId);
    if (!form) {
      logger.warn(`⚠️ Formulario ${formId} no encontrado para limpiar validación`);
      return;
    }

    // Limpiar clases de validación
    const fields = form.querySelectorAll('.form-control, .form-select');
    fields.forEach((/** @type {any} */ field) => {
      field.classList.remove('is-valid', 'is-invalid');
    });

    // Remover mensajes de feedback
    const feedbacks = form.querySelectorAll('.invalid-feedback, .valid-feedback');
    feedbacks.forEach((/** @type {any} */ feedback) => feedback.remove());

    logger.info(`🧹 Validación del formulario ${formId} limpiada`);
  }

  // Validar formulario completo
  /**
   * @param {string} formId
   * @returns {{isValid: boolean, errors: string[], warnings: string[]}}
   */
  validateForm(formId) {
    const form = /** @type {HTMLFormElement | null} */ (document.getElementById(formId));
    if (!form) return { isValid: false, errors: ['Formulario no encontrado'], warnings: [] };

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    return this.validateDentistData(data);
  }
}

export default DentistValidationManager;
