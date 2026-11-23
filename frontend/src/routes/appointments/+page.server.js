import { redirect } from "@sveltejs/kit";
import { apiFetch, getAuthHeaders } from "../../lib/api.js";
import { usefulErrorMessage } from "../../lib/utils/formatters.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user || !locals.authToken) {
    throw redirect(303, "/login");
  }

  const token = locals.authToken;
  const isPatient = locals.user.role === "PATIENT";
  const selfPatient =
    isPatient &&
    locals.user.id != null &&
    (locals.user.firstName || locals.user.lastName)
      ? [
          {
            id: locals.user.id,
            firstName: locals.user.firstName || "",
            lastName: locals.user.lastName || "",
          },
        ]
      : [];

  try {
    const [res, patients, dentists] = await Promise.all([
      apiFetch("/api/appointments/search", { headers: getAuthHeaders(token) }),
      isPatient
        ? Promise.resolve(selfPatient)
        : apiFetch("/api/patients", { headers: getAuthHeaders(token) }).catch(
            () => [],
          ),
      apiFetch("/api/dentists", { headers: getAuthHeaders(token) }).catch(
        () => [],
      ),
    ]);

    const appointments = Array.isArray(res) ? res : res?.content || [];
    return { appointments, patients, dentists, user: locals.user };
  } catch (err) {
    return {
      appointments: [],
      patients: [],
      dentists: [],
      user: locals.user,
      error: "Error al cargar turnos",
    };
  }
}

/** @type {import('./$types').Actions} */
export const actions = {
  delete: async ({ request, locals }) => {
    if (!locals.user || !locals.authToken) {
      throw redirect(303, "/login");
    }

    const token = locals.authToken;
    const data = await request.formData();
    const id = data.get("id");

    try {
      await apiFetch(`/api/appointments/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });
      return { success: true };
    } catch (error) {
      const err = /** @type {any} */ (error);
      return {
        success: false,
        error: usefulErrorMessage(err?.message)
          ? err.message
          : "Error al eliminar el turno.",
      };
    }
  },
};
