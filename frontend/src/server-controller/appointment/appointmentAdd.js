const path = require('path');

const appointmentAdd = (req, res) => {
  try {
    res.render("appointments/appointmentAdd", {
      title: "Agregar Cita | Dental Clinic",
    });
  } catch (error) {
    console.error('Error al mostrar formulario de agregar cita:', error);
    res.status(500).render('404NotFound', {
      title: 'Error del servidor',
      message: 'Error interno del servidor'
    });
  }
};

module.exports = appointmentAdd;
