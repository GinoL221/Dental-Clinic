import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server.js';
import * as api from '../../../lib/api.js';

vi.mock('../../../lib/api.js', () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` }))
}));

describe('Register Route Server Actions & Loader', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('load()', () => {
    it('should redirect to / if user is already logged in', async () => {
      const event = {
        locals: {
          user: { id: 1, email: 'user@email.com', role: 'PATIENT' }
        }
      };
      await expect(load(event)).rejects.toMatchObject({
        status: 303,
        location: '/'
      });
    });

    it('should return empty object if user is not logged in', async () => {
      const event = { locals: {} };
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
      formData.append('cardIdentity', '98765432');
      formData.append('street', 'Oak St');
      formData.append('number', '456');
      formData.append('location', 'Metropolis');
      formData.append('province', 'NY');
      formData.append('role', 'PATIENT');

      const request = {
        formData: vi.fn().mockResolvedValue(formData)
      };

      vi.mocked(api.apiFetch).mockResolvedValue({
        id: 2,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@email.com'
      });

      const event = { request };

      await expect(actions.default(event)).rejects.toMatchObject({
        status: 303,
        location: '/login?registered=true'
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
            province: 'NY'
          }
        })
      });
    });

    it('should return error on conflict 409', async () => {
      const formData = new URLSearchParams();
      formData.append('firstName', 'Jane');
      formData.append('lastName', 'Doe');
      formData.append('email', 'existing@email.com');
      formData.append('password', 'Jane123!');

      const request = {
        formData: vi.fn().mockResolvedValue(formData)
      };

      const error = new Error('Conflict');
      error.status = 409;
      vi.mocked(api.apiFetch).mockRejectedValue(error);

      const event = { request };
      const result = await actions.default(event);

      expect(result).toEqual({
        success: false,
        errors: {
          general: { msg: 'Este email ya está registrado' }
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
          province: ''
        }
      });
    });
  });
});
