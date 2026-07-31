import { describe, it, expect } from 'vitest';
import { validateRegisterField, validateRegisterForm } from './registerForm.js';

/** @returns {import('./registerForm.js').RegisterValues} */
function validValues(overrides = {}) {
  return {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    cardIdentity: '12345678',
    street: 'Oak St',
    number: '123',
    location: 'Metropolis',
    province: 'NY',
    password: 'Secret1',
    confirmPassword: 'Secret1',
    ...overrides,
  };
}

describe('validateRegisterField', () => {
  describe('required fields', () => {
    const requiredFields = [
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

    it.each(requiredFields)('reports an error when %s is empty', (field) => {
      const values = validValues({ [field]: '' });
      const error = validateRegisterField(field, '', values);
      expect(error).not.toBe('');
      expect(typeof error).toBe('string');
    });

    it.each(requiredFields)('reports an error when %s is whitespace-only', (field) => {
      const values = validValues({ [field]: '   ' });
      const error = validateRegisterField(field, '   ', values);
      expect(error).not.toBe('');
    });
  });

  describe('email format', () => {
    it('reports an error for a malformed email', () => {
      const values = validValues({ email: 'not-an-email' });
      const error = validateRegisterField('email', 'not-an-email', values);
      expect(error).not.toBe('');
    });

    it('passes for a well-formed email', () => {
      const values = validValues();
      const error = validateRegisterField('email', values.email, values);
      expect(error).toBe('');
    });
  });

  describe('password minimum length', () => {
    it('reports an error for a 5-character password', () => {
      const values = validValues({ password: 'abc12' });
      const error = validateRegisterField('password', 'abc12', values);
      expect(error).not.toBe('');
    });

    it('passes for a 6-character password', () => {
      const values = validValues({ password: 'abc123' });
      const error = validateRegisterField('password', 'abc123', values);
      expect(error).toBe('');
    });
  });

  describe('cardIdentity (DNI) numeric-only', () => {
    it('reports an error for a DNI containing letters', () => {
      const values = validValues({ cardIdentity: '12A45' });
      const error = validateRegisterField('cardIdentity', '12A45', values);
      expect(error).not.toBe('');
    });

    it('passes for a fully numeric DNI', () => {
      const values = validValues();
      const error = validateRegisterField('cardIdentity', values.cardIdentity, values);
      expect(error).toBe('');
    });
  });

  describe('confirmPassword match', () => {
    it('reports an error when confirmPassword does not match password', () => {
      const values = validValues({ password: 'Secret123', confirmPassword: 'Secret124' });
      const error = validateRegisterField('confirmPassword', 'Secret124', values);
      expect(error).not.toBe('');
    });

    it('passes when confirmPassword matches password', () => {
      const values = validValues({ password: 'Secret123', confirmPassword: 'Secret123' });
      const error = validateRegisterField('confirmPassword', 'Secret123', values);
      expect(error).toBe('');
    });
  });
});

describe('validateRegisterForm', () => {
  it('returns an empty object when every field is valid', () => {
    const errors = validateRegisterForm(validValues());
    expect(errors).toEqual({});
  });

  it('returns only the invalid fields', () => {
    const values = validValues({ email: 'not-an-email', cardIdentity: '12A45' });
    const errors = validateRegisterForm(values);
    expect(Object.keys(errors).sort()).toEqual(['cardIdentity', 'email']);
    expect(errors.email).not.toBe('');
    expect(errors.cardIdentity).not.toBe('');
  });

  it('reports a mismatched confirmPassword alongside other invalid fields', () => {
    const values = validValues({ password: 'Secret123', confirmPassword: 'Secret124' });
    const errors = validateRegisterForm(values);
    expect(errors).toHaveProperty('confirmPassword');
    expect(Object.keys(errors)).toEqual(['confirmPassword']);
  });

  it('reports every empty required field when submitting a blank form', () => {
    const blank = validValues({
      firstName: '',
      lastName: '',
      email: '',
      cardIdentity: '',
      street: '',
      number: '',
      location: '',
      province: '',
      password: '',
      confirmPassword: '',
    });
    const errors = validateRegisterForm(blank);
    expect(Object.keys(errors).sort()).toEqual(
      [
        'cardIdentity',
        'confirmPassword',
        'email',
        'firstName',
        'lastName',
        'location',
        'number',
        'password',
        'province',
        'street',
      ].sort(),
    );
  });
});
