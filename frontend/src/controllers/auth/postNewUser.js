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
        styles: ["auth"]
      });
    }

    console.log("🔍 Datos recibidos en postNewUser:", req.body);

    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      cardIdentity,
      admissionDate,
      street,
      number,
      location,
      province,
      role = "PATIENT",
    } = req.body;

    // Preparar datos del usuario para enviar al backend
    const userData = {
      firstName,
      lastName,
      email,
      password,
      role,
    };

    // Agregar campos opcionales si están presentes
    if (cardIdentity) userData.cardIdentity = parseInt(cardIdentity);
    if (admissionDate) userData.admissionDate = admissionDate;

    // CREAR objeto address para el backend Spring Boot
    console.log("🏠 Verificando datos de dirección:", {
      street: street,
      number: number,
      location: location,
      province: province,
    });

    const hasAddressData = street || number || location || province;

    if (hasAddressData) {
      userData.address = {
        street: street || "",
        number: number ? parseInt(number) : 0,
        location: location || "",
        province: province || "",
      };

      console.log("✅ Objeto address creado:", userData.address);
    } else {
      console.log("⚠️ No se encontraron datos de dirección");
    }

    console.log("📤 Datos finales a enviar al backend Spring Boot:", userData);

    // Llamar al backend Spring Boot para registrar usuario
    const backendResponse = await axios.post(
      apiConfig.getAuthUrl("REGISTER"),
      userData
    );

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
        styles: ["auth"]
      });
    }

    // Error interno del servidor
    res.status(500).render(viewPath, {
      title: "Registro de Usuario | Clínica Odontológica",
      errors: {
        general: { msg: "Error interno del servidor" },
      },
      oldData: req.body,
      styles: ["auth"]
    });
  }
};

module.exports = postNewUser;
