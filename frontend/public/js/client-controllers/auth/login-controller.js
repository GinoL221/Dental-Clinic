class LoginController {
  constructor() {
    this.loginForm = null;
    this.emailInput = null;
    this.passwordInput = null;
    this.submitButton = null;

    this.init();
  }

  init() {
    this.bindElements();
    this.attachEvents();
    this.addVisualEffects();
  }

  bindElements() {
    this.loginForm = document.getElementById("loginForm");
    this.emailInput = document.getElementById("email");
    this.passwordInput = document.getElementById("password");
    this.submitButton = this.loginForm.querySelector('button[type="submit"]');
  }

  attachEvents() {
    this.loginForm.addEventListener("submit", this.handleSubmit.bind(this));
  }

  handleSubmit(e) {
    const email = this.emailInput.value.trim();
    const password = this.passwordInput.value.trim();

    // Validaciones básicas antes de enviar al servidor
    if (!this.validateForm(email, password)) {
      e.preventDefault();
      return;
    }

    // Activar estado de carga
    UIUtils.setButtonLoading(this.submitButton, true, "Ingresar");
  }

  validateForm(email, password) {
    if (!email || !password) {
      UIUtils.showError("Por favor, completa todos los campos");
      return false;
    }

    if (!UIUtils.isValidEmail(email)) {
      UIUtils.showError("Por favor, ingresa un correo electrónico válido");
      return false;
    }

    return true;
  }

  addVisualEffects() {
    [this.emailInput, this.passwordInput].forEach((input) => {
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
  new LoginController();
});
