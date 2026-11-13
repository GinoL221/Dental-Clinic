import { redirect } from "@sveltejs/kit";
import { apiFetch, getAuthHeaders } from "../../../../lib/api.js";
import {
  usefulErrorMessage,
  getStatusLabel,
} from "../../../../lib/utils/formatters.js";
import { canTransition } from "../../../../lib/utils/statusMachine.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals }) {
  if (!locals.user || !locals.authToken) {
    throw redirect(303, "/login");
  }

  const token = locals.authToken;
  const [appointment, patients, dentists] = await Promise.all([
    apiFetch(`/api/appointments/${params.id}`, {
      headers: getAuthHeaders(token),
    }),
    apiFetch("/api/patients", { headers: getAuthHeaders(token) }),
    apiFetch("/api/dentists", { headers: getAuthHeaders(token) }),
  ]);

  return { appointment, patients, dentists };
}

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ params, request, locals }) => {
    if (!locals.user || !locals.authToken) {
      throw redirect(303, "/login");
    }

    const token = locals.authToken;
    const data = await request.formData();
    const patientId = String(data.get("patientId") || "");
    const dentistId = String(data.get("dentistId") || "");
    const appointmentDate = String(data.get("appointmentDate") || "");
    const appointmentTime = String(data.get("appointmentTime") || "");
    const description = String(data.get("description") || "");
    // P-6c (design.md §7): status comes as its own field. The PUT DTO
    // (AppointmentRequestDTO) has NO status field, so a status change is a
    // SECOND request (PATCH /appointments/{id}/status, Map body {status}) —
    // the same endpoint the dashboard's updateStatus action uses. If no
    // status field was submitted (terminal states render none), the old
    // PUT-only flow runs untouched.
    const status = String(data.get("status") || "");

    const appointmentData = {
      patientId: patientId ? parseInt(patientId) : null,
      dentistId: dentistId ? parseInt(dentistId) : null,
      date: appointmentDate,
      time: appointmentTime,
      description: description || "",
    };

    try {
      /** @type {any} */
      let current = null;
      if (status) {
        // Only fetched when a status change was requested: validates the
        // transition locally (mirroring AppointmentStatus.canTransitionTo)
        // and detects no-op submissions before touching the backend.
        current = await apiFetch(`/api/appointments/${params.id}`, {
          headers: getAuthHeaders(token),
        });
        if (
          current.status &&
          status !== current.status &&
          !canTransition(current.status, status)
        ) {
          return {
            success: false,
            error: `No se puede cambiar el estado de ${getStatusLabel(current.status)} a ${getStatusLabel(status)}.`,
            oldData: {
              patientId,
              dentistId,
              appointmentDate,
              appointmentTime,
              description,
              status,
            },
          };
        }
      }

      await apiFetch(`/api/appointments/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(token),
        },
        body: JSON.stringify(appointmentData),
      });

      if (status && current && status !== current.status) {
        try {
          await apiFetch(`/api/appointments/${params.id}/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(token),
            },
            body: JSON.stringify({ status }),
          });
        } catch (statusError) {
          const statusErr = /** @type {any} */ (statusError);
          const detail = usefulErrorMessage(statusErr.message)
            ? statusErr.message
            : "un error inesperado del servidor";
          return {
            success: false,
            error: `Los datos del turno se actualizaron, pero no se pudo cambiar el estado: ${detail}`,
            oldData: {
              patientId,
              dentistId,
              appointmentDate,
              appointmentTime,
              description,
              status,
            },
          };
        }
      }

      throw redirect(303, "/appointments");
    } catch (error) {
      const err = /** @type {any} */ (error);
      if (err.status === 303 || err.status === 302 || err.status === 307) {
        throw err;
      }

      return {
        success: false,
        // A validation 400 carries fieldErrors whose joined message would duplicate
        // what FormCard's list and the inline marks already show — expose the map alone.
        ...(err.fieldErrors && typeof err.fieldErrors === "object"
          ? { fieldErrors: err.fieldErrors }
          : {
              error: usefulErrorMessage(err.message)
                ? err.message
                : "Ya existe una cita en esa fecha y hora o los datos son inválidos.",
            }),
        oldData: {
          patientId,
          dentistId,
          appointmentDate,
          appointmentTime,
          description,
        },
      };
    }
  },
};
