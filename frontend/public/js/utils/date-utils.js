// Utilidades para parseo y formateo de fechas en cliente
// Evitan el desfase de día provocado por new Date('YYYY-MM-DD') que se interpreta como UTC
export function parseYMDToLocalDate(dateInput) {
  if (!dateInput) return null;
  try {
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const parts = dateInput.split('-');
      const y = Number(parts[0]);
      const m = Number(parts[1]) - 1;
      const d = Number(parts[2]);
      return new Date(y, m, d);
    }
    // Aceptar Date u otros formatos ISO/UTC como fallback
    const dt = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return dt;
  } catch (e) {
    return null;
  }
}

export function formatLocalDate(dateInput, locale = 'es-ES', options = { year: 'numeric', month: 'long', day: 'numeric' }) {
  try {
    const d = dateInput instanceof Date ? dateInput : parseYMDToLocalDate(dateInput);
    if (!d || isNaN(d.getTime())) return dateInput;
    return d.toLocaleDateString(locale, options);
  } catch (e) {
    return dateInput;
  }
}

export default {
  parseYMDToLocalDate,
  formatLocalDate,
};
