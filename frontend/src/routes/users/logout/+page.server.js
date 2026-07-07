import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export function load({ cookies }) {
  cookies.delete('authToken', { path: '/' });
  cookies.delete('userRole', { path: '/' });
  cookies.delete('userEmail', { path: '/' });
  throw redirect(303, '/');
}

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ cookies }) => {
    cookies.delete('authToken', { path: '/' });
    cookies.delete('userRole', { path: '/' });
    cookies.delete('userEmail', { path: '/' });
    throw redirect(303, '/');
  }
};
