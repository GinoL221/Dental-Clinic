import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server.js';
import * as api from '../../../lib/api.js';

vi.mock('../../../lib/api.js', () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` })),
}));

describe('Register Route Server Actions & Loader', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('load()', () => {
    it('should redirect to / if user is already logged in', async () => {
      const event = /** @type {any} */ ({
        locals: {
          user: { id: 1, email: 'user@email.com', role: 'PATIENT' },
        },
      });
      await expect(load(event)).rejects.toMatchObject({
        status: 303,
        location: '/',
      });
    });

    it('should return empty object if user is not logged in', async () => {
      const event = /** @type {any} */ ({ locals: {} });
      const result = await load(event);
      expect(result).toEqual({});
    });
  });

  describe('actions.default', () => {
    it('should register successfully and redirect to /login', async () => {
      const formData = new URLSearchParams();
      formData.append('firstName', 'Jane');
      formData.append('lastName', 'Doe');
      formData.append('email', 'jane@email.com');
      formData.append('password', 'Jane123!');
      formData.append('confirmPassword', 'Jane123!');
      formData.append('cardIdentity', '98765432');
      formData.append('street', 'Oak St');
      formData.append('number', '456');
      formData.append('location', 'Metropolis');
      formData.append('province', 'NY');
      formData.append('role', 'PATIENT');

      const request = {
        formData: vi.fn().mockResolvedValue(formData),
      };

      vi.mocked(api.apiFetch).mockResolvedValue({
        id: 2,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@email.com',
      });

      const event = /** @type {any} */ ({ request });

      await expect(actions.default(event)).rejects.toMatchObject({
        status: 303,
        location: '/login?registered=true',
      });

      expect(api.apiFetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@email.com',
          password: 'Jane123!',
          role: 'PATIENT',
          cardIdentity: 98765432,
          address: {
            street: 'Oak St',
            number: 456,
            location: 'Metropolis',
            province: 'NY',
          },
        }),
      });
    });

    it('should surface the backend message when the register call fails', async () => {
      const formData = new URLSearchParams();
      formData.append('firstName', 'Jane');
      formData.append('lastName', 'Doe');
      formData.append('email', 'existing@email.com');
      formData.append('password', 'Jane123!');
      formData.append('confirmPassword', 'Jane123!');

      const request = {
        formData: vi.fn().mockResolvedValue(formData),
      };

      const error = /** @type {any} */ (new Error('El email ya está registrado'));
      error.status = 400;
      vi.mocked(api.apiFetch).mockRejectedValue(error);

      const event = /** @type {any} */ ({ request });
      const result = await actions.default(event);

      expect(result).toEqual({
        success: false,
        errors: {
          general: { msg: 'El email ya está registrado' },
        },
        oldData: {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'existing@email.com',
          role: 'PATIENT',
          cardIdentity: '',
          street: '',
          number: '',
          location: '',
          province: '',
        },
      });
    });

    it('should fall back to a generic message when apiFetch fabricates a synthetic HTTP error string', async () => {
      const formData = new URLSearchParams();
      formData.append('firstName', 'Jane');
      formData.append('lastName', 'Doe');
      formData.append('email', 'jane@email.com');
      formData.append('password', 'Jane123!');
      formData.append('confirmPassword', 'Jane123!');

      const request = {
        formData: vi.fn().mockResolvedValue(formData),
      };

      const error = /** @type {any} */ (new Error('HTTP error! status: 500'));
      error.status = 500;
      vi.mocked(api.apiFetch).mockRejectedValue(error);

      const event = /** @type {any} */ ({ request });
      const result = /** @type {any} */ (await actions.default(event));

      expect(result).toEqual({
        success: false,
        errors: {
          general: { msg: 'Error al registrar usuario' },
        },
        oldData: {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@email.com',
          role: 'PATIENT',
          cardIdentity: '',
          street: '',
          number: '',
          location: '',
          province: '',
        },
      });
      expect(result.errors.general.msg).not.toContain('HTTP error!');
    });

    it('should short-circuit on confirmPassword mismatch without calling apiFetch', async () => {
      const formData = new URLSearchParams();
      formData.append('firstName', 'Jane');
      formData.append('lastName', 'Doe');
      formData.append('email', 'jane@email.com');
      formData.append('password', 'Jane123!');
      formData.append('confirmPassword', 'Different123!');

      const request = {
        formData: vi.fn().mockResolvedValue(formData),
      };

      const event = /** @type {any} */ ({ request });
      const result = /** @type {any} */ (await actions.default(event));

      expect(api.apiFetch).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        errors: {
          general: { msg: 'Las contraseñas no coinciden' },
        },
        oldData: {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@email.com',
          role: 'PATIENT',
          cardIdentity: '',
          street: '',
          number: '',
          location: '',
          province: '',
        },
      });
    });
  });
});
