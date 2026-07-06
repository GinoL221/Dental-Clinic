import logger from '../logger.js';

// Controlador de registro principal
document.addEventListener('DOMContentLoaded', function () {
  logger.debug('Inicializando controlador de registro...');

  // Inicializar validación del formulario
  initializeFormValidation();

  logger.info('Controlador de registro listo');
});

// Inicializar validación del formulario
function initializeFormValidation() {
  logger.debug('Configurando validación del formulario de registro...');

  // Configurar manejo del envío del formulario
  const form = document.getElementById('registerForm');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
    logger.info('Event listener de envío configurado');

    // Validación en tiempo real para email
    const emailInput = /** @type {HTMLInputElement | null} */ (
      form.querySelector('[name="email"]')
    );
    if (emailInput) {
      emailInput.addEventListener('blur', async function () {
        const email = emailInput.value.trim();
        if (email) {
          const exists = await window.AuthAPI.checkEmailExists(email);
          const errorContainer = document.getElementById('email-error');
          if (exists) {
            if (errorContainer) {
              errorContainer.textContent = 'El email ya está registrado';
              errorContainer.style.display = 'block';
            }
            emailInput.classList.add('is-invalid');
          } else {
            if (errorContainer) {
              errorContainer.textContent = '';
              errorContainer.style.display = 'none';
            }
            emailInput.classList.remove('is-invalid');
          }
        }
      });
    }

    // Validación en tiempo real para cardIdentity
    const cardInput = /** @type {HTMLInputElement | null} */ (
      form.querySelector('[name="cardIdentity"]')
    );
    if (cardInput) {
      cardInput.addEventListener('blur', async function () {
        const cardIdentity = cardInput.value.trim();
        if (cardIdentity) {
          const exists = await window.AuthAPI.checkCardIdentityExists(cardIdentity);
          const errorContainer = document.getElementById('cardIdentity-error');
          if (exists) {
            if (errorContainer) {
              errorContainer.textContent = 'El DNI ya está registrado';
              errorContainer.style.display = 'block';
            }
            cardInput.classList.add('is-invalid');
          } else {
            if (errorContainer) {
              errorContainer.textContent = '';
              errorContainer.style.display = 'none';
            }
            cardInput.classList.remove('is-invalid');
          }
        }
      });
    }
  } else {
    logger.error('❌ No se encontró el formulario de registro');
    return;
  }

  // Configurar validación en tiempo real para confirmación de contraseña
  setupPasswordConfirmationValidation();

  logger.info('Validación del formulario configurada');
}

// Manejar envío del formulario
/**
 * @param {any} event
 */
async function handleFormSubmit(event) {
  logger.debug('Procesando envío del formulario...');

  // Prevenir envío por defecto
  event.preventDefault();

  try {
    // Obtener datos del formulario
    const form = /** @type {HTMLFormElement} */ (event.target);
    const formData = new FormData(form);
    const userData = Object.fromEntries(formData.entries());

    logger.debug('Datos capturados del formulario:', userData);

    // Validar email y cardIdentity en el backend antes de registrar
    const emailExists = await window.AuthAPI.checkEmailExists(String(userData.email));
    if (emailExists) {
      showFormError('El email ya está registrado. Por favor, usa otro.');
      return;
    }
    const cardIdentityExists = await window.AuthAPI.checkCardIdentityExists(
      String(userData.cardIdentity),
    );
    if (cardIdentityExists) {
      showFormError('El DNI ya está registrado. Por favor, usa otro.');
      return;
    }

    await processRegistration(userData);
  } catch (error) {
    logger.error('❌ Error al procesar registro:', error);
    alert('Error al procesar el registro. Inténtelo nuevamente.');
  }
}

// Procesar registro
/**
 * @param {any} userData
 */
