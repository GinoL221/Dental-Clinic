import { redirect } from "@sveltejs/kit";
import { apiFetch, getAuthHeaders } from "../../../lib/api.js";
import { usefulErrorMessage } from "../../../lib/utils/formatters.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user || !locals.authToken) {
    throw redirect(303, "/login");
  }
  return {};
}

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request, locals }) => {
    if (!locals.user || !locals.authToken) {
      throw redirect(303, "/login");
    }

    const token = locals.authToken;
    const data = await request.formData();
    const firstName = String(data.get("firstName") || "");
    const lastName = String(data.get("lastName") || "");
    const email = String(data.get("email") || "");
    const registrationNumber = String(data.get("registrationNumber") || "");
    const password = String(data.get("password") || "").trim();

    /** @type {Record<string, any>} */
    const dentistData = {
      firstName,
      lastName,
      email,
      registrationNumber,
      ...(password ? { password } : {}),
    };

    try {
      await apiFetch("/api/dentists", {
        method: "POST",
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
                : "Ya existe un odontólogo con esa matrícula o email.",
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
};
