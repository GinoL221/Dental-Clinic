const path = require("path");

const dentistEdit = (req, res) => {
  // Verificar autenticación
  if (!req.session.user) {
    return res.redirect("/users/login");
  }

  try {
    const dentistId = req.params.id;

    res.render("dentists/dentistEdit", {
      title: "Editar Dentista | Dental Clinic",
      dentistId: dentistId,
      styles: ["dentists"]
    });
  } catch (error) {
    console.error("Error al mostrar formulario de editar dentista:", error);
    res.status(500).render("404NotFound", {
      title: "Error del servidor",
      message: "Error interno del servidor",
      styles: ["errors"]
    });
  }
};

module.exports = dentistEdit;
