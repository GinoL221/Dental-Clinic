import { redirect } from "@sveltejs/kit";
import { apiFetch, getAuthHeaders } from "../../../lib/api.js";
import { usefulErrorMessage } from "../../../lib/utils/formatters.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user || !locals.authToken) {
    throw redirect(303, "/login");
  }

  const token = locals.authToken;
  const isPatient = locals.user.role === "PATIENT";

  const [patients, dentists] = await Promise.all([
    isPatient
      ? Promise.resolve([])
      : apiFetch("/api/patients", { headers: getAuthHeaders(token) }),
    apiFetch("/api/dentists", { headers: getAuthHeaders(token) }),
  ]);

  return { patients, dentists, isPatient, user: locals.user };
}

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request, locals }) => {
    if (!locals.user || !locals.authToken) {
      throw redirect(303, "/login");
    }

    const token = locals.authToken;
    const isPatient = locals.user.role === "PATIENT";
    const data = await request.formData();
    const patientId = String(data.get("patientId") || "");
    const dentistId = String(data.get("dentistId") || "");
    const appointmentDate = String(data.get("appointmentDate") || "");
    const appointmentTime = String(data.get("appointmentTime") || "");
    const description = String(data.get("description") || "");

    let resolvedPatientId = null;
    if (isPatient) {
      resolvedPatientId = locals.user.id;
    } else if (patientId) {
      resolvedPatientId = parseInt(patientId);
    }

    const appointmentData = {
      patientId: resolvedPatientId,
      dentistId: dentistId ? parseInt(dentistId) : null,
      date: appointmentDate,
      time: appointmentTime,
      description: description || "",
    };

    try {
      await apiFetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(token),
        },
        body: JSON.stringify(appointmentData),
      });

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
