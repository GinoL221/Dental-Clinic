/**
 * Clinical schedule hours help text shown beneath appointment date/time inputs.
 * Mirrors the Monday–Friday 08:00–18:00 window enforced in
 * `backend/src/main/java/com/dh/dentalClinicMVC/service/impl/AppointmentScheduleValidator.java` (lines 29–44).
 */
export const APPOINTMENT_HOURS_HELP =
  "Atención de lunes a viernes, de 08:00 a 18:00.";

/**
 * Formats a YYYY-MM-DD date string as DD/MM/YYYY.
 * Returns empty string for falsy input or the original string if parts != 3.
 * @param {string | null | undefined} dateString
 * @returns {string}
 */
export function formatLocalDate(dateString) {
  if (!dateString) return "";
  try {
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } catch {
    // split() does not throw; kept as a guard so a malformed input never
    // propagates from a display formatter.
  }
  return dateString;
}

/** @type {Record<string, string>} */
const STATUS_LABELS = {
  SCHEDULED: "Programada",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  CANCELED: "Cancelada",
};

/**
 * Returns human-readable label for appointment status.
 * @param {string} status
 * @returns {string}
 */
export function getStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

/** @type {Record<string, string>} */
const STATUS_CLASSES = {
  SCHEDULED: "status-scheduled",
  IN_PROGRESS: "status-in-progress",
  COMPLETED: "status-completed",
  CANCELLED: "status-cancelled",
  CANCELED: "status-cancelled",
};

/**
 * Returns the project status chip class for appointment status
 * (AA-verified token pairs defined in static/css/base/tokens.css,
 * styled in static/css/components/tables.css).
 * @param {string} status
 * @returns {string}
 */
export function getStatusClass(status) {
  return STATUS_CLASSES[status] || "status-neutral";
}

/**
 * Returns the validation message for a field from a fieldErrors map
 * (ErrorResponse.fieldErrors), or undefined when absent/empty.
 * @param {Record<string, string> | null | undefined} fieldErrors
 * @param {string} field
 * @returns {string | undefined}
 */
export function fieldErrorFor(fieldErrors, field) {
  if (!fieldErrors || typeof fieldErrors !== "object") return undefined;
  const message = fieldErrors[field];
  return typeof message === "string" && message ? message : undefined;
}

/**
 * Shared rule (T1): a backend error message is useful when non-empty and not
 * the generic "HTTP error! ..." fallback produced by apiFetch.
 * @param {string | null | undefined} message
 * @returns {boolean}
 */
export function usefulErrorMessage(message) {
  return Boolean(message && !message.startsWith("HTTP error!"));
}

/**
 * Resolves a patient display name from the patients list, falling back to
 * the authenticated PATIENT session user when the appointment belongs to them.
 * @param {any} patientId
 * @param {Array<{ id: any, firstName?: string, lastName?: string }> | null | undefined} patients
 * @param {{ id?: any, role?: string, firstName?: string, lastName?: string } | null | undefined} user
 * @returns {string}
 */
export function resolvePatientName(patientId, patients, user) {
  const list = Array.isArray(patients) ? patients : [];
  const patient = list.find((p) => p.id === patientId);
  if (patient) {
    const fullName =
      `${patient.firstName || ""} ${patient.lastName || ""}`.trim();
    if (fullName) return fullName;
  }
  if (user?.role === "PATIENT" && patientId === user.id) {
    const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    if (userName) return userName;
  }
  return "Paciente #" + patientId;
}

/**
 * Neutralizes spreadsheet formula triggers (leading =, +, -, at-sign, tab, or CR,
 * including after leading whitespace) and applies RFC 4180 double-quote escaping.
 * @param {unknown} raw
 * @returns {string}
 */
function sanitizeCsvCell(raw) {
  const str = String(raw ?? "");
  const safe = /^\s*[=+\-@]|^[\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * Generates RFC 4180 compliant CSV string from appointment items.
 * @param {Array<Record<string, any>>} items
 * @returns {string}
 */
export function generateAppointmentsCsv(items) {
  if (!items || !items.length) return "";
  const keys = ["id", "patientName", "dentistName", "date", "time", "status"];
  const rows = items.map((it) =>
    keys.map((k) => sanitizeCsvCell(it[k])).join(","),
  );
  return [keys.join(","), ...rows].join("\r\n");
}

/**
 * Triggers a browser download of upcoming appointments as CSV.
 * Returns false when there is nothing to export; the caller surfaces that
 * in-page (design.md §6.4 — no native alert()).
 * @param {Array<Record<string, any>>} items
 * @returns {boolean} True if download was initiated, false otherwise.
 */
export function exportAppointmentsCsv(items) {
  const csv = generateAppointmentsCsv(items);
  if (!csv) {
    return false;
  }
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "upcoming_appointments.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}
