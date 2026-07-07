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
    const registrationNumber = String(data.get('registrationNumber') || '');

    const dentistData = {
      firstName,
      lastName,
      email,
      registrationNumber
    };

    try {
      await apiFetch('/api/dentists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(token)
        },
        body: JSON.stringify(dentistData)
      });

      throw redirect(303, '/dentists');
    } catch (error) {
      const err = /** @type {any} */ (error);
      if (err.status === 303 || err.status === 302 || err.status === 307) {
        throw err;
      }

      return {
        success: false,
        error: 'Ya existe un odontólogo con esa matrícula o email.',
        oldData: {
          firstName,
          lastName,
          email,
          registrationNumber
        }
      };
    }
  }
};
