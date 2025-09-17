const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patient");

// Ruta para listar pacientes
router.get("/", patientController.list);

// Ruta para agregar pacientes
router.get("/add", patientController.add);

// Ruta para editar pacientes
router.get("/edit/:id", patientController.edit);

module.exports = router;
