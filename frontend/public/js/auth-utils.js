class AuthUtils {
  static setupLogoutConfirmation() {
    const logoutLinks = document.querySelectorAll('a[href="/users/logout"]');

    logoutLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();

        if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
          window.location.href = "/users/logout";
        }
      });
    });
  }

  static isLoggedIn() {
    return document.querySelector(".user-dropdown") !== null;
  }

  static getUserInfo() {
    const userDropdown = document.querySelector(".user-dropdown");
    if (!userDropdown) return null;

    const emailElement = userDropdown.querySelector(".dropdown-header");
    const roleElement = userDropdown.querySelector(".dropdown-item-text");

    return {
      email: emailElement ? emailElement.textContent : null,
      role: roleElement ? roleElement.textContent.replace("Rol: ", "") : null,
    };
  }
}

// Auto-inicializar cuando se carga el DOM
document.addEventListener("DOMContentLoaded", () => {
  AuthUtils.setupLogoutConfirmation();
});

// Hacer disponible globalmente
window.AuthUtils = AuthUtils;
