import { redirect } from '@sveltejs/kit';
import { apiFetch, getAuthHeaders } from '../../lib/api.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const token = locals.user.token;
  try {
    const [res, patients, dentists] = await Promise.all([
      apiFetch('/api/appointments/search', { headers: getAuthHeaders(token) }),
      apiFetch('/api/patients', { headers: getAuthHeaders(token) }).catch(() => []),
      apiFetch('/api/dentists', { headers: getAuthHeaders(token) }).catch(() => [])
    ]);

    const appointments = Array.isArray(res) ? res : (res?.content || []);
    return { appointments, patients, dentists };
  } catch (err) {
    return { appointments: [], patients: [], dentists: [], error: 'Error al cargar citas' };
  }
}

/** @type {import('./$types').Actions} */
export const actions = {
  delete: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(303, '/login');
    }

    const token = locals.user.token;
    const data = await request.formData();
    const id = data.get('id');

    try {
      await apiFetch(`/api/appointments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token)
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Error al eliminar la cita.'
      };
    }
  }
};
