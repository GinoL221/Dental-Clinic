const path = require("path");
const logger = require("../../utils/logger-server");

const login = (req, res) => {
  try {
    if (req.session && req.session.user) {
      return res.redirect("/dentists");
    }

    // render usando vista relativa y pasar styles para cargar CSS de auth
    return res.render("users/login", {
      title: "Iniciar Sesión | Clínica Odontológica",
      errors: null,
      oldData: null,
      styles: ["auth"]
    });
  } catch (error) {
    logger.error("Error en controlador login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = login;
