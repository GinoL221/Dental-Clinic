import { redirect } from "@sveltejs/kit";
import { apiFetch, getAuthHeaders } from "./lib/api.js";

const guardedPrefixes = [
  "/dashboard",
  "/patients",
  "/dentists",
  "/appointments",
  "/users/change-password",
];

/**
 * Applies defensive HTTP security headers to SvelteKit SSR responses.
 * @param {Response} response
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @param {boolean} isGuarded
 * @returns {Response}
 */
function applySecurityHeaders(response, event, isGuarded) {
  if (
    !response ||
    !response.headers ||
    typeof response.headers.set !== "function"
  ) {
    return response;
  }
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  if (event.url?.protocol === "https:") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }
  if (isGuarded || Boolean(event.locals?.user)) {
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}

/** @type {import('@sveltejs/kit/hooks').Handle} */
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
    const response = await resolve(event);
    return applySecurityHeaders(response, event, isGuarded);
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

  const response = await resolve(event);
  return applySecurityHeaders(response, event, isGuarded);
}
