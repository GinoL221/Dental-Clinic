const path = require("path");

const appointmentAdd = (req, res) => {
  // Verificar autenticación
  if (!req.session.user) {
    return res.redirect("/users/login");
  }

  try {
    res.render("appointments/appointmentAdd", {
      title: "Agregar Cita | Dental Clinic",
      styles: ["landing"]
    });
  } catch (error) {
    console.error("Error al mostrar formulario de agregar cita:", error);
    res.status(500).render("404NotFound", {
      title: "Error del servidor",
      message: "Error interno del servidor",
      styles: ["errors"]
    });
  }
};

module.exports = appointmentAdd;
