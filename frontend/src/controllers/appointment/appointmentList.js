const path = require("path");

const appointmentList = (req, res) => {
  // Verificar autenticación
  if (!req.session.user) {
    return res.redirect("/users/login");
  }

  try {
    res.render("appointments/appointmentList", {
      title: "Lista de Citas | Dental Clinic",
      styles: ["landing"]
    });
  } catch (error) {
    console.error("Error al mostrar lista de citas:", error);
    res.status(500).render("404NotFound", {
      title: "Error del servidor",
      message: "Error interno del servidor",
      styles: ["errors"]
    });
  }
};

module.exports = appointmentList;
