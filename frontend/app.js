const express = require("express");
const path = require("path");
const mainRoutes = require("./src/routes/routes.js");

const app = express();

// Rutas principales
app.use("/", mainRoutes);

// Configura EJS como motor de vistas
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Archivos estáticos (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, "public")));

// Manejo de 404
app.use((req, res) => {
  res.status(404).render("404", { message: "Página no encontrada" });
});

module.exports = app;
