// Validaciones genéricas compartidas entre los módulos *-api.js.
// Solo vive aquí lo que es realmente común a varias entidades; las reglas
// específicas de cada entidad (DNI de paciente, matrícula de dentista,
// fecha de turno, etc.) permanecen en su propio archivo *-api.js.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Valida formato de email.
/**
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

// Lanza si los datos de entidad no fueron provistos.
// `entityLabel` es el sustantivo en español usado en el mensaje de error
// (ej. "del paciente", "del dentista", "de la cita").
/**
 * @param {Record<string, any> | null | undefined} data
 * @param {string} entityLabel
 */
export function requireEntityData(data, entityLabel) {
  if (!data) {
    throw new Error(`Datos ${entityLabel} son requeridos`);
  }
}

// Lanza si es una actualización y no se proveyó id.
/**
 * @param {Record<string, any>} data
 * @param {boolean} isUpdate
 * @param {string} entityLabel
 */
export function requireIdOnUpdate(data, isUpdate, entityLabel) {
  if (isUpdate && !data.id) {
    throw new Error(`ID ${entityLabel} es requerido para actualización`);
  }
}

// Valida que un nombre/apellido tenga al menos `minLength` caracteres
// (después de trim). Acepta valores no-string sin lanzar TypeError.
/**
 * @param {any} value
 * @param {number} minLength
 * @param {string} errorMessage
 * @returns {string}
 */
export function requireMinLength(value, minLength, errorMessage) {
  const normalized = value ? String(value).trim() : "";
  if (normalized.length < minLength) {
    throw new Error(errorMessage);
  }
  return normalized;
}

// Exportar para uso en otros archivos (Jest/Node CJS) y navegador (ESM).
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    isValidEmail,
    requireEntityData,
    requireIdOnUpdate,
    requireMinLength,
  };
}
