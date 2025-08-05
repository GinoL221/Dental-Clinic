const express = require("express");
const router = express.Router();
const authController = require("../server-controller/auth");

// Rutas GET - Mostrar formularios
router.get("/register", authController.register);
router.get("/login", authController.login);

// Rutas POST - Procesar formularios
router.post("/register", authController.postNewUser);
router.post("/login", authController.postLogin);
router.post("/logout", authController.logout);

// Ruta alternativa para logout via GET
router.get("/logout", authController.logout);

module.exports = router;
