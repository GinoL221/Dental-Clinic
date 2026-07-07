import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server.js';
import * as api from '../../lib/api.js';
import { createMockEvent } from '../../test/mockFactory.js';

vi.mock('../../lib/api.js', () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` }))
}));

describe('Patients Route Server Loader & Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('load()', () => {
    it('should redirect to /login if user is not authenticated', async () => {
      const event = createMockEvent({ locals: {} });
      // Note: hook does redirect, but let's test loader protection just in case
      await expect(load(event)).rejects.toMatchObject({
        status: 303,
        location: '/login'
      });
    });

    it('should load patients list if authenticated', async () => {
      const mockPatients = [{ id: 1, firstName: 'John', lastName: 'Doe', email: 'john@doe.com' }];
      vi.mocked(api.apiFetch).mockResolvedValue(mockPatients);

      const event = createMockEvent({
        locals: {
          user: { id: 1, email: 'admin@clinic.com', token: 'mock-token' }
        }
      });

      const result = await load(event);
      expect(result).toEqual({ patients: mockPatients });
      expect(api.apiFetch).toHaveBeenCalledWith('/api/patients', {
        headers: { Authorization: 'Bearer mock-token' }
      });
    });
  });

  describe('actions.delete', () => {
    it('should delete a patient successfully', async () => {
      const formData = new URLSearchParams();
      formData.append('id', '1');
      const request = {
        formData: vi.fn().mockResolvedValue(formData)
      };

      vi.mocked(api.apiFetch).mockResolvedValue('Patient deleted');

      const event = createMockEvent({
        request,
        locals: {
          user: { id: 1, token: 'mock-token' }
        }
      });

      const result = await actions.delete(event);
      expect(result).toEqual({ success: true });
      expect(api.apiFetch).toHaveBeenCalledWith('/api/patients/1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer mock-token' }
      });
    });

    it('should return error when delete fails', async () => {
      const formData = new URLSearchParams();
      formData.append('id', '1');
      const request = {
        formData: vi.fn().mockResolvedValue(formData)
      };

      const error = Object.assign(new Error('Conflict'), { status: 409 });
      vi.mocked(api.apiFetch).mockRejectedValue(error);

      const event = createMockEvent({
        request,
        locals: {
          user: { id: 1, token: 'mock-token' }
        }
      });

      const result = await actions.delete(event);
      expect(result).toEqual({
        success: false,
        error: 'No se puede eliminar el paciente porque tiene citas asociadas o error del servidor.'
      });
    });
  });
});
