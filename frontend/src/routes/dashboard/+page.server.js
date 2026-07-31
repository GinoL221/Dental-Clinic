import { redirect, error } from '@sveltejs/kit';
import { apiFetch, getAuthHeaders } from '../../lib/api.js';
import { parseDashboardFilters } from '../../lib/validation/dashboardFilters.js';

const EMPTY_SNAPSHOT = {
  totalAppointments: 0,
  totalDentists: 0,
  totalPatients: 0,
  todayAppointments: 0,
  monthlyStats: [],
  upcomingAppointments: [],
  statusBreakdown: [],
  dentistBreakdown: []
};

/**
 * @param {import('../../lib/validation/dashboardFilters.js').AppliedFilters} applied
 * @returns {string}
 */
function buildSnapshotQuery(applied) {
  const params = new URLSearchParams();
  if (applied.from) params.set('from', applied.from);
  if (applied.to) params.set('to', applied.to);
  if (applied.dentistId !== null && applied.dentistId !== undefined) {
    params.set('dentistId', String(applied.dentistId));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ url, locals }) {
  if (!locals.user || !locals.authToken) {
    throw redirect(303, '/login');
  }

  if (locals.user.role !== 'ADMIN') {
    throw error(403, {
      message: 'No tienes permisos para acceder al dashboard. Solo los administradores pueden ver esta página.'
    });
  }

  const headers = getAuthHeaders(locals.authToken);
  const parsed = parseDashboardFilters(url.searchParams);
  const filters = parsed.valid ? parsed.applied : parsed.raw;
  const snapshotUrl = `/api/dashboard/snapshot${parsed.valid ? buildSnapshotQuery(parsed.applied) : ''}`;

  try {
    const [snapshot, dentists] = await Promise.all([
      apiFetch(snapshotUrl, { headers }),
      apiFetch('/api/dentists', { headers }).catch(() => [])
    ]);

    return {
      user: locals.user,
      snapshot,
      dentists,
      filters,
      ...(parsed.valid ? {} : { filterError: parsed.error })
    };
  } catch (err) {
    return {
      user: locals.user,
      snapshot: EMPTY_SNAPSHOT,
      dentists: [],
      filters,
      error: 'Error al cargar el dashboard',
      ...(parsed.valid ? {} : { filterError: parsed.error })
    };
  }
}

/** @type {import('./$types').Actions} */
export const actions = {
  updateStatus: async ({ request, locals }) => {
    if (!locals.user || !locals.authToken) {
      throw redirect(303, '/login');
    }
    if (locals.user.role !== 'ADMIN') {
      throw error(403, 'No tienes permisos');
    }

    const data = await request.formData();
    const id = String(data.get('id') || '');
    const status = String(data.get('status') || '');

    try {
      await apiFetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(locals.authToken),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      return { success: true };
    } catch (err) {
      const errorCast = /** @type {any} */ (err);
      return { success: false, error: errorCast.message || 'Error al actualizar estado' };
    }
  }
};
