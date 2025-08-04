/**
 * Utilidades para manejo de autenticación en el cliente
 */
class AuthUtils {
  
  /**
   * Manejar logout con confirmación
   */
  static setupLogoutConfirmation() {
    const logoutLinks = document.querySelectorAll('a[href="/users/logout"]');
    
    logoutLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
          // Proceder con el logout
          window.location.href = '/users/logout';
        }
      });
    });
  }

  /**
   * Verificar si el usuario está logueado (del lado del cliente)
   */
  static isLoggedIn() {
    return document.querySelector('.user-dropdown') !== null;
  }

  /**
   * Obtener información del usuario desde el DOM
   */
  static getUserInfo() {
    const userDropdown = document.querySelector('.user-dropdown');
    if (!userDropdown) return null;

    const emailElement = userDropdown.querySelector('.dropdown-header');
    const roleElement = userDropdown.querySelector('.dropdown-item-text');
    
    return {
      email: emailElement ? emailElement.textContent : null,
      role: roleElement ? roleElement.textContent.replace('Rol: ', '') : null
    };
  }
}

// Auto-inicializar cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
  AuthUtils.setupLogoutConfirmation();
});

// Hacer disponible globalmente
window.AuthUtils = AuthUtils;
