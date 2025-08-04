// API para manejo de citas (appointments)
const AppointmentAPI = {
    // Obtener todas las citas
    async getAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/appointments`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            handleApiError(error);
        }
    },

    // Obtener una cita por ID
    async getById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Cita no encontrada');
                }
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            handleApiError(error);
        }
    },

    // Crear una nueva cita
    async create(appointment) {
        try {
            this.validateAppointmentData(appointment);
            
            const response = await fetch(`${API_BASE_URL}/appointments`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(appointment)
            });
            
            if (!response.ok) {
                if (response.status === 409) {
                    throw new Error('Ya existe una cita en esa fecha y hora');
                } else if (response.status === 400) {
                    throw new Error('Datos de la cita inválidos');
                }
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            handleApiError(error);
        }
    },

    // Actualizar una cita
    async update(appointment) {
        try {
            this.validateAppointmentData(appointment, true);
            
            const response = await fetch(`${API_BASE_URL}/appointments`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(appointment)
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Cita no encontrada');
                } else if (response.status === 409) {
                    throw new Error('Ya existe una cita en esa fecha y hora');
                }
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            
            return await response.text();
        } catch (error) {
            handleApiError(error);
        }
    },

    // Eliminar una cita
    async delete(id) {
        try {
            if (!id) {
                throw new Error('ID de la cita es requerido');
            }

            const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Cita no encontrada');
                }
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            
            return await response.text();
        } catch (error) {
            handleApiError(error);
        }
    },

    // Obtener citas por dentista
    async getByDentist(dentistId) {
        try {
            const response = await fetch(`${API_BASE_URL}/appointments/dentist/${dentistId}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            handleApiError(error);
        }
    },

    // Obtener citas por paciente
    async getByPatient(patientId) {
        try {
            const response = await fetch(`${API_BASE_URL}/appointments/patient/${patientId}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            handleApiError(error);
        }
    },

    // Obtener citas por fecha
    async getByDate(date) {
        try {
            const response = await fetch(`${API_BASE_URL}/appointments/date/${date}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            handleApiError(error);
        }
    },

    // Validar datos de la cita
    validateAppointmentData(appointment, isUpdate = false) {
        if (!appointment) {
            throw new Error('Datos de la cita son requeridos');
        }

        if (isUpdate && !appointment.id) {
            throw new Error('ID de la cita es requerido para actualización');
        }

        if (!appointment.date) {
            throw new Error('La fecha es requerida');
        }

        if (!appointment.time) {
            throw new Error('La hora es requerida');
        }

        if (!appointment.dentistId) {
            throw new Error('El dentista es requerido');
        }

        if (!appointment.patientId) {
            throw new Error('El paciente es requerido');
        }

        // Validar que la fecha no sea en el pasado
        const appointmentDate = new Date(appointment.date + 'T' + appointment.time);
        const now = new Date();
        
        if (appointmentDate <= now) {
            throw new Error('La cita debe ser programada para una fecha futura');
        }
    },

    // Formatear cita para mostrar
    formatAppointmentDisplay(appointment) {
        if (!appointment) return null;
        
        const date = new Date(appointment.date + 'T' + appointment.time);
        
        return {
            ...appointment,
            formattedDate: date.toLocaleDateString('es-ES'),
            formattedTime: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            formattedDateTime: date.toLocaleString('es-ES')
        };
    }
};

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppointmentAPI };
}
