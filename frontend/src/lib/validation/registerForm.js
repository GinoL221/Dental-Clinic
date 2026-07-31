/** @typedef {Record<string, string>} RegisterValues */
/** @typedef {Record<string, string>} FieldErrors */

const REQUIRED_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'cardIdentity',
  'street',
  'number',
  'location',
  'province',
  'password',
  'confirmPassword',
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NUMERIC_ONLY_PATTERN = /^\d+$/;
const PASSWORD_MIN_LENGTH = 6;

const MESSAGES = {
  required: 'Este campo es obligatorio',
  email: 'El formato del correo no es válido',
  passwordMinLength: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`,
  cardIdentityNumeric: 'El DNI debe contener solo números',
  confirmPasswordMismatch: 'Las contraseñas no coinciden',
};

/**
 * @param {string} name
 * @param {string} value
 * @param {RegisterValues} values
 * @returns {string} '' when valid, else the user-facing message
 */
export function validateRegisterField(name, value, values) {
  const trimmed = typeof value === 'string' ? value.trim() : '';

  if (REQUIRED_FIELDS.includes(name) && trimmed === '') {
    return MESSAGES.required;
  }

  if (name === 'email' && !EMAIL_PATTERN.test(trimmed)) {
    return MESSAGES.email;
  }

  if (name === 'password' && trimmed.length < PASSWORD_MIN_LENGTH) {
    return MESSAGES.passwordMinLength;
  }

  if (name === 'cardIdentity' && !NUMERIC_ONLY_PATTERN.test(trimmed)) {
    return MESSAGES.cardIdentityNumeric;
  }

  if (name === 'confirmPassword' && value !== values.password) {
    return MESSAGES.confirmPasswordMismatch;
  }

  return '';
}

/**
 * @param {RegisterValues} values
 * @returns {FieldErrors} only invalid fields; empty object === form is valid
 */
export function validateRegisterForm(values) {
  /** @type {FieldErrors} */
  const errors = {};

  for (const name of REQUIRED_FIELDS) {
    const error = validateRegisterField(name, values[name] ?? '', values);
    if (error) {
      errors[name] = error;
    }
  }

  return errors;
}
