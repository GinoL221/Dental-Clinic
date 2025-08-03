const express = require("express");
const router = express.Router();
const path = require("path");

// Ruta del index (home)
router.get("/", (req, res) => {
  res.render("index", { title: "Inicio | Clínica Odontológica" });
});

// Ruta de registro
router.get("/register", (req, res) => {
  res.render("register", { title: "Registro | Clínica Odontológica" });
});

// Ruta de login
router.get("/login", (req, res) => {
  res.render("login", { title: "Ingresar | Clínica Odontológica" });
});

module.exports = router;
