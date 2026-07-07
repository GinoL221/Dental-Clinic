/**
 * @jest-environment jsdom
 */

import AppointmentUIManager from '../public/js/appointment/modules/ui-manager.js';

describe('AppointmentUIManager — Role-based dynamic UI adjustments', () => {
  let uiManager;

  beforeEach(() => {
    // Set up standard elements present on appointmentAdd.ejs and appointmentEdit.ejs
    document.body.innerHTML = `
      <div class="mb-3">
        <select id="patientSelect" name="patientId">
          <option value="">Seleccione un paciente</option>
        </select>
      </div>
      <div id="patientInfoFields" style="display: none;">
        <input id="patientFirstName" />
        <input id="patientLastName" />
        <input id="patientEmail" />
      </div>
      <select id="dentistId"></select>
      <button id="btn-add-new-appointment">Programar Cita</button>
    `;
    uiManager = new AppointmentUIManager();
    
    // Clear global state/variables
    delete window.serverData;
    delete window.currentUser;
    delete window.isAdmin;
    document.body.removeAttribute('data-user-role');
    document.body.removeAttribute('data-is-admin');
  });

  test('configures UI elements correctly for ADMIN role', async () => {
    window.serverData = {
      user: { role: 'ADMIN' },
      isAdmin: true
    };

    const dentists = [{ id: 1, firstName: 'Laura', lastName: 'Perez' }];
    const patients = [{ id: 100, firstName: 'Juan', lastName: 'Diaz', email: 'juan@example.com' }];

    await uiManager.populateSelects(dentists, patients, true);

    const btn = document.getElementById('btn-add-new-appointment');
    expect(btn.textContent).toBe('Programar Cita para Paciente');

    const patientSelect = document.getElementById('patientSelect');
    expect(patientSelect.required).toBe(true);
    expect(patientSelect.closest('.mb-3').style.display).not.toBe('none');
  });

  test('configures UI elements correctly for USER/PATIENT role', async () => {
    window.serverData = {
      user: { role: 'USER' },
      isAdmin: false
    };

    const dentists = [{ id: 1, firstName: 'Laura', lastName: 'Perez' }];

    await uiManager.populateSelects(dentists, [], false);

    const btn = document.getElementById('btn-add-new-appointment');
    expect(btn.textContent).toBe('Solicitar Mi Cita');

    const patientSelect = document.getElementById('patientSelect');
    expect(patientSelect.required).toBe(false);
    expect(patientSelect.closest('.mb-3').style.display).toBe('none');

    const patientInfoFields = document.getElementById('patientInfoFields');
    expect(patientInfoFields.style.display).toBe('flex');

    const firstNameInput = document.getElementById('patientFirstName');
    const lastNameInput = document.getElementById('patientLastName');
    const emailInput = document.getElementById('patientEmail');

    expect(firstNameInput.readOnly).toBe(true);
    expect(lastNameInput.readOnly).toBe(true);
    expect(emailInput.readOnly).toBe(true);
  });
});
