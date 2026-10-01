const BACKEND_URL =
  (typeof process !== 'undefined' && process.env?.BACKEND_URL) || 'http://localhost:8080';

/**
 * @param {string} token
 * @returns {{ Authorization: string }}
 */
export function getAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
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

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const isJson = contentType.includes('application/json') || contentType.includes('+json');

  if (!response.ok) {
    let errorMessage;
    if (isJson) {
      const errorData = await response.json().catch(() => ({}));
      errorMessage = typeof errorData?.message === 'string' ? errorData.message : undefined;
    } else {
      errorMessage = await response.text().catch(() => '');
    }
    const error = /** @type {any} */ (
      new Error(errorMessage || `HTTP error! status: ${response.status}`)
    );
    error.status = response.status;
    error.response = response;
    throw error;
  }

  const body = await response.text();
  if (!body) return null;
  if (!isJson) return body;
  try {
    return JSON.parse(body);
  } catch (error) {
    throw error;
  }
}
