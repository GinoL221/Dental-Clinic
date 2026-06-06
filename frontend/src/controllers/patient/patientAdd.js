const path = require("path");
const logger = require("../../utils/logger-server");

const patientAdd = (req, res) => {
  if (!req.session.user) {
    return res.redirect("/users/login");
  }

  try {
    res.render("patients/patientAdd", {
      title: "Agregar Paciente | Dental Clinic",
      extraStylesheets: ["/css/views/auth.css"]
    });
  } catch (error) {
    logger.error("Error al mostrar formulario de agregar paciente:", error);
    res.status(500).render("404NotFound", {
      title: "Error del servidor",
      message: "Error interno del servidor",
      extraStylesheets: ["/css/views/error.css"]
    });
  }
};

module.exports = patientAdd;
