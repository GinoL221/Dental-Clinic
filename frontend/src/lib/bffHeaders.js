/**
 * Builds JSON headers for server-to-server BFF auth calls to the Spring Boot backend.
 * Propagates the end-user client IP in {@code X-Client-IP} authenticated with
 * {@code X-BFF-Auth} only when {@code BFF_SHARED_SECRET} is explicitly configured
 * (fail-closed otherwise).
 *
 * @param {(() => string) | undefined} getClientAddress
 * @returns {Record<string, string>}
 */
export function getBffAuthHeaders(getClientAddress) {
  /** @type {Record<string, string>} */
  const headers = { "Content-Type": "application/json" };
  const bffSecret =
    typeof process !== "undefined"
      ? process.env?.BFF_SHARED_SECRET?.trim()
      : "";
  if (bffSecret && typeof getClientAddress === "function") {
    try {
      const clientIp = String(getClientAddress() || "").trim();
      if (clientIp) {
        headers["X-Client-IP"] = clientIp;
        headers["X-BFF-Auth"] = bffSecret;
      }
    } catch {
      // Adapter did not provide a client address; backend falls back to peer IP.
    }
  }
  return headers;
}
