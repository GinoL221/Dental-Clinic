const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointment");

// Ruta para listar citas
router.get("/", appointmentController.list);

// Ruta para agregar cita
router.get("/add", appointmentController.add);

// Ruta para editar cita
router.get("/edit/:id", appointmentController.edit);

module.exports = router;
