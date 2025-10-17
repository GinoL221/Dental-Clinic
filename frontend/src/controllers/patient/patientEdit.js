const path = require("path");
const logger = require("../../utils/logger-server");

const patientEdit = (req, res) => {
  if (!req.session.user) {
    return res.redirect("/users/login");
  }

  try {
    const patientId = req.params.id;

    res.render("patients/patientEdit", {
      title: "Editar Paciente | Dental Clinic",
      patientId: patientId,
      styles: ["patients"]
    });
  } catch (error) {
    logger.error("Error al mostrar formulario de editar paciente:", error);
    res.status(500).render("404NotFound", {
      title: "Error del servidor",
      message: "Error interno del servidor",
      styles: ["errors"]
    });
  }
};

module.exports = patientEdit;
