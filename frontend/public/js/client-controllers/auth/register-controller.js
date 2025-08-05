class RegisterController {
  constructor() {
    this.registerForm = null;
    this.firstNameInput = null;
    this.lastNameInput = null;
    this.emailInput = null;
    this.passwordInput = null;
    this.confirmPasswordInput = null;
    this.roleSelect = null;
    this.submitButton = null;

    this.init();
  }

  init() {
    // Verificar si ya está autenticado
    if (AuthAPI.isAuthenticated()) {
      window.location.href = "/dentists";
      return;
    }

    this.bindElements();
    this.attachEvents();
    this.addVisualEffects();
  }

  bindElements() {
    this.registerForm = document.getElementById("registerForm");
    this.firstNameInput = document.getElementById("firstName");
    this.lastNameInput = document.getElementById("lastName");
    this.emailInput = document.getElementById("email");
    this.passwordInput = document.getElementById("password");
    this.confirmPasswordInput = document.getElementById("confirmPassword");
    this.roleSelect = document.getElementById("role");
    this.submitButton = this.registerForm.querySelector(
      'button[type="submit"]'
    );
  }

  attachEvents() {
    this.registerForm.addEventListener("submit", this.handleSubmit.bind(this));
    this.confirmPasswordInput.addEventListener(
      "input",
      this.validatePasswordMatch.bind(this)
    );
  }

  async handleSubmit(e) {
    e.preventDefault();

    const formData = this.getFormData();

    // Validaciones básicas
    if (!this.validateForm(formData)) {
      return;
    }

    // Activar estado de carga
    UIUtils.setButtonLoading(this.submitButton, true, "Registrarse");

    try {
      // Llamar a la API de registro
      const response = await AuthAPI.register(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.password,
        formData.role
      );

      // Mostrar mensaje de éxito
      UIUtils.showSuccess("¡Registro exitoso! Bienvenido a la clínica.");

      // Limpiar el formulario
      UIUtils.clearForm("registerForm");

      // Redirigir después de un breve delay
      setTimeout(() => {
        window.location.href = "/dentists";
      }, 1000);
    } catch (error) {
      // Mostrar error
      UIUtils.showError(
        error.message || "Error al registrar usuario. Intenta nuevamente."
      );
    } finally {
      // Rehabilitar el botón
      UIUtils.setButtonLoading(this.submitButton, false, "Registrarse");
    }
  }

  getFormData() {
    return {
      firstName: this.firstNameInput.value.trim(),
      lastName: this.lastNameInput.value.trim(),
      email: this.emailInput.value.trim(),
      password: this.passwordInput.value.trim(),
      confirmPassword: this.confirmPasswordInput.value.trim(),
      role: this.roleSelect.value,
    };
  }

  validateForm(formData) {
    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      UIUtils.showError("Por favor, completa todos los campos");
      return false;
    }

    if (!UIUtils.isValidEmail(email)) {
      UIUtils.showError("Por favor, ingresa un correo electrónico válido");
      return false;
    }

    if (password.length < 6) {
      UIUtils.showError("La contraseña debe tener al menos 6 caracteres");
      return false;
    }

    if (password !== confirmPassword) {
      UIUtils.showError("Las contraseñas no coinciden");
      return false;
    }

    return true;
  }

  validatePasswordMatch() {
    const password = this.passwordInput.value;
    const confirmPassword = this.confirmPasswordInput.value;

    if (confirmPassword && password !== confirmPassword) {
      this.confirmPasswordInput.classList.add("is-invalid");
    } else {
      this.confirmPasswordInput.classList.remove("is-invalid");
    }
  }

  addVisualEffects() {
    const inputs = [
      this.firstNameInput,
      this.lastNameInput,
      this.emailInput,
      this.passwordInput,
      this.confirmPasswordInput,
    ];

    inputs.forEach((input) => {
      input.addEventListener("focus", function () {
        this.parentElement.classList.add("input-focused");
      });

      input.addEventListener("blur", function () {
        this.parentElement.classList.remove("input-focused");
      });
    });
  }
}

// Inicializar el controlador cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  new RegisterController();
});
