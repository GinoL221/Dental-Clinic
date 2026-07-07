import { redirect } from '@sveltejs/kit';
import { apiFetch, getAuthHeaders } from '../../lib/api.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const token = locals.user.token;
  try {
    const patients = await apiFetch('/api/patients', {
      headers: getAuthHeaders(token)
    });
    return { patients };
  } catch (err) {
    return { patients: [], error: 'Error al cargar pacientes' };
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
      await apiFetch(`/api/patients/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token)
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'No se puede eliminar el paciente porque tiene citas asociadas o error del servidor.'
      };
    }
  }
};
