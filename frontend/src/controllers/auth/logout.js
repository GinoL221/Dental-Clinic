const logger = require("../../utils/logger-server");

const logout = (req, res) => {
  try {
    // Limpiar cookies si las hay
    res.clearCookie("authToken");
    res.clearCookie("userRole");
    res.clearCookie("userEmail");
    
    // Destruir sesión si existe
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          logger.error("Error destroying session:", err);
          return res.status(500).json({ error: "Error al cerrar sesión" });
        } else {
          // Enviar página que limpie localStorage antes de redirigir
          return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Cerrando sesión...</title>
            </head>
            <body>
              <script>
                // Limpiar localStorage
                localStorage.removeItem('authToken');
                localStorage.removeItem('userRole');
                localStorage.clear();
                
                // Redirigir al inicio
                window.location.href = '/';
              </script>
            </body>
            </html>
          `);
        }
      });
    } else {
      // Si no hay sesión, igual limpiar localStorage
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Cerrando sesión...</title>
        </head>
        <body>
          <script>
            // Limpiar localStorage
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            localStorage.clear();
            
            // Redirigir al inicio
            window.location.href = '/';
          </script>
        </body>
        </html>
      `);
    }
  } catch (error) {
    logger.error("Error en controlador logout:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = logout;
