const path = require('path');

const appointmentList = (req, res) => {
  try {
    res.render("appointments/appointmentList", {
      title: "Lista de Citas | Dental Clinic",
      appointments: [],
    });
  } catch (error) {
    console.error('Error al mostrar lista de citas:', error);
    res.status(500).render('404NotFound', {
      title: 'Error del servidor',
      message: 'Error interno del servidor'
    });
  }
};

module.exports = appointmentList;
