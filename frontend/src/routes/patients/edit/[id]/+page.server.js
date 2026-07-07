import { redirect } from '@sveltejs/kit';
import { apiFetch, getAuthHeaders } from '../../../../lib/api.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals }) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const token = locals.user.token;
  const patient = await apiFetch(`/api/patients/${params.id}`, {
    headers: getAuthHeaders(token)
  });

  return { patient };
}

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ params, request, locals }) => {
    if (!locals.user) {
      throw redirect(303, '/login');
    }

    const token = locals.user.token;
    const data = await request.formData();
    const firstName = String(data.get('firstName') || '');
    const lastName = String(data.get('lastName') || '');
    const email = String(data.get('email') || '');
    const cardIdentity = String(data.get('cardIdentity') || '');
    const admissionDate = String(data.get('admissionDate') || '');
    const street = String(data.get('street') || '');
    const number = String(data.get('number') || '');
    const location = String(data.get('location') || '');
    const province = String(data.get('province') || '');

    const patientData = {
      firstName,
      lastName,
      email,
      cardIdentity: cardIdentity ? parseInt(cardIdentity) : null,
      admissionDate,
      address: (street || number || location || province) ? {
        street: street || '',
        number: number ? parseInt(number) : 0,
        location: location || '',
        province: province || ''
      } : undefined
    };

    try {
      await apiFetch(`/api/patients/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(token)
        },
        body: JSON.stringify(patientData)
      });

      throw redirect(303, '/patients');
    } catch (error) {
      const err = /** @type {any} */ (error);
      if (err.status === 303 || err.status === 302 || err.status === 307) {
        throw err;
      }

      return {
        success: false,
        error: 'Error al actualizar el paciente.',
        oldData: {
          firstName,
          lastName,
          email,
          cardIdentity,
          admissionDate,
          street,
          number,
          location,
          province
        }
      };
    }
  }
};
