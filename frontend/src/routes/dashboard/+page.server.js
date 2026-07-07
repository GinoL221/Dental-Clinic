import { redirect, error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  if (locals.user.role !== 'ADMIN') {
    throw error(403, {
      message: 'No tienes permisos para acceder al dashboard. Solo los administradores pueden ver esta página.'
    });
  }

  return {
    user: locals.user
  };
}
