import { redirect, error } from '@sveltejs/kit';
import { apiFetch, getAuthHeaders } from '../../lib/api.js';

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

  try {
    const snapshot = await apiFetch('/api/dashboard/snapshot', {
      headers: getAuthHeaders(locals.user.token)
    });
    return {
      user: locals.user,
      snapshot
    };
  } catch (err) {
    return {
      user: locals.user,
      snapshot: {
        totalAppointments: 0,
        totalDentists: 0,
        totalPatients: 0,
        todayAppointments: 0,
        monthlyStats: [],
        upcomingAppointments: []
      },
      error: 'Error al cargar el dashboard'
    };
  }
}

/** @type {import('./$types').Actions} */
export const actions = {
  updateStatus: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(303, '/login');
    }
    if (locals.user.role !== 'ADMIN') {
      throw error(403, 'No tienes permisos');
    }

    const data = await request.formData();
    const id = data.get('id');
    const status = data.get('status');

    try {
      await apiFetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(locals.user.token),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Error al actualizar estado' };
    }
  }
};
