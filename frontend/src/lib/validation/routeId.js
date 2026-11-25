const POSITIVE_INT_RE = /^\d+$/;

/**
 * Validates that a route param or form ID is a positive safe integer string.
 * Rejects path traversal segments (`..`), slashes, query/fragment suffixes, and non-digits
 * before interpolating into server-side `apiFetch` URLs.
 *
 * @param {unknown} value
 * @returns {string | null}
 */
export function parseNumericId(value) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!POSITIVE_INT_RE.test(trimmed)) return null;
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
  return trimmed;
}
