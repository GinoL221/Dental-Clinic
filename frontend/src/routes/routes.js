const express = require("express");
const router = express.Router();
const dentistRoutes = require("./dentistRoutes");
const patientRoutes = require("./patientRoutes");
const userRoutes = require("./userRoutes");
const appointmentRoutes = require("./appointmentRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const requireAuth = require("../middlewares/requireAuth");

// Ruta del index (home)
router.get("/", (req, res) => {
  res.render("landing/index", {
    title: "Inicio | Dental Clinic",
    extraStylesheets: ["/css/views/landing.css"],
  });
});

// Rutas de citas - todas las rutas que empiecen con /appointments (protegidas)
router.use("/appointments", requireAuth, appointmentRoutes);

// Rutas del dashboard - todas las rutas que empiecen con /dashboard (protegidas)
router.use("/dashboard", requireAuth, dashboardRoutes);

// Rutas de dentistas - todas las rutas que empiecen con /dentists (protegidas)
router.use("/dentists", requireAuth, dentistRoutes);

// Rutas de pacientes - todas las rutas que empiecen con /patients (protegidas)
router.use("/patients", requireAuth, patientRoutes);

// Rutas de usuarios - todas las rutas que empiecen con /users
router.use("/users", userRoutes);

module.exports = router;
