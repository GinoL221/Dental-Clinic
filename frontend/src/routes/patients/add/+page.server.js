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
    const firstName = String(data.get('firstName') || '');
    const lastName = String(data.get('lastName') || '');
    const email = String(data.get('email') || '');
    const cardIdentity = String(data.get('cardIdentity') || '');
    const street = String(data.get('street') || '');
    const number = String(data.get('number') || '');
    const location = String(data.get('location') || '');
    const province = String(data.get('province') || '');

    const patientData = {
      firstName,
      lastName,
      email,
      cardIdentity: cardIdentity ? parseInt(cardIdentity) : null,
      admissionDate: new Date().toISOString().split('T')[0],
      address: (street || number || location || province) ? {
        street: street || '',
        number: number ? parseInt(number) : 0,
        location: location || '',
        province: province || ''
      } : undefined
    };

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
      const err = /** @type {any} */ (error);
      if (err.status === 303 || err.status === 302 || err.status === 307) {
        throw err;
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
