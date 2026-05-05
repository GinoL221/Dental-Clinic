import { API_BASE_URL, handleApiError, getAuthHeaders } from "./config.js";

const SpecialtyAPI = {
  // Obtener todas las especialidades
  async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/specialties`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },
};

export default SpecialtyAPI;
