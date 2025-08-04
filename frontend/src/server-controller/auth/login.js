const path = require("path");

const login = (req, res) => {
  try {
    if (req.session && req.session.user) {
      return res.redirect("/dentists");
    }

    const viewPath = path.join(__dirname, "../../views/users/login.ejs");
    return res.render(viewPath, {
      title: "Iniciar Sesión | Clínica Odontológica",
      errors: null,
      oldData: null,
    });
  } catch (error) {
    console.error("Error en controlador login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = login;
