import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server.js';
import * as api from '../../../lib/api.js';

vi.mock('../../../lib/api.js', () => ({
  apiFetch: vi.fn(),
  getAuthHeaders: vi.fn((token) => ({ Authorization: `Bearer ${token}` }))
}));

describe('Appointments Add Route Server Actions & Loader', () => {
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

    it('should load patients and dentists lists if authenticated', async () => {
      const mockPatients = [{ id: 1, firstName: 'John' }];
      const mockDentists = [{ id: 2, firstName: 'Dr. Jane' }];

      vi.mocked(api.apiFetch)
        .mockResolvedValueOnce(mockPatients)
        .mockResolvedValueOnce(mockDentists);

      const event = {
        locals: { user: { id: 1, token: 'mock-token' } }
      };

      const result = await load(event);
      expect(result).toEqual({ patients: mockPatients, dentists: mockDentists });
      expect(api.apiFetch).toHaveBeenNthCalledWith(1, '/api/patients', {
        headers: { Authorization: 'Bearer mock-token' }
      });
      expect(api.apiFetch).toHaveBeenNthCalledWith(2, '/api/dentists', {
        headers: { Authorization: 'Bearer mock-token' }
      });
    });
  });

  describe('actions.default', () => {
    it('should create appointment successfully and redirect to /appointments', async () => {
      const formData = new URLSearchParams();
      formData.append('patientId', '1');
      formData.append('dentistId', '2');
      formData.append('appointmentDate', '2026-07-07');
      formData.append('appointmentTime', '10:00');
      formData.append('description', 'Routine Checkup');

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
        location: '/appointments'
      });

      expect(api.apiFetch).toHaveBeenCalledWith('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token'
        },
        body: JSON.stringify({
          patientId: 1,
          dentistId: 2,
          date: '2026-07-07',
          time: '10:00',
          description: 'Routine Checkup'
        })
      });
    });
  });
});
