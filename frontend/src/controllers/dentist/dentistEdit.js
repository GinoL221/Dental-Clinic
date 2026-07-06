const path = require('path');
const logger = require('../../utils/logger-server');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const dentistEdit = (req, res) => {
  // Verificar autenticación
  if (!req.session.user) {
    return res.redirect('/users/login');
  }

  try {
    const dentistId = req.params.id;

    res.render('dentists/dentistEdit', {
      title: 'Editar Dentista | Dental Clinic',
      dentistId: dentistId,
      extraStylesheets: ['/css/views/auth.css'],
    });
  } catch (error) {
    logger.error('Error al mostrar formulario de editar dentista:', error);
    res.status(500).render('404NotFound', {
      title: 'Error del servidor',
      message: 'Error interno del servidor',
      extraStylesheets: ['/css/views/error.css'],
    });
  }
};

module.exports = dentistEdit;
