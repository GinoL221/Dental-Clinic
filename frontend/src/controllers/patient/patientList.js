const path = require("path");
const logger = require("../../utils/logger-server");

const patientList = (req, res) => {
  try {
    res.render("patients/patientList", {
      title: "Lista de Pacientes | Dental Clinic",
      patients: [],
      styles: ["patients"]
    });
  } catch (error) {
    logger.error("Error al mostrar lista de pacientes:", error);
    res.status(500).render("404NotFound", {
      title: "Error del servidor",
      message: "Error interno del servidor",
      styles: ["errors"]
    });
  }
};

module.exports = patientList;
