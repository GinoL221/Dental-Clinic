import { API_BASE_URL, getAuthHeaders, handleApiError } from "../api/config.js";

class DashboardAPI {
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

  static async getStats() {
    try {
      return await this._fetchJson(`${API_BASE_URL}/dashboard/stats`, {
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        credentials: "include",
      });
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  }

  static async getAppointmentsByMonth() {
    return await this.getAppointmentsByMonthWithOptions();
  }

  static async getAppointmentsByMonthWithOptions({ cacheBust = false } = {}) {
    try {
      const url = `${API_BASE_URL}/dashboard/appointments-by-month${cacheBust ? `?ts=${Date.now()}` : ''}`;
      return await this._fetchJson(url, {
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        credentials: "include",
      });
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  }

  static async getUpcomingAppointments({ cacheBust = false } = {}) {
    try {
      const url = `${API_BASE_URL}/dashboard/upcoming-appointments${cacheBust ? `?ts=${Date.now()}` : ''}`;
      return await this._fetchJson(url, {
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        credentials: "include",
      });
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
