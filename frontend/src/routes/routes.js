const express = require("express");
const router = express.Router();
const dentistRoutes = require("./dentistRoutes");
const patientRoutes = require("./patientRoutes");
const userRoutes = require("./userRoutes");
const appointmentRoutes = require("./appointmentRoutes");
const dashboardRoutes = require("./dashboardRoutes");

// Ruta del index (home)
router.get("/", (req, res) => {
  res.render("landing/index", {
    title: "Inicio | Dental Clinic",
    styles: ["landing"],
  });
});

// Ruta para la página "About Us"
router.get("/aboutUs", (req, res) => {
  res.render("aboutUs", {
    title: "Acerca de Nosotros | Dental Clinic",
    styles: ["landing"],
  });
});

// Rutas de citas - todas las rutas que empiecen con /appointments
router.use("/appointments", appointmentRoutes);

// Rutas del dashboard - todas las rutas que empiecen con /dashboard
router.use("/dashboard", dashboardRoutes);

// Rutas de dentistas - todas las rutas que empiecen con /dentists
router.use("/dentists", dentistRoutes);

// Rutas de pacientes - todas las rutas que empiecen con /patients
router.use("/patients", patientRoutes);

// Rutas de usuarios - todas las rutas que empiecen con /users
router.use("/users", userRoutes);

module.exports = router;
