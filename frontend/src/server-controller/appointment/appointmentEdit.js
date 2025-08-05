const path = require("path");

const appointmentEdit = (req, res) => {
  // Verificar autenticación
  if (!req.session.user) {
    return res.redirect("/auth/login");
  }

  try {
    const appointmentId = req.params.id;

    res.render("appointments/appointmentEdit", {
      title: "Editar Cita | Dental Clinic",
      appointmentId: appointmentId,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error al mostrar formulario de editar cita:", error);
    res.status(500).render("404NotFound", {
      title: "Error del servidor",
      message: "Error interno del servidor",
    });
  }
};

module.exports = appointmentEdit;
