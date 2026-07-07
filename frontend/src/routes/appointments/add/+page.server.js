import { redirect } from '@sveltejs/kit';
import { apiFetch, getAuthHeaders } from '../../../lib/api.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const token = locals.user.token;
  const [patients, dentists] = await Promise.all([
    apiFetch('/api/patients', { headers: getAuthHeaders(token) }),
    apiFetch('/api/dentists', { headers: getAuthHeaders(token) })
  ]);

  return { patients, dentists };
}

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(303, '/login');
    }

    const token = locals.user.token;
    const data = await request.formData();
    const patientId = String(data.get('patientId') || '');
    const dentistId = String(data.get('dentistId') || '');
    const appointmentDate = String(data.get('appointmentDate') || '');
    const appointmentTime = String(data.get('appointmentTime') || '');
    const description = String(data.get('description') || '');

    const appointmentData = {
      patientId: patientId ? parseInt(patientId) : null,
      dentistId: dentistId ? parseInt(dentistId) : null,
      date: appointmentDate,
      time: appointmentTime,
      description: description || ''
    };

    try {
      await apiFetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(token)
        },
        body: JSON.stringify(appointmentData)
      });

      throw redirect(303, '/appointments');
    } catch (error) {
      const err = /** @type {any} */ (error);
      if (err.status === 303 || err.status === 302 || err.status === 307) {
        throw err;
      }

      return {
        success: false,
        error: 'Ya existe una cita en esa fecha y hora o los datos son inválidos.',
        oldData: {
          patientId,
          dentistId,
          appointmentDate,
          appointmentTime,
          description
        }
      };
    }
  }
};
