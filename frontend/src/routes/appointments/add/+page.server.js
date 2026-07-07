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
    const patientId = data.get('patientId');
    const dentistId = data.get('dentistId');
    const appointmentDate = data.get('appointmentDate');
    const appointmentTime = data.get('appointmentTime');
    const description = data.get('description');

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
      if (error.status === 303 || error.status === 302 || error.status === 307) {
        throw error;
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
