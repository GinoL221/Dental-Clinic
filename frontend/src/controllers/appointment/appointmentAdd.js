const path = require("path");
const logger = require("../../utils/logger-server");

const appointmentAdd = (req, res) => {
  // Verificar autenticación
  if (!req.session.user) {
    return res.redirect("/users/login");
  }

  try {
    res.render("appointments/appointmentAdd", {
      title: "Agregar Cita | Dental Clinic",
      extraStylesheets: ["/css/views/auth.css"]
    });
  } catch (error) {
    logger.error("Error al mostrar formulario de agregar cita:", error);
    res.status(500).render("404NotFound", {
      title: "Error del servidor",
      message: "Error interno del servidor",
      extraStylesheets: ["/css/views/error.css"]
    });
  }
};

module.exports = appointmentAdd;
