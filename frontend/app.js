const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const mainRoutes = require("./src/routes/routes.js");
const userDataMiddleware = require("./src/middlewares/userDataMiddleware.js");

const app = express();

// Configura EJS como motor de vistas
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

// Middleware para parsear datos de formularios
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Configurar sesiones
app.use(
  session({
    secret: "dental-clinic-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Middleware para datos del usuario en todas las vistas
app.use(userDataMiddleware);

// Archivos estáticos (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, "public")));

// Rutas principales
app.use("/", mainRoutes);

// Manejo de 404
app.use((req, res) => {
  res.status(404).render("404NotFound", {
    title: "Página no encontrada | Clínica Odontológica",
    message: "Página no encontrada",
  });
});

// Iniciar el servidor (función utilitaria)
function startServer(port = process.env.PORT || 3000) {
  const logger = require("./src/utils/logger-server");
  const PORT = port;
  const server = app.listen(PORT, () => {
    logger.info(`Servidor corriendo en http://localhost:${PORT}`);
  });
  return server;
}

// Iniciar el servidor sólo si este archivo se ejecuta directamente
if (require.main === module) {
  startServer();
}

// Exportar la app para compatibilidad con supertest/tests
module.exports = app;
// Exponer startServer como propiedad para quien lo necesite
module.exports.startServer = startServer;
