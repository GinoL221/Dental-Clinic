const path = require("path");

const dentistList = (req, res) => {
  try {
    res.render("dentists/dentistList", {
      title: "Lista de Dentistas | Dental Clinic",
      dentists: [],
    });
  } catch (error) {
    console.error("Error al mostrar lista de dentistas:", error);
    res.status(500).render("404NotFound", {
      title: "Error del servidor",
      message: "Error interno del servidor",
    });
  }
};

module.exports = dentistList;
