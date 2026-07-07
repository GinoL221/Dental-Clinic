import { redirect } from '@sveltejs/kit';

export function load({ cookies }) {
  cookies.delete('authToken', { path: '/' });
  cookies.delete('userRole', { path: '/' });
  cookies.delete('userEmail', { path: '/' });
  throw redirect(303, '/');
}

export const actions = {
  default: async ({ cookies }) => {
    cookies.delete('authToken', { path: '/' });
    cookies.delete('userRole', { path: '/' });
    cookies.delete('userEmail', { path: '/' });
    throw redirect(303, '/');
  }
};
