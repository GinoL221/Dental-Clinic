const express = require("express");
const router = express.Router();
const dentistController = require('../controllers/dentist');

// Ruta para listar dentistas
router.get("/", dentistController.list);

// Ruta para agregar dentista
router.get("/add", dentistController.add);

// Ruta para editar dentista
router.get("/edit/:id", dentistController.edit);

module.exports = router;
