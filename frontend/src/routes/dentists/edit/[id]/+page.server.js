import { error, redirect } from "@sveltejs/kit";
import { apiFetch, getAuthHeaders } from "../../../../lib/api.js";
import { usefulErrorMessage } from "../../../../lib/utils/formatters.js";
import { parseNumericId } from "../../../../lib/validation/routeId.js";

/**
 * Resolves a safe user-facing error message for specialty actions.
 * @param {unknown} error
 * @param {string} fallback
 */
function specialtyErrorFrom(error, fallback) {
  const err = /** @type {any} */ (error);
  return usefulErrorMessage(err?.message) ? err.message : fallback;
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals }) {
  if (!locals.user || !locals.authToken) {
    throw redirect(303, "/login");
  }

  const dentistId = parseNumericId(params.id);
  if (!dentistId) {
    throw error(400, "Identificador de odontólogo inválido.");
  }

  const token = locals.authToken;
  const headers = getAuthHeaders(token);
  const [dentist, specialties] = await Promise.all([
    apiFetch(`/api/dentists/${dentistId}`, { headers }),
    apiFetch("/api/specialties", { headers }).catch(() => []),
  ]);

  return {
    dentist,
    specialties: Array.isArray(specialties) ? specialties : [],
    user: locals.user,
  };
}

/** @type {import('./$types').Actions} */
export const actions = {
  update: async ({ params, request, locals }) => {
    if (!locals.user || !locals.authToken) {
      throw redirect(303, "/login");
    }

    const dentistId = parseNumericId(params.id);
    if (!dentistId) {
      return {
        success: false,
        error: "Identificador de odontólogo inválido.",
      };
    }

    const token = locals.authToken;
    const data = await request.formData();
    const firstName = String(data.get("firstName") || "");
    const lastName = String(data.get("lastName") || "");
    const email = String(data.get("email") || "");
    const registrationNumber = String(data.get("registrationNumber") || "");

    const dentistData = {
      firstName,
      lastName,
      email,
      registrationNumber,
    };

    try {
      await apiFetch(`/api/dentists/${dentistId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(token),
        },
        body: JSON.stringify(dentistData),
      });

      throw redirect(303, "/dentists");
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
                : "Error al actualizar el odontólogo.",
            }),
        oldData: {
          firstName,
          lastName,
          email,
          registrationNumber,
        },
      };
    }
  },

  assignSpecialty: async ({ params, request, locals }) => {
    if (!locals.user || !locals.authToken) {
      throw redirect(303, "/login");
    }

    const dentistId = parseNumericId(params.id);
    if (!dentistId) {
      return { specialtyError: "Identificador de odontólogo inválido." };
    }

    const data = await request.formData();
    const rawSpecialtyId = String(data.get("specialtyId") || "").trim();
    if (!rawSpecialtyId) {
      return { specialtyError: "Seleccioná una especialidad para asignar." };
    }
    const specialtyId = parseNumericId(rawSpecialtyId);
    if (!specialtyId) {
      return { specialtyError: "Especialidad inválida." };
    }

    try {
      await apiFetch(
        `/api/specialties/dentists/${dentistId}/specialties/${specialtyId}`,
        {
          method: "POST",
          headers: getAuthHeaders(locals.authToken),
        },
      );
      return { specialtySuccess: "Especialidad asignada" };
    } catch (error) {
      return {
        specialtyError: specialtyErrorFrom(
          error,
          "No se pudo asignar la especialidad.",
        ),
      };
    }
  },

  removeSpecialty: async ({ params, request, locals }) => {
    if (!locals.user || !locals.authToken) {
      throw redirect(303, "/login");
    }

    const dentistId = parseNumericId(params.id);
    if (!dentistId) {
      return { specialtyError: "Identificador de odontólogo inválido." };
    }

    const data = await request.formData();
    const specialtyId = parseNumericId(data.get("specialtyId"));
    if (!specialtyId) {
      return { specialtyError: "Especialidad inválida." };
    }

    try {
      await apiFetch(
        `/api/specialties/dentists/${dentistId}/specialties/${specialtyId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(locals.authToken),
        },
      );
      return { specialtySuccess: "Especialidad quitada" };
    } catch (error) {
      return {
        specialtyError: specialtyErrorFrom(
          error,
          "No se pudo quitar la especialidad.",
        ),
      };
    }
  },

  createSpecialty: async ({ params, request, locals }) => {
    if (!locals.user || !locals.authToken) {
      throw redirect(303, "/login");
    }

    const dentistId = parseNumericId(params.id);
    if (!dentistId) {
      return { specialtyError: "Identificador de odontólogo inválido." };
    }

    const data = await request.formData();
    const name = String(data.get("name") || "").trim();
    const description = String(data.get("description") || "").trim();
    if (!name) {
      return { specialtyError: "El nombre de la especialidad es obligatorio." };
    }

    const headers = getAuthHeaders(locals.authToken);
    try {
      const created = await apiFetch("/api/specialties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ name, description }),
      });

      const createdId = parseNumericId(created?.id);
      if (createdId) {
        await apiFetch(
          `/api/specialties/dentists/${dentistId}/specialties/${createdId}`,
          {
            method: "POST",
            headers,
          },
        );
      }
      return { specialtySuccess: "Especialidad creada y asignada" };
    } catch (error) {
      return {
        specialtyError: specialtyErrorFrom(
          error,
          "No se pudo crear la especialidad.",
        ),
      };
    }
  },
};
