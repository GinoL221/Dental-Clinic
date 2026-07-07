import { redirect } from '@sveltejs/kit';
import { apiFetch, getAuthHeaders } from '../../../lib/api.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  return {};
}

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(303, '/login');
    }

    const token = locals.user.token;
    const data = await request.formData();
    const firstName = data.get('firstName');
    const lastName = data.get('lastName');
    const email = data.get('email');
    const cardIdentity = data.get('cardIdentity');
    const street = data.get('street');
    const number = data.get('number');
    const location = data.get('location');
    const province = data.get('province');

    const patientData = {
      firstName,
      lastName,
      email,
      cardIdentity: cardIdentity ? parseInt(cardIdentity) : null,
      admissionDate: new Date().toISOString().split('T')[0]
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
      await apiFetch('/api/patients', {
        method: 'POST',
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
        error: 'Ya existe un paciente con ese DNI o email.',
        oldData: {
          firstName,
          lastName,
          email,
          cardIdentity,
          street,
          number,
          location,
          province
        }
      };
    }
  }
};
