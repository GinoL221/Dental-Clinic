const path = require("path");

const register = (req, res) => {
  try {
    if (req.session && req.session.user) {
      return res.redirect("/dentists");
    }

    return res.render("users/register", {
      title: "Registro de Usuario | Clínica Odontológica",
      errors: null,
      oldData: null,
      styles: ["auth"]
    });
  } catch (error) {
    console.error("Error en controlador register:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = register;
