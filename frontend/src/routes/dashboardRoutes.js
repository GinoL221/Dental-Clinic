// Importaciones requeridas
const express = require('express');
const userDataMiddleware = require('../middlewares/userDataMiddleware');

const router = express.Router();
const logger = require('../utils/logger-server');

// Ruta para mostrar el dashboard
router.get('/', userDataMiddleware, (req, res) => {
  try {
    // Verificar autenticación
    if (!req.session.user) {
      return res.redirect('/users/login');
    }

    // Verificar que el usuario sea ADMIN
    if (req.session.user.role !== 'ADMIN') {
      return res.status(403).render('403', {
        title: 'Acceso Denegado - Clínica Dental',
        message:
          'No tienes permisos para acceder al dashboard. Solo los administradores pueden ver esta página.',
        user: res.locals.user,
        extraStylesheets: ['/css/views/error.css'],
      });
    }

    // Renderizar la vista del dashboard - el middleware ya proporcionó todos los datos necesarios
    res.render('dashboard/dashboard', {
      title: 'Dashboard - Clínica Dental',
      currentPage: 'dashboard',
      extraStylesheets: ['/css/lib/uPlot.min.css', '/css/views/dashboard.css'],
    });
  } catch (error) {
    logger.error('Error al cargar dashboard:', error);
    res.status(500).render('500', {
      title: 'Error del servidor',
      error: 'Error al cargar el dashboard',
      extraStylesheets: ['/css/views/error.css'],
    });
  }
});

module.exports = router;
