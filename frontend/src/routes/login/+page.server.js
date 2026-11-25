import { redirect } from "@sveltejs/kit";
import { apiFetch } from "../../lib/api.js";
import { getBffAuthHeaders } from "../../lib/bffHeaders.js";
import { usefulErrorMessage } from "../../lib/utils/formatters.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (locals.user) {
    throw redirect(303, "/");
  }
  return {};
}

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request, cookies, url, getClientAddress }) => {
    const data = await request.formData();
    const email = String(data.get("email") || "");
    const password = String(data.get("password") || "");

    try {
      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: getBffAuthHeaders(getClientAddress),
        body: JSON.stringify({ email, password }),
      });

      const { token, role } = response;

      /** @type {any} */
      const cookieOptions = {
        path: "/",
        httpOnly: true,
        maxAge: 36000, // 10 hours, matches JWT expiry
        sameSite: "lax",
        secure: url.protocol === "https:",
      };

      cookies.set("authToken", token, cookieOptions);
      cookies.set("userRole", role, cookieOptions);
      cookies.set("userEmail", email, cookieOptions);

      if (role === "ADMIN") {
        throw redirect(303, "/dashboard");
      }
      throw redirect(303, "/");
    } catch (error) {
      const err = /** @type {any} */ (error);
      if (err.status === 303 || err.status === 302 || err.status === 307) {
        throw err;
      }

      const status = err.status;
      let errorMessage = "Error al iniciar sesión";

      if (status === 401) {
        errorMessage = "Credenciales incorrectas";
      } else if (status === 404) {
        errorMessage = "Usuario no encontrado";
      } else if (status === 429) {
        const raw = typeof err?.message === "string" ? err.message.trim() : "";
        errorMessage = usefulErrorMessage(raw)
          ? raw
          : "Demasiados intentos en poco tiempo. Esperá unos segundos e intentá nuevamente.";
      }

      return {
        success: false,
        errors: {
          general: { msg: errorMessage },
        },
        oldData: { email },
      };
    }
  },
};
