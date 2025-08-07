const userDataMiddleware = (req, res, next) => {
  // Verificar si hay sesión activa
  if (req.session && req.session.user) {
    // Usuario logueado - usar datos de sesión
    const sessionUser = req.session.user;
    
    res.locals.user = {
      id: sessionUser.id,
      firstName: sessionUser.firstName,
      lastName: sessionUser.lastName,
      email: sessionUser.email,
      role: sessionUser.role,
      isLoggedIn: true,
      name: sessionUser.firstName,
      fullName: `${sessionUser.firstName} ${sessionUser.lastName}`
    };
    
    // Variables de rol para uso condicional en vistas
    res.locals.isAdmin = sessionUser.role === 'ADMIN';
    res.locals.isPatient = sessionUser.role === 'PATIENT';
    res.locals.isDentist = sessionUser.role === 'DENTIST';
    res.locals.clearAuthScript = '';
    
  } else {
    // Usuario no logueado
    res.locals.user = {
      id: null,
      firstName: null,
      lastName: null,
      email: null,
      role: null,
      isLoggedIn: false,
      name: null,
      fullName: null
    };
    
    res.locals.isAdmin = false;
    res.locals.isPatient = false;
    res.locals.isDentist = false;
    
    // Script para limpiar localStorage si no hay sesión activa
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
  }

  next();
};

module.exports = userDataMiddleware;
