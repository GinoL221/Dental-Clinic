import { API_BASE_URL, getAuthHeaders, handleApiError } from "../api/config.js";

class DashboardAPI {
  static normalizeSnapshotResponse(snapshot = {}) {
    const monthlyStats = Array.isArray(snapshot.monthlyStats)
      ? snapshot.monthlyStats
      : [];
    const upcomingAppointments = Array.isArray(snapshot.upcomingAppointments)
      ? snapshot.upcomingAppointments
      : [];

    return {
      totalAppointments: Number(snapshot.totalAppointments || 0),
      totalDentists: Number(snapshot.totalDentists || 0),
      totalPatients: Number(snapshot.totalPatients || 0),
      todayAppointments: Number(snapshot.todayAppointments || 0),
      monthlyStats,
      upcomingAppointments,
    };
  }

  static async _fetchJson(url, opts = {}) {
    const res = await fetch(url, opts);
    let body = null;
    try {
      body = await res.json();
    } catch (e) {
      try {
        body = await res.text();
      } catch (_) {
        body = null;
      }
    }
    if (!res.ok) {
      const msg =
        (body && (body.message || body.error)) ||
        body ||
        `${res.status} ${res.statusText}`;
      const err = new Error(String(msg));
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body;
  }

  static async getSnapshot() {
    try {
      const response = await this._fetchJson(`${API_BASE_URL}/dashboard/snapshot`, {
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        credentials: "include",
      });

      return this.normalizeSnapshotResponse(response);
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  }

  static async updateAppointmentStatus(id, status) {
    try {
      if (!id) throw new Error('ID de cita requerido');
      return await this._fetchJson(`${API_BASE_URL}/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  }
}

export default DashboardAPI;