async function processRegistration(userData) {
  try {
    // Validar contraseñas antes de enviar
    if (!userData.password || !userData.confirmPassword) {
      alert('Por favor, complete ambos campos de contraseña');
      return;
    }

    if (userData.password !== userData.confirmPassword) {
      validatePasswordConfirmation(); // Mostrar error visual
      alert('Las contraseñas no coinciden');
      return;
    }

    // Validar campos requeridos
    const requiredFields = ['firstName', 'lastName', 'email', 'cardIdentity'];
    for (let field of requiredFields) {
      if (!userData[field]) {
        alert(`Por favor, complete el campo: ${field}`);
        return;
      }
    }

    // Preparar datos para el backend
    /** @type {any} */
    const mappedData = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'PATIENT',
      cardIdentity: userData.cardIdentity ? parseInt(userData.cardIdentity) : null,
      admissionDate: new Date().toISOString().slice(0, 10),
    };

    // Agregar dirección si hay datos
    const hasAddressData =
      userData.street || userData.number || userData.location || userData.province;

    if (hasAddressData) {
      // Enviar campos de dirección como campos individuales (formato primitivo)
      mappedData.street = userData.street || '';
      mappedData.number = userData.number ? parseInt(userData.number) : null;
      mappedData.location = userData.location || '';
      mappedData.province = userData.province || '';

      logger.debug('Dirección enviada como campos primitivos:', {
        street: mappedData.street,
        number: mappedData.number,
        location: mappedData.location,
        province: mappedData.province,
      });
    }

    // Mostrar indicador de carga
    const submitButton = /** @type {HTMLButtonElement | null} */ (
      document.querySelector('#registerForm button[type="submit"]')
    );
    const originalText = submitButton ? submitButton.textContent : '';
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Registrando...';
    }

    try {
      const response = await fetch('/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mappedData),
      });

      if (response.ok) {
        alert('¡Registro exitoso! Redirigiendo al login...');
        setTimeout(() => {
          window.location.href = '/users/login?registered=true';
        }, 1500);
      } else {
        const errorText = await response.text();
        alert(`Error en el registro: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      const err = /** @type {any} */ (error);
      alert(`Error de conexión: ${err.message || err}`);
    } finally {
      // Restaurar botón
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  } catch (error) {
    logger.error('❌ Error al procesar registro:', error);
    alert('Error al registrar usuario. Inténtelo nuevamente.');
  }
}

// Mapear datos del formulario al formato esperado por el backend
/**
 * @param {any} formData
 */
function mapFormDataToBackendFormat(formData) {
  logger.debug('Datos originales del formulario:', formData);

  /** @type {any} */
  const mappedData = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    password: formData.password,
    role: formData.role || 'PATIENT',
  };

  // Agregar campos opcionales si están presentes
  if (formData.cardIdentity) {
    mappedData.cardIdentity = formData.cardIdentity;
  }

  // Asignar fecha de admisión automática (hoy)
  mappedData.admissionDate = new Date().toISOString().slice(0, 10);

  // Mapear datos de dirección si están presentes
  const hasAddressData =
    formData.street || formData.number || formData.location || formData.province;
  logger.debug('Verificando datos de dirección:', {
    street: formData.street,
    number: formData.number,
    location: formData.location,
    province: formData.province,
    hasAddressData,
  });

  if (hasAddressData) {
    // Enviar campos de dirección como campos individuales (formato primitivo)
    mappedData.street = formData.street || '';
    mappedData.number = formData.number ? parseInt(formData.number) : null;
    mappedData.location = formData.location || '';
    mappedData.province = formData.province || '';

    logger.info('Dirección mapeada como campos primitivos:', {
      street: mappedData.street,
      number: mappedData.number,
      location: mappedData.location,
      province: mappedData.province,
    });
  } else {
    logger.warn('⚠️ No se encontraron datos de dirección');
  }

  logger.debug('📋 Datos finales mapeados:', mappedData);
  return mappedData;
}

// Configurar validación en tiempo real para confirmación de contraseña
function setupPasswordConfirmationValidation() {
  const passwordField = /** @type {HTMLInputElement | null} */ (
    document.querySelector('[name="password"]')
  );
  const confirmPasswordField = /** @type {HTMLInputElement | null} */ (
    document.querySelector('[name="confirmPassword"]')
  );

  if (!passwordField || !confirmPasswordField) {
    logger.warn('⚠️ Campos de contraseña no encontrados');
    return;
  }

  logger.debug('🔧 Configurando eventos para validación de contraseñas...');

  // Validar cuando el usuario escribe en confirmPassword
  confirmPasswordField.addEventListener('input', function () {
    logger.debug('🔍 Validando confirmación de contraseña...');
    validatePasswordConfirmation();
  });

  // Validar cuando el usuario escribe en password (para actualizar confirmPassword)
  passwordField.addEventListener('input', function () {
    // Solo validar si confirmPassword ya tiene contenido
    if (confirmPasswordField.value) {
      logger.debug('🔍 Revalidando confirmación por cambio en password...');
      validatePasswordConfirmation();
    }
  });

  logger.info('✅ Validación en tiempo real de contraseñas configurada');
}

// Función para validar coincidencia de contraseñas
function validatePasswordConfirmation() {
  const passwordField = /** @type {HTMLInputElement | null} */ (
    document.querySelector('[name="password"]')
  );
  const confirmPasswordField = /** @type {HTMLInputElement | null} */ (
    document.querySelector('[name="confirmPassword"]')
  );
  const errorContainer = document.getElementById('confirmPassword-error');

  if (!passwordField || !confirmPasswordField || !errorContainer) {
    logger.warn('⚠️ No se encontraron elementos para validación de contraseñas');
    return false;
  }

  const password = passwordField.value;
  const confirmPassword = confirmPasswordField.value;

  logger.debug(
    `🔍 Validando contraseñas: password='${password}', confirmPassword='${confirmPassword}'`,
  );

  if (confirmPassword && password !== confirmPassword) {
    // Las contraseñas no coinciden
    logger.warn('❌ Las contraseñas no coinciden');
    errorContainer.textContent = 'Las contraseñas no coinciden';
    errorContainer.style.display = 'block';
    confirmPasswordField.classList.add('is-invalid');
    confirmPasswordField.classList.remove('is-valid');
    return false;
  } else if (confirmPassword && password === confirmPassword) {
    // Las contraseñas coinciden
    logger.info('✅ Las contraseñas coinciden');
    errorContainer.textContent = '';
    errorContainer.style.display = 'none';
    confirmPasswordField.classList.remove('is-invalid');
    confirmPasswordField.classList.add('is-valid');
    return true;
  } else {
    // Campo vacío, limpiar estados
    logger.debug('🔄 Campo de confirmación vacío, limpiando estados');
    errorContainer.textContent = '';
    errorContainer.style.display = 'none';
    confirmPasswordField.classList.remove('is-invalid', 'is-valid');
    return false;
  }
}

// Función para mostrar/ocultar contraseña
/**
 * @param {string} inputId
 * @param {HTMLElement} button
 */
function togglePasswordVisibility(inputId, button) {
  const input = /** @type {HTMLInputElement | null} */ (document.getElementById(inputId));
  const icon = /** @type {HTMLElement | null} */ (button.querySelector('i'));

  if (input && icon) {
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'bi bi-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'bi bi-eye';
    }
  }
}

// Función para mostrar error general del formulario
/**
 * @param {string} message
 */
function showFormError(message) {
  // Buscar o crear contenedor de error general
  let errorContainer = document.getElementById('form-general-error');
  if (!errorContainer) {
    errorContainer = document.createElement('div');
    errorContainer.id = 'form-general-error';
    errorContainer.className = 'alert alert-danger mt-3';

    // Insertar antes del botón de envío
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton && submitButton.parentNode) {
      submitButton.parentNode.insertBefore(errorContainer, submitButton);
    }
  }

  errorContainer.innerHTML = `
    <i class="bi bi-exclamation-triangle me-2"></i>
    ${message}
  `;
  errorContainer.style.display = 'block';

  // Scroll hacia el error
  errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Función para mostrar mensaje de éxito
/**
 * @param {string} message
 */
function showSuccessMessage(message) {
  // Buscar o crear contenedor de éxito
  let successContainer = document.getElementById('form-success-message');
  if (!successContainer) {
    successContainer = document.createElement('div');
    successContainer.id = 'form-success-message';
    successContainer.className = 'alert alert-success mt-3';

    // Insertar antes del botón de envío
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton && submitButton.parentNode) {
      submitButton.parentNode.insertBefore(successContainer, submitButton);
    }
  }

  successContainer.innerHTML = `
    <i class="bi bi-check-circle me-2"></i>
    ${message}
  `;
  successContainer.style.display = 'block';

  // Limpiar error si existe
  clearFormError();
}

// Función para limpiar error general del formulario
function clearFormError() {
  const errorContainer = document.getElementById('form-general-error');
  if (errorContainer) {
    errorContainer.style.display = 'none';
  }
}

// Función para mostrar errores
/**
 * @param {string} message
 */
function showErrorMessage(message) {
  const messageContainer = document.getElementById('message');
  if (messageContainer) {
    messageContainer.textContent = message;
    messageContainer.className = 'message error';
    messageContainer.style.display = 'block';
  } else {
    alert(message);
  }
}
