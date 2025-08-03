export function authMiddleware(next) {
  const token = localStorage.getItem("token");
  const path = window.location.pathname;
  if (!token && path !== "/login" && path !== "/register") {
    window.history.pushState({}, '', '/login');
    if (typeof window.routes === "function") window.routes();
    else location.reload();
    return;
  }
  next();
}

function isAuthenticated() {
  const token = localStorage.getItem("token");
  // Aquí podrías agregar lógica para validar expiración del token si lo deseas
  return !!token;
}

// Al cargar la página, verifica autenticación
if (!isAuthenticated()) {
  window.location.href = "/login";
} else {
  renderHome();
}
