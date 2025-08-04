// Controlador para la página de lista de dentistas
class DentistListController {
    constructor() {
        this.tableBody = null;
        this.updateForm = null;
        this.updateDiv = null;
        this.dentistIdInput = null;
        this.registrationNumberInput = null;
        this.nameInput = null;
        this.lastNameInput = null;
        
        this.init();
    }

    init() {
        this.bindElements();
        this.attachEvents();
        this.loadDentists();
    }

    bindElements() {
        this.tableBody = document.getElementById('dentistTableBody');
        this.updateForm = document.getElementById('update_dentist_form');
        this.updateDiv = document.getElementById('div_dentist_updating');
        this.dentistIdInput = document.getElementById('dentist_id');
        this.registrationNumberInput = document.getElementById('registrationNumber');
        this.nameInput = document.getElementById('name');
        this.lastNameInput = document.getElementById('lastName');
    }

    attachEvents() {
        if (this.updateForm) {
            this.updateForm.addEventListener('submit', this.handleUpdate.bind(this));
        }
    }

    // Cargar todos los dentistas
    async loadDentists() {
        try {
            const dentists = await DentistAPI.getAll();
            this.renderDentistsTable(dentists);
        } catch (error) {
            console.error('Error al cargar dentistas:', error);
            UIUtils.showError('Error al cargar la lista de dentistas. Verifique que el servidor esté funcionando.');
        }
    }

    // Renderizar la tabla de dentistas
    renderDentistsTable(dentists) {
        if (!this.tableBody) return;
        
        this.tableBody.innerHTML = '';

        dentists.forEach(dentist => {
            const row = this.createDentistRow(dentist);
            this.tableBody.innerHTML += row;
        });
    }

    // Crear fila de dentista
    createDentistRow(dentist) {
        // Manejo robusto de propiedades que pueden venir con nombres diferentes del backend
        const firstName = dentist.firstName || dentist.name || 'N/A';
        const lastName = dentist.lastName || dentist.surname || 'N/A';
        const registrationNumber = dentist.registrationNumber || dentist.matricula || 'N/A';
        
        return `
            <tr id="tr_${dentist.id}">
                <td>${dentist.id}</td>
                <td>${registrationNumber}</td>
                <td>${firstName}</td>
                <td>${lastName}</td>
                <td class="text-center">
                    <button onclick="dentistListController.findBy(${dentist.id})" class="btn btn-edit btn-action btn-sm">
                        <i class="bi bi-pencil-square me-1"></i>Modificar
                    </button>
                    <button onclick="dentistListController.deleteBy(${dentist.id})" class="btn btn-delete btn-action btn-sm">
                        <i class="bi bi-trash me-1"></i>Eliminar
                    </button>
                </td>
            </tr>
        `;
    }

    // Buscar dentista por ID para editar
    async findBy(id) {
        try {
            const dentist = await DentistAPI.getById(id);
            this.populateForm(dentist);
            this.showUpdateForm();
        } catch (error) {
            console.error('Error al buscar dentista:', error);
            UIUtils.showError('Error al buscar el dentista');
        }
    }

    // Poblar formulario con datos del dentista
    populateForm(dentist) {
        if (this.dentistIdInput) this.dentistIdInput.value = dentist.id;
        
        const registrationNumber = dentist.registrationNumber || dentist.matricula || '';
        const firstName = dentist.firstName || dentist.name || '';
        const lastName = dentist.lastName || dentist.surname || '';
        
        if (this.registrationNumberInput) this.registrationNumberInput.value = registrationNumber;
        if (this.nameInput) this.nameInput.value = firstName;
        if (this.lastNameInput) this.lastNameInput.value = lastName;
    }

    // Mostrar formulario de actualización
    showUpdateForm() {
        if (this.updateDiv) {
            this.updateDiv.style.display = 'block';
            this.updateDiv.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Ocultar formulario de actualización
    hideUpdateForm() {
        if (this.updateDiv) {
            this.updateDiv.style.display = 'none';
        }
    }

    // Manejar actualización de dentista
    async handleUpdate(e) {
        e.preventDefault();
        
        const dentistData = this.getFormData();
        
        if (!this.validateFormData(dentistData)) {
            return;
        }

        const submitButton = this.updateForm.querySelector('button[type="submit"]');
        UIUtils.setButtonLoading(submitButton, true, 'Modificar');

        try {
            await DentistAPI.update(dentistData);
            UIUtils.showSuccess('Dentista actualizado correctamente');
            this.hideUpdateForm();
            this.loadDentists(); // Recargar la lista
        } catch (error) {
            console.error('Error al actualizar dentista:', error);
            UIUtils.showError('Error al actualizar el dentista: ' + error.message);
        } finally {
            UIUtils.setButtonLoading(submitButton, false, 'Modificar');
        }
    }

    // Obtener datos del formulario
    getFormData() {
        return {
            id: parseInt(this.dentistIdInput?.value),
            registrationNumber: this.registrationNumberInput?.value.trim(),
            firstName: this.nameInput?.value.trim(),
            lastName: this.lastNameInput?.value.trim()
        };
    }

    // Validar datos del formulario
    validateFormData(data) {
        if (!data.firstName || !data.lastName || !data.registrationNumber) {
            UIUtils.showError('Por favor, completa todos los campos');
            return false;
        }

        if (data.firstName.length < 2) {
            UIUtils.showError('El nombre debe tener al menos 2 caracteres');
            return false;
        }

        if (data.lastName.length < 2) {
            UIUtils.showError('El apellido debe tener al menos 2 caracteres');
            return false;
        }

        if (data.registrationNumber.length < 3) {
            UIUtils.showError('El número de matrícula debe tener al menos 3 caracteres');
            return false;
        }

        return true;
    }

    // Eliminar dentista
    async deleteBy(id) {
        if (!confirm('¿Está seguro de que desea eliminar este dentista?')) {
            return;
        }

        try {
            await DentistAPI.delete(id);
            UIUtils.showSuccess('Dentista eliminado correctamente');
            
            // Animar la eliminación de la fila
            const row = document.getElementById(`tr_${id}`);
            if (row) {
                row.style.transition = 'opacity 0.3s ease';
                row.style.opacity = '0';
                setTimeout(() => {
                    this.loadDentists(); // Recargar la lista
                }, 300);
            }
            
            // Ocultar formulario de edición si estaba abierto
            this.hideUpdateForm();
        } catch (error) {
            console.error('Error al eliminar dentista:', error);
            UIUtils.showError('Error al eliminar el dentista: ' + error.message);
        }
    }
}

// Variable global para acceso desde onclick en HTML
let dentistListController;

// Inicializar el controlador cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    dentistListController = new DentistListController();
});
