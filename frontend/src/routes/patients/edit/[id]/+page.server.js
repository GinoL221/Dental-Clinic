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
    const firstName = data.get('firstName');
    const lastName = data.get('lastName');
    const email = data.get('email');
    const cardIdentity = data.get('cardIdentity');
    const admissionDate = data.get('admissionDate');
    const street = data.get('street');
    const number = data.get('number');
    const location = data.get('location');
    const province = data.get('province');

    const patientData = {
      firstName,
      lastName,
      email,
      cardIdentity: cardIdentity ? parseInt(cardIdentity) : null,
      admissionDate
    };

    if (street || number || location || province) {
      patientData.address = {
        street: street || '',
        number: number ? parseInt(number) : 0,
        location: location || '',
        province: province || ''
      };
    }

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
      if (error.status === 303 || error.status === 302 || error.status === 307) {
        throw error;
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
