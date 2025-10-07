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
    try {
      return await this._fetchJson(
        `${API_BASE_URL}/dashboard/appointments-by-month`,
        {
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          credentials: "include",
        }
      );
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  }

  static async getUpcomingAppointments() {
    try {
      return await this._fetchJson(
        `${API_BASE_URL}/dashboard/upcoming-appointments`,
        {
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          credentials: "include",
        }
      );
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  }
}

export default DashboardAPI;
