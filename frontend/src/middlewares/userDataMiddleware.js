/**
 * Middleware para inyectar información del usuario en las vistas
 */
const userDataMiddleware = (req, res, next) => {
  // Obtener datos del usuario desde sesión (prioridad) o cookies (fallback)
  let userEmail, userRole, authToken;
  
  if (req.session && req.session.user) {
    // Usar datos de sesión (más confiable)
    userEmail = req.session.user.email;
    userRole = req.session.user.role;
    authToken = req.session.user.token;
  } else {
    // Fallback a cookies
    userEmail = req.cookies.userEmail;
    userRole = req.cookies.userRole;
    authToken = req.cookies.authToken;
  }

  // Determinar si el usuario está logueado
  const isLoggedIn = !!(userEmail && authToken);

  // Extraer el nombre del usuario desde el email
  let userName = '';
  if (userEmail) {
    userName = userEmail.split('@')[0]; // Tomar la parte antes del @
    // Capitalizar primera letra y limpiar caracteres especiales
    userName = userName.replace(/[._-]/g, ' '); // Reemplazar puntos, guiones y guiones bajos con espacios
    userName = userName.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Hacer disponible en todas las vistas EJS
  res.locals.user = {
    email: userEmail || null,
    role: userRole || null,
    name: userName || null,
    isLoggedIn: isLoggedIn
  };

  // Si no hay autenticación del servidor, enviar script para limpiar localStorage
  if (!isLoggedIn) {
    res.locals.clearAuthScript = `
      <script>
        // Limpiar localStorage si no hay sesión activa del servidor
        if (localStorage.getItem('authToken')) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userEmail');
        }
      </script>
    `;
  } else {
    res.locals.clearAuthScript = '';
  }

  // Fallback si no hay datos del usuario
  if (!res.locals.user) {
    res.locals.user = {
      email: null,
      role: null,
      name: null,
      isLoggedIn: false
    };
  }

  next();
};

module.exports = userDataMiddleware;
