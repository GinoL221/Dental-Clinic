import { redirect } from "@sveltejs/kit";
import { apiFetch, getAuthHeaders } from "./lib/api.js";

const guardedPrefixes = [
  "/dashboard",
  "/patients",
  "/dentists",
  "/appointments",
  "/users/change-password",
];

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const token = event.cookies.get("authToken");
  const isGuarded = guardedPrefixes.some((prefix) =>
    event.url.pathname.startsWith(prefix),
  );

  if (!token) {
    event.locals.user = null;
    event.locals.authToken = null;
    if (isGuarded) {
      throw redirect(303, "/login");
    }
    return resolve(event);
  }

  try {
    const user = await apiFetch("/api/auth/me", {
      headers: getAuthHeaders(token),
    });

    event.locals.user = user;
    event.locals.authToken = token;
  } catch {
    event.locals.user = null;
    event.locals.authToken = null;

    event.cookies.delete("authToken", { path: "/" });
    event.cookies.delete("userRole", { path: "/" });
    event.cookies.delete("userEmail", { path: "/" });

    if (isGuarded) {
      throw redirect(303, "/login");
    }
  }

  if (
    event.locals.user?.mustChangePassword &&
    !event.url.pathname.startsWith("/users/change-password") &&
    !event.url.pathname.startsWith("/users/logout")
  ) {
    throw redirect(303, "/users/change-password");
  }

  return resolve(event);
}
