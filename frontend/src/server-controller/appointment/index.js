const appointmentList = require('./appointmentList');
const appointmentAdd = require('./appointmentAdd');
const appointmentEdit = require('./appointmentEdit');

module.exports = {
  list: appointmentList,
  add: appointmentAdd,
  edit: appointmentEdit,
};
