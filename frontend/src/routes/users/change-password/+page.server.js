// @ts-nocheck
import { fail, redirect } from "@sveltejs/kit";
import { apiFetch, getAuthHeaders } from "#lib/api.js";
import { getBffAuthHeaders } from "#lib/bffHeaders.js";

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
  default: async ({ request, locals, cookies, url, getClientAddress }) => {
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
          ...getBffAuthHeaders(getClientAddress),
          ...getAuthHeaders(token),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      // Backend revokes the previous JWT via tokenVersion++ on password change;
      // issue a fresh token for the current session or force clean re-login.
      let rotated = false;
      if (locals.user.email) {
        try {
          const loginResponse = await apiFetch("/api/auth/login", {
            method: "POST",
            headers: getBffAuthHeaders(getClientAddress),
            body: JSON.stringify({
              email: locals.user.email,
              password: newPassword,
            }),
          });
          if (loginResponse?.token) {
            const cookieOptions = {
              path: "/",
              httpOnly: true,
              maxAge: 36000,
              sameSite: "lax",
              secure: url.protocol === "https:",
            };
            cookies.set("authToken", loginResponse.token, cookieOptions);
            cookies.set(
              "userRole",
              loginResponse.role || locals.user.role,
              cookieOptions,
            );
            cookies.set("userEmail", locals.user.email, cookieOptions);
            rotated = true;
          }
        } catch {
          rotated = false;
        }
      }

      if (!rotated) {
        cookies.delete("authToken", { path: "/" });
        cookies.delete("userRole", { path: "/" });
        cookies.delete("userEmail", { path: "/" });
        throw redirect(303, "/login");
      }

      const target =
        locals.user.role === "ADMIN" ? "/dashboard" : "/appointments";
      throw redirect(303, target);
    } catch (error) {
      const err = /** @type {any} */ (error);
      if (err.status === 303 || err.status === 302 || err.status === 307) {
        throw err;
      }

      const status = err.status === 429 ? 429 : 400;
      return fail(status, {
        error:
          err.message ||
          "No se pudo cambiar la contraseña. Verificá que la clave actual sea correcta.",
      });
    }
  },
};
