export function authMiddleware(next) {
  const token = localStorage.getItem("token");
  const path = window.location.pathname;
  if (!token && path !== "/login" && path !== "/register") {
    window.history.pushState({}, "", "/login");
    if (typeof window.routes === "function") window.routes();
    else location.reload();
    return;
  }
  next();
}

function isAuthenticated() {
  const token = localStorage.getItem("token");
  if (!token) return false;
  return !!token;
}
