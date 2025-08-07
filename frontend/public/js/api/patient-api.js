/**
 * API para manejo de pacientes
 */

// Obtener todos los pacientes (solo para admins)
async function getAllPatients() {
  try {
    const response = await makeRequest(API_CONFIG.endpoints.patients.list, {
      method: 'GET',
      requiresAuth: true
    });
    
    if (response.success) {
      return response.data;
    } else {
      console.error('Error al obtener pacientes:', response.message);
      return [];
    }
  } catch (error) {
    console.error('Error en getAllPatients:', error);
    return [];
  }
}

// Buscar paciente por email
async function searchPatientByEmail(email) {
  try {
    const response = await makeRequest(`${API_CONFIG.endpoints.patients.search}?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      requiresAuth: true
    });
    
    if (response.success) {
      return response.data;
    } else {
      console.error('Error al buscar paciente:', response.message);
      return null;
    }
  } catch (error) {
    console.error('Error en searchPatientByEmail:', error);
    return null;
  }
}

// Crear paciente desde usuario logueado
async function createPatientFromUser(userData) {
  try {
    const patientData = {
      name: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      cardIdentity: userData.cardIdentity || Math.floor(Math.random() * 100000000), // Temporal
      admissionDate: new Date().toISOString().split('T')[0],
      address: {
        street: userData.address?.street || '',
        number: userData.address?.number || '',
        location: userData.address?.location || '',
        province: userData.address?.province || ''
      }
    };
    
    const response = await makeRequest(API_CONFIG.endpoints.patients.create, {
      method: 'POST',
      body: JSON.stringify(patientData),
      requiresAuth: true
    });
    
    if (response.success) {
      return response.data;
    } else {
      console.error('Error al crear paciente:', response.message);
      return null;
    }
  } catch (error) {
    console.error('Error en createPatientFromUser:', error);
    return null;
  }
}
