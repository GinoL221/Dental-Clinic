import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server.js';
import * as api from '../../../lib/api.js';

vi.mock('../../../lib/api.js', () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` }))
}));

describe('Dentist Add Route Server Actions & Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('load()', () => {
    it('should redirect to /login if user is not authenticated', async () => {
      const event = { locals: {} };
      await expect(load(event)).rejects.toMatchObject({
        status: 303,
        location: '/login'
      });
    });

    it('should return empty object if authenticated', async () => {
      const event = { locals: { user: { id: 1 } } };
      const result = await load(event);
      expect(result).toEqual({});
    });
  });

  describe('actions.default', () => {
    it('should create dentist successfully and redirect to /dentists', async () => {
      const formData = new URLSearchParams();
      formData.append('firstName', 'Jane');
      formData.append('lastName', 'Smith');
      formData.append('email', 'jane@smith.com');
      formData.append('registrationNumber', 'D999');

      const request = {
        formData: vi.fn().mockResolvedValue(formData)
      };

      vi.mocked(api.apiFetch).mockResolvedValue({ id: 1 });

      const event = {
        request,
        locals: { user: { id: 1, token: 'mock-token' } }
      };

      await expect(actions.default(event)).rejects.toMatchObject({
        status: 303,
        location: '/dentists'
      });

      expect(api.apiFetch).toHaveBeenCalledWith('/api/dentists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token'
        },
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@smith.com',
          registrationNumber: 'D999'
        })
      });
    });
  });
});
