import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server.js';
import * as api from '../../lib/api.js';
import { createMockEvent } from '../../test/mockFactory.js';

vi.mock('../../lib/api.js', () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` }))
}));

describe('Login Route Server Actions & Loader', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('load()', () => {
    it('should redirect to / if user is already logged in', async () => {
      const event = createMockEvent({
        locals: {
          user: { id: 1, email: 'user@email.com', role: 'PATIENT' }
        }
      });
      await expect(load(event)).rejects.toMatchObject({
        status: 303,
        location: '/'
      });
    });

    it('should return empty object if user is not logged in', async () => {
      const event = createMockEvent({ locals: {} });
      const result = await load(event);
      expect(result).toEqual({});
    });
  });

  describe('actions.default', () => {
    it('should login successfully and set cookies', async () => {
      const formData = new URLSearchParams();
      formData.append('email', 'admin@dentalclinic.com');
      formData.append('password', 'Admin123!');

      const request = {
        formData: vi.fn().mockResolvedValue(formData)
      };

      const cookies = {
        set: vi.fn()
      };

      vi.mocked(api.apiFetch).mockResolvedValue({
        id: 1,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@dentalclinic.com',
        role: 'ADMIN',
        token: 'mock-jwt-token'
      });

      const event = createMockEvent({ request, cookies });

      await expect(actions.default(event)).rejects.toMatchObject({
        status: 303,
        location: '/dashboard'
      });

      expect(api.apiFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@dentalclinic.com',
          password: 'Admin123!'
        })
      });

      expect(cookies.set).toHaveBeenCalledWith('authToken', 'mock-jwt-token', expect.any(Object));
      expect(cookies.set).toHaveBeenCalledWith('userRole', 'ADMIN', expect.any(Object));
      expect(cookies.set).toHaveBeenCalledWith('userEmail', 'admin@dentalclinic.com', expect.any(Object));
    });

    it('should return error credentials on 401', async () => {
      const formData = new URLSearchParams();
      formData.append('email', 'wrong@email.com');
      formData.append('password', 'wrong');

      const request = {
        formData: vi.fn().mockResolvedValue(formData)
      };
      const cookies = { set: vi.fn() };

      const error = Object.assign(new Error('Unauthorized'), { status: 401 });
      vi.mocked(api.apiFetch).mockRejectedValue(error);

      const event = createMockEvent({ request, cookies });
      const result = await actions.default(event);

      expect(result).toEqual({
        success: false,
        errors: {
          general: { msg: 'Credenciales incorrectas' }
        },
        oldData: { email: 'wrong@email.com' }
      });
    });
  });
});
