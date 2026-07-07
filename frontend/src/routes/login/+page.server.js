import { redirect } from '@sveltejs/kit';
import { apiFetch } from '../../lib/api.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (locals.user) {
    throw redirect(303, '/');
  }
  return {};
}

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = data.get('email');
    const password = data.get('password');

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const { token, role } = response;

      const cookieOptions = {
        path: '/',
        httpOnly: true,
        maxAge: 24 * 60 * 60, // 24 hours
        sameSite: 'lax'
      };

      cookies.set('authToken', token, cookieOptions);
      cookies.set('userRole', role, cookieOptions);
      cookies.set('userEmail', email, cookieOptions);

      throw redirect(303, '/');
    } catch (error) {
      if (error.status === 303 || error.status === 302 || error.status === 307) {
        throw error;
      }
      
      const status = error.status;
      let errorMessage = 'Error al iniciar sesión';

      if (status === 401) {
        errorMessage = 'Credenciales incorrectas';
      } else if (status === 404) {
        errorMessage = 'Usuario no encontrado';
      }

      return {
        success: false,
        errors: {
          general: { msg: errorMessage }
        },
        oldData: { email }
      };
    }
  }
};
