import { redirect } from '@sveltejs/kit';
import { apiFetch } from '../../../lib/api.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (locals.user) {
    throw redirect(303, '/');
  }
  return {};
}

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const firstName = data.get('firstName');
    const lastName = data.get('lastName');
    const email = data.get('email');
    const password = data.get('password');
    const cardIdentity = data.get('cardIdentity');
    const admissionDate = data.get('admissionDate');
    const street = data.get('street');
    const number = data.get('number');
    const location = data.get('location');
    const province = data.get('province');
    const role = data.get('role') || 'PATIENT';

    // Prepare userData object matching backend requirements
    /** @type {any} */
    const userData = {
      firstName,
      lastName,
      email,
      password,
      role
    };

    if (cardIdentity) userData.cardIdentity = parseInt(String(cardIdentity));
    if (admissionDate) userData.admissionDate = admissionDate;

    const hasAddressData = street || number || location || province;
    if (hasAddressData) {
      userData.address = {
        street: street || '',
        number: number ? parseInt(String(number)) : 0,
        location: location || '',
        province: province || ''
      };
    }

    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      throw redirect(303, '/login?registered=true');
    } catch (error) {
      const err = /** @type {any} */ (error);
      if (err.status === 303 || err.status === 302 || err.status === 307) {
        throw error;
      }

      const status = err.status;
      let errorMessage = 'Error al registrar usuario';

      if (status === 409) {
        errorMessage = 'Este email ya está registrado';
      } else if (status === 400) {
        errorMessage = 'Datos de registro inválidos';
      }

      return {
        success: false,
        errors: {
          general: { msg: errorMessage }
        },
        oldData: {
          firstName,
          lastName,
          email,
          role,
          cardIdentity: cardIdentity || '',
          street: street || '',
          number: number || '',
          location: location || '',
          province: province || ''
        }
      };
    }
  }
};
