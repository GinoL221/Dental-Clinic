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
          console.error("Error destroying session:", err);
          return res.status(500).json({ error: "Error al cerrar sesión" });
        } else {
          return res.redirect("/");
        }
      });
    } else {
      return res.redirect("/");
    }
  } catch (error) {
    console.error("Error en controlador logout:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = logout;
