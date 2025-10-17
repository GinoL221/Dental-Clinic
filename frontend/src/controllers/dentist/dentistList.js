const path = require("path");
const logger = require("../../utils/logger-server");

const dentistList = (req, res) => {
  try {
    res.render("dentists/dentistList", {
      title: "Lista de Dentistas | Dental Clinic",
      dentists: [],
      styles: ["dentists"]
    });
  } catch (error) {
    logger.error("Error al mostrar lista de dentistas:", error);
    res.status(500).render("404NotFound", {
      title: "Error del servidor",
      message: "Error interno del servidor",
      styles: ["errors"]
    });
  }
};

module.exports = dentistList;
