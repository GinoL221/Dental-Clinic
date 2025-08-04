const express = require("express");
const router = express.Router();
const dentistRoutes = require("./dentistRoutes");
const userRoutes = require("./userRoutes");

// Ruta del index (home)
router.get("/", (req, res) => {
  res.render("index", { title: "Inicio | Dental Clinic" });
});

// Ruta para la página "About Us"
router.get("/aboutUs", (req, res) => {
  res.render("aboutUs", { title: "Acerca de Nosotros | Dental Clinic" });
});

// Rutas de dentistas - todas las rutas que empiecen con /dentists
router.use("/dentists", dentistRoutes);

// Rutas de usuarios - todas las rutas que empiecen con /users
router.use("/users", userRoutes);

module.exports = router;
