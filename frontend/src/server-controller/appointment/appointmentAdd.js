const path = require("path");

const appointmentAdd = (req, res) => {
  // Verificar autenticación
  if (!req.session.user) {
    return res.redirect("/auth/login");
  }

  try {
    res.render("appointments/appointmentAdd", {
      title: "Agregar Cita | Dental Clinic",
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error al mostrar formulario de agregar cita:", error);
    res.status(500).render("404NotFound", {
      title: "Error del servidor",
      message: "Error interno del servidor",
    });
  }
};

module.exports = appointmentAdd;
