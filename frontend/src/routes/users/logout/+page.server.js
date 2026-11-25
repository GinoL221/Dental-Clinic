import { redirect } from "@sveltejs/kit";
import { apiFetch, getAuthHeaders } from "../../../lib/api.js";

/** @type {import('./$types').PageServerLoad} */
export function load() {
  throw redirect(303, "/");
}

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ cookies, locals }) => {
    const token = locals.authToken || cookies.get("authToken");
    if (token) {
      try {
        await apiFetch("/api/auth/logout", {
          method: "POST",
          headers: getAuthHeaders(token),
        });
      } catch {
        // Always clear browser cookies even if token already expired or backend is unreachable.
      }
    }
    cookies.delete("authToken", { path: "/" });
    cookies.delete("userRole", { path: "/" });
    cookies.delete("userEmail", { path: "/" });
    throw redirect(303, "/");
  },
};
