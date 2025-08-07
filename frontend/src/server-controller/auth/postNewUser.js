const path = require("path");
const axios = require("axios");
const { validationResult } = require("express-validator");
const apiConfig = require("../../config/apiConfig");

const postNewUser = async (req, res) => {
  try {
    // Validar errores de express-validator
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const viewPath = path.join(__dirname, "../../views/users/register.ejs");
      return res.render(viewPath, {
        title: "Registro de Usuario | Clínica Odontológica",
        errors: errors.mapped(),
        oldData: req.body,
      });
    }

    const { firstName, lastName, email, password, role = "USER" } = req.body;

    // Llamar al backend Spring Boot para registrar usuario
    const backendResponse = await axios.post(apiConfig.getAuthUrl("REGISTER"), {
      firstName,
      lastName,
      email,
      password,
      role,
    });

    // Si el registro fue exitoso, redirigir al login
    if (backendResponse.status === 200 || backendResponse.status === 201) {
      // Para pacientes, no auto-login, redirigir a login para que inicien sesión
      console.log("Usuario registrado exitosamente:", backendResponse.data);

      // Redirigir al login para que inicie sesión manualmente
      return res.redirect("/users/login?registered=true");
    }
  } catch (error) {
    console.error("Error en el controlador postNewUser:", error);

    const viewPath = path.join(__dirname, "../../views/users/register.ejs");

    // Manejar errores específicos del backend
    if (error.response) {
      const status = error.response.status;
      let errorMessage = "Error al registrar usuario";

      if (status === 409) {
        errorMessage = "Este email ya está registrado";
      } else if (status === 400) {
        errorMessage = "Datos de registro inválidos";
      }

      return res.render(viewPath, {
        title: "Registro de Usuario | Clínica Odontológica",
        errors: {
          general: { msg: errorMessage },
        },
        oldData: req.body,
      });
    }

    // Error interno del servidor
    res.status(500).render(viewPath, {
      title: "Registro de Usuario | Clínica Odontológica",
      errors: {
        general: { msg: "Error interno del servidor" },
      },
      oldData: req.body,
    });
  }
};

module.exports = postNewUser;
