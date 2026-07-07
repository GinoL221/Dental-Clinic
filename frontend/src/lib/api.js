const BACKEND_URL = (typeof process !== 'undefined' && process.env?.BACKEND_URL) || 'http://localhost:8080';

/**
 * @param {string} token
 * @returns {{ Authorization: string }}
 */
export function getAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`
  };
}

/**
 * @param {string} endpoint
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${BACKEND_URL}${endpoint}`;
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = /** @type {any} */ (new Error(errorData.message || `HTTP error! status: ${response.status}`));
    error.status = response.status;
    error.response = response;
    throw error;
  }
  
  return response.json();
}
