// API para manejo de autenticación y usuarios
const AuthAPI = {
    // Login de usuario
    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: apiConfig.headers,
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Credenciales incorrectas');
                } else if (response.status === 404) {
                    throw new Error('Usuario no encontrado');
                } else {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
            }
            
            const authResponse = await response.json();
            
            // Guardar token en localStorage
            if (authResponse.token) {
                localStorage.setItem('authToken', authResponse.token);
                localStorage.setItem('userRole', authResponse.role);
            }
            
            return authResponse;
        } catch (error) {
            handleApiError(error);
        }
    },

    // Registro de usuario
    async register(firstName, lastName, email, password, role = 'USER') {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: apiConfig.headers,
                body: JSON.stringify({
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    password: password,
                    role: role
                })
            });
            
            if (!response.ok) {
                if (response.status === 409) {
                    throw new Error('El email ya está registrado');
                } else if (response.status === 400) {
                    throw new Error('Datos de registro inválidos');
                } else {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
            }
            
            const authResponse = await response.json();
            
            // Guardar token en localStorage
            if (authResponse.token) {
                localStorage.setItem('authToken', authResponse.token);
                localStorage.setItem('userRole', authResponse.role);
            }
            
            return authResponse;
        } catch (error) {
            handleApiError(error);
        }
    },

    // Logout
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        window.location.href = '/';
    },

    // Verificar si está autenticado
    isAuthenticated() {
        return localStorage.getItem('authToken') !== null;
    },

    // Obtener token
    getToken() {
        return localStorage.getItem('authToken');
    },

    // Obtener rol del usuario
    getUserRole() {
        return localStorage.getItem('userRole');
    },

    // Verificar si el usuario es admin
    isAdmin() {
        return this.getUserRole() === 'ADMIN';
    },

    // Obtener datos del usuario actual (futuro endpoint)
    async getCurrentUser() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
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

    // Validar token (futuro endpoint)
    async validateToken() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/validate`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            return response.ok;
        } catch (error) {
            console.warn('Error validating token:', error);
            return false;
        }
    }
};

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthAPI };
}
