import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server.js';
import * as api from '../../lib/api.js';

vi.mock('../../lib/api.js', () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` }))
}));

describe('Dentists Route Server Loader & Actions', () => {
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

    it('should load dentists list if authenticated', async () => {
      const mockDentists = [{ id: 1, firstName: 'Jane', lastName: 'Smith', registrationNumber: 'D123' }];
      vi.mocked(api.apiFetch).mockResolvedValue(mockDentists);

      const event = {
        locals: {
          user: { id: 1, email: 'admin@clinic.com', token: 'mock-token' }
        }
      };

      const result = await load(event);
      expect(result).toEqual({ dentists: mockDentists });
      expect(api.apiFetch).toHaveBeenCalledWith('/api/dentists', {
        headers: { Authorization: 'Bearer mock-token' }
      });
    });
  });

  describe('actions.delete', () => {
    it('should delete a dentist successfully', async () => {
      const formData = new URLSearchParams();
      formData.append('id', '1');
      const request = {
        formData: vi.fn().mockResolvedValue(formData)
      };

      vi.mocked(api.apiFetch).mockResolvedValue('Dentist deleted');

      const event = {
        request,
        locals: {
          user: { id: 1, token: 'mock-token' }
        }
      };

      const result = await actions.delete(event);
      expect(result).toEqual({ success: true });
      expect(api.apiFetch).toHaveBeenCalledWith('/api/dentists/1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer mock-token' }
      });
    });
  });
});
