const path = require("path");

const dentistAdd = (req, res) => {
  // Verificar autenticación
  if (!req.session.user) {
    return res.redirect("/users/login");
  }

  try {
    res.render("dentists/dentistAdd", {
      title: "Agregar Dentista | Dental Clinic",
      styles: ["dentists"]
    });
  } catch (error) {
    console.error("Error al mostrar formulario de agregar dentista:", error);
    res.status(500).render("404NotFound", {
      title: "Error del servidor",
      message: "Error interno del servidor",
      styles: ["errors"]
    });
  }
};

module.exports = dentistAdd;
