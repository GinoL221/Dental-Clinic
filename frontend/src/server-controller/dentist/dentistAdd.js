const path = require('path');

const dentistAdd = (req, res) => {
  try {
    res.render("dentists/dentistAdd", {
      title: "Agregar Dentista | Dental Clinic",
    });
  } catch (error) {
    console.error('Error al mostrar formulario de agregar dentista:', error);
    res.status(500).render('404NotFound', {
      title: 'Error del servidor',
      message: 'Error interno del servidor'
    });
  }
};

module.exports = dentistAdd;
