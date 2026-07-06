const path = require('path');
const logger = require('../../utils/logger-server');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const patientEdit = (req, res) => {
  if (!req.session.user) {
    return res.redirect('/users/login');
  }

  try {
    const patientId = req.params.id;

    res.render('patients/patientEdit', {
      title: 'Editar Paciente | Dental Clinic',
      patientId: patientId,
      extraStylesheets: ['/css/views/auth.css'],
    });
  } catch (error) {
    logger.error('Error al mostrar formulario de editar paciente:', error);
    res.status(500).render('404NotFound', {
      title: 'Error del servidor',
      message: 'Error interno del servidor',
      extraStylesheets: ['/css/views/error.css'],
    });
  }
};

module.exports = patientEdit;
