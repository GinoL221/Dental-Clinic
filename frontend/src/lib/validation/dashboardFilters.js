/** @typedef {{ from: string|null, to: string|null, dentistId: number|null }} AppliedFilters */
/** @typedef {{ valid: boolean, error: string, applied: AppliedFilters, raw: {from:string,to:string,dentistId:string} }} FilterParseResult */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const NUMERIC_ONLY_PATTERN = /^\d+$/;

const MESSAGES = {
  invalidFrom: 'La fecha "desde" no es válida',
  invalidTo: 'La fecha "hasta" no es válida',
  invertedRange: 'La fecha "desde" no puede ser posterior a la fecha "hasta"',
  invalidDentistId: 'El odontólogo seleccionado no es válido',
};

/**
 * @param {string} value
 * @returns {boolean}
 */
function isValidIsoDate(value) {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/**
 * Parses and validates the dashboard's optional `from`/`to`/`dentistId`
 * query params. Never throws — invalid input is reported via the returned
 * `valid`/`error` fields so the caller can fall back to an unfiltered fetch.
 * @param {URLSearchParams} searchParams
 * @returns {FilterParseResult}
 */
export function parseDashboardFilters(searchParams) {
  const rawFrom = searchParams.get('from') ?? '';
  const rawTo = searchParams.get('to') ?? '';
  const rawDentistId = searchParams.get('dentistId') ?? '';
  const raw = { from: rawFrom, to: rawTo, dentistId: rawDentistId };

  /** @returns {FilterParseResult} */
  const invalid = (error) => ({
    valid: false,
    error,
    applied: { from: null, to: null, dentistId: null },
    raw,
  });

  if (rawFrom && !isValidIsoDate(rawFrom)) {
    return invalid(MESSAGES.invalidFrom);
  }
  if (rawTo && !isValidIsoDate(rawTo)) {
    return invalid(MESSAGES.invalidTo);
  }
  // ISO (YYYY-MM-DD) date strings sort lexicographically the same as
  // chronologically, so a plain string comparison is enough here.
  if (rawFrom && rawTo && rawFrom > rawTo) {
    return invalid(MESSAGES.invertedRange);
  }

  let dentistId = null;
  if (rawDentistId) {
    if (!NUMERIC_ONLY_PATTERN.test(rawDentistId)) {
      return invalid(MESSAGES.invalidDentistId);
    }
    dentistId = Number(rawDentistId);
  }

  return {
    valid: true,
    error: '',
    applied: {
      from: rawFrom || null,
      to: rawTo || null,
      dentistId,
    },
    raw,
  };
}
