// @ts-nocheck
import { fail, redirect } from "@sveltejs/kit";
import { apiFetch, getAuthHeaders } from "$lib/api.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user || !locals.authToken) {
    throw redirect(303, "/login");
  }

  return {
    user: locals.user,
  };
}

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request, locals }) => {
    if (!locals.user || !locals.authToken) {
      throw redirect(303, "/login");
    }

    const token = locals.authToken;
    const data = await request.formData();
    const currentPassword = String(data.get("currentPassword") || "");
    const newPassword = String(data.get("newPassword") || "");
    const confirmPassword = String(data.get("confirmPassword") || "");

    if (!currentPassword) {
      return fail(400, {
        error: "Tenés que ingresar tu contraseña actual o temporal.",
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return fail(400, {
        error: "La nueva contraseña debe tener al menos 6 caracteres.",
      });
    }

    if (newPassword !== confirmPassword) {
      return fail(400, {
        error: "La nueva contraseña y su confirmación no coinciden.",
      });
    }

    if (newPassword === currentPassword) {
      return fail(400, {
        error: "La nueva contraseña debe ser diferente a la contraseña actual.",
      });
    }

    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(token),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const target =
        locals.user.role === "ADMIN" ? "/dashboard" : "/appointments";
      throw redirect(303, target);
    } catch (error) {
      const err = /** @type {any} */ (error);
      if (err.status === 303 || err.status === 302 || err.status === 307) {
        throw err;
      }

      return fail(400, {
        error:
          err.message ||
          "No se pudo cambiar la contraseña. Verificá que la clave actual sea correcta.",
      });
    }
  },
};
