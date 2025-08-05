const path = require("path");

const register = (req, res) => {
  try {
    if (req.session && req.session.user) {
      return res.redirect("/dentists");
    }

    const viewPath = path.join(__dirname, "../../views/users/register.ejs");
    return res.render(viewPath, {
      title: "Registro de Usuario | Clínica Odontológica",
      errors: null,
      oldData: null,
    });
  } catch (error) {
    console.error("Error en controlador register:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = register;
